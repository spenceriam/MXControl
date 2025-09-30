import { app, Menu, Tray, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import { listProfiles, saveProfiles, getSettings, setSettings } from './persistence';
import { hidService } from './hid/service';

let tray: Tray | null = null;

export function createTray() {
  if (tray) return tray;
  const iconPath = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '../../..'), 'assets', 'topdown.png');
  const image = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
  tray = new Tray(image);
  updateTrayMenu();
  return tray;
}

export function updateTrayMenu() {
  if (!tray) return;
  const profiles = listProfiles();
  const settings = getSettings();
  const deviceState = hidService.getState();
  const items: Electron.MenuItemConstructorOptions[] = [];

  // Device status
  if (deviceState.connected) {
    const batteryIcon = deviceState.charging ? '⚡' : '🔋';
    const deviceName = deviceState.info?.product || 'MX Master';
    items.push({ label: `${deviceName}`, enabled: false });
    items.push({ label: `${batteryIcon} Battery: ${deviceState.batteryPct}%`, enabled: false });
    items.push({ label: `Connection: ${deviceState.connection}`, enabled: false });
  } else {
    items.push({ label: 'No device connected', enabled: false });
  }
  
  items.push({ type: 'separator' });

  // Profiles submenu
  items.push({
    label: 'Profiles',
    submenu: profiles.length
      ? profiles.map((p) => ({
          id: p.id,
          label: p.name,
          type: 'radio',
          checked: settings.defaultProfileId === p.id,
          click: () => {
            setSettings({ ...settings, defaultProfileId: p.id });
            updateTrayMenu();
          }
        }))
      : [{ label: 'No profiles', enabled: false }]
  });

  items.push({ type: 'separator' });
  items.push({ 
    label: 'Show Window', 
    click: () => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
        windows[0].focus();
      }
    } 
  });
  items.push({ label: 'Quit', role: 'quit' });
  tray.setContextMenu(Menu.buildFromTemplate(items));
  
  // Update tooltip
  if (deviceState.connected) {
    tray.setToolTip(`MX Control - Battery: ${deviceState.batteryPct}%`);
  } else {
    tray.setToolTip('MX Control - No device');
  }
}


