import { useState, useEffect, type FormEvent } from 'react';
import {
  Package,
  Truck,
  Sliders,
  Plus,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ArrowLeft,
  Pencil,
  X,
  Database,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type {
  FulfillmentStage,
  Order,
  Product,
  ProductBadge,
  ProductCategory,
  ShippingConfig,
} from '../types';
import { formatNaira } from '../utils/format';
import { WaybillModal } from './WaybillModal';

interface AdminDashboardProps {
  products: Product[];
  shippingConfig: ShippingConfig;
  onProductsChanged: (products: Product[]) => void;
  onShippingConfigChanged: (config: ShippingConfig) => void;
  onBackToStore: () => void;
}

type AdminTab = 'catalog' | 'orders' | 'shipping' | 'database';

interface SupabaseAdminStatus {
  configured: boolean;
  mode: 'supabase' | 'local-fallback';
  projectHost: string | null;
  tablesReady: boolean;
  missingTables: string[];
  tableCounts?: Record<string, number>;
  lastError: string | null;
  schemaSql?: string;
}

const STAGES: FulfillmentStage[] = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'In Transit',
  'Delivered',
];

const BADGES: ProductBadge[] = [
  'Best Seller',
  'New Arrival',
  'Flash Sale',
  'Free Gift',
  'None',
];

