// Deterministic team router: picks 2–3 experts from keywords (no model call: instant and predictable).
const KEYWORDS: Record<string, string[]> = {
  'product-strategist': ['idea', 'product', 'mvp', 'v1', 'feature', 'scope', 'roadmap', 'prd', 'requirement', 'launch', 'startup', 'market', 'business', 'customers', 'who is it for', 'prioriti'],
  'ux-researcher': ['user research', 'persona', 'interview', 'survey', 'competitor', 'journey', 'usability test', 'jobs to be done'],
  'growth-analyst': ['metric', 'kpi', 'analytics', 'funnel', 'conversion', 'retention', 'a/b', 'experiment', 'growth', 'acquisition', 'pricing strategy'],
  'ux-architect': ['ux', 'flow', 'wireframe', 'navigation', 'information architecture', 'sitemap', 'screen', 'onboarding', 'structure', 'page structure', 'usability'],
  'ui-designer': ['ui', 'visual', 'look', 'layout', 'colour', 'color', 'typography', 'font', 'beautiful', 'design', 'style'],
  'design-systems-lead': ['design system', 'tokens', 'component library', 'dark mode', 'theme'],
  'content-designer': ['copy', 'wording', 'microcopy', 'headline', 'text', 'error message', 'tone', 'writing'],
  'accessibility-specialist': ['accessib', 'a11y', 'wcag', 'screen reader', 'contrast', 'keyboard', 'disab'],
  'motion-designer': ['animation', 'motion', 'transition', 'micro-interaction'],
  'brand-director': ['brand', 'logo', 'name', 'naming', 'positioning', 'tagline', 'identity', 'landing page'],
  'software-architect': ['architecture', 'engineering', 'stack', 'framework', 'scal', 'hosting', 'database choice', 'tech', 'monolith', 'microservice'],
  'ai-engineer': ['ai feature', 'llm', 'chatbot', 'gpt', 'claude', 'rag', 'embedding', 'prompt injection'],
  'edge-ai-engineer': ['webgpu', 'webllm', 'on-device', 'in the browser', 'offline ai', 'local model', 'small model', 'free ai'],
  'prompt-engineer': ['prompt', 'system prompt', 'instruction', 'spec'],
  'frontend-engineer': ['frontend', 'front-end', 'react', 'css', 'html', 'component', 'javascript', 'typescript', 'web app', 'website'],
  'backend-engineer': ['backend', 'back-end', 'api', 'server', 'endpoint', 'auth', 'login', 'webhook', 'payment', 'stripe'],
  'mobile-engineer': ['mobile', 'ios', 'android', 'app store', 'pwa', 'phone', 'react native'],
  'data-engineer': ['data', 'database', 'schema', 'sql', 'postgres', 'supabase', 'migration', 'storage'],
  'creative-technologist': ['game', 'canvas', 'webgl', '3d', 'three.js', 'interactive', 'generative'],
  'template-systems-engineer': ['template', 'page builder', 'blocks', 'json schema'],
  'security-engineer': ['security', 'secure', 'hack', 'vulnerab', 'password', 'xss', 'csp', 'owasp', 'encrypt'],
  'qa-engineer': ['test', 'qa', 'bug', 'quality', 'regression', 'playwright'],
  'performance-seo-engineer': ['performance', 'slow', 'speed', 'seo', 'lighthouse', 'core web vitals', 'google ranking'],
  'devops-engineer': ['deploy', 'netlify', 'hosting setup', 'ci', 'domain', 'dns', 'build fails'],
  'technical-writer': ['documentation', 'docs', 'readme', 'guide', 'tutorial'],
  'privacy-compliance': ['privacy', 'gdpr', 'cookie', 'consent', 'personal data', 'legal', 'terms', 'licen', 'compliance'],
  'delivery-lead': ['plan', 'timeline', 'milestone', 'deadline', 'estimate', 'team', 'project'],
};
const STAKES: Record<string, string[]> = {
  money: ['money', 'pay', 'price', 'pricing', 'budget', 'cost', 'invest', 'revenue'],
  security: ['security', 'password', 'hack', 'secure', 'auth'],
  legal: ['legal', 'gdpr', 'law', 'licen', 'contract', 'compliance', 'privacy'],
  release: ['launch', 'release', 'go live', 'ship'],
};
const MUST: [string, RegExp][] = [
  ['privacy-compliance', /\b(privacy|gdpr|personal data|legal)\b/],
  ['security-engineer', /\b(security|secure|vulnerab\w*)\b/],
  ['accessibility-specialist', /\b(accessib\w*|a11y|wcag)\b/],
];
// Words that point back at an earlier turn ("based on your answer", "make that cheaper").
const REFERS = /\b(this|that|these|those|it|its|above|previous|earlier|same|instead|based on|what about|more detail|expand|elaborate|your (answer|plan|recommendation|advice|idea)|the (app|idea|plan|product|project))\b/i;
const DEFAULT_PANEL = ['product-strategist', 'ux-architect', 'software-architect'];

