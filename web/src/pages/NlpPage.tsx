// NLP Lab: NLTK and spaCy on BrainyApp2's own texts. Every panel says which library produced it and where it ran.
import { useEffect, useMemo, useRef, useState } from 'react';
import { onLinkClick } from '../lib/router';
import { loadChats } from '../lib/storage';
import { runNltk, useNltk, type Analysis, type AgreementMap, type Coach } from '../nlp/client';
import { AgreementView, AnalysisView, Bars, CoachView, Lib, NltkGate, Panel, Tone } from '../nlp/ui';
import { SAMPLE_ANSWERS, SAMPLE_QUESTION } from '../nlp/samples';

type Ent = [string, string, number];
type Tok = { i: number; text: string; lemma: string; pos: string; tag: string; dep: string; head: number };
type Parse = { text: string; root: string; root_pos: string; object: string; describers: string[]; for: string; tokens: Tok[] };
type SpacyOut = {
  model: string; spacy: string; pipeline: string[]; patterns: number; roster_patterns: number; label_totals: [string, number][]; explain: Record<string, string>;
  experts: { slug: string; name: string; title: string; department: string; entities: Ent[]; topics: [string, number][]; counts: Record<string, number> }[];
  prompts: (Parse & { id: string; title: string; agent: string; entities: Ent[]; topics: [string, number][] })[];
  demo: Parse & { entities: [string, string][]; noun_chunks: string[] };
};
type NltkOut = {
  nltk: string; corpus: Record<string, number>; top_words: [string, number][]; collocations: [string, string, number, number][];
  experts: { slug: string; name: string; title: string; tone: { compound: number; label: 'positive' | 'negative' | 'neutral'; neg: number; neu: number; pos: number }; top_words: [string, number][] }[];
  house_words: string[];
};
type Stats = { experts: number; prompts: number; documents: number; words: number; nltk: string; spacy: string; model: string; python: string; built: string };

const get = <T,>(p: string) => fetch(p).then((r) => { if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.json() as Promise<T>; });