export function AdminDashboard({
  products,
  shippingConfig,
  onProductsChanged,
  onShippingConfigChanged,
  onBackToStore,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'all' | 'paid' | 'cod' | 'verify'>('all');
  const [waybillOrder, setWaybillOrder] = useState<Order | null>(null);

  // Catalog editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newSkuModal, setNewSkuModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Audio');
  const [newPrice, setNewPrice] = useState(29000);
  const [newOriginalPrice, setNewOriginalPrice] = useState(36000);
  const [newBadge, setNewBadge] = useState<ProductBadge>('New Arrival');
  const [newColorName, setNewColorName] = useState('Obsidian Black');
  const [newColorHex, setNewColorHex] = useState('#18181B');
  const [newStock, setNewStock] = useState(30);

  // Shipping form state
  const [shipDraft, setShipDraft] = useState<ShippingConfig>(shippingConfig);
  const [shipSavedMsg, setShipSavedMsg] = useState<string | null>(null);

  // Supabase backend status state (non-secret status only)
  const [dbStatus, setDbStatus] = useState<SupabaseAdminStatus | null>(null);
  const [dbChecking, setDbChecking] = useState(false);
  const [dbFeedback, setDbFeedback] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const fetchDbStatus = async () => {
    setDbChecking(true);
    try {
      const res = await fetch('/api/admin/supabase-status');
      if (res.ok) {
        const data = (await res.json()) as SupabaseAdminStatus;
        setDbStatus(data);
      }
    } finally {
      setDbChecking(false);
    }
  };

  useEffect(() => {
    setShipDraft(shippingConfig);
  }, [shippingConfig]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
    fetchDbStatus();
  }, []);

  const updateOrder = async (
    orderId: string,
    patch: Partial<{
      currentStage: FulfillmentStage;
      highValueVerified: boolean;
      paymentStatus: Order['paymentStatus'];
      riderPhone: string;
    }>
  ) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = (await res.json()) as Order;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
  };

  const handleSaveProductEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const res = await fetch(`/api/products/${editingProduct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct),
    });
    if (res.ok) {
      const updated = (await res.json()) as Product;
      onProductsChanged(products.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(null);
    }
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        subtitle: newSubtitle || 'Official Hardware',
        category: newCategory,
        price: Number(newPrice),
        originalPrice: Number(newOriginalPrice),
        badge: newBadge,
        variants: [
          {
            id: `v-${Date.now()}`,
            name: newColorName,
            hex: newColorHex,
            sku: `JGD-${Date.now().toString().slice(-5)}`,
            stock: Number(newStock),
          },
        ],
      }),
    });
    if (res.ok) {
      const created = (await res.json()) as Product;
      onProductsChanged([created, ...products]);
      setNewSkuModal(false);
      setNewName('');
      setNewSubtitle('');
    }
  };

  const handleSaveShipping = async (e: FormEvent) => {
    e.preventDefault();
    setShipSavedMsg(null);
    const res = await fetch('/api/shipping-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shipDraft),
    });
    if (res.ok) {
      const updated = (await res.json()) as ShippingConfig;
      onShippingConfigChanged(updated);
      setShipSavedMsg('Shipping thresholds and regional delivery rates updated live.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'paid') return o.paymentStatus === 'Paid';
    if (orderFilter === 'cod') return o.paymentMethod === 'cod';
    if (orderFilter === 'verify')
      return o.requiresHighValueVerification && !o.highValueVerified;
    return true;
  });

  const paidRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingVerifyCount = orders.filter(
    (o) => o.requiresHighValueVerification && !o.highValueVerified
  ).length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FAFAFA] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-4 sm:p-5 shrink-0 space-y-6">
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-[#111315]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Storefront
          </button>
          <h1 className="font-display text-lg font-bold text-[#111315] mt-3">
            Operations Console
          </h1>
          <p className="text-xs text-zinc-500">Jogad Nigeria Operations</p>
        </div>

        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto" aria-label="Admin sections">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-[#111315] text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Orders & Logistics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-[#111315] text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalog & Variants</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'shipping'
                ? 'bg-[#111315] text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Shipping Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-[#111315] text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Backend</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px]">
        {dbStatus && (!dbStatus.configured || !dbStatus.tablesReady) && activeTab !== 'database' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
            <div>
              <div className="font-bold">
                {!dbStatus.configured
                  ? 'Supabase backend credentials not configured'
                  : dbStatus.lastError
                    ? `Cannot reach ${dbStatus.projectHost || 'Supabase project'} (local fallback active)`
                    : `Supabase tables not created yet (${dbStatus.missingTables.length} missing)`}
              </div>
              <div className="text-amber-800 mt-0.5">
                {!dbStatus.configured
                  ? 'Add SUPABASE_URL + SUPABASE_ANON_KEY (or SUPABASE_PROJECT_ID + SUPABASE_PUBLISHABLE_KEY) in Settings -> Secrets to save site data to Supabase.'
                  : dbStatus.lastError
                    ? dbStatus.lastError
                    : 'Run the SQL schema once in your Supabase SQL Editor so all orders, products, carts, and accounts save directly to Supabase.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className="px-3.5 py-2 bg-[#111315] text-white font-semibold rounded-md whitespace-nowrap"
            >
              Open Supabase Setup
            </button>
          </div>
        )}

        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-md p-4">
            <div className="text-xs text-zinc-500">Total Orders</div>
            <div className="font-mono text-2xl font-bold tabular-nums text-[#111315] mt-1">
              {orders.length}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-md p-4">
            <div className="text-xs text-zinc-500">Settled Prepaid Revenue</div>
            <div className="font-mono text-2xl font-bold tabular-nums text-[#111315] mt-1">
              {formatNaira(paidRevenue)}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-md p-4">
            <div className="text-xs text-zinc-500">High-Value Verification Queue</div>
            <div className="font-mono text-2xl font-bold tabular-nums text-amber-700 mt-1">
              {pendingVerifyCount}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-md p-4">
            <div className="text-xs text-zinc-500">Active Catalog SKUs</div>
            <div className="font-mono text-2xl font-bold tabular-nums text-[#111315] mt-1">
              {products.reduce((sum, p) => sum + p.variants.length, 0)}
            </div>
          </div>
        </div>

        {/* Tab 1: Orders & Logistics Center */}
        {activeTab === 'orders' && (
          <section className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-[#111315]">
                  Order & Logistics Center
                </h2>
                <p className="text-xs text-zinc-500">
                  Verify high-value orders (≥{formatNaira(shippingConfig.codMaxLimit)}), update
                  dispatch stages, and print waybills.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md text-xs">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'paid', label: 'Prepaid' },
                    { id: 'cod', label: 'COD' },
                    { id: 'verify', label: `Needs Verify (${pendingVerifyCount})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
                      orderFilter === f.id
                        ? 'bg-white text-[#111315] shadow-sm'
                        : 'text-zinc-600 hover:text-[#111315]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingOrders ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No orders match this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                      <th className="py-3 px-4 font-semibold">Order / Waybill</th>
                      <th className="py-3 px-4 font-semibold">Customer & Destination</th>
                      <th className="py-3 px-4 font-semibold">Payment</th>
                      <th className="py-3 px-4 font-semibold text-right">Total</th>
                      <th className="py-3 px-4 font-semibold">Dispatch Stage</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono font-bold text-[#111315] tabular-nums">
                            {o.id}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500 tabular-nums">
                            {o.waybillNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-[#111315]">
                            {o.customer.recipientName}
                          </div>
                          <div className="text-zinc-500">
                            {o.customer.city}, {o.customer.state}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500">
                            {o.customer.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top space-y-1">
                          <div className="font-semibold text-[#111315]">
                            {o.paymentStatus} · {o.paymentMethod.toUpperCase()}
                          </div>
                          {o.requiresHighValueVerification && (
                            <div
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                o.highValueVerified ? 'text-[#4D8A00]' : 'text-amber-700'
                              }`}
                            >
                              {o.highValueVerified ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {o.highValueVerified ? 'High-Value Verified' : 'Needs Verification'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top text-right font-mono font-bold tabular-nums">
                          {formatNaira(o.total)}
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <select
                            aria-label={`Update stage for ${o.id}`}
                            value={o.currentStage}
                            onChange={(e) =>
                              updateOrder(o.id, {
                                currentStage: e.target.value as FulfillmentStage,
                              })
                            }
                            className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded font-medium"
                          >
                            {STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 align-top text-right space-x-2 whitespace-nowrap">
                          {o.requiresHighValueVerification && !o.highValueVerified && (
                            <button
                              type="button"
                              onClick={() => updateOrder(o.id, { highValueVerified: true })}
                              className="px-2.5 py-1.5 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-bold rounded text-[11px]"
                            >
                              Verify Order
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setWaybillOrder(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-zinc-300 hover:border-[#111315] rounded font-semibold text-[11px]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Waybill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Catalog & Variants */}
        {activeTab === 'catalog' && (
          <section className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-[#111315]">
                  Catalog, Pricing & Variant Tools
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage active SKUs, color swatches, discount pricing, and promotional tags.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewSkuModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#82E600] hover:bg-[#73C900] text-[#111315] text-xs font-bold rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New SKU
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Promo Tag</th>
                    <th className="py-3 px-4 font-semibold">Color Variants</th>
                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Stock</th>
                    <th className="py-3 px-4 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                    return (
                      <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                        <td className="py-3 px-4 font-semibold text-[#111315]">{p.name}</td>
                        <td className="py-3 px-4 text-zinc-600">{p.category}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#111315]">{p.badge}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {p.variants.map((v) => (
                              <span
                                key={v.sku}
                                title={`${v.name} (${v.stock})`}
                                className="w-3.5 h-3.5 rounded-full border border-zinc-300 inline-block"
                                style={{ backgroundColor: v.hex }}
                              />
                            ))}
                            <span className="text-zinc-500 font-mono text-[11px] ml-1">
                              {p.variants.length}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <div className="font-bold text-[#111315]">{formatNaira(p.price)}</div>
                          <div className="text-[11px] text-zinc-400 line-through">
                            {formatNaira(p.originalPrice)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                          {totalStock}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(JSON.parse(JSON.stringify(p)))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-zinc-300 hover:border-[#111315] rounded font-semibold text-[11px]"
                          >
                            <Pencil className="w-3 h-3" />
                            Configure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 3: Shipping Configurations */}
        {activeTab === 'shipping' && (
          <section className="bg-white border border-zinc-200 rounded-md p-6">
            <form onSubmit={handleSaveShipping} className="space-y-6">
              <div className="border-b border-zinc-200 pb-4">
                <h2 className="font-display font-bold text-base text-[#111315]">
                  Shipping Thresholds & COD Guardrail Configuration
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Updates take effect immediately across Announcement Bar, Cart Progress Tracker, and Checkout.
                </p>
              </div>

              {shipSavedMsg && (
                <div className="p-3 bg-[#82E600]/15 border border-[#82E600] rounded-md text-xs font-medium text-[#111315]">
                  {shipSavedMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111315] mb-1.5">
                    Free Shipping Trigger (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={shipDraft.freeShippingThreshold}
                    onChange={(e) =>
                      setShipDraft({
                        ...shipDraft,
                        freeShippingThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono border border-zinc-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111315] mb-1.5">
                    Mandatory Prepayment Threshold / COD Limit (₦)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={5000}
                    value={shipDraft.codMaxLimit}
                    onChange={(e) =>
                      setShipDraft({
                        ...shipDraft,
                        codMaxLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono border border-zinc-300 rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Regional Flat-Rate Delivery Zones
                </div>
                <div className="space-y-2.5">
                  {shipDraft.regionalRules.map((rule, idx) => (
                    <div
                      key={rule.zoneId}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 border border-zinc-200 rounded-md"
                    >
                      <div className="sm:col-span-5">
                        <div className="text-xs font-bold text-[#111315]">{rule.zoneName}</div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {rule.states.join(', ')}
                        </div>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-zinc-500 mb-0.5">ETA</label>
                        <input
                          type="text"
                          value={rule.etaDays}
                          onChange={(e) => {
                            const updated = [...shipDraft.regionalRules];
                            updated[idx] = { ...rule, etaDays: e.target.value };
                            setShipDraft({ ...shipDraft, regionalRules: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-zinc-500 mb-0.5">
                          Flat Rate (₦)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={rule.flatRate}
                          onChange={(e) => {
                            const updated = [...shipDraft.regionalRules];
                            updated[idx] = { ...rule, flatRate: Number(e.target.value) };
                            setShipDraft({ ...shipDraft, regionalRules: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-mono border border-zinc-300 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-xs font-bold rounded-md transition-colors"
                >
                  Save Shipping Configuration
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Tab 4: Supabase Backend & Schema Readiness */}
        {activeTab === 'database' && (
          <section className="bg-white border border-zinc-200 rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-[#111315]">
                  Supabase PostgreSQL Backend
                </h2>
                <p className="text-xs text-zinc-500">
                  Server-side persistence using your configured Supabase project secrets.
                </p>
              </div>
              <button
                type="button"
                disabled={dbChecking}
                onClick={async () => {
                  setDbChecking(true);
                  setDbFeedback(null);
                  try {
                    const res = await fetch('/api/admin/supabase-sync', { method: 'POST' });
                    const data = (await res.json()) as SupabaseAdminStatus & { error?: string };
                    setDbStatus((prev) => ({ ...(prev || {}), ...data }));
                    if (res.ok && data.tablesReady) {
                      setDbFeedback('Supabase connected and seed catalog synchronized.');
                      const bootRes = await fetch('/api/bootstrap');
                      if (bootRes.ok) {
                        const bootData = (await bootRes.json()) as {
                          products?: Product[];
                          shippingConfig?: ShippingConfig;
                        };
                        if (Array.isArray(bootData.products)) {
                          onProductsChanged(bootData.products);
                        }
                        if (bootData.shippingConfig) {
                          onShippingConfigChanged(bootData.shippingConfig);
                        }
                      }
                      const ordersRes = await fetch('/api/orders');
                      if (ordersRes.ok) {
                        setOrders(await ordersRes.json());
                      }
                    } else {
                      setDbFeedback(
                        data.error || 'Supabase tables are not ready yet. Run the SQL schema below.'
                      );
                    }
                  } finally {
                    setDbChecking(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#82E600] hover:bg-[#73C900] text-[#111315] text-xs font-bold rounded-md transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dbChecking ? 'animate-spin' : ''}`} />
                <span>{dbChecking ? 'Checking...' : 'Verify & Sync Supabase'}</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-zinc-200 rounded-md bg-[#FAFAFA]">
                  <div className="text-zinc-500">Server Credentials</div>
                  <div className="font-display font-bold text-sm text-[#111315] mt-1">
                    {dbStatus?.configured ? 'Configured in ENV' : 'Awaiting ENV Secrets'}
                  </div>
                </div>
                <div className="p-4 border border-zinc-200 rounded-md bg-[#FAFAFA]">
                  <div className="text-zinc-500">Active Storage Mode</div>
                  <div className="font-display font-bold text-sm text-[#111315] mt-1">
                    {dbStatus?.mode === 'supabase' ? 'Supabase Live' : 'Local Fallback Store'}
                  </div>
                </div>
                <div className="p-4 border border-zinc-200 rounded-md bg-[#FAFAFA]">
                  <div className="text-zinc-500">Supabase Project Host</div>
                  <div className="font-mono text-xs font-semibold text-[#111315] mt-1 truncate">
                    {dbStatus?.projectHost || 'Not configured'}
                  </div>
                </div>
              </div>

              {dbStatus?.tablesReady && dbStatus.tableCounts && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Live Supabase Tables Synced
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(dbStatus.tableCounts).map(([tableName, count]) => (
                      <div
                        key={tableName}
                        className="p-3 border border-zinc-200 rounded-md bg-white"
                      >
                        <div className="font-mono text-[11px] text-zinc-500 truncate">
                          {tableName}
                        </div>
                        <div className="font-mono text-lg font-bold tabular-nums text-[#111315] mt-0.5">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dbFeedback && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md font-medium text-[#111315]">
                  {dbFeedback}
                </div>
              )}

              {dbStatus && !dbStatus.configured && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-900 space-y-1.5">
                  <div className="font-bold">Set Server Secrets in AI Studio</div>
                  <p>
                    Open Settings → Secrets and add <span className="font-mono">SUPABASE_URL</span>{' '}
                    and <span className="font-mono">SUPABASE_ANON_KEY</span> (plus optional{' '}
                    <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>), then restart the
                    dev server.
                  </p>
                </div>
              )}

              {dbStatus?.lastError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-900 space-y-1.5">
                  <div className="font-bold">
                    Could not reach {dbStatus.projectHost || 'Supabase project'}
                  </div>
                  <p>
                    Check that your project is active (not paused) and that{' '}
                    <span className="font-mono">SUPABASE_URL</span> /{' '}
                    <span className="font-mono">SUPABASE_PROJECT_ID</span> and{' '}
                    <span className="font-mono">SUPABASE_PUBLISHABLE_KEY</span> /{' '}
                    <span className="font-mono">SUPABASE_ANON_KEY</span> in AI Studio Settings →
                    Secrets match your active Supabase project, then restart the server.
                  </p>
                </div>
              )}

              {dbStatus && dbStatus.configured && dbStatus.missingTables.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-900 space-y-2">
                  <div className="font-bold">
                    Missing Supabase Tables: {dbStatus.missingTables.join(', ')}
                  </div>
                  <p>
                    Copy the PostgreSQL schema below, run it once in your Supabase Dashboard → SQL
                    Editor, and click <strong>Verify & Sync Supabase</strong> above.
                  </p>
                  {dbStatus.projectHost && dbStatus.projectHost.endsWith('.supabase.co') && (
                    <a
                      href={`https://supabase.com/dashboard/project/${dbStatus.projectHost.split('.')[0]}/sql/new`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111315] text-white font-semibold rounded-md hover:bg-zinc-800 transition-colors"
                    >
                      <span>Open Supabase SQL Editor</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {dbStatus?.schemaSql && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111315]">
                      PostgreSQL Schema (supabase/schema.sql)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (dbStatus.schemaSql && navigator.clipboard) {
                          navigator.clipboard.writeText(dbStatus.schemaSql).catch(() => {});
                          setSqlCopied(true);
                          window.setTimeout(() => setSqlCopied(false), 1800);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 hover:border-[#111315] rounded-md font-semibold text-xs"
                    >
                      {sqlCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4D8A00]" />
                          <span>Copied SQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#111315] text-zinc-200 rounded-md overflow-x-auto max-h-72 font-mono text-[11px] leading-relaxed">
                    {dbStatus.schemaSql}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-lg border border-zinc-200 shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#111315]">
                Configure SKU · {editingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-zinc-500 hover:text-[#111315]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProductEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Active Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Original Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.originalPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Promotional Badge</label>
                <select
                  value={editingProduct.badge}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      badge: e.target.value as ProductBadge,
                    })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white"
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">Color Swatches & Stock</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        variants: [
                          ...editingProduct.variants,
                          {
                            id: `v-${Date.now()}`,
                            name: 'Volt Green',
                            hex: '#73C900',
                            sku: `KT-${Date.now().toString().slice(-4)}`,
                            stock: 20,
                          },
                        ],
                      })
                    }
                    className="text-[#4D8A00] font-semibold hover:underline"
                  >
                    + Add Color Option
                  </button>
                </div>
                {editingProduct.variants.map((v, idx) => (
                  <div key={v.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="color"
                      value={v.hex}
                      onChange={(e) => {
                        const vars = [...editingProduct.variants];
                        vars[idx] = { ...v, hex: e.target.value };
                        setEditingProduct({ ...editingProduct, variants: vars });
                      }}
                      className="col-span-2 h-8 w-full rounded border border-zinc-300"
                    />
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const vars = [...editingProduct.variants];
                        vars[idx] = { ...v, name: e.target.value };
                        setEditingProduct({ ...editingProduct, variants: vars });
                      }}
                      className="col-span-6 px-2.5 py-1.5 border border-zinc-300 rounded"
                    />
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => {
                        const vars = [...editingProduct.variants];
                        vars[idx] = { ...v, stock: Number(e.target.value) };
                        setEditingProduct({ ...editingProduct, variants: vars });
                      }}
                      className="col-span-4 px-2.5 py-1.5 font-mono border border-zinc-300 rounded"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-zinc-300 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#82E600] text-[#111315] rounded-md font-bold"
                >
                  Save SKU Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New SKU Modal */}
      {newSkuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-lg border border-zinc-200 shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#111315]">Add New Catalog SKU</h3>
              <button
                type="button"
                onClick={() => setNewSkuModal(false)}
                className="p-1 text-zinc-500 hover:text-[#111315]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. KoraBuds Air 3"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Lightweight Wireless Earbuds"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white"
                  >
                    <option value="Audio">Audio</option>
                    <option value="Power">Power</option>
                    <option value="Smart & Office">Smart & Office</option>
                    <option value="Personal & Home">Personal & Home</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Badge</label>
                  <select
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value as ProductBadge)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md bg-white"
                  >
                    {BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Original Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Swatch</label>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-9 w-full rounded border border-zinc-300"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block font-semibold mb-1">Color Name</label>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min={1}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono border border-zinc-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewSkuModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#82E600] text-[#111315] rounded-md font-bold"
                >
                  Create SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {waybillOrder && (
        <WaybillModal order={waybillOrder} onClose={() => setWaybillOrder(null)} />
      )}
    </div>
  );
}