export type Plan = { experts: { slug: string; question: string }[]; stakes: string[]; reason: string; fallback: boolean };

const rank = (text: string, known: (slug: string) => boolean) => {
  const q = ` ${text.toLowerCase()} `;
  return Object.entries(KEYWORDS)
    .filter(([slug]) => known(slug))
    .map(([slug, words], order) => ({ slug, order, score: words.reduce((n, w) => n + (q.includes(w) ? (w.includes(' ') ? 2 : 1) : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);
};

/**
 * previous: earlier questions in the same team chat. A follow-up keeps its topic: free places on the panel go to
 * the experts of the earlier question, before the default panel. A question that points back ("that", "your answer")
 * or matches no topic fills the panel up to max this way; a new, specific topic only tops up to two experts. Real-model test: "based on your answer, create a
 * prompt for Claude Code" after a field-merchandising app question was routed on "prompt" and "claude" alone.
 */
export function routeQuestion(question: string, known: (slug: string) => boolean = () => true, max = 3, previous = ''): Plan {
  const q = ` ${question.toLowerCase()} `;
  const scored = rank(question, known);
  let picked = scored.slice(0, max).map((x) => x.slug);
  const earlier = previous.trim() ? rank(previous, known).map((x) => x.slug).filter((s) => !picked.includes(s)) : [];
  const fallback = picked.length === 0 && !earlier.length;
  // An angle the visitor names explicitly ("privacy angle", "security view") always gets its expert, even when
  // other experts score higher: a real-model test asked for privacy and got no privacy expert.
  for (const [slug, re] of MUST) {
    if (!re.test(q) || picked.includes(slug) || !known(slug)) continue;
    if (picked.length < max) picked.push(slug);
    else { const i = picked.map((p) => MUST.some(([m, r]) => m === p && r.test(q))).lastIndexOf(false); if (i >= 0) picked[i] = slug; }
  }
  const room = REFERS.test(question) || !scored.length ? max : 2;
  for (const s of earlier) if (picked.length < room && !picked.includes(s)) picked.push(s);
  const followUp = earlier.some((s) => picked.includes(s));
  for (const s of DEFAULT_PANEL) if (picked.length < 2 && !picked.includes(s) && known(s)) picked.push(s);
  if (fallback) picked = DEFAULT_PANEL.filter(known).slice(0, max);
  const stakes = Object.entries(STAKES).filter(([, ws]) => ws.some((w) => q.includes(w))).map(([k]) => k);
  return {
    experts: picked.map((slug) => ({ slug, question })),
    stakes, fallback,
    reason: fallback ? 'No specific topic matched, so the core panel answered.'
      : followUp ? 'Chosen by topic keywords in your question and the earlier one it follows.' : 'Chosen by topic keywords in your question.',
  };
}
