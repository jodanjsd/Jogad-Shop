import { X, Minus, Plus, Trash2, Truck, ShieldAlert, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Product, ProductVariant, ShippingConfig } from '../types';
import { formatNaira } from '../utils/format';
import { ResilientImage } from './ResilientImage';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  shippingConfig: ShippingConfig;
  onClose: () => void;
  onUpdateQty: (sku: string, delta: number) => void;
  onRemoveItem: (sku: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  shippingConfig,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const threshold = shippingConfig.freeShippingThreshold;
  const remainingForFree = Math.max(0, threshold - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / Math.max(1, threshold)) * 100));
  const exceedsCodLimit = subtotal >= shippingConfig.codMaxLimit;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-zinc-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#111315]" />
            <h2 className="font-display font-bold text-base text-[#111315]">
              Your Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="p-2 text-zinc-500 hover:text-[#111315] rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Tracker */}
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-medium text-[#111315]">
              <Truck className="w-3.5 h-3.5 text-[#4D8A00]" />
              {remainingForFree === 0
                ? 'Free nationwide shipping unlocked'
                : `Add ${formatNaira(remainingForFree)} more for Free Shipping`}
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-500">
              {progressPct}%
            </span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-sm overflow-hidden">
            <div
              className="h-full bg-[#82E600] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-zinc-300 mb-3" />
              <div className="font-display font-bold text-sm text-[#111315]">Your cart is empty</div>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Browse flagship audio, 20000mAh power banks, and smartwatches to fill your bag.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-[#111315] text-white rounded-md hover:bg-zinc-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variant.sku}
                className="flex gap-3.5 pb-4 border-b border-zinc-100 last:border-b-0"
              >
                <div className="w-20 h-20 rounded bg-[#F5F5F4] border border-zinc-200 overflow-hidden shrink-0">
                  <ResilientImage
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#111315] truncate">
                        {item.product.name}
                      </h3>
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-zinc-300 inline-block shrink-0"
                          style={{ backgroundColor: item.variant.hex }}
                        />
                        <span className="truncate">{item.variant.name}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.variant.sku)}
                      aria-label={`Remove ${item.product.name}`}
                      className="text-zinc-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-zinc-200 rounded">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.variant.sku, -1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-zinc-600 hover:text-[#111315]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.variant.sku, 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 text-zinc-600 hover:text-[#111315]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-mono text-sm font-bold tabular-nums text-[#111315]">
                      {formatNaira(item.product.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Guardrail */}
        {items.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-white space-y-3">
            {exceedsCodLimit && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Orders of <strong>{formatNaira(shippingConfig.codMaxLimit)}</strong> or more
                  require prepayment via Paystack or Flutterwave (Cash on Delivery disabled).
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 font-medium">Subtotal</span>
              <span className="font-mono text-lg font-bold tabular-nums text-[#111315]">
                {formatNaira(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Regional shipping fee is calculated at checkout by Nigerian state.
            </p>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3 px-5 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-sm font-bold rounded-md transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
