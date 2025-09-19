export type DeviceConnectionType = 'usb' | 'receiver' | 'bluetooth' | 'unknown';

export interface BatteryInfo {
  percentage: number; // 0-100
  charging: boolean;
}

export interface DPISettings {
  value: number; // 200-4000 in 50 steps
  acceleration: boolean;
  precision: boolean;
}

export type ButtonSimpleAction =
  | 'middle-click'
  | 'copy'
  | 'paste'
  | 'app-switcher'
  | 'mission-control'
  | 'play-pause'
  | 'back'
  | 'forward'
  | 'undo'
  | 'redo'
  | 'desktop-left'
  | 'desktop-right'
  | 'show-desktop'
  | 'next-track'
  | 'prev-track'
  | { type: 'keystroke'; value: string };

export type GestureDirection = 'up' | 'down' | 'left' | 'right';

export interface GestureConfig {
  mode: 'single' | 'gestures';
  sensitivity: number; // 1-10
  singleAction?: ButtonSimpleAction;
  actions?: Partial<Record<GestureDirection, ButtonSimpleAction>>;
}

export type HorizontalFunction =
  | 'horizontal-scroll'
  | 'volume'
  | 'zoom'
  | 'tab-navigation'
  | 'timeline'
  | 'brush-size'
  | 'page-navigation';

export interface ScrollingSettings {
  vertical: {
    direction: 'standard' | 'natural';
    speed: number; // 1-10
    smooth: boolean;
    lines: number; // 1-10
  };
  horizontal: {
    function: HorizontalFunction;
    sensitivity: number; // 1-10
    direction: 'standard' | 'natural';
  };
}

export interface ButtonsMapping {
  middle: ButtonSimpleAction;
  back: ButtonSimpleAction;
  forward: ButtonSimpleAction;
  gesture: GestureConfig;
}

export interface Profile {
  id: string;
  name: string;
  deviceId: string;
  settings: {
    dpi: DPISettings;
    buttons: ButtonsMapping;
    scrolling: ScrollingSettings;
  };
}

export interface DeviceStatus {
  name: string;
  serialRedacted: string;
  connection: DeviceConnectionType;
  battery: BatteryInfo;
  connected: boolean;
}


