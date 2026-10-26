export const SITE = {
  name: 'shoxxdj.fr',
  description: "Le blog d'un pentester bidouilleur",
  github: 'https://github.com/shoxxdj',
  x: 'https://x.com/shoxxdj',
};

export type SectionKey = 'articles' | 'writeups' | 'cve';

export const SECTIONS: Record<SectionKey, { title: string; details: string; intro: string }> = {
  articles: {
    title: 'Articles',
    details: 'Différents articles de blog',
    intro: 'Différents articles de blog.',
  },
  cve: {
    title: 'CVE',
    details: 'Mes CVEs et leurs histoires',
    intro: 'Mes CVEs et leurs histoires.',
  },
  writeups: {
    title: 'Writeups',
    details: 'Des writeups de challenges & CTF',
    intro: 'Des writeups de challenges & CTF.',
  },
};

// Page /contact : un lien par ligne.
export const CONTACT_LINKS: { label: string; url: string; handle: string }[] = [
  { label: 'GitHub', url: SITE.github, handle: 'github.com/shoxxdj' },
  { label: 'X', url: SITE.x, handle: '@shoxxdj' },
];

// Clé PGP publique. Tant que c'est `null`, la section PGP n'est pas affichée.
// Pour l'activer : déposer la clé dans public/ (ex. public/shoxxdj.asc) et renseigner
//   { fingerprint: 'XXXX XXXX …', keyFile: '/shoxxdj.asc' }
export const PGP: { fingerprint: string; keyFile: string } | null = null;
