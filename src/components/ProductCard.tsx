import { useState } from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product, ProductVariant } from '../types';
import { discountPercent, formatNaira } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
  onLearnMore: (product: Product, selectedVariant: ProductVariant) => void;
  onAddToCart: (product: Product, selectedVariant: ProductVariant) => void;
}

export function ProductCard({ product, onLearnMore, onAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant =
    product.variants.find((v) => v.sku === selectedVariant?.sku) || product.variants[0];
  const pctOff = discountPercent(product.price, product.originalPrice);

  const handleAdd = () => {
    onAddToCart(product, activeVariant);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  const badgeStyles: Record<string, string> = {
    'Flash Sale': 'bg-[#111315] text-[#82E600]',
    'Best Seller': 'bg-[#82E600] text-[#111315]',
    'New Arrival': 'bg-zinc-900 text-white',
    'Free Gift': 'bg-[#4D8A00] text-white',
  };

  return (
    <article className="bg-white border border-zinc-200 rounded-md flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Studio Image & Single Crisp Status Tag */}
      <div className="relative aspect-[4/3] bg-[#F5F5F4] overflow-hidden">
        {product.badge !== 'None' && (
          <div
            className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase rounded-sm ${
              badgeStyles[product.badge] || 'bg-zinc-900 text-white'
            }`}
          >
            {product.badge}
          </div>
        )}

        <button
          type="button"
          onClick={() => onLearnMore(product, activeVariant)}
          className="w-full h-full block cursor-pointer"
          aria-label={`View details for ${product.name}`}
        >
          <ResilientImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
          <span className="uppercase tracking-wider font-medium text-[11px]">
            {product.subcategory}
          </span>
          <div className="flex items-center gap-1 tabular-nums">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-[#111315]">{product.rating.toFixed(1)}</span>
            <span className="text-zinc-400">({product.reviewCount})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base text-[#111315] mt-1.5 leading-snug">
          <button
            type="button"
            onClick={() => onLearnMore(product, activeVariant)}
            className="text-left hover:text-[#4D8A00] transition-colors"
          >
            {product.name}
          </button>
        </h3>

        {/* Interactive Color Swatches */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Color options">
            {product.variants.map((variant) => {
              const isSelected = variant.sku === activeVariant.sku;
              return (
                <button
                  key={variant.sku}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  aria-label={`Select color ${variant.name}`}
                  aria-checked={isSelected}
                  role="radio"
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-[#111315] border-zinc-400 scale-105'
                      : 'border-zinc-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: variant.hex }}
                />
              );
            })}
          </div>
          <span className="text-xs text-zinc-500 truncate">{activeVariant.name}</span>
        </div>

        {/* 2-Line Feature Bullet Points */}
        <ul className="mt-3 space-y-1 text-xs text-zinc-600 flex-1">
          <li className="flex items-start gap-1.5">
            <span className="text-[#4D8A00] font-bold leading-4" aria-hidden="true">
              •
            </span>
            <span className="line-clamp-1">{product.features[0]}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#4D8A00] font-bold leading-4" aria-hidden="true">
              •
            </span>
            <span className="line-clamp-1">{product.features[1]}</span>
          </li>
        </ul>

        {/* Anchor Pricing */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tabular-nums text-[#111315]">
              {formatNaira(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="font-mono text-xs text-zinc-400 line-through tabular-nums">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>
          {pctOff > 0 && (
            <span className="text-[11px] font-mono font-semibold text-[#4D8A00] tabular-nums">
              -{pctOff}%
            </span>
          )}
        </div>

        {/* Dual CTAs */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onLearnMore(product, activeVariant)}
            className="px-3 py-2.5 text-xs font-semibold text-[#111315] bg-white border border-zinc-300 hover:border-[#111315] rounded-md transition-colors whitespace-nowrap"
          >
            Learn More
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={activeVariant.stock <= 0}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
              activeVariant.stock <= 0
                ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                : justAdded
                ? 'bg-[#111315] text-[#82E600]'
                : 'bg-[#82E600] hover:bg-[#73C900] text-[#111315]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>
              {activeVariant.stock <= 0 ? 'Out of Stock' : justAdded ? 'Added' : 'Add to Cart'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
