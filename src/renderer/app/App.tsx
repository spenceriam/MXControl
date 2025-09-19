import React, { useEffect, useState } from 'react';
import { useAppStore } from '../state/store';

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
  return (
    <div className="mx-5 mt-5 rounded-md border border-neutral-700 bg-neutral-900 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border border-neutral-600 rounded" />
        <div>
          <div className="text-sm font-medium">{device?.name ?? 'No device detected'}</div>
          <div className="text-xs text-neutral-500">Wireless Mouse</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-neutral-400">
        <span>{device?.connection ?? 'unknown'}</span>
        <span>{device ? `🔋 ${device.battery.percentage}%` : '—'}</span>
        <span className={device?.connected ? 'text-green-400' : 'text-neutral-500'}>
          {device?.connected ? '✓ Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}

function MouseTab() {
  return (
    <div className="p-10">
      <div className="text-neutral-400">Mouse tab placeholder (UI-02 will implement callouts)</div>
    </div>
  );
}

function PointerTab() {
  return (
    <div className="p-10">
      <div className="text-neutral-400">Pointer tab placeholder (UI-03 will add DPI slider)</div>
    </div>
  );
}

function ScrollingTab() {
  return (
    <div className="p-10">
      <div className="text-neutral-400">Scrolling tab placeholder (UI-03 content)</div>
    </div>
  );
}

function ProfilesTab() {
  return (
    <div className="p-10">
      <div className="text-neutral-400">Profiles tab placeholder (UI-03 content)</div>
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

  return (
    <div className="w-[900px] h-[650px] bg-black text-white flex flex-col">
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