export default function NlpPage() {
  const [sp, setSp] = useState<SpacyOut>();
  const [nl, setNl] = useState<NltkOut>();
  const [st, setSt] = useState<Stats>();
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([get<SpacyOut>('/nlp/spacy.json'), get<NltkOut>('/nlp/nltk.json'), get<Stats>('/nlp/corpus-stats.json')])
      .then(([a, b, c]) => { setSp(a); setNl(b); setSt(c); })
      .catch((e) => setErr(`The NLP results did not load (${e.message}). Reload the page to try again.`));
  }, []);
  return (
    <div className="page" tabIndex={0} role="region" aria-label="NLP Lab">
      <div className="page-inner nlp">
        <h1>NLP Lab</h1>
        <p className="lede">Two Python NLP libraries read this studio's own texts and your questions. <b>NLTK</b> runs live in your browser and also at deploy time; <b>spaCy</b> runs at deploy time on Netlify. Each panel is labelled with the library that did the work.</p>
        <p className="nlp-legend"><Lib lib="NLTK" where="live" /> <Lib lib="NLTK" where="build" /> <Lib lib="spaCy" where="build" /></p>
        {st && <p className="small">Corpus: {st.experts} expert profiles (each agent's prompt plus its own knowledge folder, with code blocks and links removed) and {st.prompts} library prompts, {st.words.toLocaleString()} words in all (counted by spaces, before tokenizing). Built {st.built.replace('T', ' ').replace('Z', ' UTC')} with Python {st.python}, NLTK {st.nltk}, spaCy {st.spacy} and {st.model}.</p>}
        {err && <p className="notice err" role="alert">{err}</p>}
        {(!sp || !nl) && !err && <p role="status" className="small">Loading the spaCy and NLTK results…</p>}
        <nav className="nlp-toc" aria-label="On this page">
          {/* Links to the build-time panels appear once their data has loaded, so no link points at a missing section. */}
          <a href="#coach">Prompt coach</a><a href="#insights">Chat insights</a><a href="#agree">Team agreement map</a>
          {sp && <><a href="#experts">What each expert knows</a><a href="#parse">Dependency parse</a></>}
          {nl && <a href="#corpus">Words and tone</a>}
        </nav>
        <PromptCoach />
        <ChatInsights />
        <AgreementPanel />
        {sp && <ExpertsPanel sp={sp} />}
        {sp && <ParsePanel sp={sp} />}
        {nl && <CorpusPanel nl={nl} />}
        <section className="nlp-panel" aria-labelledby="how-h">
          <h2 id="how-h">How it works</h2>
          <ul>
            <li><b>Deploy time:</b> Netlify installs Python 3.13, NLTK 3.9.4, spaCy 3.8 and en_core_web_sm 3.8.0, then <code>nlp/build_nlp.py</code> analyses the corpus and saves static JSON. spaCy uses an EntityRuler (before the statistical NER) so terms like WCAG 2.2, Pyodide and A/B test are recognised, and builds the BM25-weighted topic index the Prompt coach uses.</li>
            <li><b>Live:</b> the first time you press a button, your browser loads Pyodide (Python compiled to WebAssembly) and NLTK in a background worker and runs <code>nlp/nltk_core.py</code>, the same file the build uses. Your text never leaves your device.</li>
            <li>Research, the agent team and the knowledge notes are listed on <a href="/resources" onClick={onLinkClick}>Resources</a>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

const COACH_MAX = 20_000; // nlp/nltk_core.py MAX_COACH_CHARS
const ANALYZE_MAX = 100_000; // nlp/nltk_core.py MAX_ANALYZE_CHARS

function PromptCoach() {
  const [text, setText] = useState('');
  const [out, setOut] = useState<{ c: Coach; ms: number }>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const s = useNltk();
  // seq: only the newest run may show its result. lastRun: the text already coached, so the live effect below does not
  // coach it a second time (after "Try an example", or when NLTK finishes loading after the first click).
  const seq = useRef(0);
  const lastRun = useRef('');
  const run = async (t = text) => {
    if (!t.trim()) return;
    const id = ++seq.current;
    lastRun.current = t;
    setBusy(true); setErr('');
    try { const r = await runNltk<Coach>('coach', { text: t }); if (id === seq.current) setOut({ c: r.result, ms: r.ms }); }
    catch (e) { if (id === seq.current) setErr((e as Error).message); }
    finally { if (id === seq.current) setBusy(false); }
  };
  const edit = (v: string) => {
    setText(v);
    // An emptied box clears the old result, so it is never shown for a question that is no longer there.
    if (!v.trim()) { seq.current++; lastRun.current = ''; setOut(undefined); setErr(''); setBusy(false); }
  };
  // Live as you type once NLTK is loaded.
  useEffect(() => {
    if (s.status !== 'ready' || !text.trim() || text === lastRun.current) return;
    const id = setTimeout(() => run(), 400); return () => clearTimeout(id);
  }, [text, s.status]);
  const passed = out ? out.c.checks.filter((k) => k.ok).length : 0;
  return (
    <Panel id="coach" title="Prompt coach" libs={<><Lib lib="NLTK" where="live" /><Lib lib="spaCy" where="build" /></>}
      intro="Type the question you want to ask an expert. NLTK tokenizes it, flags vague words and hedges from a fixed list, and gives a rule-based clarity score (5 checks worth 20 points each, minus 5 per hedge; a heuristic, not a trained model). The topics and experts come from a topic index that spaCy built at deploy time (noun chunks and EntityRuler terms of every profile, weighted with BM25); live, a phrase matches when all of its Porter-stemmed words (NLTK) appear in your question. You get a sharper version to send.">
      <label htmlFor="coach-q" className="nlp-label">Your question</label>
      <textarea id="coach-q" className="nlp-text" rows={3} value={text} maxLength={COACH_MAX} aria-describedby="coach-q-limit" onChange={(e) => edit(e.target.value)} placeholder="e.g. Can you make my landing page better and add some stuff about accessibility?" />
      <p id="coach-q-limit" className="small">Up to {COACH_MAX.toLocaleString('en-US')} characters ({text.length.toLocaleString('en-US')} used).</p>
      <p className="nlp-actions">
        <button type="button" className="btn" disabled={!text.trim()} aria-disabled={busy || undefined} onClick={() => { if (busy) return; run(); }}>{busy && s.status !== 'ready' ? 'Loading NLTK…' : 'Coach my question'}</button>
        <button type="button" className="btn ghost sm" onClick={() => { setText(SAMPLE_QUESTION); run(SAMPLE_QUESTION); }}>Try an example</button>
      </p>
      <NltkGate>The coach uses NLTK on your device. It loads with your first click (about 15 MB once).</NltkGate>
      {err && <p className="notice err" role="alert">{err}</p>}
      <p className="sr-only" role="status">{busy ? 'Coaching…' : out ? `Clarity score ${out.c.score}. ${passed} of ${out.c.checks.length} checks passed.` : ''}</p>
      {out && <CoachView c={out.c} ms={out.ms} onUse={(t) => setText(t)} />}
    </Panel>
  );
}

function ChatInsights() {
  const chats = useMemo(() => Object.entries(loadChats()).filter(([k, v]) => k !== '__team' && Array.isArray(v) && v.length), []);
  const [text, setText] = useState('');
  const [out, setOut] = useState<{ a: Analysis; ms: number }>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    if (busy || !text.trim()) return;
    setBusy(true); setErr('');
    try { const r = await runNltk<Analysis>('analyze', { text }); setOut({ a: r.result, ms: r.ms }); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <Panel id="insights" title="Chat insights" libs={<Lib lib="NLTK" where="live" />}
      intro="Paste any text, or load one of your saved chats with an expert. NLTK tokenizes it (Punkt sentences, word_tokenize), removes English stopwords, counts word frequencies (FreqDist), ranks repeated word pairs by the log-likelihood ratio (on the words left after stopword removal) and scores the tone of each sentence with VADER (up to 40 sentences).">
      {chats.length > 0 && (
        <p><label htmlFor="ins-chat" className="nlp-label">Load a saved chat</label>{' '}
          <select id="ins-chat" className="nlp-select" defaultValue="" onChange={(e) => { const c = chats.find(([k]) => k === e.target.value); if (c) setText(c[1].map((m) => m.content).join('\n\n')); }}>
            <option value="" disabled>Choose a chat</option>
            {chats.map(([k, v]) => <option key={k} value={k}>{k.replace(/-/g, ' ')} ({v.length} messages)</option>)}
          </select></p>
      )}
      <label htmlFor="ins-text" className="nlp-label">Text to analyse</label>
      <textarea id="ins-text" className="nlp-text" rows={5} value={text} maxLength={ANALYZE_MAX} aria-describedby="ins-text-limit" onChange={(e) => setText(e.target.value)} placeholder="Paste a chat, an answer or any English text." />
      <p id="ins-text-limit" className="small">Up to {ANALYZE_MAX.toLocaleString('en-US')} characters ({text.length.toLocaleString('en-US')} used); a longer saved chat is cut to the first {ANALYZE_MAX.toLocaleString('en-US')}.</p>
      <p className="nlp-actions">
        <button type="button" className="btn" disabled={!text.trim()} aria-disabled={busy || undefined} onClick={run}>{busy ? 'Analysing…' : 'Analyse with NLTK'}</button>
        <button type="button" className="btn ghost sm" onClick={() => setText(SAMPLE_ANSWERS.map((a) => a.text).join('\n\n'))}>Use sample text</button>
      </p>
      {err && <p className="notice err" role="alert">{err}</p>}
      <p className="sr-only" role="status">{busy ? 'Analysing…' : out ? 'Analysis ready.' : ''}</p>
      {out && <AnalysisView a={out.a} ms={out.ms} />}
    </Panel>
  );
}

type Turn = { q: string; contributions: { slug: string; text: string }[] };
function AgreementPanel() {
  const turns = useMemo(() => ((loadChats().__team as unknown as Turn[]) ?? []).filter((t) => t.contributions?.filter((c) => c.slug !== 'red-team-reviewer').length > 1), []);
  const [src, setSrc] = useState(turns.length ? String(turns.length - 1) : 'sample');
  const [out, setOut] = useState<{ m: AgreementMap; ms: number }>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const answers = src === 'sample' ? SAMPLE_ANSWERS
    : turns[Number(src)].contributions.filter((c) => c.slug !== 'red-team-reviewer').map((c) => ({ name: c.slug.replace(/-/g, ' '), text: c.text }));
  const run = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    try { const r = await runNltk<AgreementMap>('agreement', { answers }); setOut({ m: r.result, ms: r.ms }); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <Panel id="agree" title="Team agreement map" libs={<><Lib lib="NLTK" where="live" /><Lib lib="spaCy" where="build" /></>}
      intro="When the whole team answers, where do the experts agree and where do they differ? Each expert's main ideas are its most frequent content words (NLTK FreqDist) plus spaCy topic phrases found in the answer; tone is NLTK VADER. Experts' own names and quoted persona lines (“Act as …”) are not counted as ideas. A pair disagrees only when the things they recommend (found by patterns such as “I recommend …”, “go with …”, “use a framework like …”) differ; otherwise it agrees when at least 20% of their main ideas match (Jaccard on Porter stems), or takes different angles. Tone never decides the verdict: when their VADER tones get different labels and are 0.5 or more apart, the pair gets a note (“Different tone.” or “Opposite tone.”). It compares words, not arguments, so read the answers too. It also appears under every answer in Ask the whole team.">
      <p><label htmlFor="agree-src" className="nlp-label">Answers</label>{' '}
        <select id="agree-src" className="nlp-select" value={src} onChange={(e) => { setSrc(e.target.value); setOut(undefined); }}>
          {turns.map((t, i) => <option key={i} value={i}>Your team chat: {t.q.slice(0, 60)}</option>)}
          <option value="sample">Sample: native app or PWA for a habit tracker (3 written answers)</option>
        </select></p>
      <details className="nlp-details"><summary>Read the {answers.length} answers</summary>{answers.map((a) => <p key={a.name}><b>{a.name}:</b> {a.text}</p>)}</details>
      <p className="nlp-actions"><button type="button" className="btn" aria-disabled={busy || undefined} onClick={run}>{busy ? 'Mapping…' : 'Map agreement'}</button></p>
      {err && <p className="notice err" role="alert">{err}</p>}
      <p className="sr-only" role="status">{busy ? 'Mapping…' : out ? 'Agreement map ready.' : ''}</p>
      {out && <AgreementView m={out.m} ms={out.ms} />}
    </Panel>
  );
}

const LABEL_ORDER = ['TECH', 'STANDARD', 'METHOD', 'ORG', 'PRODUCT', 'PERSON', 'GPE', 'NORP', 'LAW', 'WORK_OF_ART'];
export function ExpertsPanel({ sp }: { sp: SpacyOut }) {
  const [slug, setSlug] = useState('accessibility-specialist');
  const e = sp.experts.find((x) => x.slug === slug) ?? sp.experts[0];
  return (
    <Panel id="experts" title="What each expert knows" libs={<Lib lib="spaCy" where="build" />}
      intro={<>spaCy ({sp.model}) read every expert's agent prompt and its own knowledge folder. Named entities come from an EntityRuler placed before the statistical NER, with {sp.patterns} patterns for this studio's vocabulary (TECH, STANDARD, METHOD and a few names) plus the team roster ({sp.roster_patterns} names and job titles), and from the NER itself. The small model was trained on news text, so a filter drops its entities that are clearly not names (headings, verbs, common words, codes); some technical acronyms are still labelled ORG. Topics are noun chunks with nouns lemmatised, without determiners, stopwords, generic house phrases or team names.</>}>
      <p><label htmlFor="exp-sel" className="nlp-label">Expert</label>{' '}
        <select id="exp-sel" className="nlp-select" value={e.slug} onChange={(ev) => setSlug(ev.target.value)}>
          {sp.experts.map((x) => <option key={x.slug} value={x.slug}>{x.name} · {x.title}</option>)}
        </select>{' '}<a href={`/expert/${e.slug}`} onClick={onLinkClick} className="small">Chat with {e.name.split(' ')[0]}</a></p>
      <p className="small">{e.counts.tokens.toLocaleString()} spaCy tokens, {e.counts.sentences} sentences, {e.counts.entities} entity mentions with the labels below (after the filter), {e.counts.noun_chunks} noun chunks.</p>
      <div className="nlp-cols">
        <div><h3>Named entities</h3>
          <ul className="nlp-ents">{e.entities.map(([t, l, n]) => <li key={t + l}><span className={`nlp-ent l-${l}`} title={sp.explain[l]}>{t}<small>{l}</small></span> <span className="small">×{n}</span></li>)}</ul>
        </div>
        <div><h3>Topics (noun chunks)</h3><Bars rows={e.topics.slice(0, 10)} /></div>
      </div>
      <details className="nlp-details"><summary>Entity labels across all {sp.experts.length} experts</summary>
        <ul className="nlp-list">{[...sp.label_totals].sort((a, b) => LABEL_ORDER.indexOf(a[0]) - LABEL_ORDER.indexOf(b[0])).map(([l, n]) => <li key={l}><span className={`nlp-ent l-${l}`}>{l}</span> {n.toLocaleString()}: {sp.explain[l]}</li>)}</ul>
        <p className="small">Pipeline: {sp.pipeline.join(' → ')}.</p>
      </details>
    </Panel>
  );
}

export function ParsePanel({ sp }: { sp: SpacyOut }) {
  const options = [{ id: 'demo', title: 'Example sentence', p: sp.demo as Parse }, ...sp.prompts.map((p) => ({ id: p.id, title: `${p.title} prompt (GOAL line)`, p: p as Parse }))];
  const [id, setId] = useState('demo');
  const cur = options.find((o) => o.id === id) ?? options[0];
  const p = cur.p;
  return (
    <Panel id="parse" title="Dependency parse" libs={<Lib lib="spaCy" where="build" />}
      intro="spaCy's parser links every word to its head word (labels in spaCy's English scheme, e.g. nsubj, dobj, amod, pobj; hover a label for its meaning). From those links the Lab reads what each library prompt's GOAL line asks for: the root's object (or the root itself, since most GOAL lines are noun phrases), its adjective and number modifiers, and the object of “for”.">
      <p><label htmlFor="parse-sel" className="nlp-label">Sentence</label>{' '}
        <select id="parse-sel" className="nlp-select" value={id} onChange={(e) => setId(e.target.value)}>
          {options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select></p>
      <p className="nlp-sharper">{p.text}</p>
      <dl className="nlp-stats">
        <div><dt>root</dt><dd>{p.root} <small>{p.root_pos}</small></dd></div>
        <div><dt>asks for</dt><dd>{p.object || '–'}</dd></div>
        <div><dt>described as</dt><dd>{p.describers.join(', ') || '–'}</dd></div>
        <div><dt>for</dt><dd>{p.for || '–'}</dd></div>
      </dl>
      <Arcs toks={p.tokens} />
      <details className="nlp-details"><summary>Token table</summary>
        <div className="nlp-scroll" tabIndex={0} role="region" aria-label="Token table"><table className="nlp-table"><thead><tr><th>#</th><th>Token</th><th>Lemma</th><th>POS</th><th>Dependency</th><th>Head</th></tr></thead>
          <tbody>{p.tokens.map((t) => <tr key={t.i}><td>{t.i}</td><td>{t.text}</td><td>{t.lemma}</td><td title={sp.explain[t.pos]}>{t.pos}</td><td title={sp.explain[t.dep]}>{t.dep}</td><td>{t.dep === 'ROOT' ? '–' : p.tokens[t.head]?.text}</td></tr>)}</tbody></table></div>
      </details>
    </Panel>
  );
}

/** Arc diagram (like spaCy's displaCy) drawn from the parse JSON. */
function Arcs({ toks }: { toks: Tok[] }) {
  const show = toks.filter((t) => t.pos !== 'PUNCT' && t.pos !== 'SPACE');
  const xs = new Map(show.map((t, k) => [t.i, 40 + k * 92]));
  const levels = show.filter((t) => t.dep !== 'ROOT' && xs.has(t.head)).map((t) => Math.abs((xs.get(t.head) ?? 0) - (xs.get(t.i) ?? 0)) / 92);
  const maxL = Math.max(1, ...levels);
  const H = 40 + Math.min(maxL, 8) * 22;
  const W = 80 + show.length * 92;
  return (
    <div className="nlp-scroll" tabIndex={0} role="img" aria-label={`Dependency arcs: ${show.filter((t) => t.dep !== 'ROOT').map((t) => `${t.text} is ${t.dep} of ${toks[t.head]?.text}`).join('; ')}`}>
      <svg width={W} height={H + 50} viewBox={`0 0 ${W} ${H + 50}`} className="nlp-arcs">
        {show.map((t) => {
          if (t.dep === 'ROOT' || !xs.has(t.head)) return null;
          const a = xs.get(t.head)!, b = xs.get(t.i)!;
          const lvl = Math.min(Math.abs(b - a) / 92, 8);
          const y = H - lvl * 22;
          const d = `M${a},${H} C${a},${y} ${b},${y} ${b},${H}`;
          return <g key={t.i}><path d={d} className="arc" /><path d={`M${b - 4},${H - 7} L${b},${H} L${b + 4},${H - 7}`} className="arc" /><text x={(a + b) / 2} y={y + 4} className="lbl">{t.dep}</text></g>;
        })}
        {show.map((t) => <g key={`w${t.i}`}><text x={xs.get(t.i)} y={H + 20} className="w">{t.text}</text><text x={xs.get(t.i)} y={H + 38} className="p">{t.pos}</text></g>)}
      </svg>
    </div>
  );
}

export function CorpusPanel({ nl }: { nl: NltkOut }) {
  const ex = nl.experts;
  return (
    <Panel id="corpus" title="Words and tone across the studio" libs={<Lib lib="NLTK" where="build" />}
      intro={<>NLTK {nl.nltk} over the {nl.corpus.documents} expert profiles: {nl.corpus.tokens.toLocaleString()} word tokens, of which {nl.corpus.content_words.toLocaleString()} content words remain after removing stopwords, numbers, one-letter tokens and the {nl.house_words.length} house words used by more than half of the profiles (such as “{nl.house_words.slice(0, 3).join('”, “')}”). The five NLP experts have the longest knowledge notes, so NLP terms lead the counts.</>}>
      <div className="nlp-cols">
        <div><h3>Most frequent words</h3><Bars rows={nl.top_words.slice(0, 12)} /></div>
        <div><h3>Collocations (log-likelihood ratio, adjacent pairs seen 4+ times)</h3><ul className="nlp-list">{nl.collocations.slice(0, 12).map(([a, b, s, n]) => <li key={a + b}><b>{a} {b}</b> <span className="small">×{n}, score {s}</span></li>)}</ul></div>
      </div>
      <h3>Tone of each expert's profile (VADER on mission, personality and example questions)</h3>
      <div className="nlp-cols">
        <div><p className="small">Highest VADER score</p><ul className="nlp-list">{ex.slice(0, 5).map((e) => <li key={e.slug}><b>{e.name}</b> <Tone s={e.tone} compact /></li>)}</ul></div>
        <div><p className="small">Lowest VADER score</p><ul className="nlp-list">{ex.slice(-5).reverse().map((e) => <li key={e.slug}><b>{e.name}</b> <Tone s={e.tone} compact /></li>)}</ul></div>
      </div>
      <p className="small">VADER is a rule-based lexicon tuned for social-media text: words such as “fail” or “risk” pull a profile negative even when the expert is helpful, so a low score means cautious wording, not a negative expert.</p>
    </Panel>
  );
}
