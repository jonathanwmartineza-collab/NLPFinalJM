import { useState } from 'react';
import { onLinkClick } from '../lib/router';

// Real results, not mockups: every picture is a screenshot of this site's own output, made with the free
// in-browser AI from the exact prompt shown under it. Photos inside the Studio pages are Unsplash sample photos
// (see /studio/photos/LICENSE.md).
type Shot = { file: string; w: number; h: number; alt: string };
type Item = { id: string; tool: string; href: string; title: string; prompt: string; what: string; shots: Shot[] };

const ITEMS: Item[] = [
  {
    id: 'cafe', tool: 'One-shot Studio', href: '/studio', title: 'A café website in under a minute',
    prompt: 'A cosy neighbourhood coffee shop in Porto with specialty coffee, fresh pastries, opening hours and a contact form.',
    what: 'One brief became a complete, accessible page: a split hero with a photo, an about section, features with icons, a price table, opening hours and a working contact form. It follows the visitor’s light or dark setting and reflows for phones.',
    shots: [
      { file: 'cafe-desktop', w: 1200, h: 666, alt: 'The generated Café Noite Porto page on a laptop: a headline, Order Now and Learn more buttons, and a photo of a busy café interior.' },
      { file: 'cafe-dark', w: 1200, h: 666, alt: 'The same café page in dark mode: a welcome section with a photo of latte art, and the start of the features.' },
      { file: 'cafe-phone', w: 610, h: 1254, alt: 'The café page on a phone: the menu on one row, the headline, the buttons and the café photo stacked.' },
    ],
  },
  {
    id: 'yoga', tool: 'One-shot Studio', href: '/studio', title: 'A yoga studio with plans, a teacher bio and booking',
    prompt: 'A calm yoga studio in Kyoto with morning and evening classes, three membership plans, a teacher bio, a photo gallery and a booking form.',
    what: 'The AI wrote the copy and chose the sections; the Studio matched the photos to a yoga class and laid out the plans, gallery, teacher bio and booking form.',
    shots: [
      { file: 'yoga-desktop', w: 1200, h: 666, alt: 'The generated Calm Yoga Kyoto page: a headline about morning and evening classes, a Book a Session button and a photo of a class on yoga mats.' },
    ],
  },
  {
    id: 'team', tool: 'Ask the whole team', href: '/', title: 'A hard trade-off, argued by three experts',
    prompt: 'Native app or PWA for a habit tracker that must work offline and send daily reminders? Compare cost, reach and app store risk, pick one, and say what would change your mind.',
    what: 'The studio director brought in a mobile engineer, a QA engineer and the devil’s advocate. They did not agree, and the combined answer says who recommends what before it picks a PWA, with the risks and what would change the decision.',
    shots: [
      { file: 'team-pwa', w: 1200, h: 664, alt: 'The team’s answer: a recommendation for a PWA, why, the risks, next steps, and a note on the experts’ disagreement.' },
    ],
  },
  {
    id: 'agreement', tool: 'NLP Lab: agreement map', href: '/nlp', title: 'NLTK and spaCy show where the experts disagree',
    prompt: 'The team’s answer to the PWA question above, opened in the NLP Lab’s Team agreement map.',
    what: 'NLTK runs live in the browser and compares the experts’ answers: the ideas they share, what each one raised alone, each one’s tone (VADER), and what each one recommends. It flags the pair as disagreeing because one picks a PWA and the other a native app.',
    shots: [
      { file: 'agreement-pwa', w: 1200, h: 570, alt: 'The agreement map: the ideas both experts share, a Disagree label because they recommend different things, and each expert’s tone, recommendation (PWA or native app) and own ideas.' },
    ],
  },
  {
    id: 'coach', tool: 'NLP Lab: question coach', href: '/nlp', title: 'A vague question, made specific',
    prompt: 'Can you maybe make my landing page better and add some stuff about accessibility?',
    what: 'NLTK scores how clear the question is, flags vague words and hedges, and writes a sharper version with blanks to fill in. A topic index that spaCy built at deploy time picks the best expert to ask. It all runs on your device in milliseconds.',
    shots: [
      { file: 'coach', w: 1144, h: 857, alt: 'The question coach: a clarity score of 15, the checks it failed, the vague words better, some and stuff, the hedge maybe, the accessibility expert to ask, and a sharper rewrite.' },
    ],
  },
];

function Prompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  return (
    <div className="sc-prompt">
      <p className="sc-label">Prompt</p>
      <blockquote>{text}</blockquote>
      <button type="button" className="btn ghost sm" onClick={copy} aria-live="polite">{copied ? 'Copied' : 'Copy prompt'}</button>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <div className="page" tabIndex={0} role="region" aria-label="Page content">
      <div className="page-inner showcase">
        <h1>What you can make here</h1>
        <p className="lede">Real results from this site, made with the free AI that runs in your browser. Each screenshot comes with the exact prompt that made it, so you can try it yourself. The AI can word things differently each time, so your result will vary. Tap a screenshot to open it full size.</p>
        <nav className="sc-jump" aria-label="Examples on this page">
          {ITEMS.map((it) => <a key={it.id} href={`#${it.id}`}>{it.title}</a>)}
        </nav>
        {ITEMS.map((it) => (
          <section key={it.id} id={it.id} className="sc-item" aria-labelledby={`${it.id}-h`}>
            <p className="sc-tool">{it.tool}</p>
            <h2 id={`${it.id}-h`}>{it.title}</h2>
            <div className={`sc-shots n${it.shots.length}`}>
              {it.shots.map((s, i) => (
                <figure key={s.file} className={s.h > s.w ? 'tall' : undefined}>
                  <a href={`/showcase/${s.file}.webp`} target="_blank" rel="noopener" className="sc-zoom" title="Open full size">
                  <img src={`/showcase/${s.file}.webp`} srcSet={`/showcase/${s.file}-s.webp 720w, /showcase/${s.file}.webp ${s.w}w`}
                    sizes={s.h > s.w ? '(min-width: 900px) 260px, 60vw' : '(min-width: 1100px) 820px, 92vw'}
                    width={s.w} height={s.h} alt={s.alt} loading={it.id === 'cafe' && i === 0 ? 'eager' : 'lazy'} decoding="async" />
                  </a>
                </figure>
              ))}
            </div>
            <Prompt text={it.prompt} />
            <p>{it.what}</p>
            <p><a className="btn sm" href={it.href} onClick={onLinkClick}>Try it in {it.tool.replace(/:.*/, '')}</a></p>
          </section>
        ))}
        <p className="small">Screenshots taken on this site on 28 November 2026. Photos inside the Studio pages are free Unsplash sample photos; replace them with your own before you publish.</p>
      </div>
    </div>
  );
}
