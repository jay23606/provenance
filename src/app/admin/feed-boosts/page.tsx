import { requireAdmin } from '~/lib/admin';
import { listFeedBoosts } from './_actions/feed-boosts';
import { FeedBoostsManager } from './_components/feed-boosts-manager';

export const metadata = {
  title: 'Feed Boosts | Admin | Provenance',
};

export default async function FeedBoostsPage() {
  await requireAdmin();
  const { boosts } = await listFeedBoosts();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-wine mb-2">Feed Boosts</h1>
        <p className="text-ink/70 font-serif">
          Boosted artworks appear first in the default Artworks feed for anyone who hasn&apos;t seen
          them yet. Once someone has seen a boosted piece it rejoins the normal rotation for them.
        </p>
      </div>

      <FeedBoostsManager initialBoosts={boosts} />
    </div>
  );
}
