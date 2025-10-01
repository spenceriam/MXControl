/**
 * Device-specific mappings for Logitech MX mice
 * 
 * Control IDs (CIDs) and Task IDs (TIDs) are device-specific and must be
 * discovered from the device using Feature 0x1b04 (Reprogrammable Keys).
 * 
 * This file provides standard mappings based on HID++ 2.0 spec and Solaar.
 * 
 * References:
 * - HID++ 2.0 Specification
 * - Solaar: https://github.com/pwr-Solaar/Solaar
 * - Logitech Options+ behavior
 */

/**
 * Standard Control IDs for Logitech mice
 * These are common across MX Master series but should be verified with device
 */
export enum ControlId {
  // Mouse buttons
  LEFT_BUTTON = 0x50,
  RIGHT_BUTTON = 0x51,
  MIDDLE_BUTTON = 0x52,
  BACK_BUTTON = 0x53,
  FORWARD_BUTTON = 0x56,
  
  // Gesture button (thumb button on MX Master)
  GESTURE_BUTTON = 0xc3,
  
  // Scroll wheel
  VERTICAL_SCROLL_UP = 0x5d,
  VERTICAL_SCROLL_DOWN = 0x5e,
  
  // Horizontal scroll (thumb wheel)
  HORIZONTAL_SCROLL_LEFT = 0x5f,
  HORIZONTAL_SCROLL_RIGHT = 0x60,
  
  // DPI buttons (if present)
  DPI_UP = 0x69,
  DPI_DOWN = 0x6a,
  DPI_CYCLE = 0x6b,
}

/**
 * UI Action names that users can assign to buttons
 * These are the friendly names shown in the UI
 */
export enum ButtonAction {
  // Default mouse actions
  LEFT_CLICK = 'left-click',
  RIGHT_CLICK = 'right-click',
  MIDDLE_CLICK = 'middle-click',
  BACK = 'back',
  FORWARD = 'forward',
  
  // Gesture mode
  GESTURES = 'gestures',
  
  // System actions
  MISSION_CONTROL = 'mission-control',
  SHOW_DESKTOP = 'show-desktop',
  DESKTOP_LEFT = 'desktop-left',
  DESKTOP_RIGHT = 'desktop-right',
  APP_SWITCHER = 'app-switcher',
  
  // Media controls
  PLAY_PAUSE = 'play-pause',
  NEXT_TRACK = 'next-track',
  PREV_TRACK = 'prev-track',
  VOLUME_UP = 'volume-up',
  VOLUME_DOWN = 'volume-down',
  MUTE = 'mute',
  
  // Browser/App actions
  NEW_TAB = 'new-tab',
  CLOSE_TAB = 'close-tab',
  REOPEN_TAB = 'reopen-tab',
  NEXT_TAB = 'next-tab',
  PREV_TAB = 'prev-tab',
  
  // Special
  DISABLED = 'disabled',
  DEFAULT = 'default',
}

/**
 * Gesture directions for gesture button
 */
export enum GestureDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Task IDs for standard HID++ actions
 * These are the built-in actions that the device understands
 */
export enum TaskId {
  // Standard mouse buttons
  LEFT_BUTTON = 0x38,
  RIGHT_BUTTON = 0x39,
  MIDDLE_BUTTON = 0x3a,
  BACK_BUTTON = 0x3b,
  FORWARD_BUTTON = 0x3c,
  
  // Scroll actions
  VERTICAL_SCROLL = 0x3d,
  HORIZONTAL_SCROLL = 0x3e,
  
  // No action
  NO_ACTION = 0x00,
}

/**
 * Mapping from UI button names to Control IDs
 * This is MX Master 2S specific
 */
export const BUTTON_TO_CID: Record<string, ControlId> = {
  'middle': ControlId.MIDDLE_BUTTON,
  'back': ControlId.BACK_BUTTON,
  'forward': ControlId.FORWARD_BUTTON,
  'gesture': ControlId.GESTURE_BUTTON,
};

/**
 * Mapping from UI actions to Task IDs
 * For actions that have native HID++ support
 */
export const ACTION_TO_TID: Record<ButtonAction, TaskId | null> = {
  [ButtonAction.LEFT_CLICK]: TaskId.LEFT_BUTTON,
  [ButtonAction.RIGHT_CLICK]: TaskId.RIGHT_BUTTON,
  [ButtonAction.MIDDLE_CLICK]: TaskId.MIDDLE_BUTTON,
  [ButtonAction.BACK]: TaskId.BACK_BUTTON,
  [ButtonAction.FORWARD]: TaskId.FORWARD_BUTTON,
  [ButtonAction.DEFAULT]: null, // Use device default
  [ButtonAction.DISABLED]: TaskId.NO_ACTION,
  
  // These require OS-level remapping (null = not supported via HID++)
  [ButtonAction.GESTURES]: null,
  [ButtonAction.MISSION_CONTROL]: null,
  [ButtonAction.SHOW_DESKTOP]: null,
  [ButtonAction.DESKTOP_LEFT]: null,
  [ButtonAction.DESKTOP_RIGHT]: null,
  [ButtonAction.APP_SWITCHER]: null,
  [ButtonAction.PLAY_PAUSE]: null,
  [ButtonAction.NEXT_TRACK]: null,
  [ButtonAction.PREV_TRACK]: null,
  [ButtonAction.VOLUME_UP]: null,
  [ButtonAction.VOLUME_DOWN]: null,
  [ButtonAction.MUTE]: null,
  [ButtonAction.NEW_TAB]: null,
  [ButtonAction.CLOSE_TAB]: null,
  [ButtonAction.REOPEN_TAB]: null,
  [ButtonAction.NEXT_TAB]: null,
  [ButtonAction.PREV_TAB]: null,
};

