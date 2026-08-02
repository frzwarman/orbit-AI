import { useRef } from "react";

import { useDialogFocus } from "../../hooks/use-dialog-focus";
import { usePreferencesStore } from "../../stores/preferences-store";
import type { QualityMode } from "../../types/preferences";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  const threeDEnabled = usePreferencesStore((store) => store.threeDEnabled);
  const reducedMotion = usePreferencesStore((store) => store.reducedMotion);
  const quality = usePreferencesStore((store) => store.quality);
  const setThreeDEnabled = usePreferencesStore((store) => store.setThreeDEnabled);
  const setReducedMotion = usePreferencesStore((store) => store.setReducedMotion);
  const setQuality = usePreferencesStore((store) => store.setQuality);
  const warning = usePreferencesStore((store) => store.persistenceWarning);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className="settings-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="dialog-heading"><div><p className="eyebrow">Preferences</p><h2 id="settings-title">Workspace settings</h2></div>
          <button type="button" className="icon-button" aria-label="Close settings" onClick={onClose}>×</button></div>
        <label className="toggle-setting"><span><strong>3D assistant</strong><small>Show the interactive office scene</small></span>
          <input type="checkbox" role="switch" aria-label="Enable 3D" checked={threeDEnabled} onChange={(event) => setThreeDEnabled(event.target.checked)} /></label>
        <label className="toggle-setting"><span><strong>Reduced motion</strong><small>Minimize camera and interface movement</small></span>
          <input type="checkbox" role="switch" aria-label="Reduce motion" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /></label>
        <label className="select-setting"><span>Rendering quality</span>
          <select value={quality} onChange={(event) => setQuality(event.target.value as QualityMode)}>
            <option value="auto">Auto</option><option value="low">Low</option><option value="high">High</option>
          </select></label>
        {warning && <p className="storage-warning" role="status">{warning}</p>}
      </div>
    </div>
  );
}
