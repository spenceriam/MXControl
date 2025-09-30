import React, { useCallback, useState, useEffect } from 'react';
import { useAppStore } from '../state/store';
import type { ButtonsMapping, ButtonSimpleAction, GestureConfig } from '@shared/types';

const simpleActions: ButtonSimpleAction[] = [
  'middle-click',
  'copy',
  'paste',
  'back',
  'forward',
  'undo',
  'redo',
  'mission-control',
  'show-desktop',
  'app-switcher',
  'play-pause',
  'desktop-left',
  'desktop-right',
  'next-track',
  'prev-track'
];

function nextAction(current: ButtonSimpleAction): ButtonSimpleAction {
  if (typeof current === 'object') return 'middle-click'; // Skip keystroke for cycling
  const idx = simpleActions.findIndex((a) => a === current);
  return simpleActions[(idx + 1) % simpleActions.length];
}

export default function MouseTab() {
  const device = useAppStore((s) => s.device);
  const buttonsStore = useAppStore((s) => s.buttons);
  const setButtonsStore = useAppStore((s) => s.setButtons);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize from store
  useEffect(() => {
    // State is now managed entirely in store
  }, []);

  const cycle = useCallback(
    async (key: 'middle' | 'back' | 'forward') => {
      if (!device?.connected || loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const currentAction = buttonsStore[key];
        const next = nextAction(currentAction as ButtonSimpleAction);
        const updated: ButtonsMapping = {
          ...buttonsStore,
          [key]: next
        };
        
        const result = await window.mxc.updateButtons(updated);
        if (result.success) {
          setButtonsStore(updated);
        } else {
          setError('Failed to update button configuration');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [device?.connected, loading, buttonsStore, setButtonsStore]
  );

  const toggleGestureMode = useCallback(async () => {
    if (!device?.connected || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const current = buttonsStore.gesture;
      const next: GestureConfig = current.mode === 'gestures' 
        ? { mode: 'single', sensitivity: 5, singleAction: 'mission-control' } 
        : { mode: 'gestures', sensitivity: 5, actions: { up: 'mission-control', down: 'show-desktop', left: 'desktop-left', right: 'desktop-right' } };
      
      const result = await window.mxc.updateGesture(next);
      if (result.success) {
        const updated = { ...buttonsStore, gesture: next };
        setButtonsStore(updated);
      } else {
        setError('Failed to update gesture configuration');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [device?.connected, loading, buttonsStore, setButtonsStore]);

  const formatAction = (action: ButtonSimpleAction): string => {
    if (typeof action === 'object') return 'keystroke';
    return action;
  };

  return (
    <div className="p-10">
      {!device?.connected && (
        <div className="mb-4 p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-400 max-w-[400px] mx-auto">
          Connect a device to configure buttons
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400 max-w-[400px] mx-auto">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-400 max-w-[400px] mx-auto">
          Updating configuration...
        </div>
      )}
      <div className="relative w-[400px] h-[500px] mx-auto">
        <div className="opacity-10 w-full h-full border border-neutral-700" />

        <button 
          className="absolute left-1/2 -translate-x-1/2 top-20 px-4 py-2 border border-neutral-600 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          onClick={() => cycle('middle')}
          disabled={!device?.connected || loading}
        >
          Middle: {formatAction(buttonsStore.middle)}
        </button>

        <button 
          className="absolute left-16 top-44 px-4 py-2 border border-neutral-600 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          onClick={() => cycle('back')}
          disabled={!device?.connected || loading}
        >
          Back: {formatAction(buttonsStore.back)}
        </button>

        <button 
          className="absolute right-16 top-44 px-4 py-2 border border-neutral-600 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          onClick={() => cycle('forward')}
          disabled={!device?.connected || loading}
        >
          Forward: {formatAction(buttonsStore.forward)}
        </button>

        <button 
          className="absolute left-20 top-72 px-4 py-2 border border-neutral-600 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          onClick={toggleGestureMode}
          disabled={!device?.connected || loading}
        >
          Gesture: {buttonsStore.gesture.mode}
        </button>

        <button 
          className="absolute left-1/2 -translate-x-1/2 top-[380px] px-4 py-2 border border-neutral-600 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          disabled={!device?.connected || loading}
        >
          Horizontal: volume
        </button>
      </div>
    </div>
  );
}


