'use server';

import { asUntyped } from '~/lib/supabase-untyped';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { revalidatePath } from 'next/cache';
import { canManageExhibition } from '~/app/profiles/_actions/gallery-members';
import { slugify } from '~/lib/slug';
import {
  generateClaimToken,
  hashClaimToken,
  normalizeInviteEmail,
} from '~/lib/certificate-claims/tokens';
import { INVITE_TTL_MS } from '~/lib/certificate-claims/create-invite-batch';
import { isOpenCallSubmissionExpired } from '~/app/open-calls/_lib/open-call-utils';
import { parseMaxArtworksPerArtist } from '../_helpers/exhibition-invite-limits';

export type ExhibitionOpenCallSummary = {
  id: string;
  slug: string;
  submissionClosingDate: string | null;
  isOpen: boolean;
};

const OPEN_STATUSES = ['pending', 'sent'];

async function requireManager(exhibitionId: string) {
  const client = asUntyped(getSupabaseServerClient());
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminClient = asUntyped(getSupabaseServerAdminClient());
  const { data: exhibition, error } = await adminClient
    .from('exhibitions')
    .select('id, gallery_id, title, owner_role, end_date')
    .eq('id', exhibitionId)
    .single();
  if (error || !exhibition) throw new Error('Exhibition not found');

  if (!(await canManageExhibition(user.id, exhibition.gallery_id))) {
    throw new Error('Access denied');
  }

  return { user, adminClient, exhibition };
}

/** The exhibition's own open call (submission_mode 'exhibition'), if any. */
export async function getExhibitionOpenCall(
  exhibitionId: string,
): Promise<ExhibitionOpenCallSummary | null> {
  const { adminClient } = await requireManager(exhibitionId);
  const { data } = await adminClient
    .from('open_calls')
    .select('id, slug, submission_closing_date')
    .eq('exhibition_id', exhibitionId)
    .eq('submission_mode', 'exhibition')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    submissionClosingDate: data.submission_closing_date,
    isOpen: !isOpenCallSubmissionExpired(data),
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Publishes (or reopens) a public open call for this exhibition. Artists who
 * respond go through the same upload flow as invited artists, with the
 * exhibition's per-artist limit.
 */
export async function openExhibitionOpenCall(
  exhibitionId: string,
  params: { closingDate: string },
): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  try {
    const { user, adminClient, exhibition } = await requireManager(exhibitionId);
    const closingDate = params.closingDate?.trim();
    if (!closingDate || !/^\d{4}-\d{2}-\d{2}$/.test(closingDate)) {
      return { success: false, error: 'Choose a submission deadline' };
    }
    if (closingDate < todayIso()) {
      return { success: false, error: 'The deadline must be today or later' };
    }

    const existing = await getExhibitionOpenCall(exhibitionId);
    if (existing) {
      const { error } = await adminClient
        .from('open_calls')
        .update({ submission_closing_date: closingDate, updated_by: user.id })
        .eq('id', existing.id);
      if (error) {
        console.error('[Exhibitions] reopen open call failed', error);
        return { success: false, error: 'Could not update the open call' };
      }
      revalidatePath(`/exhibitions/${exhibitionId}/edit`);
      revalidatePath(`/open-calls/${existing.slug}`);
      return { success: true, slug: existing.slug };
    }

    // open_calls requires a profile to list the call under; prefer the one
    // matching the mode the exhibition is owned as.
    const { data: profiles } = await adminClient
      .from('user_profiles')
      .select('id, role, is_active')
      .eq('user_id', exhibition.gallery_id);
    const profileList = (profiles ?? []) as Array<{ id: string; role: string; is_active: boolean }>;
    const profile =
      profileList.find((p) => p.role === exhibition.owner_role && p.is_active) ??
      profileList.find((p) => p.is_active) ??
      profileList[0];
    if (!profile) {
      return { success: false, error: 'Set up your profile before opening a call' };
    }

    const baseSlug = slugify(exhibition.title) || 'open-call';
    let slug = baseSlug;
    for (let suffix = 1; ; suffix++) {
      const { data: taken } = await adminClient
        .from('open_calls')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!taken) break;
      slug = `${baseSlug}-${suffix}`;
    }

    const { error } = await adminClient.from('open_calls').insert({
      exhibition_id: exhibitionId,
      gallery_profile_id: profile.id,
      slug,
      submission_open_date: todayIso(),
      submission_closing_date: closingDate,
      call_type: 'exhibition',
      submission_mode: 'exhibition',
      eligible_locations: [],
      created_by: user.id,
      updated_by: user.id,
    });
    if (error) {
      console.error('[Exhibitions] openExhibitionOpenCall insert failed', error);
      return { success: false, error: 'Could not open the call' };
    }

    console.log('[Exhibitions] openExhibitionOpenCall succeeded', { exhibitionId, slug });
    revalidatePath(`/exhibitions/${exhibitionId}/edit`);
    revalidatePath('/open-calls');
    return { success: true, slug };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Could not open the call' };
  }
}

