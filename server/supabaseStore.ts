import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  CustomerAccount,
  DeliveryAddress,
  Order,
  Product,
  ProductVariant,
  ShippingConfig,
} from '../src/types.ts';

export interface SavedCartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface SupabaseStatus {
  configured: boolean;
  mode: 'supabase' | 'local-fallback';
  projectHost: string | null;
  tablesReady: boolean;
  missingTables: string[];
  tableCounts: Record<string, number>;
  lastError: string | null;
}

const REQUIRED_TABLES = [
  'products',
  'shipping_config',
  'orders',
  'customer_accounts',
  'newsletter_subscribers',
] as const;

const OPTIONAL_TABLES = ['carts'] as const;

function normalizeSupabaseUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

interface ProductRow {
  id: string;
  name: string;
  subtitle: string;
  category: Product['category'];
  subcategory: string;
  occasions: Product['occasions'];
  badge: Product['badge'];
  gift_note: string | null;
  price: number;
  original_price: number;
  rating: number;
  review_count: number;
  image: string;
  features: [string, string];
  specs: Product['specs'];
  description: string;
  warranty_months: number;
  variants: Product['variants'];
  collections: Product['collections'];
}

interface ShippingConfigRow {
  id: string;
  free_shipping_threshold: number;
  cod_max_limit: number;
  announcement_enabled: boolean;
  regional_rules: ShippingConfig['regionalRules'];
}

interface OrderRow {
  id: string;
  waybill_number: string;
  created_at: string;
  customer: DeliveryAddress;
  items: Order['items'];
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: Order['paymentMethod'];
  payment_status: Order['paymentStatus'];
  payment_reference: string | null;
  high_value_verified: boolean;
  requires_high_value_verification: boolean;
  current_stage: Order['currentStage'];
  courier_name: string;
  rider_phone: string | null;
  milestones: Order['milestones'];
}

interface CustomerAccountRow {
  id: string;
  contact: string;
  name: string;
  email: string;
  phone: string;
  addresses: DeliveryAddress[];
}

interface CartRow {
  cart_key: string;
  account_id: string | null;
  items: SavedCartItem[];
  updated_at: string;
}

function toProductRow(p: Product): ProductRow {
  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    subcategory: p.subcategory,
    occasions: p.occasions,
    badge: p.badge,
    gift_note: p.giftNote ?? null,
    price: p.price,
    original_price: p.originalPrice,
    rating: p.rating,
    review_count: p.reviewCount,
    image: p.image,
    features: p.features,
    specs: p.specs,
    description: p.description,
    warranty_months: p.warrantyMonths,
    variants: p.variants,
    collections: p.collections,
  };
}

function fromProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    category: row.category,
    subcategory: row.subcategory,
    occasions: row.occasions || [],
    badge: row.badge || 'None',
    giftNote: row.gift_note ?? undefined,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    image: row.image,
    features: row.features,
    specs: row.specs || [],
    description: row.description,
    warrantyMonths: Number(row.warranty_months),
    variants: row.variants || [],
    collections: row.collections || [],
  };
}

function toShippingRow(cfg: ShippingConfig): ShippingConfigRow {
  return {
    id: 'default',
    free_shipping_threshold: cfg.freeShippingThreshold,
    cod_max_limit: cfg.codMaxLimit,
    announcement_enabled: cfg.announcementEnabled,
    regional_rules: cfg.regionalRules,
  };
}

function fromShippingRow(row: ShippingConfigRow): ShippingConfig {
  return {
    freeShippingThreshold: Number(row.free_shipping_threshold),
    codMaxLimit: Number(row.cod_max_limit),
    announcementEnabled: Boolean(row.announcement_enabled),
    regionalRules: row.regional_rules || [],
  };
}

