import { seededShuffle } from '~/lib/seeded-shuffle';

/**
 * Order artworks for the default /artworks feed so people rarely see the same
 * piece twice, and admin-boosted pieces surface first:
 *
 *   1. boosted, never seen   — shuffled
 *   2. not boosted, never seen — shuffled
 *   3. seen before — least recently seen first, so anything repeats only
 *      after everything else has had a turn
 *
 * `lastSeen` maps artwork id → when the viewer last had it on screen (any
 * comparable number: epoch ms, or a recency index for signed-out viewers).
 * `seed` keeps the shuffled tiers stable within one browsing session.
 */
export function rankFeed<T extends { id: string }>(
  items: T[],
  opts: { seed: string; lastSeen: Map<string, number>; boosted: Set<string> },
): T[] {
  const { seed, lastSeen, boosted } = opts;
  const shuffled = seededShuffle(items, seed);

  const boostedUnseen: T[] = [];
  const unseen: T[] = [];
  const seen: T[] = [];

  for (const item of shuffled) {
    if (lastSeen.has(item.id)) seen.push(item);
    else if (boosted.has(item.id)) boostedUnseen.push(item);
    else unseen.push(item);
  }

  // Stable sort keeps the shuffled order among ties.
  seen.sort((a, b) => lastSeen.get(a.id)! - lastSeen.get(b.id)!);

  return [...boostedUnseen, ...unseen, ...seen];
}
