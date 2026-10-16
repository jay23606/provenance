'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { toast } from '@kit/ui/sonner';
import pathsConfig from '~/config/paths.config';
import {
  startOpenCallSubmission,
  type MyOpenCallStatus,
} from '~/app/exhibitions/_actions/exhibition-open-call';
import {
  artistFacingStatusLabel,
  type ExhibitionArtworkStatus,
} from '~/app/exhibitions/_helpers/exhibition-submission-status';

function statusClass(status: ExhibitionArtworkStatus): string {
  switch (status) {
    case 'submitted':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'selected':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'declined':
      return 'bg-ink/5 text-ink/50 border-ink/15';
  }
}

/**
 * Open calls attached to an exhibition: artists sign in (or create an
 * account and come straight back here) and submit through the exhibition
 * upload page, where they can upload new work or pick pieces already on
 * their Provenance account. Once submitted, this shows where each work
 * stands in the organiser's review.
 */
export function ExhibitionOpenCallSubmit({
  openCallId,
  slug,
  exhibitionId,
  isExpired,
  maxArtworks,
  status,
  justSubmitted,
}: {
  openCallId: string;
  slug: string;
  exhibitionId: string;
  isExpired: boolean;
  maxArtworks: number | null;
  status: MyOpenCallStatus;
  justSubmitted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const returnPath = `/open-calls/${slug}`;

  if (status.isOrganiser) {
    return (
      <div className="rounded-lg border border-wine/30 bg-wine/5 p-6 font-serif">
        <p className="text-ink/80 mb-1">This is your open call.</p>
        <p className="text-ink/60 text-sm mb-4">
          Share this page with artists. Review what they submit and select works for the
          exhibition from its edit page.
        </p>
        <Button asChild className="bg-wine text-parchment hover:bg-wine/90">
          <Link href={`/exhibitions/${exhibitionId}/edit#submissions`}>Review submissions</Link>
        </Button>
      </div>
    );
  }

  const handleStart = () => {
    startTransition(async () => {
      const result = await startOpenCallSubmission(openCallId);
      if (result.success) {
        router.push(`/exhibitions/submit?token=${encodeURIComponent(result.token)}`);
        return;
      }
      if (result.needsSignIn) {
        router.push(`${pathsConfig.auth.signIn}?next=${encodeURIComponent(returnPath)}`);
        return;
      }
      toast.error(result.error);
    });
  };

  const limitText = maxArtworks
    ? `up to ${maxArtworks} ${maxArtworks === 1 ? 'artwork' : 'artworks'}`
    : 'your work';

  let action: React.ReactNode;
  if (isExpired) {
    action = status.submissions.length ? null : (
      <Alert className="border-ink/30 bg-ink/5">
        <AlertDescription className="font-serif text-ink/80">
          Submissions for this open call have closed.
        </AlertDescription>
      </Alert>
    );
  } else if (!status.signedIn) {
    const next = encodeURIComponent(returnPath);
    action = (
      <div className="rounded-lg border border-wine/30 bg-wine/5 p-6 font-serif">
        <p className="text-ink/80 mb-1">Submit {limitText} for consideration.</p>
        <p className="text-ink/60 text-sm mb-4">
          You&apos;ll need a free Provenance account. Once you&apos;re in, you&apos;ll come
          right back here to upload new work or choose pieces already on your account.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-wine text-parchment hover:bg-wine/90">
            <Link href={`${pathsConfig.auth.signUp}?next=${next}`}>Create an account</Link>
          </Button>
          <Button asChild variant="outline" className="border-wine/30">
            <Link href={`${pathsConfig.auth.signIn}?next=${next}`}>Sign in</Link>
          </Button>
        </div>
      </div>
    );
  } else if (status.canSubmit) {
    action = (
      <div className="rounded-lg border border-wine/30 bg-wine/5 p-6 font-serif">
        <p className="text-ink/80 mb-1">
          {status.submissions.length
            ? 'You can add more work to your submission.'
            : `Submit ${limitText} for consideration.`}
        </p>
        <p className="text-ink/60 text-sm mb-4">
          Upload new work or choose pieces already on your Provenance account. Each new
          upload gets a Certificate of Authenticity.
        </p>
        <Button
          type="button"
          onClick={handleStart}
          disabled={pending}
          className="bg-wine text-parchment hover:bg-wine/90"
        >
          {pending ? 'Opening…' : status.submissions.length ? 'Add more work' : 'Submit your work'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {justSubmitted && status.submissions.length > 0 && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertDescription className="font-serif text-emerald-900">
            Thanks — your submission is in. The organiser will review it, and you&apos;ll get
            a notification if your work is selected.
          </AlertDescription>
        </Alert>
      )}

      {status.submissions.length > 0 && (
        <section className="rounded-lg border border-wine/15 p-6 font-serif">
          <p className="text-[11px] uppercase tracking-widest text-wine/50 mb-4">
            Your submission
          </p>
          <ul className="divide-y divide-wine/10">
            {status.submissions.map((submission) => (
              <li key={submission.artworkId} className="flex items-center gap-4 py-3">
                {submission.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={submission.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded object-cover bg-ink/5"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded bg-ink/5" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/artworks/${submission.artworkId}/certificate`}
                    className="block truncate text-ink hover:text-wine"
                  >
                    {submission.title}
                  </Link>
                  <p className="text-xs text-ink/50">
                    Submitted{' '}
                    {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${statusClass(submission.status)}`}
                >
                  {artistFacingStatusLabel(submission.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {action}
    </div>
  );
}
