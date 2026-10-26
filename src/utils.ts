import type { SectionKey } from './consts';

// Les dates du frontmatter sont lues en UTC : on les formate en UTC aussi,
// sinon un article daté du 1er peut s'afficher au 30 du mois précédent.
export function formatDate(date: Date, opts: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    ...opts,
  });
}

// Certaines descriptions contiennent du markdown ([texte](lien)) : on garde le texte.
export function plainText(text = '') {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

// Les catégories importées de WordPress contiennent du bruit ("non-classe")
// ou répètent le nom de la section ("writeups") : on ne les affiche pas.
export function visibleCategories(categories: string[] = [], section: SectionKey) {
  return categories.filter((c) => c !== 'non-classe' && c !== section);
}

export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
  return b.data.date.getTime() - a.data.date.getTime();
}
export const isPublished = ({ data }: { data: { draft?: boolean } }) => import.meta.env.DEV || !data.draft;
