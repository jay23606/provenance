import { describe, expect, it } from 'vitest';
import { exhibitionHasEnded, parseMaxArtworksPerArtist } from './exhibition-invite-limits';

describe('parseMaxArtworksPerArtist', () => {
  it('treats blank and invalid values as no limit', () => {
    expect(parseMaxArtworksPerArtist('')).toBeNull();
    expect(parseMaxArtworksPerArtist(null)).toBeNull();
    expect(parseMaxArtworksPerArtist('0')).toBeNull();
    expect(parseMaxArtworksPerArtist('-3')).toBeNull();
    expect(parseMaxArtworksPerArtist('abc')).toBeNull();
  });

  it('parses and caps positive limits', () => {
    expect(parseMaxArtworksPerArtist('5')).toBe(5);
    expect(parseMaxArtworksPerArtist(3)).toBe(3);
    expect(parseMaxArtworksPerArtist('500')).toBe(100);
  });
});

describe('exhibitionHasEnded', () => {
  it('is false for ongoing or future shows', () => {
    expect(exhibitionHasEnded(null)).toBe(false);
    expect(exhibitionHasEnded('2999-01-01')).toBe(false);
    expect(exhibitionHasEnded(new Date().toISOString().slice(0, 10))).toBe(false);
  });

  it('is true once the end date has passed', () => {
    expect(exhibitionHasEnded('2001-05-01')).toBe(true);
  });
});
