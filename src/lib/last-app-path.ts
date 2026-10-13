/**
 * Remembers the last page visited outside the docs shell, so the docs "back"
 * link can return there. Docs hide the main nav and the iOS tab bar, so
 * without this there's no way out inside the app.
 */

const STORAGE_KEY = 'provenance.lastAppPath';

export function rememberAppPath(path: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // Storage unavailable — the back link falls back to the home page.
  }
}

export function readLastAppPath(): string | null {
  try {
    const path = sessionStorage.getItem(STORAGE_KEY);
    // Only same-site paths; never follow anything that could leave the app.
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}
