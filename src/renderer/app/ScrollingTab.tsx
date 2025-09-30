import React, { useState, useEffect } from 'react';
import { useAppStore } from '../state/store';

export default function ScrollingTab() {
  const device = useAppStore((s) => s.device);
  const scrolling = useAppStore((s) => s.scrolling);
  const setScrolling = useAppStore((s) => s.setScrolling);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize from store
  useEffect(() => {
    // State managed in store
  }, []);

  const updateVerticalDirection = async (direction: 'standard' | 'natural') => {
    const updated = { ...scrolling, vertical: { ...scrolling.vertical, direction } };
    setScrolling(updated);
    try {
      setLoading(true);
      await window.mxc.updateScroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const updateVerticalSpeed = async (speed: number) => {
    const updated = { ...scrolling, vertical: { ...scrolling.vertical, speed } };
    setScrolling(updated);
    try {
      setLoading(true);
      await window.mxc.updateScroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSmooth = async (smooth: boolean) => {
    const updated = { ...scrolling, vertical: { ...scrolling.vertical, smooth } };
    setScrolling(updated);
    try {
      setLoading(true);
      await window.mxc.updateScroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const updateLines = async (lines: number) => {
    const updated = { ...scrolling, vertical: { ...scrolling.vertical, lines } };
    setScrolling(updated);
    try {
      setLoading(true);
      await window.mxc.updateScroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const updateHorizontalFunction = async (func: string) => {
    const updated = { ...scrolling, horizontal: { ...scrolling.horizontal, function: func as any } };
    setScrolling(updated);
    try {
      setLoading(true);
      await window.mxc.updateScroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const updateHorizontalSensitivity = async (sensitivity: number) => {
    const updated = { ...scrolling, horizontal: { ...scrolling.horizontal, sensitivity } };
    setScrolling(updated);
    try {
      setLoading(true);
      await window.mxc.updateScroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-6">
      {!device?.connected && (
        <div className="p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-400">
          Connect a device to configure scrolling
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="border border-neutral-700 rounded p-5 bg-neutral-900">
        <div className="text-xs text-neutral-400 uppercase mb-3">Vertical Scroll</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="radio" 
              name="vdir" 
              checked={scrolling.vertical.direction === 'standard'} 
              onChange={() => updateVerticalDirection('standard')}
              disabled={!device?.connected || loading}
            /> Standard (Traditional)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="radio" 
              name="vdir" 
              checked={scrolling.vertical.direction === 'natural'} 
              onChange={() => updateVerticalDirection('natural')}
              disabled={!device?.connected || loading}
            /> Natural
          </label>
        </div>
        <div className="mt-4">
          <div className="text-sm mb-2">Scroll Speed: {scrolling.vertical.speed}</div>
          <input 
            type="range" 
            min={1} 
            max={10} 
            step={1} 
            value={scrolling.vertical.speed} 
            onChange={(e) => updateVerticalSpeed(Number(e.target.value))}
            disabled={!device?.connected || loading}
            className="w-full disabled:opacity-50" 
          />
        </div>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input 
            type="checkbox" 
            checked={scrolling.vertical.smooth} 
            onChange={(e) => toggleSmooth(e.target.checked)}
            disabled={!device?.connected || loading}
          /> Enable smooth scrolling
        </label>
        <div className="mt-3">
          <div className="text-sm mb-1">Lines per scroll</div>
          <select 
            value={scrolling.vertical.lines} 
            onChange={(e) => updateLines(Number(e.target.value))} 
            disabled={!device?.connected || loading}
            className="bg-black border border-neutral-700 rounded p-2 disabled:opacity-50">
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
          <select 
            value={scrolling.horizontal.function} 
            onChange={(e) => updateHorizontalFunction(e.target.value)} 
            disabled={!device?.connected || loading}
            className="w-full p-2 bg-black border border-neutral-700 rounded disabled:opacity-50">
            {['horizontal-scroll', 'volume', 'zoom', 'tab-navigation', 'timeline', 'brush-size', 'page-navigation'].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-sm mb-2">Sensitivity: {scrolling.horizontal.sensitivity}</div>
          <input 
            type="range" 
            min={1} 
            max={10} 
            step={1} 
            value={scrolling.horizontal.sensitivity} 
            onChange={(e) => updateHorizontalSensitivity(Number(e.target.value))}
            disabled={!device?.connected || loading}
            className="w-full disabled:opacity-50" 
          />
        </div>
      </div>
    </div>
  );
}


