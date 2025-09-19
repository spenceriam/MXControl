import fs from 'fs';
import path from 'path';
import os from 'os';

const LOG_DIR = path.join(os.homedir(), '.config', 'mx-control', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'mx-control.log');

function ensureDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}
}

function redact(input: unknown): string {
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  // Redact sequences that look like serial numbers (alnum length >= 8)
  return text.replace(/[A-Za-z0-9]{8,}/g, (m) => m.replace(/.(?=.{4})/g, 'X'));
}

export function logInfo(message: string, meta?: unknown) {
  ensureDir();
  const line = `${new Date().toISOString()} INFO ${message}${meta ? ' ' + redact(meta) : ''}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
}

export function logError(message: string, err?: unknown) {
  ensureDir();
  const line = `${new Date().toISOString()} ERROR ${message}${err ? ' ' + redact(err) : ''}\n`;
  fs.appendFile(LOG_FILE, line, () => {});
}

export function getLogPath() {
  return LOG_FILE;
}


