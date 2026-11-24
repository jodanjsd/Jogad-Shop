import { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, ProductVariant } from '../types';
import { ProductCard } from './ProductCard';

interface CollectionSlideShelfProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  products: Product[];
  ctaLabel: string;
  onViewAll: () => void;
  onLearnMore: (product: Product, selectedVariant: ProductVariant) => void;
  onAddToCart: (product: Product, selectedVariant: ProductVariant) => void;
}

export function CollectionSlideShelf({
  id,
  eyebrow,
  title,
  subtitle,
  products,
  ctaLabel,
  onViewAll,
  onLearnMore,
  onAddToCart,
}: CollectionSlideShelfProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  const scrollTrack = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth * 0.85, 320);
    el.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  return (
    <section id={id} className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-10 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#4D8A00]">
            {eyebrow}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#111315] mt-0.5">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollTrack(-1)}
            aria-label={`Previous ${title} items`}
            className="p-2 rounded-md bg-white border border-zinc-200 hover:border-[#111315] text-[#111315] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack(1)}
            aria-label={`Next ${title} items`}
            className="p-2 rounded-md bg-white border border-zinc-200 hover:border-[#111315] text-[#111315] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="ml-1 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111315] bg-white border border-zinc-200 hover:border-[#111315] rounded-md transition-colors whitespace-nowrap"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-3 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[82%] sm:w-[46%] lg:w-[calc((100%-40px)/3)]"
          >
            <ProductCard
              product={product}
              onLearnMore={onLearnMore}
              onAddToCart={onAddToCart}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
