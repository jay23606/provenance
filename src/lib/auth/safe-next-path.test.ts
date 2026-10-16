import { describe, expect, it } from 'vitest';

import { safeNextPath, sanitizeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it('keeps same-origin paths', () => {
    expect(safeNextPath('/settings?tab=security')).toBe('/settings?tab=security');
  });

  it('strips the host from full URLs', () => {
    expect(safeNextPath('https://evil.com/x?y=1')).toBe('/x?y=1');
  });

  it('rejects protocol-relative and backslash paths', () => {
    expect(safeNextPath('//evil.com/x')).toBe('/artworks');
    expect(safeNextPath('/\\evil.com')).toBe('/artworks');
  });

  it('defaults when missing', () => {
    expect(safeNextPath(null)).toBe('/artworks');
    expect(safeNextPath('')).toBe('/artworks');
  });
});

describe('sanitizeNextPath', () => {
  it('keeps same-origin paths', () => {
    expect(sanitizeNextPath('/open-calls/spring-show')).toBe('/open-calls/spring-show');
  });

  it('returns null for missing, foreign or protocol-relative targets', () => {
    expect(sanitizeNextPath(null)).toBeNull();
    expect(sanitizeNextPath('')).toBeNull();
    expect(sanitizeNextPath('https://evil.com/x')).toBeNull();
    expect(sanitizeNextPath('//evil.com/x')).toBeNull();
    expect(sanitizeNextPath('/\\evil.com')).toBeNull();
  });
});
