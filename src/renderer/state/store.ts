import { create } from 'zustand';
import type { DeviceStatus, DPISettings, ButtonsMapping, ScrollingSettings, Profile } from '@shared/types';

export interface DeviceSlice {
  device: DeviceStatus | null;
  setDevice: (device: DeviceStatus | null) => void;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  connectionError: string | null;
  setConnectionStatus: (status: 'idle' | 'connecting' | 'connected' | 'error', error?: string) => void;
}

export interface PointerSlice {
  dpi: DPISettings;
  setDpi: (dpi: DPISettings) => void;
}

export interface ButtonsSlice {
  buttons: ButtonsMapping;
  setButtons: (buttons: ButtonsMapping) => void;
}

export interface ScrollingSlice {
  scrolling: ScrollingSettings;
  setScrolling: (scrolling: ScrollingSettings) => void;
}

export interface ProfilesSlice {
  profiles: Profile[];
  activeProfileId: string | null;
  setProfiles: (profiles: Profile[]) => void;
  setActiveProfile: (id: string | null) => void;
}

export type AppState = DeviceSlice & PointerSlice & ButtonsSlice & ScrollingSlice & ProfilesSlice;

const defaultDpi: DPISettings = { value: 1600, acceleration: false, precision: true };
const defaultButtons: ButtonsMapping = {
  middle: 'middle-click',
  back: 'back',
  forward: 'forward',
  gesture: { mode: 'gestures', sensitivity: 5, actions: { up: 'mission-control', down: 'show-desktop', left: 'desktop-left', right: 'desktop-right' } }
};
const defaultScrolling: ScrollingSettings = {
  vertical: { direction: 'standard', speed: 5, smooth: true, lines: 3 },
  horizontal: { function: 'volume', sensitivity: 5, direction: 'standard' }
};

export const useAppStore = create<AppState>((set) => ({
  device: null,
  setDevice: (device) => set({ device }),
  connectionStatus: 'idle',
  connectionError: null,
  setConnectionStatus: (status, error) => set({ connectionStatus: status, connectionError: error ?? null }),

  dpi: defaultDpi,
  setDpi: (dpi) => set({ dpi }),

  buttons: defaultButtons,
  setButtons: (buttons) => set({ buttons }),

  scrolling: defaultScrolling,
  setScrolling: (scrolling) => set({ scrolling }),

  profiles: [],
  activeProfileId: null,
  setProfiles: (profiles) => set({ profiles }),
  setActiveProfile: (id) => set({ activeProfileId: id })
}));


