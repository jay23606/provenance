'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { toast } from '@kit/ui/sonner';
import pathsConfig from '~/config/paths.config';
import { startOpenCallSubmission } from '~/app/exhibitions/_actions/exhibition-open-call';

/**
 * Open calls attached to an exhibition: artists sign in and submit through
 * the exhibition upload page, where they can also pick works already on
 * their Provenance account.
 */
export function ExhibitionOpenCallSubmit({
  openCallId,
  slug,
  isExpired,
  maxArtworks,
}: {
  openCallId: string;
  slug: string;
  isExpired: boolean;
  maxArtworks: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (isExpired) {
    return (
      <Alert className="border-ink/30 bg-ink/5">
        <AlertDescription className="font-serif text-ink/80">
          Submissions for this open call have closed.
        </AlertDescription>
      </Alert>
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
        router.push(
          `${pathsConfig.auth.signIn}?next=${encodeURIComponent(`/open-calls/${slug}`)}`,
        );
        return;
      }
      toast.error(result.error);
    });
  };

  return (
    <div className="rounded-lg border border-wine/30 bg-wine/5 p-6 font-serif">
      <p className="text-ink/80 mb-1">
        Submit {maxArtworks ? `up to ${maxArtworks} ${maxArtworks === 1 ? 'artwork' : 'artworks'}` : 'your work'} for
        consideration.
      </p>
      <p className="text-ink/60 text-sm mb-4">
        Sign in to upload new work or choose pieces already on your Provenance account.
        Each submission gets a Certificate of Authenticity.
      </p>
      <Button
        type="button"
        onClick={handleStart}
        disabled={pending}
        className="bg-wine text-parchment hover:bg-wine/90"
      >
        {pending ? 'Opening…' : 'Submit your work'}
      </Button>
    </div>
  );
}
