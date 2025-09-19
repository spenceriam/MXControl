import Store from 'electron-store';
import { ProfileSchema, SettingsSchema, type ProfileDto, type SettingsDto } from '@shared/schemas';
import { logInfo } from './log';

type ProfilesStore = { profiles: ProfileDto[] };

const settingsStore = new Store<SettingsDto>({
  name: 'settings',
  defaults: SettingsSchema.parse({})
});

const profilesStore = new Store<ProfilesStore>({
  name: 'profiles',
  defaults: { profiles: [] }
});

export function getSettings(): SettingsDto {
  const raw = settingsStore.store;
  return SettingsSchema.parse(raw);
}

export function setSettings(next: SettingsDto) {
  const val = SettingsSchema.parse(next);
  settingsStore.store = val;
  logInfo('settings.update', val);
}

export function listProfiles(): ProfileDto[] {
  const raw = profilesStore.get('profiles');
  return (raw ?? []).map((p) => ProfileSchema.parse(p));
}

export function saveProfiles(profiles: ProfileDto[]) {
  const validated = profiles.map((p) => ProfileSchema.parse(p));
  profilesStore.set('profiles', validated);
  logInfo('profiles.save', { count: validated.length });
}

// Device cache (for quick reconnect)
type DeviceCache = { serial?: string; lastPath?: string };
const deviceCacheStore = new Store<DeviceCache>({ name: 'device-cache', defaults: {} });
export function getDeviceCache(): DeviceCache {
  return deviceCacheStore.store;
}
export function setDeviceCache(cache: DeviceCache) {
  deviceCacheStore.store = cache;
  logInfo('deviceCache.update', cache);
}


