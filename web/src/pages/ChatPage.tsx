import { useEffect, useRef, useState } from 'react';
import type { Agent, ChatMsg } from '../lib/types';
import { streamModel } from '../lib/api';
import { loadChats, saveChat } from '../lib/storage';
import { useSpeech } from '../lib/voice';
import Markdown from '../components/Markdown';
import Composer from '../components/Composer';
import EngineGate, { DeviceBadge } from '../components/EngineGate';
import { Avatar } from '../components/Sidebar';
import { useEngine } from '../ai/engine';
import { system } from '../ai/prompts';
import { Thinking, errorText, VoiceControls, ChatFooter } from '../components/ChatParts';
import { useClearOptions } from '../components/ClearOptions';

export default function ChatPage({ agent }: { agent: Agent }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => loadChats()[agent.slug] ?? []);
  const [busy, setBusy] = useState(false);
  const [since, setSince] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState('');
  const [live, setLive] = useState('');
  const [seed, setSeed] = useState<{ text: string; n: number }>();
  const ctrl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const speech = useSpeech();
  const ready = useEngine().status === 'ready';
  const clear = useClearOptions({
    what: `this chat with ${agent.name}`,
    canClear: msgs.length > 0 && !busy,
    onClear: () => { const snap = msgs; ctrl.current?.abort(); setMsgs([]); saveChat(agent.slug, []); setErr(''); return () => { setMsgs(snap); saveChat(agent.slug, snap); }; },
    onFreed: () => { ctrl.current?.abort(); setMsgs([]); setErr(''); },
  });

  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);
  useEffect(() => () => ctrl.current?.abort(), []);

  async function send(text: string) {
    setErr('');
    const next: ChatMsg[] = [...msgs, { role: 'user', content: text }];
    setMsgs([...next, { role: 'assistant', content: '' }]);
    saveChat(agent.slug, next); // keep the question even if the page is reloaded mid-answer
    setBusy(true); setSince(Date.now()); setStreaming(false); setLive(`${agent.name} is replying`);
    ctrl.current = new AbortController();
    let acc = '';
    try {
      const history = next.slice(-12).map(({ role, content }) => ({ role, content }));
      while (history.length && history[0].role !== 'user') history.shift();
      const r = await streamModel({ mode: 'chat', slug: agent.slug, messages: history }, (t) => {
        acc += t; setStreaming(true);
        setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: 'assistant', content: acc }; return c; });
      }, ctrl.current.signal);
      const stop = r.stop === 'aborted' ? 'stopped' : r.complete ? undefined : 'cut';
      const final: ChatMsg[] = [...next, { role: 'assistant', content: acc || (stop === 'stopped' ? '_Stopped._' : ''), stop }];
      setMsgs(final); saveChat(agent.slug, final.filter((m) => m.content));
      setLive('Reply complete');
      if (acc && !stop) speech.speak(acc);
    } catch (e) {
      setMsgs(next);
      setErr(errorText(e)); setLive('');
    } finally { setBusy(false); }
  }

  return (
    <div className={`chat${ready ? '' : ' gated'}`}>
      <header className="chat-head">
        <Avatar a={agent} lg />
        <div style={{ flex: 1 }}>
          <h1>{agent.name} <DeviceBadge /></h1>
          <p><b style={{ color: 'var(--ink)' }}>{agent.title}.</b> {agent.mission}</p>
          <VoiceControls speech={speech} />
        </div>
        <div className="head-actions">
          {clear.button}
        </div>
      </header>
      {clear.panel}
      <div className="messages" aria-label={`Conversation with ${agent.name}`}>
        {msgs.length === 0 && (
          <div className="examples">
            <p>{agent.personality} Try one of these:</p>
            {agent.examplePrompts.map((p) => <button key={p} type="button" className="chip-btn" onClick={() => setSeed({ text: p, n: Date.now() })}>{p}</button>)}
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user'
          ? <div key={i} className="msg user">{m.content}</div>
          : (
            <div key={i} className="msg ai">
              <div className="msg-meta"><Avatar a={agent} /> {agent.name}</div>
              {m.content ? <Markdown text={m.content} /> : busy && i === msgs.length - 1 && !streaming ? <Thinking since={since} label={`${agent.name} is thinking`} /> : null}
              {m.stop === 'cut' && <p className="notice warn">This answer was cut off. <button type="button" className="btn ghost sm" onClick={() => send('Please continue where you stopped.')} disabled={busy || !ready}>Continue</button></p>}
            </div>
          ))}
        {err && <p className="notice err" role="alert">{err}</p>}
        <div ref={end} />
      </div>
      <div className="composer-wrap" id="ai-setup">
        {ready ? <Composer placeholder={`Ask ${agent.name}…`} busy={busy} onSend={send} onStop={() => ctrl.current?.abort()} seed={seed} />
          : <EngineGate copyText={`${system(agent.slug)}\n\nMy question: `} />}
        <ChatFooter />
      </div>
      <div className="sr-only" role="status" aria-live="polite">{live}</div>
    </div>
  );
}
