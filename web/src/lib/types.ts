export type Tier = 'opus' | 'sonnet' | 'haiku';
export type Agent = {
  slug: string; name: string; title: string; department: string; tier: Tier; personality: string;
  mission: string; monogram: string; examplePrompts: string[];
};
export type Team = { studio: { name: string; tagline: string; accent: string; researchDate: string }; departments: string[]; agents: Agent[] };
export type LibraryItem = { id: string; title: string; category: string; agent: string; runsInStudio: boolean; variables: { name: string; label: string; default?: string }[]; prompt: string };
export type SiteConfig = { aiEnabled: boolean; locked: boolean; authed: boolean; mock: boolean; costMode: 'balanced' | 'economy'; budget: { limitUsd: number; remainingPct: number; resetAt: string } | null };
export type ChatMsg = { role: 'user' | 'assistant'; content: string; stop?: string };
export type Plan = { experts: { slug: string; question: string }[]; stakes: string[]; reason: string; fallback: boolean };
