import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getUserRole } from '~/lib/user-roles';
import { ExhibitionForm } from '../_components/exhibition-form';
import {
  defaultExhibitionOwnerRole,
  getExhibitionOwnerRoleOptions,
} from '../_helpers/exhibition-owner-roles';

import { asUntyped } from '~/lib/supabase-untyped';
export const metadata = {
  title: 'New Exhibition | Provenance',
};

export default async function NewExhibitionPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as: requestedOwnerRole } = await searchParams;
  const client = asUntyped(getSupabaseServerClient());
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { data: account } = await client
    .from('accounts')
    .select('public_data')
    .eq('id', user.id)
    .single();

  if (!account) {
    redirect('/registry');
  }

  const userRole = getUserRole(account.public_data as Record<string, unknown>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-wine mb-2">
          New Exhibition
        </h1>
        <p className="text-ink/70 font-serif">
          Create an exhibition and invite artists to upload the work they will show
        </p>
      </div>

      <ExhibitionForm
        ownerRoleOptions={getExhibitionOwnerRoleOptions(userRole)}
        defaultOwnerRole={defaultExhibitionOwnerRole(userRole, requestedOwnerRole)}
      />
    </div>
  );
}
