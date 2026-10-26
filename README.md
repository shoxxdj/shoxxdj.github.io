# shoxxdj.fr

Blog construit avec [Astro](https://astro.build), déployé sur GitHub Pages.

```bash
npm install
npm run dev       # développement (la recherche n'y est pas disponible)
npm run build     # génère dist/ + l'index de recherche Pagefind
npm run preview   # sert dist/ en local, recherche comprise
```

Node 22.23.4 ou plus récent est requis.

## Structure

Un article = un dossier, avec son fichier Markdown et ses images :

```
src/content/
├── articles/
│   └── mon-article/
│       ├── index.md
│       └── img/
│           └── capture.png
├── writeups/
└── cve/
```

Le nom du dossier devient l'URL : `src/content/articles/mon-article/` → `/articles/mon-article`.

Les images se référencent avec un chemin relatif ; elles sont optimisées au build
et leur texte alternatif devient la légende de la figure :

```md
![Légende de la capture](./img/capture.png)
```

Frontmatter d'un article :

```yaml
---
title: "Titre"
date: "2025-11-15"            # sert au tri et à l'affichage
description: "Résumé affiché dans la liste"   # optionnel
categories: ["exploit"]       # optionnel
tags: ["sthack"]              # optionnel
image: "./img/couverture.jpg" # miniature de la liste, optionnel
outline: [2, 4]               # niveaux de titres du sommaire, optionnel (défaut 1 à 3)
---
```

## Autres fichiers utiles

- `src/pages/index.astro` : page d'accueil (présentation, liens Talks / Press).
- `src/consts.ts` : nom du site, liens GitHub / X, intitulés des rubriques.
- `src/styles/global.css` : tout le thème (couleurs en haut du fichier, mode sombre inclus).
- `astro.config.mjs` : domaine, coloration syntaxique, plugin de légendes d'images.
