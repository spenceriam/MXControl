import React, { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppStore } from '../state/store';
import type { Profile } from '@shared/types';

export default function ProfilesTab() {
  const device = useAppStore((s) => s.device);
  const dpi = useAppStore((s) => s.dpi);
  const buttons = useAppStore((s) => s.buttons);
  const scrolling = useAppStore((s) => s.scrolling);
  const setDpi = useAppStore((s) => s.setDpi);
  const setButtons = useAppStore((s) => s.setButtons);
  const setScrolling = useAppStore((s) => s.setScrolling);
  
  const profilesStore = useAppStore((s) => s.profiles);
  const setProfilesStore = useAppStore((s) => s.setProfiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const setActiveProfileId = useAppStore((s) => s.setActiveProfile);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);
  
  const loadProfiles = async () => {
    try {
      const list = await window.mxc.listProfiles();
      setProfilesStore(list);
      
      const settings = await window.mxc.getSettings();
      setActiveProfileId(settings.defaultProfileId);
    } catch (err) {
      setError('Failed to load profiles');
    }
  };

  const saveProfiles = async (next: Profile[]) => {
    try {
      setLoading(true);
      await window.mxc.saveProfiles(next);
      setProfilesStore(next);
      setError(null);
    } catch (err) {
      setError('Failed to save profiles');
    } finally {
      setLoading(false);
    }
  };

  const createProfileFromCurrent = async () => {
    if (!device?.connected) {
      setError('Connect a device first');
      return;
    }
    
    const p: Profile = {
      id: uuid(),
      name: 'New Profile',
      deviceId: device.serialRedacted,
      settings: {
        dpi,
        buttons,
        scrolling
      }
    };
    await saveProfiles([...profilesStore, p]);
  };

  const activateProfile = async (profile: Profile) => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply profile settings to current state
      setDpi(profile.settings.dpi);
      setButtons(profile.settings.buttons);
      setScrolling(profile.settings.scrolling);
      
      // Send to device
      await window.mxc.setDpi(profile.settings.dpi);
      await window.mxc.updateButtons(profile.settings.buttons);
      await window.mxc.updateGesture(profile.settings.buttons.gesture);
      await window.mxc.updateScroll(profile.settings.scrolling);
      
      // Set as active profile
      setActiveProfileId(profile.id);
      await window.mxc.saveSettings({ defaultProfileId: profile.id, autostart: false, startMinimized: false });
    } catch (err) {
      setError('Failed to activate profile');
    } finally {
      setLoading(false);
    }
  };
  
  const startEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setEditName(profile.name);
  };
  
  const saveEdit = async () => {
    if (!editingId) return;
    
    const updated = profilesStore.map(p => 
      p.id === editingId ? { ...p, name: editName } : p
    );
    await saveProfiles(updated);
    setEditingId(null);
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const removeProfile = async (id: string) => {
    if (!confirm('Delete this profile?')) return;
    await saveProfiles(profilesStore.filter((p) => p.id !== id));
  };

  return (
    <div className="p-10">
      {!device?.connected && (
        <div className="mb-4 p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-400">
          Connect a device to manage profiles
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="border border-neutral-700 rounded overflow-hidden">
        {profilesStore.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 last:border-b-0">
            {editingId === p.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-black border border-neutral-600 rounded px-2 py-1 text-sm"
                  autoFocus
                />
                <button 
                  onClick={saveEdit}
                  className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs"
                >
                  Save
                </button>
                <button 
                  onClick={cancelEdit}
                  className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400">📝</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      {activeProfileId === p.id && <span className="text-green-400 text-xs">✓ Active</span>}
                    </div>
                    <div className="text-xs text-neutral-500">
                      DPI: {p.settings.dpi.value} | Buttons: {typeof p.settings.buttons.middle === 'string' ? p.settings.buttons.middle : 'custom'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                  <button 
                    onClick={() => activateProfile(p)}
                    disabled={!device?.connected || loading || activeProfileId === p.id}
                    className="px-3 py-1 border border-neutral-600 rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {activeProfileId === p.id ? 'Active' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => startEdit(p)}
                    disabled={loading}
                    className="px-3 py-1 text-neutral-400 hover:text-white disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => removeProfile(p.id)}
                    disabled={loading}
                    className="px-3 py-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {profilesStore.length === 0 && <div className="px-4 py-6 text-neutral-500">No profiles yet. Create one from your current settings.</div>}
      </div>
      <div className="mt-4 flex gap-2">
        <button 
          onClick={createProfileFromCurrent}
          disabled={!device?.connected || loading}
          className="px-4 py-2 border border-neutral-600 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : '+ Save Current Settings as Profile'}
        </button>
      </div>
      <div className="mt-6 p-4 border border-neutral-700 rounded bg-neutral-900">
        <div className="text-sm font-medium mb-3">About Profiles</div>
        <div className="text-xs text-neutral-400 space-y-2">
          <p>Profiles save your complete mouse configuration (DPI, buttons, scrolling).</p>
          <p>Create a profile to quickly switch between different setups.</p>
          <p>The active profile is automatically applied when you connect your device.</p>
        </div>
      </div>
    </div>
  );
}


