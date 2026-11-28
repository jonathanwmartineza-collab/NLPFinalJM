// Pure renderer: Spec → one self-contained, accessible, responsive, light/dark HTML page.
// Every string from the model is escaped here; colours come only from the fixed palette table.
import type { Spec, Theme } from './spec';
import { PHOTOS, RELATED, photoSrc, keywordTheme, type Photo } from './photos';

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

// Line icons (24×24, stroke = currentColor). Chosen from the item's own words; decorative, so aria-hidden.
const ICONS: Record<string, string> = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/>',
  leaf: '<path d="M5 19C5 11 10.5 5.5 20 5c-.5 9.5-6 15-14 15M5 19l8-8"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  device: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  truck: '<path d="M2.5 6h11v10h-11zM13.5 9.5h4l3.5 3.5v3h-7.5"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>',
};
const ICON_WORDS: [RegExp, string][] = [
  [/\b(price|pric|afford|cheap|value|free|discount|budget|cost|deal)/, 'tag'],
  [/\b(deliver|ship|pick-?up|takeaway|take-away|courier)/, 'truck'],
  [/\b(app|online|mobile|digital|phone|website|web)/, 'device'],
  [/\b(learn|course|lesson|guide|teach|read|book club|study)/, 'book'],
  [/\b(book|calendar|appointment|date|event|week|reserv|schedul)/, 'calendar'],
  [/\b(time|hour|fast|quick|minute|day|24|open|late|speed)/, 'clock'],
  [/\b(safe|secur|trust|insur|guarantee|privacy|private|protect|certif|licen)/, 'shield'],
  [/\b(fresh|organic|natural|eco|green|sustainab|plant|seasonal)/, 'leaf'],
  [/\b(locat|near|local|city|neighbou?r|place|address|central|visit)/, 'pin'],
  [/\b(team|people|community|group|family|families|staff|member|kids|small)/, 'users'],
  [/\b(support|help|talk|chat|advice|question|listen|answer)/, 'chat'],
  [/\b(care|love|friendly|kind|health|comfort|wellbeing|calm|relax)/, 'heart'],
  [/\b(quality|best|award|premium|rated|top|expert|craft|skill)/, 'star'],
  [/\b(easy|simple|energy|power|boost|instant|smart|ai|automat)/, 'bolt'],
];
const ROTATE = ['check', 'star', 'heart', 'bolt'];
const svg = (name: string, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
export const iconFor = (text: string, n: number) => ICON_WORDS.find(([re]) => re.test(text.toLowerCase()))?.[1] ?? ROTATE[n % ROTATE.length];

/** Hands out the theme's photos, then a related theme's, in turn (the hero takes the first), so photos rarely repeat. */
type Photos = { hero: Photo; next: () => Photo };
function photoDeck(theme: Theme): Photos {
  const all = [...PHOTOS[theme], ...PHOTOS[RELATED[theme]]];
  let i = 0;
  return { hero: all[0], next: () => all[(1 + i++) % all.length] };
}
const img = (p: Photo, size: 'l' | 's', lazy = true) => {
  const [w, h] = size === 'l' ? [960, 600] : [600, 375];
  return `<img src="${photoSrc(p, size)}" alt="${esc(p.alt)}" width="${w}" height="${h}"${lazy ? ' loading="lazy"' : ''} decoding="async"${p.pos ? ` style="object-position:${p.pos}"` : ''}>`;
};

function section(s: Spec['sections'][number], i: number, ph: Photos): string {
  const id = slug(s.heading || s.kind, i);
  const head = `<h2 id="${id}-h">${esc(s.heading || defaultHeading(s.kind))}</h2>${s.intro ? `<p class="intro">${esc(s.intro)}</p>` : ''}`;
  const items = s.items;
  let body = '';
  switch (s.kind) {
    case 'features': body = `<ul class="grid">${items.map((it, n) => `<li class="card"><span class="chip">${svg(iconFor(`${it.title} ${it.text}`, n))}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ul>`; break;
    case 'cards': {
      // Up to three cards get a photo each; more would repeat the theme's photos, so they get an icon instead.
      const pics = items.length > 0 && items.length <= 3;
      body = `<ul class="grid">${items.map((it, n) => `<li class="card${pics ? ' media' : ''}">${pics ? `<div class="pic">${img(ph.next(), 's')}</div>` : `<span class="chip">${svg(iconFor(`${it.title} ${it.text}`, n))}</span>`}<div class="body">${it.meta ? `<p class="tag">${esc(it.meta)}</p>` : ''}<h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div></li>`).join('')}</ul>`; break;
    }
    case 'pricing': body = `<ul class="grid">${items.map((it, n) => `<li class="card price${n === 1 ? ' pick' : ''}"><h3>${esc(it.title)}</h3><p class="big">${esc(it.meta || '—')}</p><ul class="ticks">${it.text.split(/[;•\n]/).map((x) => x.trim()).filter(Boolean).map((x) => `<li>${svg('check', 'tick')}<span>${esc(x)}</span></li>`).join('')}</ul><a class="btn${n === 1 ? '' : ' ghost'}" href="#contact">Choose ${esc(it.title)}</a></li>`).join('')}</ul>`; break;
    case 'steps': body = `<ol class="steps">${items.map((it) => `<li><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}</ol>`; break;
    case 'stats': body = `<dl class="stats">${items.map((it) => `<div><dt>${esc(it.title)}</dt><dd>${esc(it.meta || it.text)}</dd></div>`).join('')}</dl>`; break;
    case 'faq': body = `<div class="faq">${items.map((it) => `<details><summary>${esc(it.title)}</summary><p>${esc(it.text)}</p></details>`).join('')}</div>`; break;
    case 'schedule': body = `<div class="table-wrap" tabindex="0" role="region" aria-labelledby="${id}-h"><table><thead><tr><th scope="col">What</th><th scope="col">When</th><th scope="col">Details</th></tr></thead><tbody>${items.map((it) => `<tr><th scope="row">${esc(it.title)}</th><td>${esc(it.meta)}</td><td>${esc(it.text)}</td></tr>`).join('')}</tbody></table></div>`; break;
    case 'gallery': body = `<ul class="gallery${items.length >= 3 ? ' bento' : ''}">${items.map((it, n) => { const p = ph.next(); return `<li><figure>${img(p, n === 0 && items.length >= 3 ? 'l' : 's')}<figcaption><b>${esc(it.title)}</b>${it.text ? ` ${esc(it.text)}` : ''}</figcaption></figure></li>`; }).join('')}</ul>`; break;
    case 'quote': body = items.map((it) => `<figure class="quote">${svg('quote', 'qmark')}<blockquote><p>${esc(it.text)}</p></blockquote><figcaption><b>${esc(it.title)}</b>${it.meta ? `, ${esc(it.meta)}` : ''} <span class="note">(example: replace with a real quote)</span></figcaption></figure>`).join(''); break;
    case 'about': {
      const text = items.map((it) => `${it.title ? `<h3>${esc(it.title)}</h3>` : ''}<p>${esc(it.text)}</p>`).join('');
      return `<section aria-labelledby="${id}-h"><div class="wrap split"><div>${head}${text}</div><div class="about-pic">${img(ph.next(), 'l')}</div></div></section>`;
    }
    case 'cta': return `<section class="band-wrap" aria-labelledby="${id}-h"><div class="wrap"><div class="band">${head}<a class="btn" href="#contact">${esc(items[0]?.title || 'Get started')}</a></div></div></section>`;
    case 'contact': return `<section id="contact" aria-labelledby="${id}-h"><div class="wrap narrow">${head}
<form id="cf" class="card" novalidate>
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
  const theme: Theme = spec.theme ?? keywordTheme([spec.title, spec.tagline, ...spec.sections.map((s) => s.heading)].join(' ')) ?? 'business';
  const ph = photoDeck(theme);
  const hasContact = spec.sections.some((s) => s.kind === 'contact');
  const nav = spec.sections.map((s, i) => s.heading && s.kind !== 'cta' ? `<li><a href="#${s.kind === 'contact' ? 'contact' : slug(s.heading, i)}">${esc(s.heading)}</a></li>` : '').join('');
  // Every other section sits on the surface colour, so the page reads as distinct bands.
  let band = 0;
  const sections = spec.sections.map((s, i) => {
    const alt = s.kind !== 'cta' && band++ % 2 === 0;
    return section(s, i, ph)
      .replace(/<section aria-labelledby="([^"]+)-h">/, (m, id) => `<section id="${id}" aria-labelledby="${id}-h">`)
      .replace(/^<section /, alt ? '<section class="alt" ' : '<section ')
      .replace(/^<section class="alt" class="/, '<section class="alt ');
  }).join('\n');
  const first = spec.sections.find((s) => s.kind !== 'contact' && s.kind !== 'cta');
  const firstId = first ? slug(first.heading || first.kind, spec.sections.indexOf(first)) : '';
  return `<!-- AI-generated by ${esc(studioName)}; review before publishing -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title)}</title>
<meta name="description" content="${esc(spec.tagline.slice(0, 155))}">
<style>
:root{${vars(p.light)};--card:var(--surface);--tint:var(--line);--tint:color-mix(in srgb,var(--accent) 13%,var(--surface));--shadow:0 1px 2px rgba(0,0,0,.05),0 12px 32px -12px rgba(0,0,0,.18);color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{${vars(p.dark)};--shadow:0 1px 2px rgba(0,0,0,.4),0 16px 40px -16px rgba(0,0,0,.7)}img{filter:brightness(.9)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{margin:0;font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;height:auto}
a{color:var(--accent)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:4px}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;background:var(--surface);padding:8px 12px;z-index:9}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px}.narrow{max-width:660px}
header.top{border-bottom:1px solid var(--line);background:var(--surface)}
header.top .wrap{display:flex;align-items:center;gap:16px;min-height:68px;flex-wrap:wrap}
.brand{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none;margin-right:auto;letter-spacing:-.01em}
nav ul{display:flex;gap:4px 18px;list-style:none;margin:0;padding:8px 0;flex-wrap:wrap}nav a{color:var(--soft);text-decoration:none;display:inline-block;padding:10px 2px;font-weight:600;font-size:15px}nav a:hover{color:var(--accent)}
.hero{overflow:hidden;padding:64px 0 72px;background:radial-gradient(900px 420px at 90% 0%,var(--tint),transparent 70%)}
.hero .wrap{display:grid;gap:40px;align-items:center}
@media (min-width:860px){.hero .wrap{grid-template-columns:1.05fr .95fr;gap:56px}.hero{padding:88px 0 96px}}
.hero h1{font-size:clamp(36px,5.6vw,62px);line-height:1.05;margin:0 0 18px;letter-spacing:-.025em;max-width:16ch}
.hero p{font-size:clamp(18px,2.2vw,21px);color:var(--soft);max-width:52ch;margin:0 0 30px}
.actions{display:flex;flex-wrap:wrap;gap:12px}
.hero-pic{position:relative;margin:0}
.hero-pic::before{content:"";position:absolute;inset:auto -14px -14px 28px;height:70%;border-radius:28px;background:var(--accent);opacity:.18;z-index:0}
.hero-pic img{position:relative;z-index:1;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:24px;box-shadow:var(--shadow)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border-radius:999px;background:var(--accent);color:var(--accentInk);text-decoration:none;border:2px solid var(--accent);font:inherit;font-weight:700;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
.btn:hover{transform:translateY(-1px);box-shadow:var(--shadow)}
.btn.ghost{background:transparent;color:var(--accent)}
section{padding:64px 0;scroll-margin-top:12px}@media (min-width:860px){section{padding:88px 0}}
section.alt{background:var(--surface);--card:var(--bg);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
h2{font-size:clamp(28px,4vw,40px);line-height:1.15;margin:0 0 10px;letter-spacing:-.02em}.intro{color:var(--soft);margin:0 0 8px;max-width:62ch;font-size:18px}
h3{font-size:19px;line-height:1.3;margin:0 0 6px}
.grid{list-style:none;padding:0;margin:32px 0 0;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:26px;transition:transform .2s ease,box-shadow .2s ease}.card p{margin:0;color:var(--soft)}
.grid .card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.chip{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:14px;background:var(--tint);color:var(--accent);margin-bottom:16px}.ico{width:24px;height:24px}
.card.media{padding:0;overflow:hidden;display:flex;flex-direction:column}.card.media .body{padding:22px 24px 26px}
.pic img{width:100%;aspect-ratio:16/10;object-fit:cover}
.tag{font-size:13px;font-weight:800;color:var(--accent)!important;margin:0 0 6px!important;text-transform:uppercase;letter-spacing:.06em}
.price{display:flex;flex-direction:column}.price .big{font-size:38px;font-weight:800;letter-spacing:-.02em;color:var(--ink)!important;margin:6px 0 14px!important}
.price.pick{border:2px solid var(--accent);box-shadow:var(--shadow)}
.ticks{list-style:none;padding:0;margin:0 0 24px;color:var(--soft);display:grid;gap:8px;flex:1}.ticks li{display:flex;gap:10px;align-items:flex-start}.tick{flex:none;width:20px;height:20px;margin-top:3px;color:var(--accent)}
.price .btn{align-self:flex-start}
.steps{counter-reset:s;list-style:none;padding:0;margin:32px 0 0;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.steps li{counter-increment:s;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px}
.steps li::before{content:counter(s);width:44px;height:44px;border-radius:50%;background:var(--accent);color:var(--accentInk);display:grid;place-items:center;font-weight:800;font-size:18px;margin-bottom:14px}.steps p{margin:0;color:var(--soft)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin:32px 0 0}.stats div{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px;display:flex;flex-direction:column-reverse;gap:4px}
.stats dt{color:var(--soft);font-size:15px}.stats dd{margin:0;font-size:40px;line-height:1.1;font-weight:800;letter-spacing:-.02em;color:var(--accent)}
.faq{margin-top:28px}.faq details{border:1px solid var(--line);border-radius:14px;padding:0 20px;margin:0 0 12px;background:var(--card)}.faq summary{cursor:pointer;font-weight:700;min-height:56px;display:flex;align-items:center}.faq p{color:var(--soft);margin:0 0 18px}
.table-wrap{overflow-x:auto;margin-top:28px;border:1px solid var(--line);border-radius:16px}table{width:100%;border-collapse:collapse;background:var(--card)}th,td{text-align:left;padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:top}tbody tr:last-child>*{border-bottom:0}thead th{font-size:14px;color:var(--soft);text-transform:uppercase;letter-spacing:.05em}
.gallery{list-style:none;padding:0;margin:32px 0 0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));grid-auto-rows:240px}
@media (min-width:760px){.gallery.bento{grid-template-columns:repeat(3,1fr)}.gallery.bento li:first-child{grid-column:span 2;grid-row:span 2}}
.gallery li{border-radius:20px;overflow:hidden;position:relative;background:var(--tint)}
.gallery figure{margin:0;height:100%}.gallery img{width:100%;height:100%;object-fit:cover}
.gallery figcaption{position:absolute;inset:auto 0 0 0;padding:40px 18px 14px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.78));font-size:15px;line-height:1.45}
.split{display:grid;gap:40px;align-items:center}@media (min-width:860px){.split{grid-template-columns:1fr 1fr;gap:64px}}
.split p{color:var(--soft)}.about-pic img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:24px;box-shadow:var(--shadow)}
.quote{position:relative;margin:28px 0 0;background:var(--card);border:1px solid var(--line);padding:32px 32px 26px;border-radius:24px;max-width:820px}
.qmark{width:40px;height:40px;color:var(--accent);margin-bottom:8px}.quote blockquote{margin:0;font-size:clamp(19px,2.4vw,23px);line-height:1.5}.quote blockquote p{margin:0}.quote figcaption{color:var(--soft);margin-top:14px}.note{font-size:14px}
.band-wrap{padding:24px 0 88px}
.band{background:var(--accent);color:var(--accentInk);border-radius:28px;padding:56px 32px;text-align:center;background-image:radial-gradient(circle at 12% 20%,rgba(255,255,255,.14),transparent 40%),radial-gradient(circle at 88% 90%,rgba(255,255,255,.12),transparent 45%)}
.band h2,.band .intro{color:var(--accentInk);margin-left:auto;margin-right:auto}.band .intro{margin-bottom:24px}.band .btn{background:var(--accentInk);color:var(--accent);border-color:var(--accentInk);margin-top:16px}
form.card{display:grid;gap:8px;margin-top:28px;padding:28px}label{font-weight:700}input,textarea{font:inherit;padding:12px 14px;border-radius:12px;border:1px solid var(--soft);background:var(--surface);color:var(--ink);min-height:50px}
form .btn{justify-self:start;margin-top:10px}.err{color:var(--accent);margin:0;font-weight:700}#cf-status{margin:4px 0 0;color:var(--soft)}
footer{border-top:1px solid var(--line);padding:32px 0;color:var(--soft);font-size:15px}footer p{margin:4px 0}
@media (max-width:520px){.wrap{padding:0 18px}.card{padding:22px}.band{padding:40px 22px}.quote{padding:24px 22px 20px}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap"><a class="brand" href="#main">${esc(spec.title)}</a>${nav ? `<nav aria-label="Sections"><ul>${nav}</ul></nav>` : ''}</div></header>
<main id="main" tabindex="-1">
<div class="hero"><div class="wrap"><div><h1>${esc(spec.title)}</h1>${spec.tagline ? `<p>${esc(spec.tagline)}</p>` : ''}<div class="actions"><a class="btn" href="${hasContact ? '#contact' : '#main'}">${esc(spec.cta || 'Get started')}</a>${firstId ? `<a class="btn ghost" href="#${firstId}">Learn more</a>` : ''}</div></div><figure class="hero-pic">${img(ph.hero, 'l', false)}</figure></div></div>
${sections}
</main>
<footer><div class="wrap"><p>© ${new Date().getFullYear()} ${esc(spec.title)} · Page drafted with ${esc(studioName)}: review the text before publishing.</p><p>Sample photos: replace them with your own.</p></div></footer>
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
