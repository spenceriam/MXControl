import HID from 'node-hid';
import { HIDPPProtocol, HIDPPError } from './hidpp';
import { BLETransport } from './ble';
import { BLEBatteryService } from './ble-battery';
import { 
  ButtonAction, 
  getControlId, 
  getTaskId, 
  ControlFlags,
  requiresOSRemapping 
} from './device-mappings';

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
  private bleTransport: BLETransport | null = null;
  private bleBatteryService: BLEBatteryService | null = null;
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
      // Enumerate all HID devices
      const allDevices = HID.devices();
      console.log(`[HID Discovery] Total devices enumerated: ${allDevices.length}`);

      // Candidate filters:
      // - Logitech vendor (0x046d)
      // - OR Logitech HID++ usage page (0xff43)
      // - OR product name contains "mx master"
      const candidates = allDevices.filter((d) => {
        const isLogitech = d.vendorId === 0x046d;
        const isHidpp = (d.usagePage as any) === 0xff43;
        const name = (d.product ?? '').toLowerCase();
        const isMxName = name.includes('mx master') || name.includes('master 2s');
        return isLogitech || isHidpp || isMxName;
      });
      console.log(`[HID Discovery] Candidates after filtering: ${candidates.length}`);
      candidates.forEach((d, i) => {
        console.log(`  [${i}] ${d.product} | path=${d.path} | vendor=0x${(d.vendorId ?? 0).toString(16)} | product=0x${(d.productId ?? 0).toString(16)} | usagePage=0x${((d.usagePage as any) ?? 0).toString(16)}`);
      });

      // Prefer HID++ interface if available
      const hidppDevices = candidates.filter((d) => (d.usagePage as any) === 0xff43);
      console.log(`[HID Discovery] HID++ devices (usagePage 0xff43): ${hidppDevices.length}`);
      const preferred = hidppDevices.length > 0 ? hidppDevices : candidates;

      // Dedupe by path (Bluetooth often reports multiple logical interfaces with same hidraw)
      const byPath = new Map<string, typeof preferred[number]>();
      for (const d of preferred) {
        if (d.path) byPath.set(d.path, d);
      }
      const unique = Array.from(byPath.values());
      console.log(`[HID Discovery] Unique devices after dedup: ${unique.length}`);

      // Map to API shape
      const result = unique.map((d) => ({
        path: d.path!,
        vendorId: d.vendorId ?? 0,
        productId: d.productId ?? 0,
        serialNumber: d.serialNumber,
        manufacturer: d.manufacturer,
        product: d.product
      }));
      
      console.log(`[HID Discovery] Returning ${result.length} device(s) to renderer`);
      return result;
    } catch (err) {
      console.error('Device discovery failed:', err);
      return []; // Return empty array instead of crashing
    }
  }

  async connect(info: HidDeviceInfo): Promise<void> {
    this.close();
    
    // Create timeout promise
    const timeoutMs = 10000; // Increased for BLE
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
      console.log(`[HID Connect] Opening device: ${info.path}`);
      console.log(`[HID Connect] Product: ${info.product}, Serial: ${info.serialNumber}`);
      
      // Detect connection type based on strong heuristics (Linux Bluetooth often uses hidraw with MAC serial)
      const serialLooksLikeMac = !!info.serialNumber && /([0-9a-f]{2}:){5}[0-9a-f]{2}/i.test(info.serialNumber);
      const pathHintsBt = /uhid|bluetooth/i.test(info.path);
      const productHintsBt = /bluetooth/i.test(info.product ?? '');
      const isBluetooth = serialLooksLikeMac || pathHintsBt || productHintsBt;
      this.state.connection = isBluetooth ? 'bluetooth' : 'receiver';
      console.log(`[HID Connect] Connection type: ${this.state.connection} (BT=${isBluetooth}, serialMAC=${serialLooksLikeMac}, pathBT=${pathHintsBt})`);
      
      // For Bluetooth devices, use BLE GATT instead of HID
      if (isBluetooth && info.serialNumber) {
        console.log(`[HID Connect] Bluetooth device detected, using BLE GATT transport`);
        this.bleTransport = new BLETransport();
        await this.bleTransport.connect({
          address: info.serialNumber,
          name: info.product
        });
        console.log(`[HID Connect] BLE connected successfully`);
        
        // Initialize BLE Battery Service for simpler battery reading
        this.bleBatteryService = new BLEBatteryService();
        console.log(`[BLE Battery] Service initialized`);
        
        // Initialize HID++ protocol with BLE transport (for DPI, buttons, etc.)
        this.hidpp = new HIDPPProtocol(this.bleTransport, true);
        console.log(`[HID++] Protocol initialized with BLE transport`);
      } else {
        // Use traditional HID for Unifying receiver
        console.log(`[HID Connect] Using HID transport`);
        this.device = new HID.HID(info.path);
        console.log(`[HID Connect] HID device opened successfully`);
        
        // Initialize HID++ protocol with HID transport
        this.hidpp = new HIDPPProtocol(this.device, isBluetooth);
        console.log(`[HID++] Protocol initialized with HID transport`);
      }
      
      // Verify device responds with a simple ping first (more reliable)
      console.log(`[HID Connect] Verifying connection with ping...`);
      const pingSuccess = await this.hidpp.ping();
      if (!pingSuccess) {
        console.warn(`[HID Connect] Ping failed, trying getProtocolVersion...`);
        // Fallback to getProtocolVersion
        try {
          const version = await this.hidpp.getProtocolVersion();
          console.log(`[HID Connect] Protocol version: ${version.major}.${version.minor}`);
        } catch (err) {
          console.error(`[HID Connect] Both ping and getProtocolVersion failed`);
          throw new Error('Device not responding to HID++ commands');
        }
      } else {
        console.log(`[HID Connect] Ping successful`);
      }
      
      // Discover features for caching
      console.log(`[HID Connect] Discovering features...`);
      const features = await this.hidpp.discoverFeatures();
      console.log(`[HID Connect] Discovered ${features.length} features`);
      
      this.state.connected = true;
      this.state.info = info;
      
      // Get initial battery status
      console.log(`[HID Connect] Getting battery status...`);
      await this.updateBatteryStatus();
      
      this.startBatteryPolling();
      this.emit();
      console.log(`[HID Connect] Connection complete and successful`);
    } catch (err) {
      console.error('[HID Connect] Internal connection error:', err);
      if (err instanceof Error) {
        console.error('[HID Connect] Error stack:', err.stack);
      }
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
    if (this.bleBatteryService) {
      try {
        this.bleBatteryService.close();
      } catch {}
      this.bleBatteryService = null;
    }
    if (this.bleTransport) {
      try {
        this.bleTransport.close();
      } catch {}
      this.bleTransport = null;
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
    try {
      // For Bluetooth devices, prefer GATT Battery Service (simpler, more reliable)
      if (this.bleBatteryService && this.state.info?.serialNumber) {
        console.log('[HID Service] Reading battery via GATT Battery Service');
        const level = await this.bleBatteryService.readBatteryLevel(this.state.info.serialNumber);
        
        // Use trend-based charging detection
        const batteryInfo = this.bleBatteryService.getBatteryInfo();
        this.state.batteryPct = batteryInfo.level;
        this.state.charging = batteryInfo.charging ?? false;
        
        this.emit();
        console.log(`[HID Service] Battery: ${level}%, charging: ${batteryInfo.charging}`);
      } else if (this.hidpp) {
        // For USB/Unifying, use HID++ protocol
        console.log('[HID Service] Reading battery via HID++ protocol');
        const battery = await this.hidpp.getBatteryStatus();
        this.state.batteryPct = battery.percentage;
        this.state.charging = battery.charging;
        this.emit();
        console.log(`[HID Service] Battery: ${battery.percentage}%, charging: ${battery.charging}`);
      }
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
      await this.hidpp.getControlCount();
      return true;
    } catch (err) {
      console.error('Failed to configure buttons:', err);
      return false;
    }
  }

  /**
   * Set the action for a specific button
   * @param buttonName Button name (e.g., 'middle', 'back', 'forward', 'gesture')
   * @param action Action to assign (from ButtonAction enum)
   * @returns true if successful, false otherwise
   */
  async setButtonAction(buttonName: string, action: ButtonAction): Promise<boolean> {
    if (!this.hidpp) {
      console.error('[Button Remap] Not connected to device');
      return false;
    }

    try {
      // Get Control ID for this button
      const cid = getControlId(buttonName);
      if (cid === null) {
        console.error(`[Button Remap] Unknown button: ${buttonName}`);
        return false;
      }

      console.log(`[Button Remap] Setting ${buttonName} (CID 0x${cid.toString(16)}) to ${action}`);

      // Check if action requires OS-level remapping
      if (requiresOSRemapping(action)) {
        console.log(`[Button Remap] Action ${action} requires OS-level remapping`);
        // For now, we'll divert the button to software but not implement the action
        // TODO: Implement OS-level input injection for custom actions
        await this.hidpp.setControlIdReporting(
          cid,
          true, // divert
          true  // persist
        );
        console.log(`[Button Remap] Button diverted to software for custom action`);
        return true;
      }

      // For default action, reset to device default
      if (action === ButtonAction.DEFAULT) {
        console.log(`[Button Remap] Resetting ${buttonName} to default`);
        await this.hidpp.setControlIdReporting(cid, false, false); // no divert, no persist
        return true;
      }

      // For native HID++ actions, get the Task ID
      const tid = getTaskId(action);
      if (tid !== null) {
        // For native mouse actions, use device default handling
        // The device knows how to handle these actions natively
        console.log(`[Button Remap] Using native action TID 0x${tid.toString(16)}`);
        await this.hidpp.setControlIdReporting(cid, false, false); // no divert, use device default
        return true;
      }

      console.error(`[Button Remap] Failed to map action ${action} to ${buttonName}`);
      return false;
    } catch (err) {
      console.error(`[Button Remap] Failed to set button action:`, err);
      return false;
    }
  }

  /**
   * Get the current button configuration
   * @returns Map of button names to current actions
   */
  async getButtonActions(): Promise<Record<string, ButtonAction>> {
    if (!this.hidpp) {
      console.error('[Button Remap] Not connected to device');
      return {};
    }

    try {
      const count = await this.hidpp.getControlCount();
      console.log(`[Button Remap] Device has ${count} programmable controls`);

      const config: Record<string, ButtonAction> = {};

      // Query each control for its current state
      for (let i = 0; i < count; i++) {
        try {
          const info = await this.hidpp.getControlIdInfo(i);
          console.log(`[Button Remap] Control ${i}: CID=0x${info.cid.toString(16)}, TID=0x${info.tid.toString(16)}`);
          
          // Map CID back to button name
          // For now, just log - full reverse mapping needs more work
        } catch (err) {
          console.warn(`[Button Remap] Failed to get info for control ${i}`);
        }
      }

      return config;
    } catch (err) {
      console.error('[Button Remap] Failed to get button actions:', err);
      return {};
    }
  }

  /**
   * Set gesture sensitivity
   * @param sensitivity 1-10 (10 = most sensitive)
   * @returns true if successful
   */
  async setGestureSensitivity(sensitivity: number): Promise<boolean> {
    if (!this.hidpp) {
      console.error('[Gesture] Not connected to device');
      return false;
    }

    try {
      console.log(`[Gesture] Setting sensitivity to ${sensitivity}`);
      await this.hidpp.setGestureConfig(true, sensitivity);
      return true;
    } catch (err) {
      console.error('[Gesture] Failed to set sensitivity:', err);
      return false;
    }
  }

  /**
   * Get current gesture configuration
   * @returns Gesture config with enabled state and sensitivity
   */
  async getGestureConfig(): Promise<{ enabled: boolean; sensitivity: number } | null> {
    if (!this.hidpp) {
      console.error('[Gesture] Not connected to device');
      return null;
    }

    try {
      const config = await this.hidpp.getGestureConfig();
      console.log(`[Gesture] Current config: enabled=${config.enabled}, sensitivity=${config.sensitivity}`);
      return config;
    } catch (err) {
      console.error('[Gesture] Failed to get config:', err);
      return null;
    }
  }
}

export const hidService = new HIDService();
