/**
 * Review states for exhibition_artworks rows. Artist submissions start as
 * 'submitted' and only become part of the exhibition once the organiser
 * selects them; everything the organiser adds directly is 'selected'.
 */
export const EXHIBITION_ARTWORK_STATUSES = ['submitted', 'selected', 'declined'] as const;

export type ExhibitionArtworkStatus = (typeof EXHIBITION_ARTWORK_STATUSES)[number];

export type ReviewDecision = 'select' | 'decline';

export function parseExhibitionArtworkStatus(value: unknown): ExhibitionArtworkStatus {
  return EXHIBITION_ARTWORK_STATUSES.includes(value as ExhibitionArtworkStatus)
    ? (value as ExhibitionArtworkStatus)
    : 'selected';
}

/** Only selected works are shown on the exhibition (and counted publicly). */
export function isShownInExhibition(status: unknown): boolean {
  return parseExhibitionArtworkStatus(status) === 'selected';
}

export type ReviewPlan =
  | {
      ok: true;
      next: ExhibitionArtworkStatus;
      /** Issue the Certificate of Show now (gallery/institution shows only). */
      issueCos: boolean;
      /** Add the artist to exhibition_artists if they aren't credited yet. */
      creditArtist: boolean;
      notifyArtist: boolean;
    }
  | { ok: false; error: string };

/**
 * What selecting or declining a submission should do. A selected work that
 * already has a Certificate of Show can't be declined here: the certificate
 * and its provenance entries are already issued, so the organiser removes the
 * work from the exhibition instead.
 */
export function planSubmissionReview(params: {
  current: unknown;
  decision: ReviewDecision;
  showIssuesCos: boolean;
  hasCos: boolean;
}): ReviewPlan {
  const current = parseExhibitionArtworkStatus(params.current);
  const next: ExhibitionArtworkStatus = params.decision === 'select' ? 'selected' : 'declined';

  if (current === next) {
    return { ok: false, error: next === 'selected' ? 'Already selected' : 'Already declined' };
  }

  if (next === 'declined') {
    if (current === 'selected' && params.hasCos) {
      return {
        ok: false,
        error: 'A Certificate of Show has been issued for this work; remove it from the exhibition instead',
      };
    }
    return { ok: true, next, issueCos: false, creditArtist: false, notifyArtist: false };
  }

  return {
    ok: true,
    next,
    issueCos: params.showIssuesCos && !params.hasCos,
    creditArtist: true,
    notifyArtist: true,
  };
}

export type SubmissionCounts = Record<ExhibitionArtworkStatus, number>;

export function countSubmissionsByStatus(statuses: unknown[]): SubmissionCounts {
  const counts: SubmissionCounts = { submitted: 0, selected: 0, declined: 0 };
  for (const s of statuses) counts[parseExhibitionArtworkStatus(s)] += 1;
  return counts;
}

/** How a submission's status reads to the artist who submitted it. */
export function artistFacingStatusLabel(status: unknown): string {
  switch (parseExhibitionArtworkStatus(status)) {
    case 'submitted':
      return 'Under review';
    case 'selected':
      return 'Selected';
    case 'declined':
      return 'Not selected';
  }
}
