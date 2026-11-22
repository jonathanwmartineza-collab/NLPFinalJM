// Pure renderer: Spec → one self-contained, accessible, responsive, light/dark HTML page.
// Every string from the model is escaped here; colours come only from the fixed palette table.
import type { Spec } from './spec';

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type Pal = { bg: string; surface: string; ink: string; soft: string; line: string; accent: string; accentInk: string };
export const PALETTE_TOKENS: Record<string, { light: Pal; dark: Pal }> = {
  ember:  { light: { bg: '#FFF9F5', surface: '#FFFFFF', ink: '#1F1712', soft: '#5C4A3F', line: '#EADBD0', accent: '#A8360A', accentInk: '#FFFFFF' }, dark: { bg: '#16100C', surface: '#211812', ink: '#F6ECE5', soft: '#CDB8AA', line: '#3A2C23', accent: '#FF9C70', accentInk: '#1A0E08' } },
  ocean:  { light: { bg: '#F5F9FF', surface: '#FFFFFF', ink: '#0F1A2A', soft: '#3F5166', line: '#D5E1EF', accent: '#0B5CAD', accentInk: '#FFFFFF' }, dark: { bg: '#0B121C', surface: '#121C2A', ink: '#E8F0FA', soft: '#A9BCD2', line: '#24334A', accent: '#7CB8FF', accentInk: '#06111F' } },
  forest: { light: { bg: '#F6FAF6', surface: '#FFFFFF', ink: '#122015', soft: '#43574A', line: '#D6E5DA', accent: '#1D6B37', accentInk: '#FFFFFF' }, dark: { bg: '#0D1510', surface: '#142019', ink: '#E7F3EA', soft: '#A9C4B1', line: '#25382C', accent: '#7ED69B', accentInk: '#06140B' } },
  plum:   { light: { bg: '#FBF7FC', surface: '#FFFFFF', ink: '#21142A', soft: '#56465E', line: '#E6DAEC', accent: '#76298A', accentInk: '#FFFFFF' }, dark: { bg: '#140E18', surface: '#1E1524', ink: '#F3EAF7', soft: '#C7B4D0', line: '#36283F', accent: '#DAA2EC', accentInk: '#1A0D20' } },
  slate:  { light: { bg: '#F7F8FA', surface: '#FFFFFF', ink: '#111827', soft: '#4B5563', line: '#E1E5EB', accent: '#1E3A5F', accentInk: '#FFFFFF' }, dark: { bg: '#0E1116', surface: '#161B22', ink: '#E6EAF0', soft: '#AAB4C2', line: '#2A313C', accent: '#A9C7EE', accentInk: '#0B1320' } },
  rose:   { light: { bg: '#FFF7F9', surface: '#FFFFFF', ink: '#2A1219', soft: '#5E434B', line: '#EFD9DF', accent: '#A8213F', accentInk: '#FFFFFF' }, dark: { bg: '#180D11', surface: '#23141A', ink: '#F8E9EE', soft: '#D3B3BE', line: '#3D2730', accent: '#FF93AE', accentInk: '#1F070E' } },
};

const vars = (p: Pal) => Object.entries(p).map(([k, v]) => `--${k}:${v}`).join(';');
const slug = (s: string, i: number) => `s${i}-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'section'}`;

