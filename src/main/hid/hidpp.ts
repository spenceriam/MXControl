import HID from 'node-hid';

// HID++ 2.0 Protocol Implementation for Logitech MX Master 2S

// Report IDs
const REPORT_ID_SHORT = 0x10;
const REPORT_ID_LONG = 0x11;

// Device Index
const DEVICE_INDEX_RECEIVER = 0x00;
const DEVICE_INDEX_BLUETOOTH = 0xff;

// Root Feature
const FEATURE_ROOT = 0x0000;
const FEATURE_FEATURE_SET = 0x0001;

// Known Feature IDs
const FEATURE_BATTERY_STATUS = 0x1000;
const FEATURE_BATTERY_UNIFIED = 0x1001;
const FEATURE_ADJUSTABLE_DPI = 0x2201;
const FEATURE_REPROG_KEYS_V4 = 0x1b04;
const FEATURE_GESTURE = 0x6501;

// Error codes
const ERR_SUCCESS = 0x00;
const ERR_INVALID_SUBID = 0x01;
const ERR_INVALID_ADDRESS = 0x02;
const ERR_INVALID_VALUE = 0x03;
const ERR_CONNECT_FAIL = 0x04;
const ERR_TOO_MANY_DEVICES = 0x05;
const ERR_ALREADY_EXISTS = 0x06;
const ERR_BUSY = 0x07;
const ERR_UNKNOWN_DEVICE = 0x08;
const ERR_RESOURCE_ERROR = 0x09;
const ERR_REQUEST_UNAVAILABLE = 0x0a;
const ERR_UNSUPPORTED = 0x0b;

interface HIDPPFeature {
  featureId: number;
  featureIndex: number;
  featureType: number;
}

export class HIDPPError extends Error {
  constructor(
    message: string,
    public code: number
  ) {
    super(message);
    this.name = 'HIDPPError';
  }
}

export class HIDPPProtocol {
  private device: HID.HID;
  private deviceIndex: number;
  private softwareId: number = 0x01;
  private featureCache: Map<number, number> = new Map();
  private pendingResponses: Map<string, (data: Buffer) => void> = new Map();
  private closed: boolean = false;

  constructor(device: HID.HID, isBluetooth: boolean = true) {
    this.device = device;
    this.deviceIndex = isBluetooth ? DEVICE_INDEX_BLUETOOTH : DEVICE_INDEX_RECEIVER;
    
    console.log(`[HID++] Constructor: Setting up device listeners (deviceIndex=0x${this.deviceIndex.toString(16).padStart(2, '0')})`);
    
    // Set up data listener for responses
    this.device.on('data', (data: Buffer) => {
      this.handleResponse(data);
    });
    
    // Set up error listener
    this.device.on('error', (err: Error) => {
      console.error('[HID++] Device error:', err);
    });
    
    // Try to set non-blocking mode (may not be needed, but doesn't hurt)
    try {
      // Some versions of node-hid support setNonBlocking
      if (typeof (this.device as any).setNonBlocking === 'function') {
        (this.device as any).setNonBlocking(true);
        console.log('[HID++] Set device to non-blocking mode');
      }
    } catch (err) {
      // Ignore if not supported
      console.log('[HID++] setNonBlocking not supported (this is OK)');
    }
  }
  
  // Ensure device is valid before operations
  private ensureDevice(): void {
    if (this.closed || !this.device) {
      throw new HIDPPError('Device not connected or already closed', -1);
    }
  }

  private handleResponse(data: Buffer): void {
    console.log(`[HID++] Raw response received (${data.length} bytes): ${data.slice(0, Math.min(data.length, 16)).toString('hex')}`);
    
    if (data.length < 7) {
      console.log(`[HID++] Response too short, ignoring`);
      return;
    }

    const reportId = data[0];
    const deviceIndex = data[1];
    const featureIndex = data[2];
    const functionId = (data[3] >> 4) & 0x0f;
    const softwareId = data[3] & 0x0f;

    console.log(`[HID++] Parsed: reportId=0x${reportId.toString(16).padStart(2, '0')} devIdx=0x${deviceIndex.toString(16).padStart(2, '0')} featIdx=0x${featureIndex.toString(16).padStart(2, '0')} funcId=0x${functionId.toString(16)} swId=0x${softwareId.toString(16)}`);

    // Check if this is an error response
    if (featureIndex === 0x8f) {
      console.log(`[HID++] Error response detected`);
      // Error response format
      return;
    }

    const key = `${featureIndex}:${functionId}:${softwareId}`;
    console.log(`[HID++] Looking for handler: ${key}`);
    const handler = this.pendingResponses.get(key);
    if (handler) {
      console.log(`[HID++] Handler found, calling it`);
      this.pendingResponses.delete(key);
      handler(data);
    } else {
      console.log(`[HID++] No handler found for response`);
    }
  }

