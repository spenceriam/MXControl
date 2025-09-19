import React, { useState } from 'react';

export default function ScrollingTab() {
  const [verticalDir, setVerticalDir] = useState<'standard' | 'natural'>('standard');
  const [verticalSpeed, setVerticalSpeed] = useState(5);
  const [smooth, setSmooth] = useState(true);
  const [lines, setLines] = useState(3);
  const [hMode, setHMode] = useState('volume');
  const [hSens, setHSens] = useState(5);

  return (
    <div className="p-10 space-y-6">
      <div className="border border-neutral-700 rounded p-5 bg-neutral-900">
        <div className="text-xs text-neutral-400 uppercase mb-3">Vertical Scroll</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="vdir" checked={verticalDir === 'standard'} onChange={() => setVerticalDir('standard')} /> Standard (Traditional)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="vdir" checked={verticalDir === 'natural'} onChange={() => setVerticalDir('natural')} /> Natural
          </label>
        </div>
        <div className="mt-4">
          <div className="text-sm mb-2">Scroll Speed</div>
          <input type="range" min={1} max={10} step={1} value={verticalSpeed} onChange={(e) => setVerticalSpeed(Number(e.target.value))} className="w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /> Enable smooth scrolling
        </label>
        <div className="mt-3">
          <div className="text-sm mb-1">Lines per scroll</div>
          <select value={lines} onChange={(e) => setLines(Number(e.target.value))} className="bg-black border border-neutral-700 rounded p-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-neutral-700 rounded p-5 bg-neutral-900">
        <div className="text-xs text-neutral-400 uppercase mb-3">Horizontal Scroll</div>
        <div className="mb-3">
          <select value={hMode} onChange={(e) => setHMode(e.target.value)} className="w-full p-2 bg-black border border-neutral-700 rounded">
            {['horizontal-scroll', 'volume', 'zoom', 'tab-navigation', 'timeline', 'brush-size', 'page-navigation'].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-sm mb-2">Sensitivity</div>
          <input type="range" min={1} max={10} step={1} value={hSens} onChange={(e) => setHSens(Number(e.target.value))} className="w-full" />
        </div>
      </div>
    </div>
  );
}


