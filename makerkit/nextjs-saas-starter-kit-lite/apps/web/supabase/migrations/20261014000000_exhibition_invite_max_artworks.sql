/*
 * exhibition_artist_invites.max_artworks: how many artworks the invited artist
 * may upload for the exhibition (the organiser then selects from those).
 * Null means no limit, which is how every existing invite behaves today.
 *
 * DATA-SAFE: additive only. One nullable column with a range check; no
 * existing row is touched.
 */

alter table public.exhibition_artist_invites
  add column if not exists max_artworks integer;

alter table public.exhibition_artist_invites
  drop constraint if exists exhibition_artist_invites_max_artworks_check;

alter table public.exhibition_artist_invites
  add constraint exhibition_artist_invites_max_artworks_check
  check (max_artworks is null or (max_artworks between 1 and 100));

comment on column public.exhibition_artist_invites.max_artworks is
  'Most artworks the invitee may upload for this exhibition; null = no limit';
