/*
 * -------------------------------------------------------
 * Artworks feed: "seen" tracking and admin boosts
 *
 * artwork_impressions: one row per (user, artwork) the user has actually had
 * on screen in the /artworks feed. The default feed ranks never-seen artworks
 * first and returns seen ones least-recently-seen first, so signed-in users
 * rarely see the same piece twice. Written only through
 * record_artwork_impressions() so clients can't forge other users' rows.
 *
 * artwork_feed_boosts: artworks an admin has pushed up the default feed.
 * Boosted artworks a user hasn't seen yet come before everything else.
 * expires_at null = boosted until removed. Readable by everyone (the feed
 * reads it); written by the service role from the admin action only.
 *
 * DATA-SAFE: additive only. New tables, policies and function.
 * -------------------------------------------------------
 */

create table if not exists public.artwork_impressions (
  user_id uuid not null references auth.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  first_seen_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  seen_count integer not null default 1,
  primary key (user_id, artwork_id)
);

create index if not exists artwork_impressions_user_last_seen_idx
  on public.artwork_impressions(user_id, last_seen_at desc);

comment on table public.artwork_impressions is 'Artworks each user has had on screen in the /artworks feed; drives unseen-first ranking.';

alter table public.artwork_impressions enable row level security;

drop policy if exists artwork_impressions_read_own on public.artwork_impressions;

create policy artwork_impressions_read_own on public.artwork_impressions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on table public.artwork_impressions from anon, authenticated;

create or replace function public.record_artwork_impressions(p_artwork_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or p_artwork_ids is null then
    return;
  end if;

  insert into public.artwork_impressions (user_id, artwork_id)
  select v_user, a.id
  from public.artworks a
  where a.id = any(p_artwork_ids[1:100])
  on conflict (user_id, artwork_id) do update
    set last_seen_at = now(),
        seen_count = public.artwork_impressions.seen_count + 1;
end;
$$;

revoke all on function public.record_artwork_impressions(uuid[]) from public, anon;
grant execute on function public.record_artwork_impressions(uuid[]) to authenticated;

create table if not exists public.artwork_feed_boosts (
  artwork_id uuid primary key references public.artworks(id) on delete cascade,
  boosted_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone
);

create index if not exists artwork_feed_boosts_expires_at_idx
  on public.artwork_feed_boosts(expires_at);

comment on table public.artwork_feed_boosts is 'Artworks admins have boosted to the front of the default /artworks feed. Service role writes only.';

alter table public.artwork_feed_boosts enable row level security;

drop policy if exists artwork_feed_boosts_read_all on public.artwork_feed_boosts;

create policy artwork_feed_boosts_read_all on public.artwork_feed_boosts
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on table public.artwork_feed_boosts from anon, authenticated;