/**
 * Default button configuration for MX Master 2S
 * Matches Logitech Options+ defaults
 */
export const DEFAULT_BUTTON_CONFIG = {
  middle: ButtonAction.MIDDLE_CLICK,
  back: ButtonAction.BACK,
  forward: ButtonAction.FORWARD,
  gesture: ButtonAction.GESTURES,
};

/**
 * Default gesture actions
 * Matches Logitech Options+ defaults
 */
export const DEFAULT_GESTURE_ACTIONS = {
  [GestureDirection.UP]: ButtonAction.MISSION_CONTROL,
  [GestureDirection.DOWN]: ButtonAction.SHOW_DESKTOP,
  [GestureDirection.LEFT]: ButtonAction.DESKTOP_LEFT,
  [GestureDirection.RIGHT]: ButtonAction.DESKTOP_RIGHT,
};

/**
 * Flags for setControlIdReporting
 */
export enum ControlFlags {
  /** Device handles the button (no divert) */
  DEFAULT = 0x00,
  
  /** Divert button presses to software (required for custom actions) */
  DIVERT = 0x01,
  
  /** Persist divert setting across power cycles */
  PERSIST = 0x02,
  
  /** Raw XY movement data */
  RAW_XY = 0x04,
  
  /** Analytics key events */
  ANALYTICS_KEY_EVENTS = 0x08,
}

/**
 * Helper to determine if an action requires OS-level remapping
 * (i.e., not natively supported by HID++ protocol)
 */
export function requiresOSRemapping(action: ButtonAction): boolean {
  return ACTION_TO_TID[action] === null && action !== ButtonAction.DEFAULT;
}

/**
 * Helper to get the Control ID for a button name
 */
export function getControlId(buttonName: string): ControlId | null {
  return BUTTON_TO_CID[buttonName] ?? null;
}

/**
 * Helper to get the Task ID for an action
 */
export function getTaskId(action: ButtonAction): TaskId | null {
  return ACTION_TO_TID[action] ?? null;
}

/**
 * Keyboard shortcuts for OS-level actions on Linux
 * These are standard XDG/GNOME/KDE shortcuts
 */
export const OS_ACTION_SHORTCUTS: Record<ButtonAction, string[]> = {
  // Window management
  [ButtonAction.MISSION_CONTROL]: ['Super+s', 'Alt+F1'], // Overview/Activities
  [ButtonAction.SHOW_DESKTOP]: ['Super+d', 'Ctrl+Alt+d'], // Show Desktop
  [ButtonAction.DESKTOP_LEFT]: ['Super+Page_Down', 'Ctrl+Alt+Left'],
  [ButtonAction.DESKTOP_RIGHT]: ['Super+Page_Up', 'Ctrl+Alt+Right'],
  [ButtonAction.APP_SWITCHER]: ['Alt+Tab'],
  
  // Media
  [ButtonAction.PLAY_PAUSE]: ['XF86AudioPlay'],
  [ButtonAction.NEXT_TRACK]: ['XF86AudioNext'],
  [ButtonAction.PREV_TRACK]: ['XF86AudioPrev'],
  [ButtonAction.VOLUME_UP]: ['XF86AudioRaiseVolume'],
  [ButtonAction.VOLUME_DOWN]: ['XF86AudioLowerVolume'],
  [ButtonAction.MUTE]: ['XF86AudioMute'],
  
  // Browser
  [ButtonAction.NEW_TAB]: ['Ctrl+t'],
  [ButtonAction.CLOSE_TAB]: ['Ctrl+w'],
  [ButtonAction.REOPEN_TAB]: ['Ctrl+Shift+t'],
  [ButtonAction.NEXT_TAB]: ['Ctrl+Tab'],
  [ButtonAction.PREV_TAB]: ['Ctrl+Shift+Tab'],
  
  // Not applicable
  [ButtonAction.LEFT_CLICK]: [],
  [ButtonAction.RIGHT_CLICK]: [],
  [ButtonAction.MIDDLE_CLICK]: [],
  [ButtonAction.BACK]: [],
  [ButtonAction.FORWARD]: [],
  [ButtonAction.GESTURES]: [],
  [ButtonAction.DEFAULT]: [],
  [ButtonAction.DISABLED]: [],
};
