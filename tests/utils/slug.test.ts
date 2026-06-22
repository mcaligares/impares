import { describe, it, expect } from 'vitest';
import { slugify, disambiguateSlugs } from '@/utils/slug';

describe('slugify', () => {
  it('slugifies a multi-word name', () => {
    expect(slugify('Don Carlos')).toBe('don-carlos');
  });

  it('strips accents', () => {
    expect(slugify('Germán')).toBe('german');
  });

  it('collapses non-alphanumeric runs and trims hyphens', () => {
    expect(slugify('  Toro!! ')).toBe('toro');
  });
});

describe('disambiguateSlugs', () => {
  it('suffixes duplicate base slugs by order of appearance', () => {
    expect(disambiguateSlugs(['matias', 'matias'])).toEqual(['matias-1', 'matias-2']);
  });

  it('leaves unique slugs unsuffixed', () => {
    expect(disambiguateSlugs(['matias', 'german'])).toEqual(['matias', 'german']);
  });
});
