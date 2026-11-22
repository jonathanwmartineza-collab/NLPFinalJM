import { useEffect, useState } from 'react';
import { onLinkClick } from '../lib/router';
import { clearChats, clearBuilds } from '../lib/storage';
import { canSpeak, useSpeech } from '../lib/voice';
import { ApiError } from '../lib/api';

export function Thinking({ since, label }: { since: number; label: string }) {
  const [s, setS] = useState(0);
  useEffect(() => { const t = setInterval(() => setS(Math.floor((Date.now() - since) / 1000)), 500); return () => clearInterval(t); }, [since]);
  return <p className="thinking">{label} <span className="dots" aria-hidden="true"><i /><i /><i /></span> <span>{s} s</span></p>;
}

export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'budget' || e.code === 'quota') {
      const t = e.resetAt ? new Date(e.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      return `${e.message}${t ? ` It resets at ${t}.` : ''}`;
    }
    return e.message;
  }
  return 'Something went wrong. Please try again.';
}

export function VoiceControls({ speech }: { speech: ReturnType<typeof useSpeech> }) {
  if (!canSpeak) return null;
  const en = speech.voices.filter((v) => v.lang?.toLowerCase().startsWith((navigator.language || 'en').slice(0, 2)));
  const list = en.length ? en : speech.voices;
  return (
    <div className="voice-line">
      <label className="switch"><input type="checkbox" checked={speech.enabled} onChange={(e) => speech.setEnabled(e.target.checked)} /> Read answers aloud</label>
      {speech.enabled && list.length > 0 && (
        <label>Voice{' '}
          <select value={speech.voice} onChange={(e) => speech.setVoice(e.target.value)}>
            <option value="">Browser default</option>
            {list.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

export function ChatFooter({ research, onCleared }: { research?: string; onCleared?: () => void }) {
  return (
    <div className="composer-foot" style={{ marginTop: 8 }}>
      <span>AI-generated answers. Review before you rely on them.{research ? ` Research dated ${research}.` : ''}</span>
      <span className="footer-links">
        <a href="/resources" onClick={onLinkClick}>Resources</a> · <a href="/guide" onClick={onLinkClick}>How it was built</a> · <a href="/privacy" onClick={onLinkClick}>Privacy</a>
        {onCleared && <> · <button type="button" style={{ border: 0, background: 'none', padding: 0, color: 'var(--faint)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
          onClick={() => { clearChats(); clearBuilds(); onCleared(); }}>Clear all chats</button></>}
      </span>
    </div>
  );
}
