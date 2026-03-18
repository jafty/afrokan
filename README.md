# Afrokan

Blog statique multi-page prêt pour Netlify.

## Développement

```bash
npm install
npm run build
npm run dev
```

Le build génère le site dans `dist/`.

## Gestion des articles et des images

- Les articles vivent dans `src/content/posts/*.md`.
- Les images uploadées depuis Decap CMS sont stockées dans `src/assets/uploads/`.
- L'administration est disponible sur `/admin` après activation de Netlify Identity + Git Gateway.
