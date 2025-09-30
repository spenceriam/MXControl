import React, { useCallback, useState, useEffect } from 'react';
import { useAppStore } from '../state/store';

function clampToStep(val: number) {
  const clamped = Math.min(4000, Math.max(200, val));
  const steps = Math.round(clamped / 50);
  return steps * 50;
}

export default function PointerTab() {
  const device = useAppStore((s) => s.device);
  const dpiSettings = useAppStore((s) => s.dpi);
  const setDpiSettings = useAppStore((s) => s.setDpi);
  
  const [dpi, setDpi] = useState(dpiSettings.value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current DPI from device on mount or when device connects
  useEffect(() => {
    if (device?.connected) {
      // DPI will be loaded from device status - for now use store value
      setDpi(dpiSettings.value);
    }
  }, [device?.connected, dpiSettings.value]);

  const commit = useCallback(async (next: number) => {
    const value = clampToStep(next);
    setDpi(value);
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.mxc.setDpi({ value });
      if (result.success) {
        setDpiSettings({ ...dpiSettings, value });
      } else {
        setError('Failed to set DPI');
        setDpi(dpiSettings.value); // Revert
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setDpi(dpiSettings.value); // Revert
    } finally {
      setLoading(false);
    }
  }, [dpiSettings, setDpiSettings]);

  return (
    <div className="p-10 max-w-[600px] mx-auto">
      {!device?.connected && (
        <div className="mb-4 p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-400">
          Connect a device to configure pointer settings
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between text-sm mb-2">
        <span>Pointer Speed</span>
        <span className="flex items-center gap-2">
          {dpi} DPI
          {loading && <span className="text-xs text-neutral-500">(saving...)</span>}
        </span>
      </div>
      <input
        type="range"
        min={200}
        max={4000}
        step={50}
        value={dpi}
        onChange={(e) => setDpi(Number(e.target.value))}
        onMouseUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => commit(dpi)}
        disabled={!device?.connected || loading}
        className="w-full disabled:opacity-50"
      />
      <div className="flex justify-between text-xs text-neutral-500">
        <span>Slow</span>
        <span>Fast</span>
      </div>
      <div className="mt-5">
        <div className="text-sm text-neutral-400 mb-2">Quick Select</div>
        <div className="grid grid-cols-5 gap-2">
          {[800, 1200, 1600, 2400, 3200].map((p) => (
            <button
              key={p}
              disabled={!device?.connected || loading}
              className={`py-2 border rounded ${dpi === p ? 'border-white' : 'border-neutral-600'} bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity`}
              onClick={() => commit(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={dpiSettings.acceleration}
            onChange={(e) => setDpiSettings({ ...dpiSettings, acceleration: e.target.checked })}
            disabled={!device?.connected}
            className="disabled:opacity-50"
          /> 
          Enable pointer acceleration
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={dpiSettings.precision}
            onChange={(e) => setDpiSettings({ ...dpiSettings, precision: e.target.checked })}
            disabled={!device?.connected}
            className="disabled:opacity-50"
          /> 
          Enhance pointer precision
        </label>
      </div>
    </div>
  );
}


