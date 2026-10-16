/*
 * Exhibition submission review.
 *
 * exhibition_artworks.status:
 *   'selected'  — part of the exhibition (shown publicly once published).
 *   'submitted' — an artist submitted it through an invite / open call; only
 *                 the organiser (and gallery team) can see it until reviewed.
 *   'declined'  — the organiser passed on it. The row stays so the artist
 *                 can't resubmit the same work and the organiser can undo;
 *                 the artist keeps their Certificate of Authenticity.
 *
 * reviewed_at / reviewed_by record the organiser's last decision.
 *
 * submission_invite_id: the exhibition_artist_invites row the work came in
 * under (null for works the organiser added). Only these rows are reviewable.
 *
 * cos_artwork_id: the Certificate of Show issued when the organiser selected
 * the work (gallery/institution shows). Submissions no longer get a CoS up
 * front, so a declined work never has one.
 *
 * Read policies are tightened so non-managers only see 'selected' rows;
 * organisers and gallery team members still see everything for their shows.
 *
 * DATA-SAFE: additive only. Every existing row defaults to 'selected', so
 * nothing already public disappears. Policies are replaced (drop if exists /
 * create); no rows are deleted or rewritten.
 */

alter table public.exhibition_artworks
  add column if not exists status text not null default 'selected';

alter table public.exhibition_artworks
  drop constraint if exists exhibition_artworks_status_check;

alter table public.exhibition_artworks
  add constraint exhibition_artworks_status_check
  check (status in ('submitted', 'selected', 'declined'));

alter table public.exhibition_artworks
  add column if not exists reviewed_at timestamp with time zone;

alter table public.exhibition_artworks
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

alter table public.exhibition_artworks
  add column if not exists submission_invite_id uuid
    references public.exhibition_artist_invites(id) on delete set null;

alter table public.exhibition_artworks
  add column if not exists cos_artwork_id uuid
    references public.artworks(id) on delete set null;

comment on column public.exhibition_artworks.submission_invite_id is
  'Invite the artist submitted this work under; null when the organiser added it';
comment on column public.exhibition_artworks.cos_artwork_id is
  'Certificate of Show issued when the organiser selected this submission';

comment on column public.exhibition_artworks.status is
  'selected = shown in the exhibition; submitted = awaiting organiser review; declined = organiser passed';
comment on column public.exhibition_artworks.reviewed_at is
  'When the organiser last selected or declined this submission';
comment on column public.exhibition_artworks.reviewed_by is
  'Organiser (or team member) who last selected or declined this submission';

create index if not exists exhibition_artworks_exhibition_status_idx
  on public.exhibition_artworks(exhibition_id, status);

-- ── Read policies: only selected rows are visible outside the organiser ─────

drop policy if exists exhibition_artworks_read_anon on public.exhibition_artworks;
drop policy if exists exhibition_artworks_read_authenticated on public.exhibition_artworks;

create policy exhibition_artworks_read_anon on public.exhibition_artworks
  for select
  to anon
  using (
    exhibition_artworks.status = 'selected'
    and exists (
      select 1 from public.exhibitions e
      where e.id = exhibition_artworks.exhibition_id
        and e.published_at is not null
    )
  );

create policy exhibition_artworks_read_authenticated on public.exhibition_artworks
  for select
  to authenticated
  using (
    exists (
      select 1 from public.exhibitions e
      where e.id = exhibition_artworks.exhibition_id
        and (
          (e.published_at is not null and exhibition_artworks.status = 'selected')
          or e.gallery_id = (select auth.uid())
          or public.is_gallery_member_for_exhibition(e.gallery_id)
        )
    )
  );
