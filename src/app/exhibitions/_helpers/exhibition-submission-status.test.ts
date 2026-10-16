import { describe, expect, it } from 'vitest';
import {
  artistFacingStatusLabel,
  countSubmissionsByStatus,
  isShownInExhibition,
  parseExhibitionArtworkStatus,
  planSubmissionReview,
} from './exhibition-submission-status';

describe('parseExhibitionArtworkStatus', () => {
  it('keeps known statuses', () => {
    expect(parseExhibitionArtworkStatus('submitted')).toBe('submitted');
    expect(parseExhibitionArtworkStatus('declined')).toBe('declined');
  });

  it('treats missing or unknown values as selected, matching the column default', () => {
    expect(parseExhibitionArtworkStatus(undefined)).toBe('selected');
    expect(parseExhibitionArtworkStatus(null)).toBe('selected');
    expect(parseExhibitionArtworkStatus('bogus')).toBe('selected');
  });
});

describe('isShownInExhibition', () => {
  it('shows only selected works', () => {
    expect(isShownInExhibition('selected')).toBe(true);
    expect(isShownInExhibition('submitted')).toBe(false);
    expect(isShownInExhibition('declined')).toBe(false);
  });
});

describe('planSubmissionReview', () => {
  it('selecting a submission at a gallery show issues a CoS, credits and notifies', () => {
    expect(
      planSubmissionReview({
        current: 'submitted',
        decision: 'select',
        showIssuesCos: true,
        hasCos: false,
      }),
    ).toEqual({ ok: true, next: 'selected', issueCos: true, creditArtist: true, notifyArtist: true });
  });

  it('selecting at an artist-run show issues no CoS', () => {
    const plan = planSubmissionReview({
      current: 'submitted',
      decision: 'select',
      showIssuesCos: false,
      hasCos: false,
    });
    expect(plan).toMatchObject({ ok: true, next: 'selected', issueCos: false });
  });

  it('re-selecting a declined work does not issue a second CoS', () => {
    const plan = planSubmissionReview({
      current: 'declined',
      decision: 'select',
      showIssuesCos: true,
      hasCos: true,
    });
    expect(plan).toMatchObject({ ok: true, next: 'selected', issueCos: false });
  });

  it('declining a pending submission never touches certificates or credits', () => {
    expect(
      planSubmissionReview({
        current: 'submitted',
        decision: 'decline',
        showIssuesCos: true,
        hasCos: false,
      }),
    ).toEqual({
      ok: true,
      next: 'declined',
      issueCos: false,
      creditArtist: false,
      notifyArtist: false,
    });
  });

  it('allows unselecting when no CoS was issued', () => {
    const plan = planSubmissionReview({
      current: 'selected',
      decision: 'decline',
      showIssuesCos: false,
      hasCos: false,
    });
    expect(plan).toMatchObject({ ok: true, next: 'declined' });
  });

  it('refuses to decline a selected work whose CoS is already issued', () => {
    const plan = planSubmissionReview({
      current: 'selected',
      decision: 'decline',
      showIssuesCos: true,
      hasCos: true,
    });
    expect(plan.ok).toBe(false);
  });

  it('rejects no-op transitions', () => {
    expect(
      planSubmissionReview({ current: 'selected', decision: 'select', showIssuesCos: true, hasCos: true })
        .ok,
    ).toBe(false);
    expect(
      planSubmissionReview({ current: 'declined', decision: 'decline', showIssuesCos: true, hasCos: false })
        .ok,
    ).toBe(false);
  });
});

describe('countSubmissionsByStatus', () => {
  it('tallies each status', () => {
    expect(countSubmissionsByStatus(['submitted', 'submitted', 'selected', 'declined'])).toEqual({
      submitted: 2,
      selected: 1,
      declined: 1,
    });
  });
});

describe('artistFacingStatusLabel', () => {
  it('describes each review state from the artist side', () => {
    expect(artistFacingStatusLabel('submitted')).toBe('Under review');
    expect(artistFacingStatusLabel('selected')).toBe('Selected');
    expect(artistFacingStatusLabel('declined')).toBe('Not selected');
  });
});