function section(s: Spec['sections'][number], i: number): string {
  const id = slug(s.heading || s.kind, i);
  const head = `<h2 id="${id}-h">${esc(s.heading || defaultHeading(s.kind))}</h2>${s.intro ? `<p class="intro">${esc(s.intro)}</p>` : ''}`;
  const items = s.items;
  let body = '';
  switch (s.kind) {
    case 'features': body = `<ul class="grid">${items.map((it, n) => `<li class="card"><span class="num" aria-hidden="true">${n + 1}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ul>`; break;
    case 'cards': body = `<ul class="grid">${items.map((it) => `<li class="card">${it.meta ? `<p class="tag">${esc(it.meta)}</p>` : ''}<h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ul>`; break;
    case 'pricing': body = `<ul class="grid">${items.map((it, n) => `<li class="card price${n === 1 ? ' pick' : ''}"><h3>${esc(it.title)}</h3><p class="big">${esc(it.meta || '—')}</p><ul class="ticks">${it.text.split(/[;•\n]/).map((x) => x.trim()).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><a class="btn${n === 1 ? '' : ' ghost'}" href="#contact">Choose ${esc(it.title)}</a></li>`).join('')}</ul>`; break;
    case 'steps': body = `<ol class="steps">${items.map((it) => `<li><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ol>`; break;
    case 'stats': body = `<dl class="stats">${items.map((it) => `<div><dt>${esc(it.title)}</dt><dd>${esc(it.meta || it.text)}</dd></div>`).join('')}</dl>`; break;
    case 'faq': body = `<div class="faq">${items.map((it) => `<details><summary>${esc(it.title)}</summary><p>${esc(it.text)}</p></details>`).join('')}</div>`; break;
    case 'schedule': body = `<div class="table-wrap" tabindex="0" role="region" aria-labelledby="${id}-h"><table><thead><tr><th scope="col">What</th><th scope="col">When</th><th scope="col">Details</th></tr></thead><tbody>${items.map((it) => `<tr><th scope="row">${esc(it.title)}</th><td>${esc(it.meta)}</td><td>${esc(it.text)}</td></tr>`).join('')}</tbody></table></div>`; break;
    case 'gallery': body = `<ul class="gallery">${items.map((it, n) => `<li><div class="tile t${n % 4}" role="img" aria-label="${esc(it.title || 'Image placeholder')}"></div><p><b>${esc(it.title)}</b>${it.text ? ` ${esc(it.text)}` : ''}</p></li>`).join('')}</ul>`; break;
    case 'quote': body = items.map((it) => `<figure class="quote"><blockquote><p>${esc(it.text)}</p></blockquote><figcaption>${esc(it.title)}${it.meta ? `, ${esc(it.meta)}` : ''} <span class="note">(example: replace with a real quote)</span></figcaption></figure>`).join(''); break;
    case 'about': body = items.length ? items.map((it) => `${it.title ? `<h3>${esc(it.title)}</h3>` : ''}<p>${esc(it.text)}</p>`).join('') : ''; break;
    case 'cta': return `<section class="band" aria-labelledby="${id}-h"><div class="wrap">${head}<a class="btn" href="#contact">${esc(items[0]?.title || 'Get started')}</a></div></section>`;
    case 'contact': return `<section id="contact" aria-labelledby="${id}-h"><div class="wrap narrow">${head}
<form id="cf" novalidate>
<label for="cf-name">Name</label><input id="cf-name" name="name" autocomplete="name" required>
<label for="cf-email">Email</label><input id="cf-email" name="email" type="email" autocomplete="email" required aria-describedby="cf-email-err"><p id="cf-email-err" class="err" hidden>Enter an email address like name@example.com.</p>
<label for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="4" required></textarea>
<button class="btn" type="submit">Send message</button>
<p id="cf-status" role="status" aria-live="polite"></p>
</form></div></section>`;
  }
  return `<section aria-labelledby="${id}-h"><div class="wrap">${head}${body}</div></section>`;
}

const defaultHeading = (k: string) => ({ features: 'Why choose us', cards: 'Highlights', pricing: 'Pricing', steps: 'How it works', stats: 'In numbers', faq: 'Frequently asked questions', schedule: 'Schedule', gallery: 'Gallery', quote: 'What people say', about: 'About', contact: 'Contact', cta: 'Ready to start?' } as Record<string, string>)[k] ?? 'More';

export function renderPage(spec: Spec, studioName = 'BrainyApp2'): string {
  const p = PALETTE_TOKENS[spec.palette] ?? PALETTE_TOKENS.ember;
  const hasContact = spec.sections.some((s) => s.kind === 'contact');
  const nav = spec.sections.map((s, i) => s.heading && s.kind !== 'cta' ? `<li><a href="#${s.kind === 'contact' ? 'contact' : slug(s.heading, i)}">${esc(s.heading)}</a></li>` : '').join('');
  const sections = spec.sections.map((s, i) => section(s, i).replace(/<section aria-labelledby="([^"]+)-h">/, (m, id) => `<section id="${id}" aria-labelledby="${id}-h">`)).join('\n');
  return `<!-- AI-generated by ${esc(studioName)}; review before publishing -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title)}</title>
<meta name="description" content="${esc(spec.tagline.slice(0, 155))}">
<style>
:root{${vars(p.light)};color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{${vars(p.dark)}}}
*{box-sizing:border-box}html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{margin:0;font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink)}
a{color:var(--accent)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:4px}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;background:var(--surface);padding:8px 12px;z-index:9}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}.narrow{max-width:640px}
header.top{border-bottom:1px solid var(--line);background:var(--surface)}
header.top .wrap{display:flex;align-items:center;gap:16px;min-height:64px;flex-wrap:wrap}
.brand{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none;margin-right:auto}
nav ul{display:flex;gap:4px 16px;list-style:none;margin:0;padding:8px 0;flex-wrap:wrap}nav a{color:var(--soft);text-decoration:none;display:inline-block;padding:10px 2px}nav a:hover{color:var(--accent)}
.hero{padding:72px 0 56px}.hero h1{font-size:clamp(34px,6vw,58px);line-height:1.1;margin:0 0 16px;letter-spacing:-.02em;max-width:18ch}
.hero p{font-size:clamp(18px,2.4vw,21px);color:var(--soft);max-width:60ch;margin:0 0 28px}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 22px;border-radius:12px;background:var(--accent);color:var(--accentInk);font-weight:700;text-decoration:none;border:2px solid var(--accent);font:inherit;font-weight:700;cursor:pointer}
.btn.ghost{background:transparent;color:var(--accent)}
section{padding:56px 0;border-top:1px solid var(--line)}h2{font-size:clamp(26px,4vw,36px);margin:0 0 8px;letter-spacing:-.01em}.intro{color:var(--soft);margin:0 0 24px;max-width:65ch}
h3{font-size:19px;margin:0 0 6px}
.grid{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:22px}.card p{margin:0;color:var(--soft)}
.num{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--accent);color:var(--accentInk);font-weight:800;margin-bottom:12px}
.tag{font-size:14px;font-weight:700;color:var(--accent)!important;margin:0 0 6px!important;text-transform:uppercase;letter-spacing:.04em}
.price .big{font-size:32px;font-weight:800;color:var(--ink)!important;margin:4px 0 12px!important}.price.pick{border:2px solid var(--accent)}
.ticks{padding-left:20px;margin:0 0 20px;color:var(--soft)}
.steps{counter-reset:s;list-style:none;padding:0;margin:24px 0 0;display:grid;gap:16px}.steps li{counter-increment:s;padding-left:56px;position:relative}
.steps li::before{content:counter(s);position:absolute;left:0;top:0;width:40px;height:40px;border-radius:50%;border:2px solid var(--accent);color:var(--accent);display:grid;place-items:center;font-weight:800}.steps p{margin:0;color:var(--soft)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin:24px 0 0}.stats div{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px}
.stats dt{color:var(--soft);font-size:15px}.stats dd{margin:4px 0 0;font-size:30px;font-weight:800}
.faq details{border:1px solid var(--line);border-radius:12px;padding:0 18px;margin:0 0 10px;background:var(--surface)}.faq summary{cursor:pointer;font-weight:700;min-height:48px;display:flex;align-items:center}.faq p{color:var(--soft);margin:0 0 16px}
.table-wrap{overflow-x:auto;margin-top:20px}table{width:100%;border-collapse:collapse;background:var(--surface)}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);vertical-align:top}thead th{font-size:14px;color:var(--soft)}
.gallery{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.gallery p{margin:8px 0 0;color:var(--soft)}
.tile{aspect-ratio:4/3;border-radius:14px;border:1px solid var(--line)}.t0{background:linear-gradient(135deg,var(--accent),var(--surface))}.t1{background:linear-gradient(200deg,var(--line),var(--accent))}.t2{background:radial-gradient(circle at 30% 30%,var(--accent),var(--bg))}.t3{background:linear-gradient(45deg,var(--surface),var(--line),var(--accent))}
.quote{margin:24px 0 0;background:var(--surface);border-left:4px solid var(--accent);padding:20px 24px;border-radius:0 14px 14px 0}.quote blockquote{margin:0;font-size:19px}.quote figcaption{color:var(--soft);margin-top:8px}.note{font-size:14px}
.band{background:var(--accent);color:var(--accentInk);border:0}.band h2,.band .intro{color:var(--accentInk)}.band .btn{background:var(--accentInk);color:var(--accent);border-color:var(--accentInk)}
form{display:grid;gap:8px;margin-top:20px}label{font-weight:700}input,textarea{font:inherit;padding:12px;border-radius:10px;border:1px solid var(--soft);background:var(--surface);color:var(--ink);min-height:48px}
form .btn{justify-self:start;margin-top:8px}.err{color:var(--accent);margin:0;font-weight:700}
footer{border-top:1px solid var(--line);padding:28px 0;color:var(--soft);font-size:15px}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap"><a class="brand" href="#main">${esc(spec.title)}</a>${nav ? `<nav aria-label="Sections"><ul>${nav}</ul></nav>` : ''}</div></header>
<main id="main" tabindex="-1">
<div class="hero"><div class="wrap"><h1>${esc(spec.title)}</h1>${spec.tagline ? `<p>${esc(spec.tagline)}</p>` : ''}<a class="btn" href="${hasContact ? '#contact' : '#main'}">${esc(spec.cta || 'Get started')}</a></div></div>
${sections}
</main>
<footer><div class="wrap"><p>© ${new Date().getFullYear()} ${esc(spec.title)} · Page drafted with ${esc(studioName)}: review the text before publishing.</p></div></footer>
<script>
(function(){var f=document.getElementById('cf');if(!f)return;f.addEventListener('submit',function(e){e.preventDefault();var em=f.elements.email,er=document.getElementById('cf-email-err'),ok=/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(em.value);er.hidden=ok;em.setAttribute('aria-invalid',String(!ok));
if(!f.elements.name.value.trim()){f.elements.name.focus();document.getElementById('cf-status').textContent='Please add your name.';return}
if(!ok){em.focus();return}if(!f.elements.message.value.trim()){f.elements.message.focus();document.getElementById('cf-status').textContent='Please write a message.';return}
document.getElementById('cf-status').textContent='Thanks! This demo form does not send anything yet: connect it to your email or form service.';f.reset()})})();
</script>
</body>
</html>
`;
}
