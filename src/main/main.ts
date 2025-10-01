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
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload/preload.js'),
      contextIsolation: true,
      sandbox: false, // Disabled to allow preload to require shared modules
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false
    }
  });

  const isDev = !app.isPackaged;
  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../../renderer/index.html')}`;
  mainWindow.loadURL(url);

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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
  
  // Initialize HID service without connecting (prevents startup crashes)
  // Connection will be initiated by user action or IPC handler
  try {
    hidService.initialize();
    console.log('HID service initialized (not connected)');
  } catch (err) {
    console.error('HID service initialization failed:', err);
    // App continues without HID support
  }

  // React to HID state changes for UI updates
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

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Log but don't exit - allow app to continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Log but don't exit - allow app to continue
});



