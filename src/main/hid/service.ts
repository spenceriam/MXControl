import HID from 'node-hid';
import { HIDPPProtocol, HIDPPError } from './hidpp';

export type Connection = 'usb' | 'receiver' | 'bluetooth' | 'unknown';

export interface HidDeviceInfo {
  path: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  manufacturer?: string;
  product?: string;
}

export interface HidState {
  connected: boolean;
  info?: HidDeviceInfo;
  connection: Connection;
  batteryPct: number;
  charging: boolean;
}

type Listener = (s: HidState) => void;

export class HIDService {
  private device: HID.HID | null = null;
  private hidpp: HIDPPProtocol | null = null;
  private state: HidState = { connected: false, connection: 'unknown', batteryPct: 0, charging: false };
  private pollTimer: NodeJS.Timeout | null = null;
  private listeners: Set<Listener> = new Set();
  private initialized: boolean = false;

  // Safe initialization without device enumeration
  initialize(): void {
    if (this.initialized) return;
    
    this.state = {
      connected: false,
      connection: 'unknown',
      batteryPct: 0,
      charging: false
    };
    
    this.initialized = true;
    console.log('HIDService initialized safely');
  }
  discover(): HidDeviceInfo[] {
    try {
      // Find Logitech MX devices, prioritizing HID++ interface (usagePage 0xff43)
      const allDevices = HID.devices();
      const mxDevices = allDevices.filter(
        (d) =>
          d.vendorId === 0x046d &&
          (d.productId === 0xb019 || // MX Master 2S
            (d.product ?? '').toLowerCase().includes('mx master'))
      );

      // Prefer HID++ interface if available
      const hidppDevices = mxDevices.filter((d) => d.usagePage === 0xff43);
      const devicesToUse = hidppDevices.length > 0 ? hidppDevices : mxDevices;

      return devicesToUse.map((d) => ({
        path: d.path!,
        vendorId: d.vendorId!,
        productId: d.productId!,
        serialNumber: d.serialNumber,
        manufacturer: d.manufacturer,
        product: d.product
      }));
    } catch (err) {
      console.error('Device discovery failed:', err);
      return []; // Return empty array instead of crashing
    }
  }

  async connect(info: HidDeviceInfo): Promise<void> {
    this.close();
    
    // Create timeout promise
    const timeoutMs = 5000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    try {
      // Race connection against timeout
      await Promise.race([this._connectInternal(info), timeoutPromise]);
    } catch (err) {
      console.error('Failed to connect to device:', err);
      this.close(); // Ensure cleanup
      throw err; // Re-throw for caller to handle
    }
  }
  
  private async _connectInternal(info: HidDeviceInfo): Promise<void> {
    try {
      this.device = new HID.HID(info.path);
      
      // Detect connection type based on path/interface
      const isBluetooth = info.path.includes('uhid') || info.path.includes('bluetooth');
      this.state.connection = isBluetooth ? 'bluetooth' : 'receiver';
      
      // Initialize HID++ protocol
      this.hidpp = new HIDPPProtocol(this.device, isBluetooth);
      
      // Test connection with ping (with internal timeout)
      const pingOk = await this.hidpp.ping();
      if (!pingOk) {
        throw new Error('Device did not respond to ping');
      }
      
      // Discover features for caching
      await this.hidpp.discoverFeatures();
      
      this.state.connected = true;
      this.state.info = info;
      
      // Get initial battery status
      await this.updateBatteryStatus();
      
      this.startBatteryPolling();
      this.emit();
    } catch (err) {
      console.error('Internal connection error:', err);
      throw err;
    }
  }

  close(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.hidpp) {
      this.hidpp.close();
      this.hidpp = null;
    }
    if (this.device) {
      try {
        this.device.close();
      } catch {}
      this.device = null;
    }
    this.state.connected = false;
    this.emit();
  }

  private async updateBatteryStatus(): Promise<void> {
    if (!this.hidpp) return;
    
    try {
      const battery = await this.hidpp.getBatteryStatus();
      this.state.batteryPct = battery.percentage;
      this.state.charging = battery.charging;
      this.emit();
    } catch (err) {
      console.error('Failed to get battery status:', err);
    }
  }

  private startBatteryPolling() {
    if (this.pollTimer) return;
    
    // Poll battery every 60 seconds
    this.pollTimer = setInterval(async () => {
      await this.updateBatteryStatus();
    }, 60000);
  }

  getState(): HidState {
    return { ...this.state };
  }

  onChange(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snapshot = this.getState();
    for (const l of this.listeners) l(snapshot);
  }

  async setDpi(value: number): Promise<boolean> {
    if (!this.hidpp) return false;
    
    try {
      await this.hidpp.setSensorDPI(value);
      return true;
    } catch (err) {
      console.error('Failed to set DPI:', err);
      return false;
    }
  }

  async getDpi(): Promise<number | null> {
    if (!this.hidpp) return null;
    
    try {
      return await this.hidpp.getSensorDPI();
    } catch (err) {
      console.error('Failed to get DPI:', err);
      return null;
    }
  }

  async updateButtons(): Promise<boolean> {
    if (!this.hidpp) return false;
    
    try {
      // For now, just verify the feature is available
      // Actual button remapping requires mapping UI actions to Control IDs
      const count = await this.hidpp.getControlCount();
      console.log(`Device has ${count} reprogrammable controls`);
      return true;
    } catch (err) {
      console.error('Failed to update buttons:', err);
      return false;
    }
  }

  async updateGesture(): Promise<boolean> {
    if (!this.hidpp) return false;
    
    try {
      // Get current gesture config to verify feature works
      const config = await this.hidpp.getGestureConfig();
      console.log('Gesture config:', config);
      return true;
    } catch (err) {
      console.error('Failed to update gesture:', err);
      return false;
    }
  }
}

export const hidService = new HIDService();


