export type ProductCategory =
  | 'Audio'
  | 'Power'
  | 'Smart & Office'
  | 'Personal & Home';

export type ProductOccasion =
  | 'Gaming'
  | 'Content Creation'
  | 'Best Sellers'
  | 'Travel & Commute';

export type ProductBadge =
  | 'Best Seller'
  | 'New Arrival'
  | 'Flash Sale'
  | 'Free Gift'
  | 'None';

export type ProductCollectionTab =
  | 'Best Sellers'
  | 'New Arrivals'
  | 'Flash Sales'
  | 'All Products';

export interface ProductVariant {
  id: string;
  name: string;
  hex: string;
  sku: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  subcategory: string;
  occasions: ProductOccasion[];
  badge: ProductBadge;
  giftNote?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  image: string;
  features: [string, string];
  specs: Array<{ label: string; value: string }>;
  description: string;
  warrantyMonths: number;
  variants: ProductVariant[];
  collections: Array<'Best Sellers' | 'New Arrivals' | 'Flash Sales'>;
}

export interface RegionalShippingRule {
  zoneId: string;
  zoneName: string;
  states: string[];
  flatRate: number;
  etaDays: string;
}

export interface ShippingConfig {
  freeShippingThreshold: number;
  codMaxLimit: number;
  announcementEnabled: boolean;
  regionalRules: RegionalShippingRule[];
}

export type PaymentMethod = 'paystack' | 'flutterwave' | 'cod';
export type PaymentStatus = 'Paid' | 'COD Pending' | 'Awaiting Verification';
export type FulfillmentStage =
  | 'Order Placed'
  | 'Confirmed'
  | 'Packed'
  | 'In Transit'
  | 'Delivered';

export interface OrderItem {
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface DeliveryAddress {
  id?: string;
  label?: string;
  recipientName: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  streetAddress: string;
  landmark?: string;
}

export interface OrderMilestone {
  stage: FulfillmentStage;
  completed: boolean;
  timestamp?: string;
  note: string;
}

export interface Order {
  id: string;
  waybillNumber: string;
  createdAt: string;
  customer: DeliveryAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  highValueVerified: boolean;
  requiresHighValueVerification: boolean;
  currentStage: FulfillmentStage;
  courierName: string;
  riderPhone?: string;
  milestones: OrderMilestone[];
}

export interface CustomerAccount {
  id: string;
  contact: string;
  name: string;
  email: string;
  phone: string;
  addresses: DeliveryAddress[];
}

export interface HeroSlide {
  id: string;
  kicker: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  targetTab: ProductCollectionTab;
  targetCategory?: ProductCategory | 'All';
  image: string;
  offerTag: string;
}

export interface CustomerVideoCaption {
  startSec: number;
  endSec: number;
  text: string;
}

export interface CustomerVideo {
  id: string;
  title: string;
  customerName: string;
  city: string;
  occasion: string;
  quote: string;
  duration: string;
  durationSeconds: number;
  posterImage: string;
  productId: string;
  youtubeId?: string;
  youtubeUrl?: string;
  captions: CustomerVideoCaption[];
}

