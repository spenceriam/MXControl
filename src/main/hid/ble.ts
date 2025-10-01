import { EventEmitter } from 'events';
import * as dbus from 'dbus-next';

// Logitech vendor-specific GATT service and characteristic UUIDs
const LOGITECH_SERVICE_UUID = '00010000-0000-1000-8000-011f2000046d';
const LOGITECH_CHAR_UUID = '00010001-0000-1000-8000-011f2000046d';

export interface BLEDeviceInfo {
  address: string; // MAC address (e.g., "CD:37:EE:48:C1:6A")
  name?: string;
}

/**
 * BLE GATT transport for HID++ communication over Bluetooth Low Energy
 * Uses BlueZ D-Bus API to communicate with Logitech devices
 */
export class BLETransport extends EventEmitter {
  private bus: dbus.MessageBus | null = null;
  private charProxy: any = null;
  private propsInterface: any = null;
  private connected: boolean = false;
  private deviceInfo: BLEDeviceInfo | null = null;

  constructor() {
    super();
  }

  /**
   * Connect to a Bluetooth device via GATT
   */
  async connect(deviceInfo: BLEDeviceInfo): Promise<void> {
    try {
      console.log(`[BLE] Connecting to device: ${deviceInfo.address}`);
      
      // Connect to system D-Bus
      this.bus = dbus.systemBus();
      
      // Convert MAC address to D-Bus path format (e.g., CD:37:EE:48:C1:6A -> CD_37_EE_48_C1_6A)
      const addressPath = deviceInfo.address.replace(/:/g, '_').toUpperCase();
      
      // Find the Logitech GATT characteristic
      const charPath = await this.findLogitechCharacteristic(addressPath);
      if (!charPath) {
        throw new Error('Logitech GATT characteristic not found on device');
      }
      
      console.log(`[BLE] Found characteristic at: ${charPath}`);
      
      // Get proxy for the characteristic
      const obj = await this.bus.getProxyObject('org.bluez', charPath);
      this.charProxy = obj.getInterface('org.bluez.GattCharacteristic1');
      this.propsInterface = obj.getInterface('org.freedesktop.DBus.Properties');
      
      // Subscribe to notifications
      console.log('[BLE] Starting notifications...');
      await this.charProxy.StartNotify();
      
      // Listen for property changes (notifications)
      this.propsInterface.on('PropertiesChanged', this.handleNotification.bind(this));
      
      this.connected = true;
      this.deviceInfo = deviceInfo;
      
      console.log('[BLE] Connected successfully');
    } catch (err) {
      console.error('[BLE] Connection failed:', err);
      this.close();
      throw err;
    }
  }

  /**
   * Find the Logitech GATT characteristic path for a device
   */
  private async findLogitechCharacteristic(addressPath: string): Promise<string | null> {
    if (!this.bus) return null;
    
    try {
      // Get the device object
      const devicePath = `/org/bluez/hci0/dev_${addressPath}`;
      const deviceObj = await this.bus.getProxyObject('org.bluez', devicePath);
      const deviceInterface = deviceObj.getInterface('org.bluez.Device1');
      
      // Check if device is connected
      const deviceProps = deviceObj.getInterface('org.freedesktop.DBus.Properties');
      const connected = await deviceProps.Get('org.bluez.Device1', 'Connected');
      
      if (!connected.value) {
        console.log('[BLE] Device not connected, attempting to connect...');
        await deviceInterface.Connect();
        // Wait a bit for services to be discovered
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Get ObjectManager to enumerate all objects
      const managerObj = await this.bus.getProxyObject('org.bluez', '/');
      const manager = managerObj.getInterface('org.freedesktop.DBus.ObjectManager');
      const objects = await manager.GetManagedObjects();
      
      // Find characteristics under this device
      for (const [path, interfaces] of Object.entries(objects) as [string, any][]) {
        if (path.startsWith(devicePath) && interfaces['org.bluez.GattCharacteristic1']) {
          const charData: any = interfaces['org.bluez.GattCharacteristic1'];
          const uuid = charData.UUID?.value;
          
          console.log(`[BLE] Found characteristic: ${path} | UUID: ${uuid}`);
          
          if (uuid === LOGITECH_CHAR_UUID) {
            return path;
          }
        }
      }
      
      return null;
    } catch (err) {
      console.error('[BLE] Error finding characteristic:', err);
      return null;
    }
  }

  /**
   * Handle incoming notifications from the device
   */
  private handleNotification(iface: string, changed: any, invalidated: any): void {
    if (changed.Value) {
      const data = Buffer.from(changed.Value.value);
      console.log(`[BLE] Notification received (${data.length} bytes): ${data.toString('hex')}`);
      this.emit('data', data);
    }
  }

  /**
   * Write data to the device
   */
  async write(data: Buffer): Promise<number> {
    if (!this.connected || !this.charProxy) {
      throw new Error('BLE device not connected');
    }
    
    try {
      console.log(`[BLE] Writing ${data.length} bytes: ${data.toString('hex')}`);
      
      // Convert Buffer to array of numbers for D-Bus
      const dataArray = Array.from(data);
      
      // Write to characteristic
      await this.charProxy.WriteValue(dataArray, {});
      
      return data.length;
    } catch (err) {
      console.error('[BLE] Write failed:', err);
      throw err;
    }
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.charProxy) {
      try {
        this.charProxy.StopNotify().catch(() => {});
      } catch (err) {
        // Ignore errors during cleanup
      }
    }
    
    if (this.propsInterface) {
      try {
        this.propsInterface.removeAllListeners();
      } catch (err) {
        // Ignore
      }
    }
    
    this.charProxy = null;
    this.propsInterface = null;
    this.bus = null;
    this.connected = false;
    this.deviceInfo = null;
    
    console.log('[BLE] Disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get device info
   */
  getDeviceInfo(): BLEDeviceInfo | null {
    return this.deviceInfo;
  }
}
