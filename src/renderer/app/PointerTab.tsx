import React, { useCallback, useState } from 'react';

function clampToStep(val: number) {
  const clamped = Math.min(4000, Math.max(200, val));
  const steps = Math.round(clamped / 50);
  return steps * 50;
}

export default function PointerTab() {
  const [dpi, setDpi] = useState(1600);

  const commit = useCallback(async (next: number) => {
    const value = clampToStep(next);
    setDpi(value);
    await window.mxc.setDpi({ value });
  }, []);

  return (
    <div className="p-10 max-w-[600px] mx-auto">
      <div className="flex items-center justify-between text-sm mb-2">
        <span>Pointer Speed</span>
        <span>{dpi} DPI</span>
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
        className="w-full"
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
              className={`py-2 border rounded ${dpi === p ? 'border-white' : 'border-neutral-600'} bg-neutral-900`}
              onClick={() => commit(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" /> Enable pointer acceleration
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked type="checkbox" /> Enhance pointer precision
        </label>
      </div>
    </div>
  );
}


