// Built-in sample photos for Studio pages (Unsplash License, see web/public/studio/photos/LICENSE.md).
// renderPage() writes short same-origin paths; inlinePhotos() swaps them for data: URIs, because the preview
// sandbox (img-src data: blob:) and a downloaded file can't load the site's own paths.
import { THEMES, type Theme } from './spec';

export type Photo = { file: string; alt: string; pos?: string };

/** Three photos per theme; the first is the hero. Alt text describes the photo, not the business. */
const P: Record<Theme, [string, string, string?][]> = {
  food: [['food-1', 'A plated dish on a restaurant table with wine glasses'], ['food-2', 'A warm restaurant dining room with wooden tables'], ['food-3', 'Friends sharing burgers and fries at a table, seen from above']],
  cafe: [['cafe-1', 'A bright cafe with plants, a counter and small tables'], ['cafe-2', 'Milk poured into a latte with a leaf pattern'], ['cafe-3', 'Roasted coffee beans, close up']],
  fitness: [['fitness-1', 'Rows of dumbbells in a bright gym'], ['fitness-3', 'A group exercising on yoga mats in a studio'], ['fitness-2', 'A woman doing sit-ups on a mat by a window']],
  tech: [['tech-1', 'A team working on laptops around a shared table'], ['tech-2', 'Laptops, phones and notebooks on a desk, seen from above'], ['tech-3', 'Two people working at computer screens in an office']],
  business: [['business-2', 'Colleagues talking around a desk in an open office'], ['business-1', 'A meeting table in a bright office with tall windows'], ['business-3', 'A quiet office hallway with glass walls']],
  education: [['education-2', 'A teacher with pupils working at desks in a classroom'], ['education-1', 'An empty classroom with desks and a chalkboard'], ['education-3', 'A stack of colourful books', '20% 50%']],
  health: [['health-1', 'A clean, bright treatment room in a clinic'], ['health-3', 'A calm clinic waiting area with blue sofas'], ['health-2', 'A stethoscope on a white cloth, in black and white']],
  travel: [['travel-1', 'A resort pool with sun loungers and a wooden lodge at sunset'], ['travel-2', 'A cosy hotel room with a large bed and warm lights'], ['travel-3', 'Two loungers on a terrace facing mountains']],
  nature: [['nature-2', 'A calm lake between pine trees and misty mountains'], ['nature-1', 'Sunlight through a misty green forest'], ['nature-3', 'A road through a tall dark forest with a beam of light']],
  shop: [['shop-1', 'A clothing shop with shelves, rails and hanging lamps'], ['shop-2', 'Clothes on a hanging rail in a bright boutique'], ['shop-3', 'Dresses and shirts on rails in a shop']],
  events: [['events-1', 'Guests raising glasses at a party with string lights'], ['events-2', 'A long table set with flowers and glasses for a dinner'], ['events-3', 'A conference hall with round tables and big screens']],
  beauty: [['beauty-1', 'A modern salon with round mirrors and black chairs'], ['beauty-3', 'A stylist blow-drying a client’s hair'], ['beauty-2', 'Salon chairs facing a long mirror']],
  home: [['home-1', 'A bright living room with a sofa, wooden table and plants'], ['home-3', 'A yellow armchair beside a lamp and framed print'], ['home-2', 'A light living room with two sofas and a coffee table']],
  creative: [['creative-2', 'A tidy desk with a laptop, a big screen and plants'], ['creative-1', 'A hand sketching lettering on a light table'], ['creative-3', 'Material samples and a notebook on a white desk, seen from above']],
};

export const PHOTOS: Record<Theme, Photo[]> = Object.fromEntries(
  THEMES.map((t) => [t, P[t].map(([file, alt, pos]) => ({ file, alt, pos }))]),
) as Record<Theme, Photo[]>;

/** A neighbouring theme whose photos fit too, so a long page doesn't show the same three photos again and again. */
export const RELATED: Record<Theme, Theme> = { food: 'cafe', cafe: 'food', fitness: 'nature', tech: 'business', business: 'tech', education: 'creative', health: 'nature', travel: 'nature', nature: 'travel', shop: 'home', events: 'food', beauty: 'shop', home: 'creative', creative: 'home' };

export const photoSrc = (p: Photo, size: 'l' | 's') => `/studio/photos/${p.file}-${size}.webp`;

