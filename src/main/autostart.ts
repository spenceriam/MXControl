import fs from 'fs';
import path from 'path';
import os from 'os';
import { app } from 'electron';

const desktopEntry = `[Desktop Entry]
Type=Application
Name=MX Control
Exec=${process.execPath}
X-GNOME-Autostart-enabled=true
`;

export function enableAutostart() {
  const dir = path.join(os.homedir(), '.config', 'autostart');
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, 'mx-control.desktop');
  fs.writeFileSync(target, desktopEntry, { encoding: 'utf8' });
}

export function disableAutostart() {
  const target = path.join(os.homedir(), '.config', 'autostart', 'mx-control.desktop');
  try {
    fs.unlinkSync(target);
  } catch {
    // ignore
  }
}

export function isAutostartEnabled() {
  const target = path.join(os.homedir(), '.config', 'autostart', 'mx-control.desktop');
  return fs.existsSync(target);
}


