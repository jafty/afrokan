# Afrokan

Guide et blog statique public dédié aux adresses afro-caribéennes de Toulouse.

## Développement

```bash
npm install
npm run build
npm run dev
```

Le build génère le site dans `dist/`.

## Gérer les images et les articles

Les articles sont stockés dans `src/content/posts/*.md`.

### Changer l'image principale d'un article

1. Ouvrez le fichier Markdown de l'article (ex: `src/content/posts/la-mayombe.md`).
2. Modifiez la valeur `coverImage` dans le frontmatter.
3. Utilisez soit :
   - une URL externe (`https://...`),
   - une image locale dans `src/assets/uploads/` (ex: `/uploads/nom-image.jpg`).
4. Relancez `npm run build`.

### Ajouter des images dans une galerie

1. Dans le frontmatter de l'article, ajoutez ou complétez le tableau `galleryImages`.
2. Ajoutez une image par ligne :

```md
galleryImages:
  - /uploads/image-1.jpg
  - /uploads/image-2.jpg
```

3. Relancez `npm run build`.

### Ajouter une nouvelle image locale

1. Copiez l'image dans `src/assets/uploads/`.
2. Référencez-la dans `coverImage` ou `galleryImages` avec un chemin commençant par `/uploads/...`.
3. Exécutez `npm run build` pour publier la version mise à jour dans `dist/`.
