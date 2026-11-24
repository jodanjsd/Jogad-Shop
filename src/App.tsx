import { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_SHIPPING_CONFIG,
} from './data/seedData';
import type {
  CustomerAccount,
  HeroSlide,
  Order,
  Product,
  ProductCategory,
  ProductCollectionTab,
  ProductOccasion,
  ProductVariant,
  ShippingConfig,
} from './types';
import { Header, type ActiveView } from './components/Header';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryVisualGrid } from './components/CategoryVisualGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer, type CartItem } from './components/CartDrawer';
import { AccountModal } from './components/AccountModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AdminDashboard } from './components/AdminDashboard';
import { TrustAndFooter } from './components/TrustAndFooter';
import { CollectionSlideShelf } from './components/CollectionSlideShelf';
import { CustomerVideoGallery } from './components/CustomerVideoGallery';

const COLLECTION_TABS: ProductCollectionTab[] = [
  'Best Sellers',
  'New Arrivals',
  'Flash Sales',
  'All Products',
];

const OCCASION_FILTERS: Array<ProductOccasion | 'All'> = [
  'All',
  'Best Sellers',
  'Content Creation',
  'Gaming',
  'Travel & Commute',
];

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(INITIAL_SHIPPING_CONFIG);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);

  const [activeView, setActiveView] = useState<ActiveView>('storefront');
  const [activeTab, setActiveTab] = useState<ProductCollectionTab>('Best Sellers');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<ProductOccasion | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Cart & Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartKey] = useState<string>(() => {
    try {
      const existing = window.localStorage.getItem('jogad_cart_key');
      if (existing) return existing;
      const created = `cart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem('jogad_cart_key', created);
      return created;
    } catch {
      return `cart-${Date.now().toString(36)}`;
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<{
    product: Product;
    variant?: ProductVariant;
  } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        const [bootRes, cartRes] = await Promise.all([
          fetch('/api/bootstrap'),
          fetch(`/api/cart/${encodeURIComponent(cartKey)}`),
        ]);
        if (bootRes.ok) {
          const data = (await bootRes.json()) as {
            products: Product[];
            shippingConfig: ShippingConfig;
          };
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
          if (data.shippingConfig) {
            setShippingConfig(data.shippingConfig);
          }
        }
        if (cartRes.ok) {
          const cartData = (await cartRes.json()) as { items?: CartItem[] };
          if (Array.isArray(cartData.items) && cartData.items.length > 0) {
            setCart(cartData.items);
          }
        }
      } catch {
        // Initial seed fallback remains active
      } finally {
        setLoadingBootstrap(false);
        setCartHydrated(true);
      }
    };
    loadBootstrap();
  }, [cartKey]);

  useEffect(() => {
    if (!cartHydrated) return;
    fetch(`/api/cart/${encodeURIComponent(cartKey)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        accountId: account?.id ?? null,
      }),
    }).catch(() => {});
  }, [cart, cartHydrated, cartKey, account?.id]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectCategory = (category: ProductCategory | 'All', subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || null);
    setSelectedOccasion('All');
    if (category !== 'All' || subcategory) {
      setActiveTab('All Products');
    }
    setTimeout(() => scrollToSection('catalog-section'), 40);
  };

  const handleSelectOccasion = (occasion: ProductOccasion) => {
    setSelectedOccasion(occasion);
    setSelectedCategory('All');
    setSelectedSubcategory(null);
    setActiveTab('All Products');
    setTimeout(() => scrollToSection('catalog-section'), 40);
  };

  const handleHeroAction = (slide: HeroSlide) => {
    setActiveTab(slide.targetTab);
    setSelectedCategory(slide.targetCategory || 'All');
    setSelectedSubcategory(null);
    setSelectedOccasion('All');
    setTimeout(() => scrollToSection('catalog-section'), 40);
  };

  const handleAddToCart = (
    product: Product,
    variant: ProductVariant,
    qty = 1,
    openDrawer = false
  ) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variant.sku === variant.sku);
      if (existing) {
        return prev.map((item) =>
          item.variant.sku === variant.sku
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, variant, quantity: qty }];
    });
    if (openDrawer) {
      setCartOpen(true);
    }
  };

  const handleUpdateQty = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.variant.sku === sku
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.variant.sku !== sku));
  };

  const handleOrderCreated = (order: Order) => {
    setCart([]);
    setTrackedOrder(order);
    // Refresh catalog stock from backend
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    } else if (activeTab !== 'All Products') {
      list = list.filter((p) => p.collections.includes(activeTab));
    }

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedSubcategory) {
      list = list.filter((p) => p.subcategory === selectedSubcategory);
    }
    if (selectedOccasion !== 'All') {
      list = list.filter((p) => p.occasions.includes(selectedOccasion));
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [
    products,
    searchQuery,
    activeTab,
    selectedCategory,
    selectedSubcategory,
    selectedOccasion,
    sortBy,
  ]);

  const bestSellingProducts = useMemo(
    () => products.filter((p) => p.collections.includes('Best Sellers')),
    [products]
  );

  const newStockProducts = useMemo(
    () => products.filter((p) => p.collections.includes('New Arrivals')),
    [products]
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#111315]">
      <Header
        activeView={activeView}
        onNavigateView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={handleSelectCategory}
        onSelectOccasion={handleSelectOccasion}
        onOpenProduct={(product) =>
          setDetailModal({ product, variant: product.variants[0] })
        }
        onOpenCart={() => setCartOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onScrollToSection={scrollToSection}
        cartCount={cartCount}
        account={account}
        products={products}
        shippingConfig={shippingConfig}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {activeView === 'storefront' && (
        <main className="flex-1">
          {/* 1. Hero Promotional Banner */}
          <HeroCarousel onSelectHeroAction={handleHeroAction} />

          {/* 2. Quick Category Visual Grid */}
          <CategoryVisualGrid
            products={products}
            activeCategory={selectedCategory}
            onSelectCategory={(cat) => handleSelectCategory(cat)}
          />

          {/* 3. Best Selling Product Slide */}
          <CollectionSlideShelf
            id="best-selling-slide"
            eyebrow="Top Customer Picks"
            title="Best Selling Slide"
            subtitle="Most reordered power banks, ANC headphones, laptops, and smartwatches."
            products={bestSellingProducts}
            ctaLabel="View All Best Sellers"
            onViewAll={() => {
              setSelectedCategory('All');
              setSelectedSubcategory(null);
              setSelectedOccasion('All');
              setSearchQuery('');
              setActiveTab('Best Sellers');
              setTimeout(() => scrollToSection('catalog-section'), 40);
            }}
            onLearnMore={(p, variant) => setDetailModal({ product: p, variant })}
            onAddToCart={(p, variant) => handleAddToCart(p, variant, 1, false)}
          />

          {/* 4. New Stock Product Slide */}
          <CollectionSlideShelf
            id="new-stock-slide"
            eyebrow="Fresh 2026 Arrivals"
            title="New Stock Slide"
            subtitle="Newly landed creator kits, AI earbuds, portable displays, and fast chargers."
            products={newStockProducts}
            ctaLabel="View All New Stock"
            onViewAll={() => {
              setSelectedCategory('All');
              setSelectedSubcategory(null);
              setSelectedOccasion('All');
              setSearchQuery('');
              setActiveTab('New Arrivals');
              setTimeout(() => scrollToSection('catalog-section'), 40);
            }}
            onLearnMore={(p, variant) => setDetailModal({ product: p, variant })}
            onAddToCart={(p, variant) => handleAddToCart(p, variant, 1, false)}
          />

          {/* 5. Jogad 5-Video Customer Product Use Gallery */}
          <CustomerVideoGallery
            products={products}
            onLearnMore={(p, variant) => setDetailModal({ product: p, variant })}
            onAddToCart={(p, variant) => handleAddToCart(p, variant, 1, false)}
          />

          {/* 6. Tabbed Product Carousels & Filterable Grid */}
          <section
            id="catalog-section"
            className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-10 pb-6"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#111315]">
                  Featured Gear & Deals
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Switch collections or filter by occasion. All prices include Nigerian VAT.
                </p>
              </div>

              {/* Switchable Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md overflow-x-auto">
                {COLLECTION_TABS.map((tab) => {
                  const active = activeTab === tab && !searchQuery.trim();
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                        setSearchQuery('');
                      }}
                      className={`px-3.5 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white text-[#111315] shadow-sm'
                          : 'text-zinc-600 hover:text-[#111315]'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filter Bar */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Occasion:</span>
                {OCCASION_FILTERS.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => {
                      setSelectedOccasion(occ);
                      if (occ !== 'All') setActiveTab('All Products');
                    }}
                    className={`px-3 py-1.5 rounded-md border transition-colors whitespace-nowrap ${
                      selectedOccasion === occ
                        ? 'bg-[#111315] text-white border-[#111315]'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {occ === 'All' ? 'All Occasions' : occ}
                  </button>
                ))}

                {(selectedCategory !== 'All' || selectedSubcategory || searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory(null);
                      setSelectedOccasion('All');
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-[#4D8A00] hover:underline"
                  >
                    Reset Filters ({selectedSubcategory || selectedCategory || searchQuery})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono tabular-nums text-zinc-500">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </span>
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'rating')
                  }
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-medium focus:outline-none focus:border-[#111315]"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loadingBootstrap ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white border border-zinc-200 rounded-md h-96 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-md p-12 text-center space-y-3">
                <div className="font-display font-bold text-base text-[#111315]">
                  No matching gadgets found
                </div>
                <p className="text-xs text-zinc-500">
                  Try clearing your category, occasion, or search filters to view all products.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSubcategory(null);
                    setSelectedOccasion('All');
                    setSearchQuery('');
                    setActiveTab('All Products');
                  }}
                  className="px-4 py-2 bg-[#111315] text-white text-xs font-semibold rounded-md"
                >
                  Show All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onLearnMore={(p, variant) => setDetailModal({ product: p, variant })}
                    onAddToCart={(p, variant) => handleAddToCart(p, variant, 1, false)}
                  />
                ))}
              </div>
            )}
          </section>

          <TrustAndFooter
            shippingConfig={shippingConfig}
            onNavigateView={setActiveView}
            onSelectCategory={(cat) => handleSelectCategory(cat)}
          />
        </main>
      )}

      {activeView === 'track' && (
        <div className="flex-1 flex flex-col justify-between">
          <OrderTrackingView
            initialOrder={trackedOrder}
            onBackToStore={() => setActiveView('storefront')}
          />
          <TrustAndFooter
            shippingConfig={shippingConfig}
            onNavigateView={setActiveView}
            onSelectCategory={(cat) => handleSelectCategory(cat)}
          />
        </div>
      )}

      {activeView === 'admin' && (
        <AdminDashboard
          products={products}
          shippingConfig={shippingConfig}
          onProductsChanged={setProducts}
          onShippingConfigChanged={setShippingConfig}
          onBackToStore={() => setActiveView('storefront')}
        />
      )}

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        shippingConfig={shippingConfig}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Product Detail Modal */}
      {detailModal && (
        <ProductDetailModal
          product={detailModal.product}
          initialVariant={detailModal.variant}
          shippingConfig={shippingConfig}
          onClose={() => setDetailModal(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Account & Saved Addresses Modal */}
      {accountOpen && (
        <AccountModal
          account={account}
          onClose={() => setAccountOpen(false)}
          onAccountUpdated={setAccount}
        />
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          items={cart}
          shippingConfig={shippingConfig}
          account={account}
          onClose={() => setCheckoutOpen(false)}
          onOrderCreated={handleOrderCreated}
          onOpenAccount={() => {
            setCheckoutOpen(false);
            setAccountOpen(true);
          }}
          onTrackOrder={(order) => {
            setTrackedOrder(order);
            setCheckoutOpen(false);
            setActiveView('track');
          }}
        />
      )}
    </div>
  );
}
