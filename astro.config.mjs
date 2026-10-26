import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { figure } from './src/plugins/figure.mjs';

export default defineConfig({
  site: 'https://shoxxdj.fr',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
    processor: satteri({
      hastPlugins: [figure],
      // Pas de « smart punctuation » : elle transformerait `--option` en tiret
      // cadratin et les guillemets droits, ce qui abîme les commandes dans le texte.
      features: { smartPunctuation: false },
    }),
  },
});
