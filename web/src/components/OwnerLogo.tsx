import { onLinkClick } from '../lib/router';

export const OWNER = 'Jonathan Martinez';
export const OWNER_ROLE = 'AI Practitioner';
export const COPYRIGHT = `© 2026 ${OWNER}. All rights reserved.`;

/** Small neural-network mark: three linked nodes and an outlying one. Colours come from tokens. */
export function NeuralMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="owner-mark" width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <g stroke="var(--logo-line)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="8" y1="8" x2="22" y2="10" />
        <line x1="8" y1="8" x2="12" y2="22" />
        <line x1="22" y1="10" x2="12" y2="22" />
        <line x1="22" y1="10" x2="24" y2="22" />
      </g>
      <circle cx="8" cy="8" r="3.5" fill="var(--logo-teal)" />
      <circle cx="22" cy="10" r="3.5" fill="var(--ink)" />
      <circle cx="12" cy="22" r="3.5" fill="var(--ink)" />
      <circle cx="24" cy="22" r="2.5" fill="var(--logo-lav)" />
    </svg>
  );
}

/** Top-left owner logo. Under 360px only the mark shows; the name stays as its accessible text. */
export default function OwnerLogo() {
  return (
    <a href="/" className="owner" onClick={onLinkClick}>
      <NeuralMark />
      <span className="owner-text"><span className="owner-name">{OWNER}</span> <span className="owner-role">{OWNER_ROLE}</span></span>
    </a>
  );
}
