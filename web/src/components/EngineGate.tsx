import { useEffect, useState } from 'react';
import { useEngine, initEngine, loadTier, cancelLoad, savedTier } from '../ai/engine';
import { TIERS, type TierId } from '../ai/models';
import { onLinkClick } from '../lib/router';

/** Shown in place of the composer until the on-device AI is ready. Nothing downloads without a click. */
export default function EngineGate({ copyText }: { copyText?: string }) {
  const s = useEngine();
  const [pick, setPick] = useState<TierId>(() => savedTier() ?? 'quality');
  const [copied, setCopied] = useState('');
  useEffect(() => { initEngine(); }, []);
  useEffect(() => { if (!savedTier()) setPick(s.recommended); }, [s.recommended]);

  if (s.status === 'ready') return null;
  if (s.status === 'checking') return <p className="notice" role="status">Checking whether this device can run the free on-device AI…</p>;

  const copy = async () => {
    if (!copyText) return;
    try { await navigator.clipboard.writeText(copyText); setCopied('Copied. Paste it into any AI chat you use.'); } catch { setCopied('Copy was blocked by the browser.'); }
  };

  if (s.status === 'unsupported') return (
    <div className="notice warn engine-gate">
      <p><b>This device can't run the free AI.</b> {s.reason}</p>
      <p>It needs a browser with WebGPU turned on and a graphics chip with about 1 GB or more of free memory: for example a recent Chrome or Edge on a laptop or desktop. You can still browse the team, the prompt library and the guides.</p>
      {copyText && <p><button type="button" className="btn ghost sm" onClick={copy}>Copy this expert's prompt</button> <span role="status">{copied}</span></p>}
    </div>
  );
  if (s.status === 'elsewhere') return <p className="notice warn" role="alert"><b>The AI is already running in another tab.</b> {s.reason}</p>;

  if (s.status === 'loading') {
    const pct = Math.round(s.progress * 100);
    const t = TIERS.find((x) => x.id === s.tier);
    return (
      <div className="notice engine-gate" aria-live="polite">
        <p><b>{s.cached[s.tier!] ? 'Starting' : 'Downloading'} the {t?.label} model…</b> {pct}%</p>
        <progress max={100} value={pct} aria-label={`Model download ${pct}%`} />
        <p className="small">{s.progressText}</p>
        <p className="small">The first time takes a few minutes. It's saved in this browser, so next time it starts in seconds and even works offline.</p>
        <button type="button" className="btn ghost sm" onClick={() => cancelLoad()}>Cancel</button>
      </div>
    );
  }

  const tier = TIERS.find((t) => t.id === pick)!;
  const cached = !!s.cached[pick];
  return (
    <div className="engine-gate">
      {s.status === 'error' && (
        <div className="notice err" role="alert">
          <p><b>The AI stopped.</b> {s.reason}</p>
          {s.errorKind === 'oom' && pick !== 'lite' && <button type="button" className="btn sm" onClick={() => { setPick('lite'); loadTier('lite'); }}>Use the Lite model instead</button>}
        </div>
      )}
      <fieldset className="tiers">
        <legend>Turn on the free AI. It runs on your device: nothing you type leaves your browser.</legend>
        {TIERS.map((t) => (
          <label key={t.id} className="tier" data-on={pick === t.id}>
            <input type="radio" name="tier" value={t.id} checked={pick === t.id} onChange={() => setPick(t.id)} />
            <span>
              <b>{t.label}</b> · needs ≈{t.sizeGb} GB of graphics memory{s.recommended === t.id ? ' · Recommended for this device' : ''}{s.cached[t.id] ? ' · Downloaded' : ''}
              <span className="small">{t.blurb} Licence: <a href={t.licenceUrl} target="_blank" rel="noreferrer">{t.licence}</a>{t.attribution ? ` (${t.attribution})` : ''}.</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="small">{cached ? 'This model is already saved in this browser.' : <>The model (a one-time download, smaller than its memory need) comes from Hugging Face, which sees the download request like any website. It's saved in this browser for next time. <a href="/privacy" onClick={onLinkClick}>Privacy</a></>}{s.storage ? ` Storage used: ${(s.storage.usedMb / 1000).toFixed(1)} GB of ${(s.storage.quotaMb / 1000).toFixed(0)} GB available to this site.` : ''}</p>
      <button type="button" className="btn" onClick={() => loadTier(pick)}>{cached ? `Turn on AI (${tier.label})` : `Download ${tier.label} model`}</button>
    </div>
  );
}

/** Small header badge: which model answers. */
export function DeviceBadge() {
  const s = useEngine();
  if (s.status !== 'ready') return null;
  const t = TIERS.find((x) => x.id === s.tier);
  return <span className="badge device" title={s.modelId}>On your device · {t?.label}</span>;
}