function toOrderRow(o: Order): OrderRow {
  return {
    id: o.id,
    waybill_number: o.waybillNumber,
    created_at: o.createdAt,
    customer: o.customer,
    items: o.items,
    subtotal: o.subtotal,
    shipping_fee: o.shippingFee,
    total: o.total,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    payment_reference: o.paymentReference ?? null,
    high_value_verified: o.highValueVerified,
    requires_high_value_verification: o.requiresHighValueVerification,
    current_stage: o.currentStage,
    courier_name: o.courierName,
    rider_phone: o.riderPhone ?? null,
    milestones: o.milestones,
  };
}

function fromOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    waybillNumber: row.waybill_number,
    createdAt: row.created_at,
    customer: row.customer,
    items: row.items || [],
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference ?? undefined,
    highValueVerified: Boolean(row.high_value_verified),
    requiresHighValueVerification: Boolean(row.requires_high_value_verification),
    currentStage: row.current_stage,
    courierName: row.courier_name,
    riderPhone: row.rider_phone ?? undefined,
    milestones: row.milestones || [],
  };
}

function toAccountRow(acc: CustomerAccount): CustomerAccountRow {
  return {
    id: acc.id,
    contact: acc.contact,
    name: acc.name,
    email: acc.email,
    phone: acc.phone,
    addresses: acc.addresses,
  };
}

function fromAccountRow(row: CustomerAccountRow): CustomerAccount {
  return {
    id: row.id,
    contact: row.contact,
    name: row.name,
    email: row.email,
    phone: row.phone,
    addresses: row.addresses || [],
  };
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    Boolean(error.message && error.message.toLowerCase().includes('schema cache')) ||
    Boolean(error.message && error.message.toLowerCase().includes('does not exist'))
  );
}

function isNetworkErrorMessage(message?: string | null): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('fetch failed') ||
    lower.includes('unreachable') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('aborted') ||
    lower.includes('network')
  );
}

interface SupabaseCandidate {
  url: string;
  host: string;
  key: string;
}

const UNREACHABLE_COOLDOWN_MS = 45_000;

export class SupabaseStore {
  private candidates: SupabaseCandidate[] = [];
  private activeCandidateIndex = 0;
  private client: SupabaseClient | null = null;
  private projectHost: string | null = null;
  private tablesReady = false;
  private cartsTableReady = false;
  private missingTables: string[] = [];
  private tableCounts: Record<string, number> = {};
  private lastError: string | null = null;
  private lastFailedProbeAt = 0;
  private inFlightProbe: Promise<SupabaseStatus> | null = null;

  constructor() {
    const rawUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
    const projectId = (process.env.SUPABASE_PROJECT_ID || '').trim();
    const projectUrl = projectId ? normalizeSupabaseUrl(`https://${projectId}.supabase.co`) : null;

    const serviceKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      ''
    ).trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    const publishableKey = (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

    const seen = new Set<string>();
    const addCandidate = (url: string | null, preferredKey: string, fallbackKey: string) => {
      if (!url) return;
      const key = serviceKey || preferredKey || fallbackKey;
      if (!key) return;
      const host = new URL(url).host;
      const sig = `${host}::${key}`;
      if (seen.has(sig)) return;
      seen.add(sig);
      this.candidates.push({ url, host, key });
    };

    // Prefer SUPABASE_URL + ANON_KEY first, and also register SUPABASE_PROJECT_ID + PUBLISHABLE_KEY
    // as an automatic candidate if both sets exist in Secrets so stale URLs fail over cleanly.
    addCandidate(rawUrl, anonKey, publishableKey);
    addCandidate(projectUrl, publishableKey, anonKey);

    if (this.candidates.length > 0) {
      this.activateCandidate(0);
    }
  }

