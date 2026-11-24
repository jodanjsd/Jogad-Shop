import type { ShippingConfig } from '../types';

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function discountPercent(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function getShippingRate(
  stateName: string,
  subtotal: number,
  config: ShippingConfig
): { fee: number; etaDays: string; zoneName: string; isFree: boolean } {
  const matched =
    config.regionalRules.find((r) =>
      r.states.some((s) => s.toLowerCase() === stateName.toLowerCase())
    ) || config.regionalRules[config.regionalRules.length - 1];

  const isFree = subtotal >= config.freeShippingThreshold;
  return {
    fee: isFree ? 0 : matched?.flatRate ?? 4500,
    etaDays: matched?.etaDays ?? '2–4 business days',
    zoneName: matched?.zoneName ?? 'Nationwide Delivery',
    isFree,
  };
}

export const NIGERIAN_STATES = [
  'Lagos',
  'FCT Abuja',
  'Ogun',
  'Oyo',
  'Rivers',
  'Delta',
  'Edo',
  'Enugu',
  'Anambra',
  'Abia',
  'Akwa Ibom',
  'Imo',
  'Cross River',
  'Kano',
  'Kaduna',
  'Ondo',
  'Osun',
  'Ekiti',
  'Kwara',
  'Plateau',
  'Niger',
  'Benue',
  'Other States',
];
