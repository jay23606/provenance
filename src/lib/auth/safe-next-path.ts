const DEFAULT_NEXT_PATH = '/artworks';

/**
 * Turns a post-sign-in `next` value into a same-origin path.
 *
 * Guards against open redirects (CASA 5.1.2 / CWE-601): full URLs are reduced
 * to their path, and protocol-relative values like `//evil.com/x` (which
 * `new URL(value, origin)` would resolve to another host) fall back to the
 * default destination.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_NEXT_PATH;

  let path = next;
  try {
    const url = new URL(next);
    path = url.pathname + url.search;
  } catch {
    // Already a path.
  }

  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    console.warn('[Auth] Rejected unsafe post-login redirect target', { next });
    return DEFAULT_NEXT_PATH;
  }

  return path;
}

/**
 * A `next` value that is already a same-origin path, or null. For carrying a
 * destination between auth screens and onboarding without a default.
 */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  return next;
}