  private activateCandidate(index: number): void {
    const candidate = this.candidates[index];
    if (!candidate) return;
    this.activeCandidateIndex = index;
    this.projectHost = candidate.host;
    this.client = createClient(candidate.url, candidate.key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal ?? AbortSignal.timeout(3000),
          }),
      },
    });
  }

  public isConfigured(): boolean {
    return this.candidates.length > 0 && Boolean(this.client);
  }

  public isActive(): boolean {
    return Boolean(this.client && this.tablesReady);
  }

  public isCartTableReady(): boolean {
    return Boolean(this.client && this.cartsTableReady);
  }

  public getStatus(): SupabaseStatus {
    return {
      configured: this.isConfigured(),
      mode: this.isActive() ? 'supabase' : 'local-fallback',
      projectHost: this.projectHost,
      tablesReady: this.tablesReady,
      missingTables: this.missingTables,
      tableCounts: this.tableCounts,
      lastError: this.lastError,
    };
  }

  public async probeAndInitialize(
    seed: {
      products: Product[];
      shippingConfig: ShippingConfig;
      orders: Order[];
      accounts: CustomerAccount[];
    },
    options?: { force?: boolean }
  ): Promise<SupabaseStatus> {
    if (!this.isConfigured()) {
      this.tablesReady = false;
      this.cartsTableReady = false;
      this.missingTables = [];
      this.tableCounts = {};
      this.lastError = null;
      return this.getStatus();
    }

    // Deduplicate concurrent probes
    if (this.inFlightProbe) {
      return this.inFlightProbe;
    }

    // For non-forced probes (e.g. page bootstrap), avoid re-hitting an unreachable host on every request
    if (
      !options?.force &&
      this.lastError &&
      this.lastFailedProbeAt > 0 &&
      Date.now() - this.lastFailedProbeAt < UNREACHABLE_COOLDOWN_MS
    ) {
      return this.getStatus();
    }

    this.inFlightProbe = this.runProbeSequence(seed).finally(() => {
      this.inFlightProbe = null;
    });
    return this.inFlightProbe;
  }

  private async runProbeSequence(seed: {
    products: Product[];
    shippingConfig: ShippingConfig;
    orders: Order[];
    accounts: CustomerAccount[];
  }): Promise<SupabaseStatus> {
    // Try active candidate first, then any remaining candidates if a network error occurs
    const order = [
      this.activeCandidateIndex,
      ...this.candidates.map((_, idx) => idx).filter((idx) => idx !== this.activeCandidateIndex),
    ];

    for (const idx of order) {
      this.activateCandidate(idx);
      const status = await this.probeCurrentCandidate(seed);
      if (!status.lastError || !isNetworkErrorMessage(status.lastError)) {
        this.lastFailedProbeAt = 0;
        return status;
      }
    }

    this.lastFailedProbeAt = Date.now();
    return this.getStatus();
  }

  private async probeCurrentCandidate(seed: {
    products: Product[];
    shippingConfig: ShippingConfig;
    orders: Order[];
    accounts: CustomerAccount[];
  }): Promise<SupabaseStatus> {
    const client = this.client;
    if (!client) return this.getStatus();

    const missing: string[] = [];
    const counts: Record<string, number> = {};
    let unexpectedError: string | null = null;

    // Fast reachability check on the first table before fanning out to remaining tables.
    // Never use { head: true } because PostgREST returns empty bodies on HEAD, hiding PGRST205.
    const firstTable = REQUIRED_TABLES[0];
    let firstRes: { error: { code?: string; message?: string } | null; count: number | null };
    try {
      const { error, count } = await client
        .from(firstTable)
        .select('*', { count: 'exact' })
        .limit(1);
      firstRes = { error, count };
    } catch (err) {
      firstRes = { error: { message: (err as Error).message }, count: null };
    }

    if (firstRes.error && isNetworkErrorMessage(firstRes.error.message)) {
      this.tablesReady = false;
      this.cartsTableReady = false;
      this.missingTables = [];
      this.tableCounts = {};
      this.lastError = `Supabase project host (${this.projectHost}) is unreachable. Check SUPABASE_URL or SUPABASE_PROJECT_ID in Settings -> Secrets.`;
      return this.getStatus();
    }

    if (firstRes.error) {
      if (isMissingTableError(firstRes.error)) {
        missing.push(firstTable);
      } else {
        unexpectedError = firstRes.error.message || 'Unable to reach Supabase project';
      }
    } else {
      counts[firstTable] = firstRes.count ?? 0;
    }

    // Probe remaining required and optional tables in one parallel batch
    const remainingRequired = REQUIRED_TABLES.slice(1);
    const [reqResults, optResults] = await Promise.all([
      Promise.all(
        remainingRequired.map(async (table) => {
          try {
            const { error, count } = await client
              .from(table)
              .select('*', { count: 'exact' })
              .limit(1);
            return { table, error, count };
          } catch (err) {
            return { table, error: { message: (err as Error).message }, count: null };
          }
        })
      ),
      Promise.all(
        OPTIONAL_TABLES.map(async (optTable) => {
          try {
            const { error, count } = await client
              .from(optTable)
              .select('*', { count: 'exact' })
              .limit(1);
            return { optTable, error, count };
          } catch (err) {
            return { optTable, error: { message: (err as Error).message }, count: null };
          }
        })
      ),
    ]);

    for (const res of reqResults) {
      if (res.error) {
        if (isMissingTableError(res.error)) {
          missing.push(res.table);
        } else {
          unexpectedError = isNetworkErrorMessage(res.error.message)
            ? `Supabase project host (${this.projectHost}) is unreachable. Check SUPABASE_URL or SUPABASE_PROJECT_ID in Settings -> Secrets.`
            : res.error.message || 'Unable to reach Supabase project';
        }
      } else {
        counts[res.table] = res.count ?? 0;
      }
    }

    for (const res of optResults) {
      if (res.error) {
        if (res.optTable === 'carts') {
          this.cartsTableReady = false;
          if (isMissingTableError(res.error)) {
            missing.push(res.optTable);
          }
        }
      } else {
        if (res.optTable === 'carts') {
          this.cartsTableReady = true;
        }
        counts[res.optTable] = res.count ?? 0;
      }
    }

    this.missingTables = missing;
    const coreMissing = missing.filter((t) =>
      (REQUIRED_TABLES as readonly string[]).includes(t)
    );
    this.tablesReady = coreMissing.length === 0 && !unexpectedError;
    this.tableCounts = counts;
    this.lastError = unexpectedError;

    if (this.tablesReady) {
      await this.seedIfEmpty(seed);
      const countTables = [
        ...REQUIRED_TABLES,
        ...(this.cartsTableReady ? OPTIONAL_TABLES : []),
      ];
      const refreshed = await Promise.all(
        countTables.map(async (table) => {
          const { count } = await client
            .from(table)
            .select('*', { count: 'exact' })
            .limit(1);
          return { table, count };
        })
      );
      for (const item of refreshed) {
        if (typeof item.count === 'number') {
          this.tableCounts[item.table] = item.count;
        }
      }
    }

    return this.getStatus();
  }

  public async seedIfEmpty(seed: {
    products: Product[];
    shippingConfig: ShippingConfig;
    orders: Order[];
    accounts: CustomerAccount[];
  }): Promise<void> {
    if (!this.client || !this.tablesReady) return;

    const { count: prodCount, error: prodCountErr } = await this.client
      .from('products')
      .select('id', { count: 'exact' })
      .limit(1);
    if (prodCountErr) {
      this.lastError = prodCountErr.message;
      return;
    }

    if ((prodCount ?? 0) === 0 && seed.products.length > 0) {
      const { error } = await this.client
        .from('products')
        .upsert(seed.products.map(toProductRow), { onConflict: 'id' });
      if (error) {
        this.lastError = error.message;
        return;
      }
    }

    const { count: shipCount } = await this.client
      .from('shipping_config')
      .select('id', { count: 'exact' })
      .limit(1);

    if ((shipCount ?? 0) === 0) {
      const { error } = await this.client
        .from('shipping_config')
        .upsert(toShippingRow(seed.shippingConfig), { onConflict: 'id' });
      if (error) {
        this.lastError = error.message;
        return;
      }
    }

    const { count: orderCount } = await this.client
      .from('orders')
      .select('id', { count: 'exact' })
      .limit(1);

    if ((orderCount ?? 0) === 0 && seed.orders.length > 0) {
      const { error } = await this.client
        .from('orders')
        .upsert(seed.orders.map(toOrderRow), { onConflict: 'id' });
      if (error) {
        this.lastError = error.message;
        return;
      }
    }

    const { count: accCount } = await this.client
      .from('customer_accounts')
      .select('id', { count: 'exact' })
      .limit(1);

    if ((accCount ?? 0) === 0 && seed.accounts.length > 0) {
      const { error } = await this.client
        .from('customer_accounts')
        .upsert(seed.accounts.map(toAccountRow), { onConflict: 'id' });
      if (error) {
        this.lastError = error.message;
      }
    }
  }

  public async getProducts(): Promise<Product[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(fromProductRow);
  }

  public async upsertProduct(product: Product): Promise<Product> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client
      .from('products')
      .upsert(toProductRow(product), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromProductRow(data as ProductRow);
  }

  public async updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data: existing, error: fetchErr } = await this.client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!existing) return null;

    const merged: Product = { ...fromProductRow(existing as ProductRow), ...patch, id };
    const { data, error } = await this.client
      .from('products')
      .update(toProductRow(merged))
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromProductRow(data as ProductRow);
  }

  public async deleteProduct(id: string): Promise<boolean> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) throw new Error(error.message);
    return Array.isArray(data) && data.length > 0;
  }

  public async getShippingConfig(fallback: ShippingConfig): Promise<ShippingConfig> {
    if (!this.client) return fallback;
    const { data, error } = await this.client
      .from('shipping_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromShippingRow(data as ShippingConfigRow) : fallback;
  }

  public async updateShippingConfig(config: ShippingConfig): Promise<ShippingConfig> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client
      .from('shipping_config')
      .upsert(toShippingRow(config), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromShippingRow(data as ShippingConfigRow);
  }

  public async getOrders(): Promise<Order[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as OrderRow[]).map(fromOrderRow);
  }

  public async getOrderById(id: string): Promise<Order | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromOrderRow(data as OrderRow) : null;
  }

  public async createOrder(order: Order): Promise<Order> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client
      .from('orders')
      .insert(toOrderRow(order))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromOrderRow(data as OrderRow);
  }

  public async updateOrder(order: Order): Promise<Order> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client
      .from('orders')
      .update(toOrderRow(order))
      .eq('id', order.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromOrderRow(data as OrderRow);
  }

  public async getAccounts(): Promise<CustomerAccount[]> {
    if (!this.client) return [];
    const { data, error } = await this.client.from('customer_accounts').select('*');
    if (error) throw new Error(error.message);
    return (data as CustomerAccountRow[]).map(fromAccountRow);
  }

  public async getAccountById(id: string): Promise<CustomerAccount | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('customer_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromAccountRow(data as CustomerAccountRow) : null;
  }

  public async upsertAccount(account: CustomerAccount): Promise<CustomerAccount> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { data, error } = await this.client
      .from('customer_accounts')
      .upsert(toAccountRow(account), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromAccountRow(data as CustomerAccountRow);
  }

  public async subscribeNewsletter(email: string): Promise<void> {
    if (!this.client) throw new Error('Supabase client not initialized');
    const { error } = await this.client
      .from('newsletter_subscribers')
      .upsert(
        { email, subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    if (error) throw new Error(error.message);
  }

  public async getCart(cartKey: string): Promise<SavedCartItem[]> {
    if (!this.client || !this.cartsTableReady) return [];
    const { data, error } = await this.client
      .from('carts')
      .select('*')
      .eq('cart_key', cartKey)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? ((data as CartRow).items || []) : [];
  }

  public async saveCart(
    cartKey: string,
    items: SavedCartItem[],
    accountId?: string | null
  ): Promise<void> {
    if (!this.client || !this.cartsTableReady) return;
    const { error } = await this.client.from('carts').upsert(
      {
        cart_key: cartKey,
        account_id: accountId ?? null,
        items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cart_key' }
    );
    if (error) throw new Error(error.message);
  }
}
