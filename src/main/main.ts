import { app, BrowserWindow, Menu, nativeTheme } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc';
import { createTray } from './tray';
import { hidService } from './hid/service';
import { setDeviceCache, getDeviceCache } from './persistence';
import { updateTrayMenu } from './tray';

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false
    }
  });

  const isDev = !app.isPackaged;
  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../renderer/index.html')}`;
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: prevent navigation
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(async () => {
  createMainWindow();
  registerIpcHandlers();
  createTray();
  // Attempt to discover and connect to first found device (placeholder strategy)
  const cached = getDeviceCache();
  const devices = hidService.discover();
  const target = devices.find((d) => (cached.lastPath && d.path === cached.lastPath) || (cached.serial && d.serialNumber === cached.serial)) || devices[0];
  if (target) {
    try {
      await hidService.connect(target);
      setDeviceCache({ lastPath: target.path, serial: target.serialNumber });
      console.log('Connected to device:', target.product);
    } catch (err) {
      console.error('Failed to connect to device:', err);
      // ignore connection failures for now
    }
  } else {
    console.log('No MX Master devices found');
  }

  // react to HID state changes
  hidService.onChange(() => {
    updateTrayMenu();
  });
  if (process.platform === 'darwin') {
    const template: Electron.MenuItemConstructorOptions[] = [{ role: 'appMenu' }, { role: 'editMenu' }];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }
  nativeTheme.themeSource = 'dark';
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});



