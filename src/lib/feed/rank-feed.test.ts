import { describe, expect, it } from 'vitest';
import { rankFeed } from './rank-feed';

const items = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id }));

describe('rankFeed', () => {
  it('puts boosted unseen first, then unseen, then seen oldest-first', () => {
    const ranked = rankFeed(items, {
      seed: 's1',
      boosted: new Set(['e', 'b']),
      lastSeen: new Map([
        ['a', 300],
        ['b', 100], // boosted but already seen → treated as seen
        ['c', 200],
      ]),
    }).map((i) => i.id);

    expect(ranked[0]).toBe('e');
    expect(new Set(ranked.slice(1, 3))).toEqual(new Set(['d', 'f']));
    expect(ranked.slice(3)).toEqual(['b', 'c', 'a']);
  });

  it('is deterministic for the same seed', () => {
    const opts = { seed: 'same', boosted: new Set<string>(), lastSeen: new Map<string, number>() };
    expect(rankFeed(items, opts)).toEqual(rankFeed(items, opts));
  });

  it('still returns everything when all have been seen', () => {
    const lastSeen = new Map(items.map((i, n) => [i.id, n]));
    const ranked = rankFeed(items, { seed: 'x', boosted: new Set(), lastSeen });
    expect(ranked.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });
});
