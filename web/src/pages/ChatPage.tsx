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
import { useClearOptions, clearWithUndo } from '../components/ClearOptions';
import EmergencyNotice from '../components/EmergencyNotice';

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
    answering: busy,
    onClear: () => { ctrl.current?.abort(); setErr(''); return clearWithUndo(msgs, [] as ChatMsg[], (m) => { setMsgs(m); saveChat(agent.slug, m); }); },
    onFreed: () => { ctrl.current?.abort(); setMsgs([]); setErr(''); },
  });

  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);
  useEffect(() => () => ctrl.current?.abort(), []);

  async function send(text: string, base: ChatMsg[] = msgs) {
    setErr('');
    const next: ChatMsg[] = [...base, { role: 'user', content: text }];
    setMsgs([...next, { role: 'assistant', content: '' }]);
    saveChat(agent.slug, next); // keep the question even if the page is reloaded mid-answer
    setBusy(true); setSince(Date.now()); setStreaming(false); setLive(`${agent.name} is replying`);
    ctrl.current = new AbortController();
    let acc = '';
    // Save the answer as it grows, so a reload mid-answer keeps what was written (marked as interrupted).
    let savedAt = 0;
    const savePartial = () => { if (acc && Date.now() - savedAt > 1_000) { savedAt = Date.now(); saveChat(agent.slug, [...next, { role: 'assistant', content: acc, stop: 'interrupted' }]); } };
    try {
      const history = next.slice(-12).map(({ role, content }) => ({ role, content }));
      while (history.length && history[0].role !== 'user') history.shift();
      const r = await streamModel({ mode: 'chat', slug: agent.slug, messages: history }, (t) => {
        acc += t; setStreaming(true); savePartial();
        setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: 'assistant', content: acc }; return c; });
      }, ctrl.current.signal);
      const stop = r.stop === 'aborted' ? 'stopped' : r.stop === 'repeat' ? 'repeat' : r.complete ? undefined : 'cut';
      const text = r.stop === 'repeat' ? r.text : acc;
      const final: ChatMsg[] = [...next, { role: 'assistant', content: text || (stop === 'stopped' ? '_Stopped._' : ''), stop }];
      setMsgs(final); saveChat(agent.slug, final.filter((m) => m.content));
      setLive('Reply complete');
      if (acc && !stop) speech.speak(acc);
    } catch (e) {
      // Keep any partial answer instead of dropping it.
      const keep: ChatMsg[] = acc ? [...next, { role: 'assistant', content: acc, stop: 'cut' }] : next;
      setMsgs(keep); saveChat(agent.slug, keep);
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
          ? <div key={i} style={{ display: 'contents' }}><div className="msg user">{m.content}</div><EmergencyNotice text={m.content} /></div>
          : (
            <div key={i} className="msg ai">
              <div className="msg-meta"><Avatar a={agent} /> {agent.name}</div>
              {m.content ? <Markdown text={m.content} /> : busy && i === msgs.length - 1 && !streaming ? <Thinking since={since} label={`${agent.name} is thinking`} /> : null}
              {m.stop === 'repeat' && <p className="notice warn">This answer started repeating itself, so it was stopped early. <button type="button" className="btn ghost sm" onClick={() => { const q = [...msgs.slice(0, i)].reverse().find((x) => x.role === 'user')?.content; if (q) send(q); }} disabled={busy || !ready}>Ask again</button></p>}
              {m.stop === 'interrupted' && !(busy && i === msgs.length - 1) && <p className="notice warn">This answer was interrupted (the page was reloaded or closed).{' '}
                <button type="button" className="btn ghost sm" onClick={() => send('Please continue where you stopped.')} disabled={busy || !ready}>Continue</button>{' '}
                <button type="button" className="btn ghost sm" disabled={busy || !ready || msgs[i - 1]?.role !== 'user'} onClick={() => { const base = msgs.slice(0, i - 1); setMsgs(base); saveChat(agent.slug, base); send(msgs[i - 1].content, base); }}>Ask again</button>
                {!ready && <span className="small"> Turn on the AI below first.</span>}</p>}
              {m.stop === 'stopped' && m.content !== '_Stopped._' && <p className="small" style={{ color: 'var(--soft)' }}>Stopped before the end.</p>}
              {m.stop === 'cut' && <p className="notice warn">This answer was cut off. <button type="button" className="btn ghost sm" onClick={() => send('Please continue where you stopped.')} disabled={busy || !ready}>Continue</button></p>}
            </div>
          ))}
        {!busy && msgs.length > 0 && msgs[msgs.length - 1].role === 'user' && (
          <p className="notice warn">Your last question has no answer yet (the page was reloaded or the answer was interrupted).{' '}
            <button type="button" className="btn ghost sm" disabled={!ready} onClick={() => { const q = msgs[msgs.length - 1].content; const prev = msgs.slice(0, -1); setMsgs(prev); saveChat(agent.slug, prev); send(q, prev); }}>Ask again</button>
            {!ready && <span className="small">Turn on the AI below first.</span>}
          </p>
        )}
        {err && <p className="notice err" role="alert">{err}</p>}
        <div ref={end} />
      </div>
      <div className="composer-wrap" id="ai-setup">
        {ready ? <Composer placeholder={`Ask ${agent.name}…`} busy={busy} onSend={send} onStop={() => ctrl.current?.abort()} seed={seed} clear={clear.quick('Clear chat')} />
          : <EngineGate copyText={`${system(agent.slug)}\n\nMy question: `} />}
        <ChatFooter />
      </div>
      <div className="sr-only" role="status" aria-live="polite">{live}</div>
    </div>
  );
}
