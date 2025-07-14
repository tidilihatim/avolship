import { Metadata } from 'next';
import { FeaturedPromotionsList } from './_components/featured-promotions-list';

export const metadata: Metadata = {
  title: 'Featured Promotions | AvolShip',
  description: 'View all featured promotions from shipping providers',
};

export default function FeaturedPromotionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FeaturedPromotionsList />
    </div>
  );
}