import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un article = un dossier : src/content/<section>/<slug>/index.md + img/
// L'identifiant de l'entrée (et donc l'URL) est le nom du dossier.
const section = (name: string) =>
  defineCollection({
    loader: glob({
      pattern: '*/index.md',
      base: `./src/content/${name}`,
      generateId: ({ entry }) => entry.split('/')[0],
    }),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        date: z.coerce.date(),
        description: z.string().optional(),
        categories: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        image: image().optional(),
	draft: z.boolean().optional(),
        // Niveaux de titres affichés dans le sommaire, ex. [2, 4]
        outline: z.tuple([z.number(), z.number()]).optional(),
      }),
  });

export const collections = {
  articles: section('articles'),
  writeups: section('writeups'),
  cve: section('cve'),
};
