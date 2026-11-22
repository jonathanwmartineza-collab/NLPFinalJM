import { useState } from 'react';
import type { Team } from '../lib/types';
import { onLinkClick } from '../lib/router';
import { TIERS } from '../ai/models';
import { deleteModels, useEngine, initEngine } from '../ai/engine';

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
const Page = ({ children }: { children: React.ReactNode }) => <div className="page" tabIndex={0} role="region" aria-label="Page content"><div className="page-inner prose">{children}</div></div>;

export function ResourcesPage({ team }: { team: Team }) {
  const repo = team.studio.repoUrl;
  return (
    <Page>
      <h1>Resources</h1>
      <p className="lede">Everything this free studio relies on. Research dated {team.studio.researchDate}; models, browsers and limits change, so check the sources.</p>
      <h2>This project</h2>
      {repo ? <ul>
        <li><Ext href={repo}>Source code on GitHub</Ext>: agents in <code>.claude/agents</code>, skills in <code>.claude/skills</code>, knowledge in <code>knowledge/</code>.</li>
        <li><Ext href={`${repo}/blob/main/docs/MASTER_PROMPT.md`}>The audited master prompt</Ext> used to build it, and the <a href="/guide" onClick={onLinkClick}>step-by-step guide</a>.</li>
        <li><Ext href={`${repo}/blob/main/docs/models.md`}>Models and licences</Ext> · <Ext href={`${repo}/blob/main/docs/skills-lock.md`}>Skills lock</Ext></li>
      </ul> : <p>The source code isn't public yet. How the site was built is on the <a href="/guide" onClick={onLinkClick}>guide page</a>; the models and their licences are listed below.</p>}
      <h2>On-device AI</h2>
      <ul>
        <li><Ext href="https://github.com/mlc-ai/web-llm">WebLLM</Ext> (Apache-2.0) by the <Ext href="https://mlc.ai">MLC</Ext> team runs the models in your browser with <Ext href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API">WebGPU</Ext>. <Ext href="https://webllm.mlc.ai/models/">Model list</Ext>.</li>
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
      <h2>Skills from the community</h2>
      <ul>
        <li><Ext href="https://www.firecrawl.dev/blog/best-claude-code-skills">Firecrawl: best Claude Code skills</Ext> · <Ext href="https://github.com/anthropics/skills">anthropics/skills</Ext> · <Ext href="https://github.com/vercel-labs/agent-skills">vercel-labs/agent-skills</Ext> · <Ext href="https://github.com/mattpocock/skills">mattpocock/skills</Ext></li>
      </ul>
      <h2>Credits</h2>
      <p>Layout inspired by <Ext href="https://experts21.netlify.app">Experts21</Ext>. {team.studio.name}'s name, words, agents and colours are its own.</p>
    </Page>
  );
}

const STEPS: [string, string][] = [
  ['Audit the plan', 'A master prompt was written, audited for flaws (licences, context limits, security, privacy) and corrected before any code was written.'],
  ['Copy the team', 'The 29 experts, their skills and knowledge were copied, and two new experts were added: Ada (on-device AI) and Theo (page templates).'],
  ['Remove the server', 'No API keys, no password, no budgets: the site became fully static on Netlify.'],
  ['Run AI in the browser', 'WebLLM runs a small open model in a Web Worker on your graphics chip, after you choose a model and agree to download it.'],
  ['Fit small models', 'Each expert gets a short prompt that fits a 4,096-token context; history is trimmed in code; answers stay short.'],
  ['Team mode on one device', 'A keyword router picks the experts instantly; they answer one after another; Nova combines the answers.'],
  ['A Studio that never breaks', 'The AI writes content as JSON; tested, accessible blocks turn it into the page. Every string is escaped.'],
  ['Test and ship', 'Unit and end-to-end tests with a mock engine, accessibility checks in light and dark, then a static deploy.'],
];

export function GuidePage({ team }: { team: Team }) {
  return (
    <Page>
      <h1>How {team.studio.name} was built</h1>
      <p className="lede">Built with Claude Code from an audited master prompt, one step at a time, with proof for each step.</p>
      <ol>{STEPS.map(([t, d]) => <li key={t}><b>{t}.</b> {d}</li>)}</ol>
      <h2>Build your own</h2>
      <p>{team.studio.repoUrl ? <>The full prompt is in <Ext href={`${team.studio.repoUrl}/blob/main/docs/MASTER_PROMPT.md`}>docs/MASTER_PROMPT.md</Ext>. </> : 'The source code and the full build prompt will be published when the project is complete. '}To build a real app with this team, copy <code>.claude/</code>, <code>knowledge/</code> and <code>prompts/</code> into a new repository, start Claude Code, and ask the orchestrator to take your idea from discovery to deploy.</p>
      <h2>How the website works</h2>
      <ul>
        <li>Agents live as files in <code>.claude/agents</code>. At build time a script validates them and turns them into this sidebar and short on-device prompts.</li>
        <li>Answers are generated on your device. The only network traffic for AI is the one-time model download from Hugging Face.</li>
        <li>Generated pages run only in a sandbox with no access to this site, your data or the network.</li>
      </ul>
      <h2>Troubleshooting</h2>
      <ul>
        <li><b>“This device can't run the free AI”</b>: use a recent Chrome or Edge on a laptop or desktop, make sure hardware acceleration is on, and update your graphics drivers.</li>
        <li><b>Out of memory</b>: choose the Lite model, close other tabs and apps.</li>
        <li><b>Download stuck</b>: check your connection and free disk space, then try again; finished parts are kept.</li>
        <li><b>“Running in another tab”</b>: only one tab can use the AI at a time. Close the other one and reload.</li>
      </ul>
    </Page>
  );
}

export function PrivacyPage({ team }: { team: Team }) {
  const s = useEngine();
  const [msg, setMsg] = useState('');
  return (
    <Page>
      <h1>Privacy note</h1>
      <p className="lede">Plain-language summary of what this site does with your information. General information, not legal advice.</p>
      <h2>Your messages stay on your device</h2>
      <ul>
        <li>The AI runs in your browser. What you type to the experts and the Studio is processed on your device and is not sent to us or to any AI company.</li>
        <li>Your chats and Studio pages are saved in this browser (localStorage and IndexedDB). Use “Clear all chats” at the bottom of any chat to delete them.</li>
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
      <h2>Contact</h2>
      <p>Questions about this site: {team.studio.repoUrl ? <>open an issue on the <Ext href={`${team.studio.repoUrl}/issues`}>project's GitHub repository</Ext>.</> : 'contact details will be added when the project is published.'}</p>
    </Page>
  );
}

export function NotFound() {
  return <Page><h1>Page not found</h1><p>That page doesn't exist. <a href="/" onClick={onLinkClick}>Go back to the team</a>.</p></Page>;
}
