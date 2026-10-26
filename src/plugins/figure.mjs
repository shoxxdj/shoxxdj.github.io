// Équivalent du plugin markdown-it-image-figures utilisé sur la version VitePress :
// une image seule dans un paragraphe devient <figure>, et son texte alternatif
// sert de légende (<figcaption>).
//
// Plugin « hast » pour le processeur Markdown d'Astro (Sätteri). Il s'exécute
// avant le traitement des images, qui continue donc de les optimiser.

const isBlank = (node) => node.type === 'text' && !node.value.trim();

export const figure = {
  name: 'figure',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      const content = node.children.filter((child) => !isBlank(child));
      const img = content[0];

      if (content.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return;

      const alt = String(img.properties?.alt ?? '').trim();
      const children = [{ type: 'element', tagName: 'img', properties: { ...img.properties }, children: [] }];

      if (alt) {
        children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: alt }],
        });
      }

      ctx.replaceNode(node, { type: 'element', tagName: 'figure', properties: {}, children });
    },
  },
};
