import { ArrowUpRight } from 'lucide-react';
import type { Product, ProductCategory } from '../types';
import { ResilientImage } from './ResilientImage';

interface CategoryVisualGridProps {
  products: Product[];
  activeCategory: ProductCategory | 'All';
  onSelectCategory: (category: ProductCategory) => void;
}

const CATEGORY_CARDS: Array<{
  category: ProductCategory;
  caption: string;
  image: string;
}> = [
  {
    category: 'Audio',
    caption: 'ANC Earbuds, Studio Headphones & Speakers',
    image: '/src/assets/jogad/prod-178-14.jpg',
  },
  {
    category: 'Power',
    caption: '50,000mAh PowerJet, 27,000mAh & Fast Chargers',
    image: '/src/assets/jogad/prod-15-28.jpg',
  },
  {
    category: 'Smart & Office',
    caption: 'Core i7 Laptops, Osmo Pocket 3 & Smartwatches',
    image: '/src/assets/jogad/prod-270-1.jpg',
  },
  {
    category: 'Personal & Home',
    caption: 'Lifestyle Gadgets, Trimmers & Smart Appliances',
    image: '/src/assets/jogad/prod-227-3.jpg',
  },
];

export function CategoryVisualGrid({
  products,
  activeCategory,
  onSelectCategory,
}: CategoryVisualGridProps) {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-10 pb-4">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#111315]">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Official hardware across audio, rapid charging, smart wearables, and home gear.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {CATEGORY_CARDS.map((card) => {
          const count = products.filter((p) => p.category === card.category).length;
          const isSelected = activeCategory === card.category;
          return (
            <button
              key={card.category}
              type="button"
              onClick={() => onSelectCategory(card.category)}
              className={`group text-left bg-white rounded-md border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isSelected ? 'border-[#111315] ring-1 ring-[#111315]' : 'border-zinc-200'
              }`}
            >
              <div className="aspect-[4/3] bg-[#F5F5F4] overflow-hidden">
                <ResilientImage
                  src={card.image}
                  alt={card.category}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex items-start justify-between gap-2 border-t border-zinc-100">
                <div>
                  <div className="font-display font-bold text-sm sm:text-base text-[#111315]">
                    {card.category}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{card.caption}</div>
                  <div className="text-[11px] font-mono tabular-nums text-zinc-400 mt-1.5">
                    {count} {count === 1 ? 'model' : 'models'}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#4D8A00] shrink-0 mt-0.5 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
