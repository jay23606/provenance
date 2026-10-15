/*
 * Exhibition open calls + submitting existing artworks.
 *
 * exhibition_artist_invites.source: 'invite' for artists the organiser
 * invited, 'open_call' for artists who joined through the exhibition's public
 * open call (the app issues them an invite row so both share one upload flow).
 *
 * exhibition_artist_invites.submitted_count: artworks submitted under the
 * invite so far, new uploads and existing works alike; enforces max_artworks.
 *
 * open_calls.submission_mode: 'upload' (legacy image-upload form) or
 * 'exhibition' (artists submit through the exhibition upload flow, can pick
 * works already on their account, and respect the per-artist limit).
 *
 * DATA-SAFE: additive only. New columns with defaults that match current
 * behaviour; no existing row changes meaning.
 */

alter table public.exhibition_artist_invites
  add column if not exists source text not null default 'invite';

alter table public.exhibition_artist_invites
  drop constraint if exists exhibition_artist_invites_source_check;

alter table public.exhibition_artist_invites
  add constraint exhibition_artist_invites_source_check
  check (source in ('invite', 'open_call'));

alter table public.exhibition_artist_invites
  add column if not exists submitted_count integer not null default 0;

comment on column public.exhibition_artist_invites.source is
  'invite = organiser invited the artist; open_call = artist joined via the exhibition open call';
comment on column public.exhibition_artist_invites.submitted_count is
  'Artworks submitted under this invite (new uploads and existing works); compared to max_artworks';

alter table public.open_calls
  add column if not exists submission_mode text not null default 'upload';

alter table public.open_calls
  drop constraint if exists open_calls_submission_mode_check;

alter table public.open_calls
  add constraint open_calls_submission_mode_check
  check (submission_mode in ('upload', 'exhibition'));

comment on column public.open_calls.submission_mode is
  'upload = legacy image form; exhibition = submit through the exhibition upload flow';
