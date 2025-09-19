import React, { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Profile } from '@shared/types';

export default function ProfilesTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    window.mxc
      .listProfiles()
      .then((list: Profile[]) => setProfiles(list))
      .catch(() => setProfiles([]));
    window.mxc
      .getSettings()
      .then((s: { defaultProfileId: string | null }) => setActiveId(s.defaultProfileId))
      .catch(() => setActiveId(null));
  }, []);

  async function save(next: Profile[]) {
    setProfiles(next);
    await window.mxc.saveProfiles(next);
  }

  async function newProfile() {
    const p: Profile = {
      id: uuid(),
      name: 'New Profile',
      deviceId: 'device-serial',
      settings: {
        dpi: { value: 1600, acceleration: false, precision: true },
        buttons: {
          middle: 'middle-click',
          back: 'back',
          forward: 'forward',
          gesture: { mode: 'gestures', sensitivity: 5 }
        },
        scrolling: {
          vertical: { direction: 'standard', speed: 5, smooth: true, lines: 3 },
          horizontal: { function: 'volume', sensitivity: 5, direction: 'standard' }
        }
      }
    };
    await save([...profiles, p]);
  }

  async function removeProfile(id: string) {
    await save(profiles.filter((p) => p.id !== id));
  }

  return (
    <div className="p-10">
      <div className="border border-neutral-700 rounded overflow-hidden">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">📝</span>
              <span>{p.name}</span>
              {activeId === p.id && <span className="text-green-400 text-xs">✓ Active</span>}
            </div>
            <div className="flex gap-2 text-sm">
              <button className="text-neutral-400 hover:text-white">Activate</button>
              <button className="text-neutral-400 hover:text-white">Edit</button>
              <button className="text-neutral-400 hover:text-white" onClick={() => removeProfile(p.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {profiles.length === 0 && <div className="px-4 py-6 text-neutral-500">No profiles yet.</div>}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="px-3 py-2 border border-neutral-600 rounded bg-neutral-900" onClick={newProfile}>
          + New Profile
        </button>
        <button className="px-3 py-2 border border-neutral-600 rounded bg-neutral-900">Import</button>
        <button className="px-3 py-2 border border-neutral-600 rounded bg-neutral-900">Export</button>
      </div>
      <div className="mt-6 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Auto-start with system
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Show in system tray
        </label>
      </div>
    </div>
  );
}