/** Stops accepting open-call submissions (sets the deadline to yesterday). */
export async function closeExhibitionOpenCall(
  exhibitionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, adminClient } = await requireManager(exhibitionId);
    const existing = await getExhibitionOpenCall(exhibitionId);
    if (!existing) return { success: false, error: 'No open call for this exhibition' };

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { error } = await adminClient
      .from('open_calls')
      .update({ submission_closing_date: yesterday, updated_by: user.id })
      .eq('id', existing.id);
    if (error) {
      console.error('[Exhibitions] closeExhibitionOpenCall failed', error);
      return { success: false, error: 'Could not close the open call' };
    }

    revalidatePath(`/exhibitions/${exhibitionId}/edit`);
    revalidatePath(`/open-calls/${existing.slug}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Could not close the call' };
  }
}

/**
 * Artist responds to an exhibition open call: issues (or refreshes) their
 * upload invite and returns its token for /exhibitions/submit.
 */
export async function startOpenCallSubmission(
  openCallId: string,
): Promise<{ success: true; token: string } | { success: false; error: string; needsSignIn?: boolean }> {
  const client = asUntyped(getSupabaseServerClient());
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { success: false, error: 'Sign in to submit', needsSignIn: true };
  if (!user.email) return { success: false, error: 'Add an email to your account to submit' };

  const adminClient = asUntyped(getSupabaseServerAdminClient());
  const { data: openCall } = await adminClient
    .from('open_calls')
    .select('id, exhibition_id, submission_closing_date, submission_mode')
    .eq('id', openCallId)
    .maybeSingle();
  if (!openCall || openCall.submission_mode !== 'exhibition') {
    return { success: false, error: 'Open call not found' };
  }
  if (isOpenCallSubmissionExpired(openCall)) {
    return { success: false, error: 'Submissions for this open call have closed' };
  }

  const { data: exhibition } = await adminClient
    .from('exhibitions')
    .select('id, gallery_id, metadata')
    .eq('id', openCall.exhibition_id)
    .single();
  if (!exhibition) return { success: false, error: 'Exhibition not found' };
  if (exhibition.gallery_id === user.id) {
    return { success: false, error: 'This is your own open call' };
  }

  const email = normalizeInviteEmail(user.email);
  const { data: prior } = await adminClient
    .from('exhibition_artist_invites')
    .select('id, status')
    .eq('exhibition_id', exhibition.id)
    .ilike('invitee_email', email)
    .in('status', [...OPEN_STATUSES, 'consumed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prior?.status === 'consumed') {
    return { success: false, error: "You've already submitted to this exhibition" };
  }

  const token = generateClaimToken();
  const tokenHash = hashClaimToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  if (prior) {
    // Reuse their open invite (direct or earlier open-call visit); the old
    // link stops working, which is fine since they're here now.
    const { error } = await adminClient
      .from('exhibition_artist_invites')
      .update({ token_hash: tokenHash, expires_at: expiresAt, status: 'sent' })
      .eq('id', prior.id);
    if (error) {
      console.error('[Exhibitions] startOpenCallSubmission refresh failed', error);
      return { success: false, error: 'Could not start your submission' };
    }
  } else {
    const { data: account } = await adminClient
      .from('accounts')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();
    const { error } = await adminClient.from('exhibition_artist_invites').insert({
      exhibition_id: exhibition.id,
      invitee_email: email,
      invitee_name: account?.name ?? null,
      artist_account_id: user.id,
      max_artworks: parseMaxArtworksPerArtist(
        (exhibition.metadata as Record<string, unknown> | null)?.max_artworks_per_artist,
      ),
      source: 'open_call',
      token_hash: tokenHash,
      status: 'sent',
      expires_at: expiresAt,
      created_by: null,
    });
    if (error) {
      console.error('[Exhibitions] startOpenCallSubmission insert failed', error);
      return { success: false, error: 'Could not start your submission' };
    }
  }

  console.log('[Exhibitions] startOpenCallSubmission ready', {
    openCallId,
    reused: Boolean(prior),
  });
  revalidatePath(`/exhibitions/${exhibition.id}/edit`);
  return { success: true, token };
}
