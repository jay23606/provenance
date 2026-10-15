'use client';

import { useSearchParams } from 'next/navigation';

import { sanitizeNextPath } from '~/lib/auth/safe-next-path';

/**
 * The page to land on after signing in or up (e.g. an open call the visitor
 * was about to submit to), carried between auth screens as `?next=`.
 */
export function useAuthNextPath(): string | null {
  return sanitizeNextPath(useSearchParams().get('next'));
}

/** Appends the current `next` to an auth path so switching screens keeps it. */
export function withNextPath(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
