/** Largest per-artist upload limit an organiser can set. */
export const MAX_ARTWORKS_PER_ARTIST_CAP = 100;

/** Parses the "artworks per artist" form value; null means no limit. */
export function parseMaxArtworksPerArtist(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.floor(n), MAX_ARTWORKS_PER_ARTIST_CAP);
}

/** True once an exhibition's end date (YYYY-MM-DD) is before today (UTC). */
export function exhibitionHasEnded(endDate: string | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
}
