import { useState } from 'react';
import type { Team } from '../lib/types';
import { onLinkClick } from '../lib/router';
import { TIERS } from '../ai/models';
import { deleteModels, useEngine, initEngine } from '../ai/engine';

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
const Page = ({ children }: { children: React.ReactNode }) => <div className="page" tabIndex={0} role="region" aria-label="Page content"><div className="page-inner prose">{children}</div></div>;

export function ResourcesPage({ team }: { team: Team }) {
  return (
    <Page>
      <h1>Resources</h1>
      <p className="lede">Everything this free studio relies on. Research dated {team.studio.researchDate}; models, browsers and limits change, so check the sources.</p>
      <h2>On-device AI</h2>
      <ul>
        <li><Ext href="https://webllm.mlc.ai">WebLLM</Ext> (Apache-2.0) by the <Ext href="https://mlc.ai">MLC</Ext> team runs the models in your browser with <Ext href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API">WebGPU</Ext>. <Ext href="https://webllm.mlc.ai/models/">Model list</Ext>.</li>
        {TIERS.map((t) => <li key={t.id}><b>{t.label}</b>: <Ext href={t.source}>{t.f16.replace(/-q4f16_1-MLC$/, '')}</Ext>, needs ≈{t.sizeGb} GB graphics memory, licence <Ext href={t.licenceUrl}>{t.licence}</Ext>{t.attribution ? `. ${t.attribution}.` : '.'}</li>)}
      </ul>
      <h2>Platform documentation</h2>
      <ul>
        <li><Ext href="https://code.claude.com/docs/en/sub-agents">Claude Code subagents</Ext> · <Ext href="https://code.claude.com/docs/en/skills">Claude Code skills</Ext></li>
        <li><Ext href="https://docs.netlify.com/">Netlify documentation</Ext></li>
      </ul>
      <h2>Standards the team follows</h2>
      <ul>
        <li><Ext href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</Ext> · <Ext href="https://www.nngroup.com/articles/ten-usability-heuristics/">Nielsen's 10 heuristics</Ext> · <Ext href="https://web.dev/articles/vitals">Core Web Vitals</Ext> · <Ext href="https://owasp.org/www-project-top-10-for-large-language-model-applications/">OWASP LLM Top 10</Ext></li>
      </ul>
      <h2>Community skills</h2>
      <p>Some of the team's skills come from open-source skill collections published by Anthropic, Vercel and Matt Pocock, each under its own open-source licence. <Ext href="https://www.firecrawl.dev/blog/best-claude-code-skills">An overview of popular Claude Code skills</Ext>.</p>
    </Page>
  );
}

