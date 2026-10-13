'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { toast } from '@kit/ui/sonner';
import {
  boostArtwork,
  listFeedBoosts,
  removeBoost,
  searchArtworksToBoost,
  type BoostArtwork,
  type FeedBoost,
} from '../_actions/feed-boosts';

const DURATIONS: { label: string; days: number | null }[] = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Until removed', days: null },
];

function boostStatus(expiresAt: string | null): string {
  if (!expiresAt) return 'Until removed';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  return `${Math.ceil(ms / (24 * 60 * 60 * 1000))}d left`;
}

function Thumb({ artwork }: { artwork: BoostArtwork }) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-parchment">
      {artwork.image_url && (
        <Image src={artwork.image_url} alt={artwork.title} fill className="object-cover" unoptimized />
      )}
    </div>
  );
}

export function FeedBoostsManager({ initialBoosts }: { initialBoosts: FeedBoost[] }) {
  const [pending, startTransition] = useTransition();
  const [boosts, setBoosts] = useState<FeedBoost[]>(initialBoosts);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BoostArtwork[]>([]);
  const [days, setDays] = useState<number | null>(7);

  const reload = async () => {
    const res = await listFeedBoosts();
    if (res.error) toast.error(res.error);
    setBoosts(res.boosts);
  };

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await searchArtworksToBoost(query);
      if (res.error) toast.error(res.error);
      setResults(res.artworks);
    });
  };

  const boost = (artworkId: string) => {
    startTransition(async () => {
      const res = await boostArtwork(artworkId, days);
      if (res.error) return void toast.error(res.error);
      toast.success('Artwork boosted');
      await reload();
    });
  };

  const unboost = (artworkId: string) => {
    startTransition(async () => {
      const res = await removeBoost(artworkId);
      if (res.error) return void toast.error(res.error);
      toast.success('Boost removed');
      await reload();
    });
  };

  const boostedIds = new Set(boosts.map((b) => b.artwork.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Boost an artwork</CardTitle>
          <CardDescription>Search by title or artist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title or artist"
              className="font-serif"
            />
            <Button type="submit" disabled={pending || !query.trim()} className="font-serif">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-sm font-serif text-ink/70">
            Boost for:
            {DURATIONS.map((d) => (
              <Button
                key={d.label}
                type="button"
                size="sm"
                variant={days === d.days ? 'default' : 'outline'}
                onClick={() => setDays(d.days)}
                className="font-serif"
              >
                {d.label}
              </Button>
            ))}
          </div>

          {results.length > 0 && (
            <ul className="divide-y divide-wine/10">
              {results.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2">
                  <Thumb artwork={a} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-wine">{a.title}</p>
                    <p className="truncate text-xs font-serif text-ink/60">{a.artist_name}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={pending}
                    variant={boostedIds.has(a.id) ? 'outline' : 'default'}
                    onClick={() => boost(a.id)}
                    className="font-serif"
                  >
                    {boostedIds.has(a.id) ? 'Re-boost' : 'Boost'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boosted now</CardTitle>
          <CardDescription>{boosts.length} boosted</CardDescription>
        </CardHeader>
        <CardContent>
          {boosts.length === 0 ? (
            <p className="text-sm font-serif text-ink/60">No artworks are boosted.</p>
          ) : (
            <ul className="divide-y divide-wine/10">
              {boosts.map((b) => (
                <li key={b.artwork.id} className="flex items-center gap-3 py-2">
                  <Thumb artwork={b.artwork} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-wine">{b.artwork.title}</p>
                    <p className="truncate text-xs font-serif text-ink/60">
                      {b.artwork.artist_name} · {boostStatus(b.expires_at)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => unboost(b.artwork.id)}
                    className="font-serif border-wine/30"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
