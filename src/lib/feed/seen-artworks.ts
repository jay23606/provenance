/**
 * Client-side record of artworks seen in the /artworks feed.
 *
 * Every viewer keeps a capped, oldest-first list in localStorage (sent with
 * feed requests when signed out). Signed-in viewers also get their views
 * batched to /api/artworks/impressions so ranking follows them across devices.
 */

const STORAGE_KEY = 'provenance.feed.seen';
const MAX_LOCAL = 500;
const FLUSH_DELAY_MS = 4000;

let pending = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function readLocalSeen(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeLocalSeen(id: string) {
  try {
    const list = readLocalSeen().filter((v) => v !== id);
    list.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_LOCAL)));
  } catch {
    // Storage unavailable (private mode etc.) — ranking just treats it as unseen.
  }
}

export function flushSeen() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pending.size === 0) return;

  const artworkIds = [...pending].slice(0, 100);
  pending = new Set([...pending].slice(100));

  fetch('/api/artworks/impressions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artworkIds }),
    keepalive: true,
  }).catch((err) => console.error('[SeenArtworks] Failed to record impressions', err));

  if (pending.size > 0) flushSeen();
}

export function markSeen(id: string, signedIn: boolean) {
  writeLocalSeen(id);
  if (!signedIn) return;

  pending.add(id);
  if (!flushTimer) flushTimer = setTimeout(flushSeen, FLUSH_DELAY_MS);
}
