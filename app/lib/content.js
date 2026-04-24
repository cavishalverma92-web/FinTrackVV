export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function articleSlug(item = {}) {
  const headline = slugify(item.headline || item.title || "article");
  const fallbackId = slugify(item.id || item.url || item.publishedAt || "item");
  return `${headline}-${fallbackId}`.replace(/-+/g, "-");
}

export function withArticleSlugs(items = []) {
  return items.map((item) => ({
    ...item,
    slug: item.slug || articleSlug(item),
  }));
}
