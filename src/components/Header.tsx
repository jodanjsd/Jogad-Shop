import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  User,
  X,
  ChevronDown,
  Menu,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  CustomerAccount,
  Product,
  ProductCategory,
  ProductOccasion,
  ShippingConfig,
} from '../types';
import { FREQUENT_SEARCHES } from '../data/seedData';
import { formatNaira } from '../utils/format';
import { ResilientImage } from './ResilientImage';

export type ActiveView = 'storefront' | 'track' | 'admin';

interface HeaderProps {
  activeView: ActiveView;
  onNavigateView: (view: ActiveView) => void;
  onSelectCategory: (category: ProductCategory | 'All', subcategory?: string) => void;
  onSelectOccasion: (occasion: ProductOccasion) => void;
  onOpenProduct: (product: Product) => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onScrollToSection: (sectionId: string) => void;
  cartCount: number;
  account: CustomerAccount | null;
  products: Product[];
  shippingConfig: ShippingConfig;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

type MegaKey = 'Audio' | 'Power' | 'Smart & Office' | 'Personal & Home' | 'Occasions' | 'Support';

const MEGA_MENU_DATA: Record<
  MegaKey,
  {
    title: string;
    links: Array<{ label: string; sub?: string; actionType: 'cat' | 'occ' | 'track' | 'support'; value: string }>;
  }
> = {
  Audio: {
    title: 'Audio & Acoustic Gear',
    links: [
      { label: 'True Wireless Earbuds', sub: 'Hybrid ANC & ENC call clarity', actionType: 'cat', value: 'Earbuds' },
      { label: 'Over-Ear Headphones', sub: '60H battery studio comfort', actionType: 'cat', value: 'Headphones' },
      { label: 'Portable Speakers', sub: 'IP67 rugged outdoor sound', actionType: 'cat', value: 'Speakers' },
    ],
  },
  Power: {
    title: 'Power & Charging',
    links: [
      { label: 'Power Banks', sub: '20,000mAh 22.5W AniFast PD', actionType: 'cat', value: 'Power Banks' },
      { label: 'GaN Chargers & Cables', sub: '65W laptop & smartphone adapters', actionType: 'cat', value: 'Chargers & Cables' },
    ],
  },
  'Smart & Office': {
    title: 'Smart Wearables & Workstations',
    links: [
      { label: 'AMOLED Smartwatches', sub: 'Bluetooth calling & fitness', actionType: 'cat', value: 'Smartwatches' },
      { label: 'Keyboards, Mice & Webcams', sub: 'Wireless mechanical & 2K webcams', actionType: 'cat', value: 'Keyboards & Webcams' },
      { label: 'Creator Desk Kits', sub: 'Microphones, hubs & studio bundles', actionType: 'cat', value: 'Creator Bundles' },
    ],
  },
  'Personal & Home': {
    title: 'Personal Care & Home',
    links: [
      { label: 'Precision Grooming', sub: 'Cordless steel-blade trimmers', actionType: 'cat', value: 'Grooming' },
      { label: 'Home Appliances', sub: 'Cordless desk & car vacuums', actionType: 'cat', value: 'Home Appliances' },
    ],
  },
  Occasions: {
    title: 'Shop by Occasion',
    links: [
      { label: 'Best Sellers', sub: 'Highest-rated gear across Nigeria', actionType: 'occ', value: 'Best Sellers' },
      { label: 'Content Creation', sub: 'Audio, power & studio kits', actionType: 'occ', value: 'Content Creation' },
      { label: 'Gaming', sub: '45ms low-latency audio & power', actionType: 'occ', value: 'Gaming' },
      { label: 'Travel & Commute', sub: 'Flight-safe power & ANC', actionType: 'occ', value: 'Travel & Commute' },
    ],
  },
  Support: {
    title: 'Customer Care & Policies',
    links: [
      { label: 'Track Your Order', sub: 'Live Order ID & waybill status', actionType: 'track', value: 'track' },
      { label: '365-Day Official Warranty', sub: 'Serialized swap protection', actionType: 'support', value: 'trust-strip' },
      { label: 'Shipping & COD Rules', sub: 'Nationwide rates & thresholds', actionType: 'support', value: 'site-footer' },
    ],
  },
};

export function Header({
  activeView,
  onNavigateView,
  onSelectCategory,
  onSelectOccasion,
  onOpenProduct,
  onOpenCart,
  onOpenAccount,
  onScrollToSection,
  cartCount,
  account,
  products,
  shippingConfig,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [openMega, setOpenMega] = useState<MegaKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const megaTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const handleMegaEnter = (key: MegaKey) => {
    if (megaTimeoutRef.current) {
      window.clearTimeout(megaTimeoutRef.current);
    }
    setOpenMega(key);
  };

  const handleMegaLeave = () => {
    megaTimeoutRef.current = window.setTimeout(() => {
      setOpenMega(null);
    }, 150);
  };

  const matchingSearchProducts = searchQuery.trim()
    ? products
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.subcategory.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q)
          );
        })
        .slice(0, 4)
    : [];

  const handleMegaLinkClick = (
    parentKey: MegaKey,
    item: { actionType: 'cat' | 'occ' | 'track' | 'support'; value: string }
  ) => {
    setOpenMega(null);
    setMobileMenuOpen(false);
    if (item.actionType === 'track') {
      onNavigateView('track');
      return;
    }
    if (item.actionType === 'support') {
      onNavigateView('storefront');
      setTimeout(() => onScrollToSection(item.value), 50);
      return;
    }
    if (item.actionType === 'occ') {
      onNavigateView('storefront');
      onSelectOccasion(item.value as ProductOccasion);
      return;
    }
    onNavigateView('storefront');
    onSelectCategory(parentKey as ProductCategory, item.value);
  };

  const featuredForMega = (key: MegaKey): Product | undefined => {
    if (key === 'Occasions' || key === 'Support') {
      return products[0];
    }
    return products.find((p) => p.category === key) || products[0];
  };

  return (
    <div className="sticky top-0 z-40 no-print">
      {shippingConfig.announcementEnabled && !bannerDismissed && (
        <div className="bg-[#111315] text-zinc-100 h-9 px-4 flex items-center justify-between text-xs border-b border-zinc-800">
          <div className="w-6 shrink-0 hidden sm:block" />
          <p className="truncate text-center font-medium tracking-tight">
            Free Shipping on Orders Over{' '}
            <span className="text-[#82E600] font-mono tabular-nums font-semibold">
              {formatNaira(shippingConfig.freeShippingThreshold)}
            </span>{' '}
            <span className="text-zinc-500 mx-1.5" aria-hidden="true">
              ·
            </span>{' '}
            Prepayment Required for Orders Above{' '}
            <span className="font-mono tabular-nums font-semibold">
              {formatNaira(shippingConfig.codMaxLimit)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-zinc-400 hover:text-white p-1 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header
        className="bg-white/95 backdrop-blur-md border-b border-zinc-200"
        onMouseLeave={handleMegaLeave}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 -ml-2 text-zinc-700 hover:text-[#111315]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigateView('storefront');
                onSelectCategory('All');
              }}
              aria-label="Jogad Home"
              className="flex items-center shrink-0 cursor-pointer"
            >
              <img
                src="/src/assets/jogad/jogad-logo.webp"
                alt="Jogad"
                referrerPolicy="no-referrer"
                className="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
              />
            </button>
          </div>

          {/* Zone 2: Mega-Menu Categories */}
          <nav
            aria-label="Primary Categories"
            className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13px] font-medium text-zinc-700"
          >
            <button
              type="button"
              onClick={() => {
                onNavigateView('storefront');
                onSelectCategory('All');
                setOpenMega(null);
              }}
              className={`hover:text-[#111315] transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 ${
                activeView === 'storefront' && openMega === null
                  ? 'border-transparent hover:border-[#73C900]'
                  : 'border-transparent'
              }`}
            >
              All Products
            </button>

            {(['Audio', 'Power', 'Smart & Office', 'Personal & Home', 'Occasions', 'Support'] as MegaKey[]).map(
              (key) => (
                <div
                  key={key}
                  onMouseEnter={() => handleMegaEnter(key)}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (key === 'Support') {
                        onNavigateView('track');
                        setOpenMega(null);
                      } else if (key === 'Occasions') {
                        onNavigateView('storefront');
                        onSelectOccasion('Best Sellers');
                        setOpenMega(null);
                      } else {
                        onNavigateView('storefront');
                        onSelectCategory(key as ProductCategory);
                        setOpenMega(null);
                      }
                    }}
                    className={`inline-flex items-center gap-1 hover:text-[#111315] transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 ${
                      openMega === key
                        ? 'border-[#73C900] text-[#111315]'
                        : 'border-transparent'
                    }`}
                  >
                    <span>{key}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              )
            )}
          </nav>

          {/* Zone 3: Interactive Storefront Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              className={`p-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                searchOpen
                  ? 'bg-[#111315] text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-[#111315]'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('track')}
              className={`hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'track'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-[#111315]'
              }`}
            >
              Track Order
            </button>

            <button
              type="button"
              onClick={onOpenAccount}
              aria-label="Account and saved addresses"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-[#111315] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline max-w-[90px] truncate">
                {account ? account.name.split(' ')[0] : 'Account'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateView(activeView === 'admin' ? 'storefront' : 'admin')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'admin'
                  ? 'bg-[#111315] text-white border-[#111315]'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {activeView === 'admin' ? 'Storefront' : 'Admin'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open shopping cart (${cartCount} items)`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#82E600] hover:bg-[#73C900] text-[#111315] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              <span className="font-mono tabular-nums font-bold">({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Mega-Menu Dropdown Panel */}
        {openMega && (
          <div
            onMouseEnter={() => handleMegaEnter(openMega)}
            onMouseLeave={handleMegaLeave}
            className="hidden lg:block border-t border-zinc-200 bg-white shadow-lg"
          >
            <div className="max-w-[1320px] mx-auto px-6 py-7 grid grid-cols-12 gap-8">
              <div className="col-span-7">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                  {MEGA_MENU_DATA[openMega].title}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MEGA_MENU_DATA[openMega].links.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleMegaLinkClick(openMega, item)}
                      className="text-left p-3 rounded-md hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors group"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-[#111315]">
                        <span>{item.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#5A9E00] transition-colors" />
                      </div>
                      {item.sub && <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const feat = featuredForMega(openMega);
                if (!feat) return null;
                return (
                  <div className="col-span-5 bg-zinc-50 border border-zinc-200 rounded-md p-4 flex items-center gap-4">
                    <div className="w-28 h-24 shrink-0 bg-white rounded overflow-hidden border border-zinc-200">
                      <ResilientImage
                        src={feat.image}
                        alt={feat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#4D8A00]">
                        Featured · {feat.badge !== 'None' ? feat.badge : feat.category}
                      </div>
                      <div className="font-display font-bold text-sm text-[#111315] truncate mt-0.5">
                        {feat.name}
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {feat.subtitle}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-mono text-sm font-bold tabular-nums text-[#111315]">
                          {formatNaira(feat.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMega(null);
                            onOpenProduct(feat);
                          }}
                          className="text-xs font-semibold text-[#111315] underline underline-offset-4 hover:text-[#4D8A00]"
                        >
                          Quick View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Expandable Live Search Bar */}
        {searchOpen && (
          <div className="border-t border-zinc-200 bg-white shadow-md">
            <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-4 space-y-3">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    if (activeView !== 'storefront') {
                      onNavigateView('storefront');
                    }
                  }}
                  placeholder="Search earbuds, 20000mAh power banks, GaN chargers, smartwatches..."
                  className="w-full pl-10 pr-20 py-2.5 text-sm bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-10 text-xs text-zinc-500 hover:text-[#111315] px-2 py-1"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search bar"
                  className="absolute right-2.5 p-1 text-zinc-400 hover:text-[#111315]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Most Frequently Searched:</span>
                {FREQUENT_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      onSearchChange(term);
                      onNavigateView('storefront');
                      onScrollToSection('catalog-section');
                    }}
                    className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-[#111315] rounded-sm font-medium transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {matchingSearchProducts.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchingSearchProducts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onOpenProduct(item);
                        setSearchOpen(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 border border-zinc-200 text-left transition-colors"
                    >
                      <div className="w-12 h-12 rounded bg-zinc-100 overflow-hidden shrink-0">
                        <ResilientImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#111315] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{item.category}</div>
                      </div>
                      <div className="font-mono text-xs font-bold tabular-nums text-[#111315] shrink-0">
                        {formatNaira(item.price)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {(['All', 'Audio', 'Power', 'Smart & Office', 'Personal & Home'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onNavigateView('storefront');
                    onSelectCategory(cat);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-md"
                >
                  {cat === 'All' ? 'All Products' : cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onNavigateView('track');
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-md"
              >
                Track Order
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
