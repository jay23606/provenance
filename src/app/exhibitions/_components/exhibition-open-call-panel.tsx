'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Megaphone } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { toast } from '@kit/ui/sonner';
import {
  closeExhibitionOpenCall,
  openExhibitionOpenCall,
  type ExhibitionOpenCallSummary,
} from '../_actions/exhibition-open-call';

function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function ExhibitionOpenCallPanel({
  exhibitionId,
  openCall,
  defaultClosingDate,
}: {
  exhibitionId: string;
  openCall: ExhibitionOpenCallSummary | null;
  defaultClosingDate: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const [closingDate, setClosingDate] = useState(
    openCall?.isOpen && openCall.submissionClosingDate
      ? openCall.submissionClosingDate.slice(0, 10)
      : defaultClosingDate && defaultClosingDate >= today
        ? defaultClosingDate
        : '',
  );

  const publicPath = openCall ? `/open-calls/${openCall.slug}` : null;

  const handleOpen = () => {
    startTransition(async () => {
      const result = await openExhibitionOpenCall(exhibitionId, { closingDate });
      if (result.success) {
        toast.success(openCall ? 'Open call updated' : 'Open call is live');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      const result = await closeExhibitionOpenCall(exhibitionId);
      if (result.success) {
        toast.success('Open call closed');
        router.refresh();
      } else {
        toast.error(result.error || 'Could not close the open call');
      }
    });
  };

  const handleCopy = async () => {
    if (!publicPath) return;
    try {
      await navigator.clipboard.writeText(new URL(publicPath, window.location.origin).href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <section className="mt-12 pt-10 border-t border-wine/15">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-widest text-wine/50 font-serif mb-2">
          Open call
        </p>
        <h2 className="text-2xl font-display font-bold text-ink">
          Accept submissions from any artist
        </h2>
        <p className="text-ink/55 font-serif text-sm mt-2 max-w-2xl">
          Alongside your invites, publish a public open call. Artists sign in, upload new work or
          pick pieces already on their account, and their submissions land in this exhibition for
          you to select from. The per-artist limit above applies.
        </p>
      </div>

      {openCall?.isOpen ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 font-serif space-y-3">
          <p className="text-sm text-ink">
            <span className="font-semibold text-emerald-800">Open</span>
            {openCall.submissionClosingDate &&
              ` · accepting submissions until ${formatDate(openCall.submissionClosingDate)}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href={publicPath!} target="_blank">
                View open call
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleCopy()}
              className="h-8 text-xs gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy link
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2 pt-1">
            <div className="space-y-1">
              <Label htmlFor="openCallDeadline" className="text-xs">
                Deadline
              </Label>
              <Input
                id="openCallDeadline"
                type="date"
                min={today}
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="h-8 w-44 text-xs"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !closingDate}
              onClick={handleOpen}
              className="h-8 text-xs"
            >
              Update deadline
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={handleClose}
              className="h-8 text-xs text-ink/60 hover:text-wine"
            >
              Close open call
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-wine/15 p-4 font-serif">
          {openCall && (
            <p className="text-sm text-ink/60 mb-3">
              Your open call is closed. Set a new deadline to reopen it.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="openCallDeadline">Submission deadline</Label>
              <Input
                id="openCallDeadline"
                type="date"
                min={today}
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              type="button"
              disabled={pending || !closingDate}
              onClick={handleOpen}
              className="gap-1.5 bg-wine text-parchment hover:bg-wine/90"
            >
              <Megaphone className="h-4 w-4" />
              {openCall ? 'Reopen open call' : 'Publish open call'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
