import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { isAdmin } from '~/lib/admin';
import { asUntyped } from '~/lib/supabase-untyped';
import { ArtworkFeed } from './_components/artwork-feed';
import { NewUserConversionTracker } from '~/app/portal/_components/new-user-conversion-tracker';

export const metadata = {
  title: 'Artworks | Provenance',
};

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function ArtworksPage() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Admins get a boost control on each slide, seeded with what's boosted now.
  let boostedIds: string[] | undefined;
  if (user && (await isAdmin(user.id))) {
    const { data } = await asUntyped(client)
      .from('artwork_feed_boosts')
      .select('artwork_id')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    boostedIds = (data ?? []).map((r: { artwork_id: string }) => r.artwork_id);
  }

  return (
    <>
      {/* Fires GTM signup + trial_started events on first landing after auth callback */}
      <NewUserConversionTracker />
      <ArtworkFeed
        currentUserId={user?.id}
        isSignedIn={!!user}
        initialBoostedIds={boostedIds}
      />
    </>
  );
}
