import React, { useCallback, useState } from 'react';
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
  'show-desktop'
];

function nextAction(current: ButtonSimpleAction): ButtonSimpleAction {
  const idx = simpleActions.findIndex((a) => JSON.stringify(a) === JSON.stringify(current));
  return simpleActions[(idx + 1) % simpleActions.length];
}

export default function MouseTab() {
  const [buttons, setButtons] = useState<ButtonsMapping | null>(null);
  const [gesture, setGesture] = useState<GestureConfig | null>(null);

  const cycle = useCallback(
    async (key: 'middle' | 'back' | 'forward') => {
      const next = nextAction((buttons?.[key] as ButtonSimpleAction) ?? 'middle-click');
      const updated: ButtonsMapping = {
        middle: buttons?.middle ?? 'middle-click',
        back: buttons?.back ?? 'back',
        forward: buttons?.forward ?? 'forward',
        gesture: buttons?.gesture ?? { mode: 'gestures', sensitivity: 5 }
      };
      updated[key] = next;
      setButtons(updated);
      await window.mxc.updateButtons(updated);
    },
    [buttons]
  );

  const toggleGestureMode = useCallback(async () => {
    const current = gesture ?? { mode: 'gestures', sensitivity: 5 };
    const next: GestureConfig = current.mode === 'gestures' ? { mode: 'single', sensitivity: 5, singleAction: 'mission-control' } : { mode: 'gestures', sensitivity: 5 };
    setGesture(next);
    await window.mxc.updateGesture(next);
  }, [gesture]);

  return (
    <div className="p-10">
      <div className="relative w-[400px] h-[500px] mx-auto">
        <div className="opacity-10 w-full h-full border border-neutral-700" />

        <button className="absolute left-1/2 -translate-x-1/2 top-20 px-4 py-2 border border-neutral-600 rounded bg-neutral-900" onClick={() => cycle('middle')}>
          Middle: {typeof buttons?.middle === 'string' ? buttons?.middle : 'keystroke'}
        </button>

        <button className="absolute left-16 top-44 px-4 py-2 border border-neutral-600 rounded bg-neutral-900" onClick={() => cycle('back')}>
          Back: {typeof buttons?.back === 'string' ? buttons?.back : 'keystroke'}
        </button>

        <button className="absolute right-16 top-44 px-4 py-2 border border-neutral-600 rounded bg-neutral-900" onClick={() => cycle('forward')}>
          Forward: {typeof buttons?.forward === 'string' ? buttons?.forward : 'keystroke'}
        </button>

        <button className="absolute left-20 top-72 px-4 py-2 border border-neutral-600 rounded bg-neutral-900" onClick={toggleGestureMode}>
          Gesture: {gesture?.mode ?? 'gestures'}
        </button>

        <button className="absolute left-1/2 -translate-x-1/2 top-[380px] px-4 py-2 border border-neutral-600 rounded bg-neutral-900">
          Horizontal: volume
        </button>
      </div>
    </div>
  );
}


