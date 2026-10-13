import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { asUntyped } from '~/lib/supabase-untyped';

const BodySchema = z.object({
  artworkIds: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * Record artworks the signed-in user has had on screen in the /artworks feed.
 * Signed-out viewers track this on-device instead, so this is a no-op for them.
 */
export async function POST(request: NextRequest) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await asUntyped(client).rpc('record_artwork_impressions', {
    p_artwork_ids: [...new Set(parsed.data.artworkIds)],
  });

  if (error) {
    console.error('[API/artworks/impressions] record failed', error);
    return NextResponse.json({ error: 'Failed to record impressions' }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
