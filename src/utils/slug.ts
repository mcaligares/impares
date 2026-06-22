export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function disambiguateSlugs(baseSlugs: string[]): string[] {
  const totals = new Map<string, number>();
  for (const slug of baseSlugs) {
    totals.set(slug, (totals.get(slug) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  return baseSlugs.map((slug) => {
    if ((totals.get(slug) ?? 0) <= 1) return slug;
    const next = (seen.get(slug) ?? 0) + 1;
    seen.set(slug, next);
    return `${slug}-${next}`;
  });
}