// Brief words that point to a theme. A brief is the user's own words, so it is trusted over the model's pick.
const KEYWORDS: Record<Theme, RegExp> = {
  food: /\b(restaurants?|bistros?|pizza\w*|burgers?|sushi|tacos?|ramen|kitchens?|chefs?|menus?|dining|diners?|food|meals?|catering|bakery|bakeries|bread|brunch|grill|eatery|trattoria|tapas|bbq|vegan)\b/g,
  cafe: /\b(caf[eé]s?|coffee|espresso|lattes?|tea ?rooms?|roasters?|roastery|baristas?)\b/g,
  fitness: /\b(gyms?|fitness|yoga|pilates|crossfit|workouts?|personal trainers?|boxing|martial arts|running|athletes?|sports?|swim\w*|cycling|dance)\b/g,
  tech: /\b(apps?|software|saas|startups?|developers?|api|platforms?|ai|cloud|tech\w*|it support|cyber\w*|devices?|data)\b/g,
  business: /\b(consult\w*|agency|agencies|law|lawyers?|legal|accountants?|accounting|finance|financial|firms?|b2b|coach(es|ing)?|marketing|insurance|recruit\w*|business)\b/g,
  education: /\b(schools?|tutors?|tutoring|courses?|lessons?|academy|universit(y|ies)|colleges?|education|teachers?|learning|language|students?|kids club)\b/g,
  health: /\b(clinics?|dentists?|dental|doctors?|therap(y|ist|ists)|physio\w*|health|medical|wellness|vets?|veterinar\w*|pharmac(y|ies)|nurs\w*|care)\b/g,
  travel: /\b(hotels?|hostels?|travel\w*|tours?|trips?|vacations?|holidays?|b&b|guest ?houses?|resorts?|getaways?|retreats?)\b/g,
  nature: /\b(gardens?|gardening|landscap\w*|farms?|outdoors?|hik(e|es|ing)|camp\w*|forests?|eco\w*|parks?|nature|plants?|florists?|flowers?)\b/g,
  shop: /\b(shops?|stores?|boutiques?|fashion|clothing|clothes|apparel|jewel\w*|e-?commerce|retail|markets?|merch\w*)\b/g,
  events: /\b(weddings?|events?|part(y|ies)|festivals?|conferences?|concerts?|venues?|meetups?|gigs?|celebrations?|music|bands?|djs?)\b/g,
  beauty: /\b(salons?|hair\w*|barbers?|barbershops?|spas?|beauty|nails?|make-?up|skincare|massages?|cosmetics?)\b/g,
  home: /\b(interiors?|furniture|homes?|decor|architects?|architecture|renovat\w*|plumb\w*|cleaning|real estate|realtors?|propert(y|ies)|apartments?|builders?)\b/g,
  creative: /\b(portfolios?|photograph\w*|designers?|artists?|art|illustrat\w*|writers?|creative|galler(y|ies)|crafts?|ceramics?|pottery)\b/g,
};

/** The theme whose words appear most in the text, or undefined when none do. Ties go to the earlier theme. */
export function keywordTheme(text: string): Theme | undefined {
  const t = text.toLowerCase();
  let best: Theme | undefined, score = 0;
  for (const theme of THEMES) {
    const n = t.match(KEYWORDS[theme])?.length ?? 0;
    if (n > score) { best = theme; score = n; }
  }
  return best;
}

/** Brief words first, then the model's pick, then words in the page itself, then a neutral default. */
export function pickTheme(brief: string, modelTheme: Theme | undefined, pageText = ''): Theme {
  return keywordTheme(brief) ?? modelTheme ?? keywordTheme(pageText) ?? 'business';
}

const PATH = /\/studio\/photos\/[a-z]+-\d-[ls]\.webp/g;
const cache = new Map<string, Promise<string | null>>();
/** A 1×1 transparent GIF: a photo that fails to load shows the frame's colour, not a broken image. */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function toDataUri(path: string, fetcher: typeof fetch): Promise<string | null> {
  let p = cache.get(path);
  if (!p) {
    p = fetcher(path).then(async (r) => {
      if (!r.ok) return null;
      const bytes = new Uint8Array(await r.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return `data:image/webp;base64,${btoa(bin)}`;
    }).catch(() => null);
    p.then((v) => { if (!v) cache.delete(path); });
    cache.set(path, p);
  }
  return p;
}

/** Swap every built-in photo path for a data: URI so the page works in the sandbox and as a downloaded file. */
export async function inlinePhotos(html: string, fetcher: typeof fetch = (u) => fetch(u)): Promise<string> {
  const paths = [...new Set(html.match(PATH) ?? [])];
  if (!paths.length) return html;
  const uris = await Promise.all(paths.map((p) => toDataUri(p, fetcher)));
  const map = new Map(paths.map((p, i) => [p, uris[i] ?? BLANK]));
  return html.replace(PATH, (m) => map.get(m)!);
}
