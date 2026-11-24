import { useState } from 'react';
import { X, Star, ShieldCheck, Truck, Minus, Plus, Check } from 'lucide-react';
import type { Product, ProductVariant, ShippingConfig } from '../types';
import { discountPercent, formatNaira } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: Product;
  initialVariant?: ProductVariant;
  shippingConfig: ShippingConfig;
  onClose: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, qty: number, openDrawer?: boolean) => void;
}

export function ProductDetailModal({
  product,
  initialVariant,
  shippingConfig,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    initialVariant || product.variants[0]
  );
  const [quantity, setQuantity] = useState(1);

  const pctOff = discountPercent(product.price, product.originalPrice);
  const qualifiesFreeShipping = product.price * quantity >= shippingConfig.freeShippingThreshold;
  const requiresPrepay = product.price * quantity >= shippingConfig.codMaxLimit;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="bg-white w-full max-w-4xl rounded-lg border border-zinc-200 shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div className="text-xs text-zinc-500">
            <span>{product.category}</span>
            <span className="mx-2">/</span>
            <span className="text-[#111315] font-medium">{product.subcategory}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-2 text-zinc-500 hover:text-[#111315] rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Gallery & Specifications */}
          <div className="md:col-span-6 bg-[#F5F5F4] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200">
            <div className="aspect-[4/3] bg-white rounded-md border border-zinc-200 overflow-hidden">
              <ResilientImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Technical Specifications
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="bg-white border border-zinc-200 rounded-md p-3"
                  >
                    <div className="text-[11px] text-zinc-500">{spec.label}</div>
                    <div className="text-xs font-semibold text-[#111315] mt-0.5">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                {product.badge !== 'None' ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#82E600] text-[#111315] rounded-sm">
                    {product.badge}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Official Hardware
                  </span>
                )}
                <div className="flex items-center gap-1 text-xs tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-zinc-500">({product.reviewCount} reviews)</span>
                </div>
              </div>

              <h2 className="font-display text-2xl font-bold text-[#111315] mt-3 leading-tight">
                {product.name}
              </h2>
              <p className="text-sm text-zinc-600 mt-1">{product.subtitle}</p>

              {/* Price Anchor */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-mono text-2xl font-bold tabular-nums text-[#111315]">
                  {formatNaira(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="font-mono text-sm text-zinc-400 line-through tabular-nums">
                    {formatNaira(product.originalPrice)}
                  </span>
                )}
                {pctOff > 0 && (
                  <span className="text-xs font-mono font-bold text-[#4D8A00]">
                    Save {pctOff}%
                  </span>
                )}
              </div>

              {product.giftNote && (
                <div className="mt-3 text-xs font-medium text-[#3F7000] bg-[#82E600]/15 border border-[#82E600]/40 px-3 py-2 rounded-md">
                  {product.giftNote}
                </div>
              )}

              <p className="mt-4 text-sm text-zinc-600 leading-relaxed">{product.description}</p>

              {/* Features */}
              <ul className="mt-4 space-y-1.5 text-xs text-zinc-700">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4D8A00] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Color Variant Selection */}
              <div className="mt-5 pt-4 border-t border-zinc-200">
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="font-semibold text-[#111315]">
                    Color: <span className="font-normal text-zinc-600">{selectedVariant.name}</span>
                  </span>
                  <span className="font-mono text-zinc-500 tabular-nums">
                    SKU {selectedVariant.sku} · {selectedVariant.stock} in stock
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const active = variant.sku === selectedVariant.sku;
                    return (
                      <button
                        key={variant.sku}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                          active
                            ? 'border-[#111315] bg-zinc-50 text-[#111315]'
                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-zinc-300"
                          style={{ backgroundColor: variant.hex }}
                        />
                        <span>{variant.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantity & Buy Actions */}
            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-zinc-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-2.5 text-zinc-600 hover:text-[#111315]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedVariant.stock || 10, q + 1))}
                    aria-label="Increase quantity"
                    className="p-2.5 text-zinc-600 hover:text-[#111315]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={selectedVariant.stock <= 0}
                  onClick={() => {
                    onAddToCart(product, selectedVariant, quantity, true);
                    onClose();
                  }}
                  className="flex-1 py-3 px-5 bg-[#82E600] hover:bg-[#73C900] disabled:bg-zinc-200 disabled:text-zinc-500 text-[#111315] font-display text-sm font-bold rounded-md transition-colors"
                >
                  {selectedVariant.stock <= 0
                    ? 'Out of Stock'
                    : `Add to Cart · ${formatNaira(product.price * quantity)}`}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#4D8A00] shrink-0" />
                  <span>
                    {qualifiesFreeShipping
                      ? 'Qualifies for Free Shipping'
                      : `Free shipping over ${formatNaira(shippingConfig.freeShippingThreshold)}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4D8A00] shrink-0" />
                  <span>
                    {requiresPrepay
                      ? 'Prepayment required (≥₦150k)'
                      : `${product.warrantyMonths}-Month Nigerian Warranty`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
