import React, { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';
import MouseTab from './MouseTab';
import PointerTab from './PointerTab';
import ScrollingTab from './ScrollingTab';
import ProfilesTab from './ProfilesTab';

type TabKey = 'mouse' | 'pointer' | 'scrolling' | 'profiles';

function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: TabKey[] = ['mouse', 'pointer', 'scrolling', 'profiles'];
  return (
    <div className="flex border-b border-neutral-700 px-5">
      {tabs.map((t) => (
        <button
          key={t}
          className={
            'px-6 py-3 text-sm ' +
            (active === t ? 'text-white border-b-2 border-white' : 'text-neutral-400 hover:text-white')
          }
          onClick={() => onChange(t)}
        >
          {t[0].toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}

function DeviceCard() {
  const device = useAppStore((s) => s.device);
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const connectionError = useAppStore((s) => s.connectionError);
  const setDevice = useAppStore((s) => s.setDevice);
  const setConnectionStatus = useAppStore((s) => s.setConnectionStatus);
  
  const handleConnect = async () => {
    console.log('[Renderer] Connect button clicked');
    setConnectionStatus('connecting');
    setConnectionError(null);
    
    try {
      // Discover devices
      console.log('[Renderer] Calling discoverDevices...');
      const result = await window.mxc.discoverDevices();
      console.log('[Renderer] Discovery result:', result);
      
      if (result.devices.length === 0) {
        console.log('[Renderer] No devices found');
        setConnectionStatus('error', 'No MX Master devices found');
        return;
      }
      
      // Connect to first device
      console.log('[Renderer] Connecting to device:', result.devices[0]);
      const connectResult = await window.mxc.connectDevice({ path: result.devices[0].path });
      console.log('[Renderer] Connect result:', connectResult);
      
      if (!connectResult.success) {
        console.log('[Renderer] Connection failed:', connectResult.error);
        setConnectionStatus('error', connectResult.error || 'Connection failed');
        return;
      }
      
      // Get updated device status
      console.log('[Renderer] Getting device status...');
      const status = await window.mxc.getDeviceStatus();
      console.log('[Renderer] Device status:', status);
      setDevice(status);
      setConnectionStatus('connected');
      console.log('[Renderer] Connection complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Renderer] Error in handleConnect:', err);
      setConnectionStatus('error', message);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await window.mxc.disconnectDevice();
      const status = await window.mxc.getDeviceStatus();
      setDevice(status);
      setConnectionStatus('idle');
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };
  
  return (
    <div className="mx-5 mt-5 rounded-md border border-neutral-700 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-neutral-600 rounded" />
          <div>
            <div className="text-sm font-medium">{device?.name ?? 'No device detected'}</div>
            <div className="text-xs text-neutral-500">Wireless Mouse</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span>{device?.connection ?? 'unknown'}</span>
            <span>{device ? `🔋 ${device.battery.percentage}%` : '—'}</span>
            <span className={device?.connected ? 'text-green-400' : 'text-neutral-500'}>
              {device?.connected ? '✓ Connected' : 'Disconnected'}
            </span>
          </div>
          {!device?.connected && (
            <button
              onClick={handleConnect}
              disabled={connectionStatus === 'connecting'}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs rounded transition-colors"
            >
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Device'}
            </button>
          )}
          {device?.connected && (
            <button
              onClick={handleDisconnect}
              className="px-4 py-1.5 border border-neutral-600 hover:border-neutral-500 text-neutral-300 text-xs rounded transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      {connectionError && (
        <div className="mt-2 text-xs text-red-400">Error: {connectionError}</div>
      )}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState<TabKey>('mouse');
  const setDevice = useAppStore((s) => s.setDevice);

  useEffect(() => {
    // Load device status via IPC when available
    window.mxc
      ?.getDeviceStatus?.()
      .then((d: any) => setDevice(d))
      .catch(() => void 0);
  }, [setDevice]);

  // Resize the window to fit content (no scrollbars)
  useEffect(() => {
    const WIDTH = 900;
    const root = document.getElementById('root') ?? document.body;
    let raf = 0;

    const measureAndResize = () => {
      // Measure full content height and add 1px buffer to prevent bars from rounding
      const height = Math.ceil((root?.scrollHeight || document.documentElement.scrollHeight) + 1);
      window.mxc?.resizeWindow?.({ width: WIDTH, height });
    };

    // Observe content size changes
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureAndResize);
    });
    ro.observe(root);

    // Initial
    raf = requestAnimationFrame(measureAndResize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active]);

  return (
    <div className="w-[900px] bg-black text-white flex flex-col overflow-hidden">
      <div className="bg-neutral-900 border-b border-neutral-700 px-4 py-3 text-sm font-medium">MX Control</div>
      <DeviceCard />
      <Tabs active={active} onChange={setActive} />
      <div className="flex-1">
        {active === 'mouse' && <MouseTab />}
        {active === 'pointer' && <PointerTab />}
        {active === 'scrolling' && <ScrollingTab />}
        {active === 'profiles' && <ProfilesTab />}
      </div>
      <div className="border-t border-neutral-700 p-4 flex items-center justify-between">
        <button className="px-4 py-2 border border-neutral-600 rounded bg-neutral-900 text-sm">Restore Defaults</button>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-neutral-600 rounded bg-neutral-900 text-sm">Apply</button>
          <button className="px-4 py-2 bg-white text-black rounded text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}


