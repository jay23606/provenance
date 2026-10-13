'use server';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { requireAdminUserId } from '~/lib/admin';
import { escapeIlike } from '~/lib/escape-ilike';
import { asUntyped } from '~/lib/supabase-untyped';

export type BoostArtwork = {
  id: string;
  title: string;
  artist_name: string | null;
  image_url: string | null;
};

export type FeedBoost = {
  artwork: BoostArtwork;
  created_at: string;
  expires_at: string | null;
};

const ARTWORK_COLS = 'id, title, artist_name, image_url';
const NOT_ALLOWED = 'You do not have permission to manage feed boosts';

export async function listFeedBoosts(): Promise<{ boosts: FeedBoost[]; error?: string }> {
  if (!(await requireAdminUserId())) return { boosts: [], error: NOT_ALLOWED };

  const db = asUntyped(getSupabaseServerAdminClient());
  const { data, error } = await db
    .from('artwork_feed_boosts')
    .select(`created_at, expires_at, artwork:artworks(${ARTWORK_COLS})`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FeedBoosts] list failed', error);
    return { boosts: [], error: 'Failed to load boosts' };
  }

  return { boosts: ((data ?? []) as unknown as FeedBoost[]).filter((b) => b.artwork) };
}

export async function searchArtworksToBoost(
  query: string,
): Promise<{ artworks: BoostArtwork[]; error?: string }> {
  if (!(await requireAdminUserId())) return { artworks: [], error: NOT_ALLOWED };

  const q = query.trim();
  if (!q) return { artworks: [] };

  const pattern = `%${escapeIlike(q)}%`;
  const db = asUntyped(getSupabaseServerAdminClient());
  const { data, error } = await db
    .from('artworks')
    .select(ARTWORK_COLS)
    .or(`title.ilike.${pattern},artist_name.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.error('[FeedBoosts] search failed', error);
    return { artworks: [], error: 'Search failed' };
  }

  return { artworks: (data ?? []) as BoostArtwork[] };
}

/** Boost an artwork in the default feed. `days` null = until removed. */
export async function boostArtwork(
  artworkId: string,
  days: number | null,
): Promise<{ error?: string }> {
  const adminId = await requireAdminUserId();
  if (!adminId) return { error: NOT_ALLOWED };

  const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;

  const db = asUntyped(getSupabaseServerAdminClient());
  const { error } = await db.from('artwork_feed_boosts').upsert({
    artwork_id: artworkId,
    boosted_by: adminId,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[FeedBoosts] boost failed', { artworkId, error });
    return { error: 'Failed to boost artwork' };
  }

  console.log('[FeedBoosts] boosted', { artworkId, days, adminId });
  return {};
}

export async function removeBoost(artworkId: string): Promise<{ error?: string }> {
  if (!(await requireAdminUserId())) return { error: NOT_ALLOWED };

  const db = asUntyped(getSupabaseServerAdminClient());
  const { error } = await db.from('artwork_feed_boosts').delete().eq('artwork_id', artworkId);

  if (error) {
    console.error('[FeedBoosts] remove failed', { artworkId, error });
    return { error: 'Failed to remove boost' };
  }

  return {};
}
