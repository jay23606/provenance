'use client';

import Link from 'next/link';

import { useAuthNextPath, withNextPath } from '../_hooks/use-auth-next-path';

/** Link between sign-in and sign-up that keeps the visitor's `next` destination. */
export function AuthSwitchLink({ href, children }: { href: string; children: React.ReactNode }) {
  const next = useAuthNextPath();
  return <Link href={withNextPath(href, next)}>{children}</Link>;
}
