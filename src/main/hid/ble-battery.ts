import * as dbus from 'dbus-next';

// Standard BLE Battery Service UUIDs
const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

export interface BLEBatteryInfo {
  level: number; // 0-100
  charging?: boolean;
}

/**
 * BLE GATT Battery Service handler
 * Provides simple battery level reading via standard BLE Battery Service
 * This is more reliable than HID++ for battery status over Bluetooth
 */
export class BLEBatteryService {
  private bus: dbus.MessageBus | null = null;
  private batteryCharPath: string | null = null;
  private charProxy: any = null;
  private propsInterface: any = null;
  private notificationCallback: ((level: number) => void) | null = null;

  constructor() {
    // Empty constructor
  }

  /**
   * Read battery level from a Bluetooth device
   * @param deviceAddress MAC address in format "CD:37:EE:48:C1:6A"
   * @returns Battery level percentage (0-100)
   */
  async readBatteryLevel(deviceAddress: string): Promise<number> {
    try {
      console.log(`[BLE Battery] Reading battery level for ${deviceAddress}`);

      // Connect to system D-Bus if not already connected
      if (!this.bus) {
        this.bus = dbus.systemBus();
      }

      // Convert MAC address to D-Bus path format
      const addressPath = deviceAddress.replace(/:/g, '_').toUpperCase();
      const devicePath = `/org/bluez/hci0/dev_${addressPath}`;

      // Find the battery characteristic
      const charPath = await this.findBatteryCharacteristic(devicePath);
      if (!charPath) {
        throw new Error('Battery characteristic not found on device');
      }

      // Get proxy for the characteristic
      const obj = await this.bus.getProxyObject('org.bluez', charPath);
      const char = obj.getInterface('org.bluez.GattCharacteristic1');

      // Read the value
      const value = await char.ReadValue({});
      const batteryLevel = Buffer.from(value)[0];

      console.log(`[BLE Battery] Battery level: ${batteryLevel}%`);
      return batteryLevel;
    } catch (err) {
      console.error('[BLE Battery] Failed to read battery level:', err);
      throw err;
    }
  }

  /**
   * Subscribe to battery level updates
   * @param deviceAddress MAC address in format "CD:37:EE:48:C1:6A"
   * @param callback Function to call when battery level changes
   * @returns Unsubscribe function
   */
  async subscribeToBatteryUpdates(
    deviceAddress: string,
    callback: (level: number) => void
  ): Promise<() => void> {
    try {
      console.log(`[BLE Battery] Subscribing to battery updates for ${deviceAddress}`);

      // Connect to system D-Bus if not already connected
      if (!this.bus) {
        this.bus = dbus.systemBus();
      }

      // Convert MAC address to D-Bus path format
      const addressPath = deviceAddress.replace(/:/g, '_').toUpperCase();
      const devicePath = `/org/bluez/hci0/dev_${addressPath}`;

      // Find the battery characteristic
      this.batteryCharPath = await this.findBatteryCharacteristic(devicePath);
      if (!this.batteryCharPath) {
        throw new Error('Battery characteristic not found on device');
      }

      // Get proxy for the characteristic
      const obj = await this.bus.getProxyObject('org.bluez', this.batteryCharPath);
      this.charProxy = obj.getInterface('org.bluez.GattCharacteristic1');
      this.propsInterface = obj.getInterface('org.freedesktop.DBus.Properties');

      // Subscribe to notifications
      await this.charProxy.StartNotify();

      // Store callback
      this.notificationCallback = callback;

      // Listen for property changes (notifications)
      this.propsInterface.on('PropertiesChanged', (iface: string, changed: any) => {
        if (changed.Value) {
          const level = Buffer.from(changed.Value.value)[0];
          console.log(`[BLE Battery] Battery level update: ${level}%`);
          if (this.notificationCallback) {
            this.notificationCallback(level);
          }
        }
      });

      console.log('[BLE Battery] Subscribed to battery updates');

      // Return unsubscribe function
      return () => this.unsubscribeFromBatteryUpdates();
    } catch (err) {
      console.error('[BLE Battery] Failed to subscribe to battery updates:', err);
      throw err;
    }
  }

  /**
   * Unsubscribe from battery updates
   */
  private async unsubscribeFromBatteryUpdates(): Promise<void> {
    try {
      if (this.charProxy) {
        await this.charProxy.StopNotify();
      }

      if (this.propsInterface) {
        this.propsInterface.removeAllListeners();
      }

      this.charProxy = null;
      this.propsInterface = null;
      this.batteryCharPath = null;
      this.notificationCallback = null;

      console.log('[BLE Battery] Unsubscribed from battery updates');
    } catch (err) {
      console.error('[BLE Battery] Error unsubscribing:', err);
      // Don't throw, this is cleanup
    }
  }

  /**
   * Find the battery characteristic path for a device
   */
  private async findBatteryCharacteristic(devicePath: string): Promise<string | null> {
    if (!this.bus) return null;

    try {
      // Get ObjectManager to enumerate all objects
      const managerObj = await this.bus.getProxyObject('org.bluez', '/');
      const manager = managerObj.getInterface('org.freedesktop.DBus.ObjectManager');
      const objects = await manager.GetManagedObjects();

      // Find battery characteristic under this device
      for (const [path, interfaces] of Object.entries(objects) as [string, any][]) {
        if (path.startsWith(devicePath) && interfaces['org.bluez.GattCharacteristic1']) {
          const charData: any = interfaces['org.bluez.GattCharacteristic1'];
          const uuid = charData.UUID?.value || charData.UUID;

          if (uuid === BATTERY_LEVEL_UUID) {
            console.log(`[BLE Battery] Found battery characteristic at: ${path}`);
            return path;
          }
        }
      }

      return null;
    } catch (err) {
      console.error('[BLE Battery] Error finding battery characteristic:', err);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    await this.unsubscribeFromBatteryUpdates();
    this.bus = null;
  }
}