export function GuidePage({ team }: { team: Team }) {
  return (
    <Page>
      <h1>Guide</h1>
      <p className="lede">How to get answers from {team.studio.name}'s {team.agents.length} AI experts, in the browser or in Claude Code.</p>
      <h2>Start in 3 steps</h2>
      <ol>
        <li><b>Turn on the free AI.</b> Pick a model (the recommended one is already selected) and download it once. It runs on your device.</li>
        <li><b>Ask.</b> Type a question for the whole team on the <a href="/" onClick={onLinkClick}>home page</a>, or pick one expert from the list.</li>
        <li><b>Read the answer.</b> In team mode, {team.agents.find((a) => a.slug === 'orchestrator')?.name ?? 'the studio director'} combines the experts' answers into one, and you can open each expert's contribution.</li>
      </ol>
      <h2>Four ways to work</h2>
      <ul>
        <li><b>Ask the whole team</b> for questions that span several areas. The router picks 2 to 4 experts; they answer one after another on your device; the red team checks big decisions.</li>
        <li><b>Ask one expert</b> when you know who you need. Each expert page shows example questions to start from.</li>
        <li><b>One-shot Studio</b> turns a short brief into a complete, accessible web page you can preview, refine and download.</li>
        <li><b>Prompt Library</b> has tested one-shot build prompts. Copy one, or open it in the Studio.</li>
      </ul>
      <h2>Use the team in Claude Code</h2>
      <ol>
        <li>Put the studio's <code>.claude/</code>, <code>knowledge/</code> and <code>prompts/</code> folders in your project and start Claude Code there.</li>
        <li>Ask one expert with <code>@agent-&lt;slug&gt;</code>, for example <code>@agent-ux-architect Design the onboarding flow</code>.</li>
        <li>Ask the whole team with <code>@agent-orchestrator</code> and describe your goal; it plans the work and delegates to the right experts.</li>
      </ol>
      <p>No GPU? Every expert page offers <b>Copy this expert's prompt</b>, which you can paste into any AI chat.</p>
      <h2>How the website works</h2>
      <ul>
        <li>Each expert is defined in one file. At build time a script validates them and turns them into the expert list and short on-device prompts.</li>
        <li>Answers are generated on your device. The only network traffic for AI is the one-time model download from Hugging Face.</li>
        <li>Generated pages run only in a sandbox with no access to this site, your data or the network.</li>
      </ul>
      <h2>Troubleshooting</h2>
      <ul>
        <li><b>“This device can't run the free AI”</b>: use a recent Chrome or Edge on a laptop or desktop, make sure hardware acceleration is on, and update your graphics drivers.</li>
        <li><b>Out of memory</b>: choose the Lite model, close other tabs and apps.</li>
        <li><b>Download stuck</b>: check your connection and free disk space, then try again; finished parts are kept.</li>
        <li><b>“Running in another tab”</b>: only one tab can use the AI at a time. Close the other one and reload.</li>
        <li><b>Projector or bright room</b>: turn on high contrast with the contrast button next to the expert search.</li>
      </ul>
    </Page>
  );
}

export function PrivacyPage() {
  const s = useEngine();
  const [msg, setMsg] = useState('');
  return (
    <Page>
      <h1>Privacy note</h1>
      <p className="lede">Plain-language summary of what this site does with your information. General information, not legal advice.</p>
      <h2>Your messages stay on your device</h2>
      <ul>
        <li>The AI runs in your browser. What you type to the experts and the Studio is processed on your device and is not sent to us or to any AI company.</li>
        <li>Your chats and Studio pages are saved in this browser (localStorage and IndexedDB). Use “Clear options” in any chat or in the Studio: “Clear” erases that tool's work (with Undo), and “Free up space” deletes everything this site stored, including the downloaded model.</li>
        <li>This site has no accounts, no analytics and no cookies.</li>
      </ul>
      <h2>The model download</h2>
      <ul>
        <li>When you turn the AI on, your browser downloads the model you chose from Hugging Face (and a small program file from GitHub). Like any website, they receive your IP address and browser details for that download. Their own privacy policies apply.</li>
        <li>The model is saved in this browser so it doesn't download again. You can delete it here at any time.</li>
      </ul>
      <p><button type="button" className="btn ghost sm" onClick={async () => { await initEngine(); await deleteModels(); setMsg('Downloaded models were deleted from this browser.'); }}>Delete downloaded models</button> <span role="status">{msg}</span>
        {s.storage && <span className="small"> This site uses {(s.storage.usedMb / 1000).toFixed(2)} GB of storage in this browser.</span>}</p>
      <h2>Voice</h2>
      <p>Dictation uses your browser's speech recognition, which may send audio to the browser maker's speech service. Reading answers aloud uses voices on your device.</p>
      <h2>AI-generated content</h2>
      <p>All answers and pages are produced by small AI models. They can be wrong. Review them before you rely on them, and don't treat them as legal, financial or medical advice.</p>
    </Page>
  );
}

export function NotFound() {
  return <Page><h1>Page not found</h1><p>That page doesn't exist. <a href="/" onClick={onLinkClick}>Go back to the team</a>.</p></Page>;
}
