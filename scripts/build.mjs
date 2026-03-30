import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');
const postsDir = path.join(srcDir, 'content', 'posts');
const assetsDir = path.join(srcDir, 'assets');

const categories = {
  all: 'Tout explorer',
  restaurant: 'Restaurants',
  salon: 'Coiffure & Beauté',
  boutique: 'Épiceries & Boutiques'
};

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function clearDir(dir) { fs.rmSync(dir, { recursive: true, force: true }); ensureDir(dir); }
function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath); else fs.copyFileSync(srcPath, destPath);
  }
}

function escapeHtml(value = '') {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) {
      blocks.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('### ')) { flush(); blocks.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`); continue; }
    paragraph.push(line);
  }
  flush();
  return blocks.join('\n');
}

function parseValue(raw) {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1);
  return trimmed;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter block');
  const [, frontmatter, body] = match;
  const data = {};
  let currentKey = null;
  for (const line of frontmatter.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const listMatch = line.match(/^\s+-\s+(.*)$/);
    if (listMatch && currentKey) {
      data[currentKey].push(parseValue(listMatch[1]));
      continue;
    }
    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) continue;
    const [, key, value] = kvMatch;
    if (value === '') {
      data[key] = [];
      currentKey = key;
    } else {
      data[key] = parseValue(value);
      currentKey = key;
    }
  }
  return { data, body };
}

function readPosts() {
  return fs.readdirSync(postsDir).filter((name) => name.endsWith('.md')).map((name) => {
    const raw = fs.readFileSync(path.join(postsDir, name), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    return { ...data, content: markdownToHtml(body.trim()), slug: data.slug || name.replace(/\.md$/, '') };
  }).sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
}

function layout({ title, description = '', content, canonical = '/' }) { return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="canonical" href="${canonical}" />
</head>
<body>
<div class="site-shell">
<header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-mark">Afrokan.</span><span class="brand-tag">Le blog — Toulouse</span></a><nav class="footer-links"><a class="nav-link" href="/">Articles</a></nav></div></header>
<main>${content}</main>
<footer class="site-footer"><div class="container footer-inner"><div><div class="brand-mark">Afrokan.</div><p class="footer-copy">Le guide indépendant de la culture afro et caribéenne toulousaine.</p></div><div class="footer-links"><a class="nav-link" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a><a class="nav-link" href="mailto:contact@example.com">Contact</a></div></div></footer>
</div>
</body>
</html>`; }

function renderCard(post) {
  return `<article class="card"><a href="/${post.slug}/"><img class="card-image" src="${post.coverImage}" alt="${escapeHtml(post.title)}" /></a><div class="card-body"><div class="meta"><span class="badge">${categories[post.category]}</span><span>${post.dateLabel}</span></div><h2><a href="/${post.slug}/" style="text-decoration:none;">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt)}</p><div class="card-footer">📍 ${escapeHtml(post.address)}</div></div></article>`;
}

function renderHome(posts) {
  const pills = [['all', categories.all], ...Object.entries(categories).filter(([k]) => k !== 'all')].map(([slug, label]) => `<a class="filter-pill${slug === 'all' ? ' active' : ''}" href="${slug === 'all' ? '/' : `/categories/${slug}/`} ">${label}</a>`).join('');
  return layout({ title: 'Afrokan. City Guide & Blog', description: 'Histoires, adresses et culture. Les vraies pépites afro et caribéennes de Toulouse.', content: `<section class="hero"><div class="container hero-grid"><div><h1>Le journal afro <span style="color:var(--accent);font-style:italic;">de la Ville Rose.</span></h1><p>Histoires, adresses et culture. Les vraies pépites de Toulouse racontées par ceux qui les vivent.</p></div><aside class="callout"><h2 style="margin-top:0; font-size:2rem;">Le guide public des bonnes adresses</h2><p>Afrokan met en avant les restaurants, salons et boutiques afro-caribéens de Toulouse avec des contenus pensés uniquement pour les lecteurs.</p></aside></div></section><section class="container"><div class="filter-bar">${pills}</div><div class="card-grid">${posts.map(renderCard).join('')}</div></section>` });
}

function renderCategory(posts, category) {
  return layout({ title: `Afrokan — ${categories[category]}`, description: `Sélection ${categories[category]} du blog Afrokan.`, canonical: `/categories/${category}/`, content: `<section class="page-wrap"><div class="container"><a class="back-link" href="/">← Retour à tous les articles</a><h1 class="page-title" style="font-size:3.5rem; margin:1rem 0;">${categories[category]}</h1><div class="card-grid">${posts.filter((post) => post.category === category).map(renderCard).join('')}</div></div></section>` });
}

function renderPost(post) {
  const gallery = Array.isArray(post.galleryImages) && post.galleryImages.length ? `<div class="gallery">${post.galleryImages.map((image) => `<div class="gallery-item"><img src="${image}" alt="${escapeHtml(post.title)}" /></div>`).join('')}</div>` : '';
  return layout({ title: `${post.title} — Afrokan`, description: post.excerpt, canonical: `/${post.slug}/`, content: `<section class="page-wrap"><article class="article-layout"><a class="back-link" href="/">← Retour au guide</a><div class="meta" style="margin-top:1.5rem;"><span class="badge">${categories[post.category]}</span><span>${post.dateLabel}</span><span>📍 ${escapeHtml(post.address)}</span></div><h1 class="article-title">${escapeHtml(post.title)}</h1><img class="article-cover" src="${post.coverImage}" alt="${escapeHtml(post.title)}" /><div class="article-content">${post.content}</div>${gallery}</article></section>` });
}

clearDir(distDir);
copyDir(assetsDir, distDir);
const posts = readPosts();
fs.writeFileSync(path.join(distDir, 'index.html'), renderHome(posts));
for (const category of Object.keys(categories).filter((key) => key !== 'all')) { ensureDir(path.join(distDir, 'categories', category)); fs.writeFileSync(path.join(distDir, 'categories', category, 'index.html'), renderCategory(posts, category)); }
for (const post of posts) { ensureDir(path.join(distDir, post.slug)); fs.writeFileSync(path.join(distDir, post.slug, 'index.html'), renderPost(post)); }
