import HID from 'node-hid';

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

export class HIDService {
  private device: HID.HID | null = null;
  private state: HidState = { connected: false, connection: 'unknown', batteryPct: 0, charging: false };
  private pollTimer: NodeJS.Timeout | null = null;

  discover(): HidDeviceInfo[] {
    return HID.devices()
      .filter((d) => (d.product ?? '').toLowerCase().includes('mx') && (d.manufacturer ?? '').toLowerCase().includes('logitech'))
      .map((d) => ({
        path: d.path!,
        vendorId: d.vendorId!,
        productId: d.productId!,
        serialNumber: d.serialNumber,
        manufacturer: d.manufacturer,
        product: d.product
      }));
  }

  connect(info: HidDeviceInfo): void {
    this.close();
    this.device = new HID.HID(info.path);
    this.state.connected = true;
    this.state.info = info;
    this.state.connection = 'receiver';
    this.startBatteryPolling();
  }

  close(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.device) {
      try {
        this.device.close();
      } catch {}
      this.device = null;
    }
    this.state.connected = false;
  }

  private startBatteryPolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      // TODO: implement HID++ battery query. For now mock steady 85%.
      this.state.batteryPct = 85;
      this.state.charging = false;
    }, 60000);
  }

  getState(): HidState {
    return { ...this.state };
  }

  setDpi(value: number): boolean {
    // TODO: Implement HID++ DPI set. Validate range handled by IPC.
    return !!this.device;
  }

  updateButtons(): boolean {
    // TODO: Implement 0x1b04
    return !!this.device;
  }

  updateGesture(): boolean {
    // TODO: Implement 0x6501
    return !!this.device;
  }
}

export const hidService = new HIDService();


