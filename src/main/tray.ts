import { app, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { listProfiles, saveProfiles, getSettings, setSettings } from './persistence';

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
  const items: Electron.MenuItemConstructorOptions[] = [];

  items.push({ label: 'MX Control', enabled: false });
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
  items.push({ label: 'Show Window', click: () => app.focus({ steal: true }) });
  items.push({ label: 'Quit', role: 'quit' });
  tray.setContextMenu(Menu.buildFromTemplate(items));
}


