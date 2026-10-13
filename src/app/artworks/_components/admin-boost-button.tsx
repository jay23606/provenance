'use client';

import { useTransition } from 'react';
import { Rocket } from 'lucide-react';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { toast } from '@kit/ui/sonner';
import { boostArtwork, removeBoost } from '~/app/admin/feed-boosts/_actions/feed-boosts';

const DURATIONS: { label: string; days: number | null }[] = [
  { label: 'Boost for 7 days', days: 7 },
  { label: 'Boost for 30 days', days: 30 },
  { label: 'Boost until removed', days: null },
];

/** Admin-only overlay control to boost an artwork in the default feed. */
export function AdminBoostButton({
  artworkId,
  boosted,
  onChange,
}: {
  artworkId: string;
  boosted: boolean;
  onChange: (artworkId: string, boosted: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  const boost = (days: number | null) =>
    startTransition(async () => {
      const res = await boostArtwork(artworkId, days);
      if (res.error) return void toast.error(res.error);
      onChange(artworkId, true);
      toast.success('Boosted in the feed');
    });

  const unboost = () =>
    startTransition(async () => {
      const res = await removeBoost(artworkId);
      if (res.error) return void toast.error(res.error);
      onChange(artworkId, false);
      toast.success('Boost removed');
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          title={boosted ? 'Boosted in feed (admin)' : 'Boost in feed (admin)'}
          aria-label={boosted ? 'Manage feed boost' : 'Boost in feed'}
          className={`h-11 w-11 p-0 rounded-full transition-all shadow-sm ${
            boosted
              ? 'text-wine bg-parchment/90 hover:bg-parchment'
              : 'text-parchment bg-black/25 hover:bg-black/35 backdrop-blur-sm'
          }`}
        >
          <Rocket className={`h-5 w-5 ${boosted ? 'fill-current' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-serif">
        <DropdownMenuLabel className="text-xs text-ink/50">
          {boosted ? 'Boosted in feed' : 'Admin · feed boost'}
        </DropdownMenuLabel>
        {DURATIONS.map((d) => (
          <DropdownMenuItem key={d.label} onSelect={() => boost(d.days)}>
            {boosted ? d.label.replace('Boost', 'Re-boost') : d.label}
          </DropdownMenuItem>
        ))}
        {boosted && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={unboost} className="text-destructive">
              Remove boost
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