  private async sendCommand(
    featureIndex: number,
    functionId: number,
    params: Buffer = Buffer.alloc(0),
    longFormat: boolean = false
  ): Promise<Buffer> {
    // Validate device is available
    this.ensureDevice();
    
    const reportId = longFormat ? REPORT_ID_LONG : REPORT_ID_SHORT;
    const reportSize = longFormat ? 20 : 7;
    
    const report = Buffer.alloc(reportSize);
    report[0] = reportId;
    report[1] = this.deviceIndex;
    report[2] = featureIndex;
    report[3] = (functionId << 4) | (this.softwareId & 0x0f);
    
    if (params.length > 0) {
      params.copy(report, 4, 0, Math.min(params.length, reportSize - 4));
    }

    console.log(`[HID++] Sending command: featureIdx=0x${featureIndex.toString(16).padStart(2, '0')} funcId=0x${functionId.toString(16)} swId=0x${this.softwareId.toString(16)} devIdx=0x${this.deviceIndex.toString(16).padStart(2, '0')}`);
    console.log(`[HID++] Report: ${report.slice(0, Math.min(report.length, 16)).toString('hex')}`);

    return new Promise((resolve, reject) => {
      const key = `${featureIndex}:${functionId}:${this.softwareId}`;
      const timeout = setTimeout(() => {
        console.log(`[HID++] Timeout waiting for response: ${key}`);
        this.pendingResponses.delete(key);
        reject(new HIDPPError('Device response timeout', -1));
      }, 3000); // Increased timeout to 3s

      this.pendingResponses.set(key, (response: Buffer) => {
        clearTimeout(timeout);
        console.log(`[HID++] Received response: ${response.slice(0, Math.min(response.length, 16)).toString('hex')}`);
        
        // Check for error
        if (response[2] === 0x8f && response.length >= 7) {
          const errorCode = response[6];
          reject(new HIDPPError(`HID++ error: ${this.getErrorMessage(errorCode)}`, errorCode));
          return;
        }
        
        resolve(response);
      });

      try {
        // Try different write methods for compatibility
        // Method 1: Try write with report ID (most common for hidraw)
        console.log(`[HID++] Writing ${report.length} bytes to device`);
        console.log(`[HID++] Full report hex: ${report.toString('hex')}`);
        
        try {
          const bytesWritten = this.device.write(Array.from(report));
          console.log(`[HID++] Write returned: ${bytesWritten} bytes`);
        } catch (writeErr) {
          console.error(`[HID++] Standard write failed:`, writeErr);
          // Try without report ID as fallback
          console.log(`[HID++] Trying write without report ID...`);
          const bytesWritten = this.device.write(Array.from(report.slice(1)));
          console.log(`[HID++] Write (no report ID) returned: ${bytesWritten} bytes`);
        }
      } catch (err) {
        console.error(`[HID++] All write attempts failed:`, err);
        clearTimeout(timeout);
        this.pendingResponses.delete(key);
        reject(err);
      }

      // Increment software ID for next command
      this.softwareId = (this.softwareId + 1) & 0x0f;
      if (this.softwareId === 0) this.softwareId = 1;
    });
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case ERR_INVALID_SUBID: return 'Invalid SubID/Function';
      case ERR_INVALID_ADDRESS: return 'Invalid address';
      case ERR_INVALID_VALUE: return 'Invalid value';
      case ERR_CONNECT_FAIL: return 'Connection failed';
      case ERR_TOO_MANY_DEVICES: return 'Too many devices';
      case ERR_ALREADY_EXISTS: return 'Already exists';
      case ERR_BUSY: return 'Device busy';
      case ERR_UNKNOWN_DEVICE: return 'Unknown device';
      case ERR_RESOURCE_ERROR: return 'Resource error';
      case ERR_REQUEST_UNAVAILABLE: return 'Request unavailable';
      case ERR_UNSUPPORTED: return 'Unsupported';
      default: return `Unknown error (${code})`;
    }
  }

  // Root Feature (0x0000) - Feature Index is always 0x00
  async ping(): Promise<boolean> {
    try {
      const params = Buffer.from([0x00, 0x00, 0xaa]);
      const response = await this.sendCommand(0x00, 0x01, params);
      return response[4] === 0x00 && response[5] === 0x00 && response[6] === 0xaa;
    } catch (err) {
      return false;
    }
  }

  async getProtocolVersion(): Promise<{ major: number; minor: number }> {
    const response = await this.sendCommand(0x00, 0x00);
    return {
      major: response[4],
      minor: response[5]
    };
  }

  async getFeatureCount(): Promise<number> {
    const response = await this.sendCommand(0x00, 0x00);
    return response[6];
  }

  async getFeatureId(index: number): Promise<HIDPPFeature> {
    const params = Buffer.from([index]);
    const response = await this.sendCommand(0x00, 0x01, params);
    return {
      featureId: (response[4] << 8) | response[5],
      featureIndex: index,
      featureType: response[6]
    };
  }

  // Feature Set (0x0001) - Get feature index by feature ID
  async getFeatureIndex(featureId: number): Promise<number> {
    // Check cache first
    if (this.featureCache.has(featureId)) {
      return this.featureCache.get(featureId)!;
    }

    // Feature Set is always at index 0x01
    const params = Buffer.alloc(3);
    params.writeUInt16BE(featureId, 0);
    
    try {
      const response = await this.sendCommand(0x01, 0x00, params);
      const featureIndex = response[4];
      
      if (featureIndex === 0x00) {
        throw new HIDPPError(`Feature 0x${featureId.toString(16)} not supported`, ERR_UNSUPPORTED);
      }

      // Cache the result
      this.featureCache.set(featureId, featureIndex);
      return featureIndex;
    } catch (err) {
      throw new HIDPPError(`Failed to get feature index for 0x${featureId.toString(16)}`, ERR_UNSUPPORTED);
    }
  }

  // Battery Status (0x1000 or 0x1001)
  async getBatteryStatus(): Promise<{ percentage: number; charging: boolean; level: string }> {
    let featureIndex: number;
    
    try {
      // Try unified battery status first (0x1001)
      featureIndex = await this.getFeatureIndex(FEATURE_BATTERY_UNIFIED);
      const response = await this.sendCommand(featureIndex, 0x00);
      
      const percentage = response[4];
      const nextLevel = response[5];
      const status = response[6];
      
      // Status: 0 = discharging, 1 = recharging, 2 = charge complete, 3 = slow recharge, 4 = invalid
      const charging = status === 1 || status === 3;
      
      let level = 'good';
      if (percentage <= 5) level = 'critical';
      else if (percentage <= 10) level = 'low';
      else if (percentage >= 90) level = 'full';
      
      return { percentage, charging, level };
    } catch {
      // Fallback to basic battery status (0x1000)
      try {
        featureIndex = await this.getFeatureIndex(FEATURE_BATTERY_STATUS);
        const response = await this.sendCommand(featureIndex, 0x00);
        
        // Response format: battery level (0-4), next level (0-4), status
        const batteryLevel = response[4]; // 0=critical, 1=low, 2=good, 3=full
        const status = response[6]; // bit flags for charging status
        
        // Map battery level to percentage (approximate)
        let percentage = 50;
        switch (batteryLevel) {
          case 0: percentage = 5; break;  // critical
          case 1: percentage = 20; break; // low  
          case 2: percentage = 60; break; // good
          case 3: percentage = 95; break; // full
        }
        
        const charging = (status & 0x01) !== 0;
        
        const levelNames = ['critical', 'low', 'good', 'full'];
        const level = levelNames[batteryLevel] || 'good';
        
        return { percentage, charging, level };
      } catch (err) {
        throw new HIDPPError('Battery status not available', ERR_UNSUPPORTED);
      }
    }
  }

  // Adjustable DPI (0x2201)
  async getSensorDPI(): Promise<number> {
    const featureIndex = await this.getFeatureIndex(FEATURE_ADJUSTABLE_DPI);
    const params = Buffer.from([0x00]); // sensor 0
    const response = await this.sendCommand(featureIndex, 0x01, params);
    
    const dpi = (response[4] << 8) | response[5];
    return dpi;
  }

  async setSensorDPI(dpi: number): Promise<void> {
    // Validate DPI range and step
    if (dpi < 200 || dpi > 4000) {
      throw new HIDPPError('DPI must be between 200 and 4000', ERR_INVALID_VALUE);
    }
    if (dpi % 50 !== 0) {
      throw new HIDPPError('DPI must be in 50 DPI increments', ERR_INVALID_VALUE);
    }

    const featureIndex = await this.getFeatureIndex(FEATURE_ADJUSTABLE_DPI);
    const params = Buffer.alloc(3);
    params[0] = 0x00; // sensor 0
    params.writeUInt16BE(dpi, 1);
    
    await this.sendCommand(featureIndex, 0x02, params);
  }

  async getSensorDPIList(): Promise<number[]> {
    const featureIndex = await this.getFeatureIndex(FEATURE_ADJUSTABLE_DPI);
    const params = Buffer.from([0x00]); // sensor 0
    const response = await this.sendCommand(featureIndex, 0x00, params);
    
    // Parse DPI list from response
    const dpiList: number[] = [];
    for (let i = 4; i < response.length - 1; i += 2) {
      const dpi = (response[i] << 8) | response[i + 1];
      if (dpi === 0 || dpi === 0xffff) break;
      dpiList.push(dpi);
    }
    
    return dpiList;
  }

  // Reprogrammable Keys (0x1b04)
  async getControlCount(): Promise<number> {
    const featureIndex = await this.getFeatureIndex(FEATURE_REPROG_KEYS_V4);
    const response = await this.sendCommand(featureIndex, 0x00);
    return response[4];
  }

  async getControlIdInfo(index: number): Promise<{ cid: number; tid: number; flags: number }> {
    const featureIndex = await this.getFeatureIndex(FEATURE_REPROG_KEYS_V4);
    const params = Buffer.from([index]);
    const response = await this.sendCommand(featureIndex, 0x01, params);
    
    return {
      cid: (response[4] << 8) | response[5],
      tid: (response[6] << 8) | response[7],
      flags: response[8]
    };
  }

  async getControlIdReporting(cid: number): Promise<{ divert: boolean; persist: boolean; rawXY: boolean }> {
    const featureIndex = await this.getFeatureIndex(FEATURE_REPROG_KEYS_V4);
    const params = Buffer.alloc(2);
    params.writeUInt16BE(cid, 0);
    const response = await this.sendCommand(featureIndex, 0x03, params);
    
    const flags = response[6];
    return {
      divert: (flags & 0x01) !== 0,
      persist: (flags & 0x02) !== 0,
      rawXY: (flags & 0x10) !== 0
    };
  }

  async setControlIdReporting(
    cid: number,
    divert: boolean,
    persist: boolean = true,
    rawXY: boolean = false
  ): Promise<void> {
    const featureIndex = await this.getFeatureIndex(FEATURE_REPROG_KEYS_V4);
    const params = Buffer.alloc(4);
    params.writeUInt16BE(cid, 0);
    
    let flags = 0;
    if (divert) flags |= 0x01;
    if (persist) flags |= 0x02;
    if (rawXY) flags |= 0x10;
    
    params[2] = flags;
    params[3] = flags; // valid flags mask
    
    await this.sendCommand(featureIndex, 0x04, params);
  }

  // Gesture (0x6501)
  async getGestureConfig(): Promise<{ enabled: boolean; sensitivity: number }> {
    try {
      const featureIndex = await this.getFeatureIndex(FEATURE_GESTURE);
      const response = await this.sendCommand(featureIndex, 0x00);
      
      const enabled = response[4] !== 0;
      const sensitivity = response[5] || 5;
      
      return { enabled, sensitivity };
    } catch {
      // Gesture feature may not be available on all devices
      return { enabled: false, sensitivity: 5 };
    }
  }

  async setGestureConfig(enabled: boolean, sensitivity: number = 5): Promise<void> {
    if (sensitivity < 1 || sensitivity > 10) {
      throw new HIDPPError('Sensitivity must be between 1 and 10', ERR_INVALID_VALUE);
    }

    const featureIndex = await this.getFeatureIndex(FEATURE_GESTURE);
    const params = Buffer.from([enabled ? 1 : 0, sensitivity]);
    
    await this.sendCommand(featureIndex, 0x01, params);
  }

  // Utility to discover all features on the device
  async discoverFeatures(): Promise<HIDPPFeature[]> {
    const features: HIDPPFeature[] = [];
    
    try {
      const count = await this.getFeatureCount();
      
      for (let i = 0; i <= count; i++) {
        try {
          const feature = await this.getFeatureId(i);
          features.push(feature);
          
          // Cache the feature index
          this.featureCache.set(feature.featureId, feature.featureIndex);
        } catch {
          // Skip features that fail to enumerate
        }
      }
    } catch (err) {
      console.error('Feature discovery failed:', err);
    }
    
    return features;
  }

  close(): void {
    this.closed = true;
    this.pendingResponses.clear();
    this.featureCache.clear();
  }
}