import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ACCOUNTS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SHIPPING_CONFIG,
} from './src/data/seedData.ts';
import type {
  CustomerAccount,
  DeliveryAddress,
  FulfillmentStage,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  ShippingConfig,
} from './src/types.ts';
import { SupabaseStore, type SavedCartItem } from './server/supabaseStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const SCHEMA_SQL_PATH = path.resolve(__dirname, 'supabase', 'schema.sql');

interface StoreState {
  products: Product[];
  shippingConfig: ShippingConfig;
  orders: Order[];
  accounts: CustomerAccount[];
  newsletter: Array<{ email: string; subscribedAt: string }>;
  carts: Record<string, SavedCartItem[]>;
}

const STAGE_ORDER: FulfillmentStage[] = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'In Transit',
  'Delivered',
];

function loadStore(): StoreState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      const existingProducts = Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS;
      const hasJogadCatalog = existingProducts.some((p) => p.id.startsWith('jogad-'));
      let mergedProducts = INITIAL_PRODUCTS;
      let shouldWrite = false;

      if (hasJogadCatalog) {
        const existingIds = new Set(existingProducts.map((p) => p.id));
        const missingProducts = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
        mergedProducts =
          missingProducts.length > 0 ? [...existingProducts, ...missingProducts] : existingProducts;
        shouldWrite = missingProducts.length > 0;
      } else {
        shouldWrite = true;
      }

      const mergedState: StoreState = {
        products: mergedProducts,
        shippingConfig: parsed.shippingConfig ?? INITIAL_SHIPPING_CONFIG,
        orders: hasJogadCatalog && Array.isArray(parsed.orders) ? parsed.orders : INITIAL_ORDERS,
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : INITIAL_ACCOUNTS,
        newsletter: Array.isArray(parsed.newsletter) ? parsed.newsletter : [],
        carts: parsed.carts && typeof parsed.carts === 'object' ? parsed.carts : {},
      };
      if (shouldWrite) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(mergedState, null, 2), 'utf-8');
      }
      return mergedState;
    } catch {
      // Fallback to clean seed if file was corrupted
    }
  }
  const initial: StoreState = {
    products: INITIAL_PRODUCTS,
    shippingConfig: INITIAL_SHIPPING_CONFIG,
    orders: INITIAL_ORDERS,
    accounts: INITIAL_ACCOUNTS,
    newsletter: [],
    carts: {},
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

function saveStore(state: StoreState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function computeShippingFee(stateName: string, subtotal: number, config: ShippingConfig): number {
  if (subtotal >= config.freeShippingThreshold) {
    return 0;
  }
  const matched = config.regionalRules.find((r) =>
    r.states.some((s) => s.toLowerCase() === stateName.toLowerCase())
  );
  if (matched) {
    return matched.flatRate;
  }
  const fallback = config.regionalRules[config.regionalRules.length - 1];
  return fallback ? fallback.flatRate : 4500;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const store = loadStore();
  const supabase = new SupabaseStore();

  if (supabase.isConfigured()) {
    void supabase
      .probeAndInitialize({
        products: store.products,
        shippingConfig: store.shippingConfig,
        orders: store.orders,
        accounts: store.accounts,
      })
      .then((status) => {
        if (status.tablesReady) {
          console.log(`Supabase backend connected (${status.projectHost})`);
        } else if (status.missingTables.length > 0) {
          console.log(
            `Supabase configured (${status.projectHost}), awaiting schema tables (${status.missingTables.join(', ')}). Using local fallback until schema is created.`
          );
        } else if (status.lastError) {
          console.log(`Supabase fallback active (${status.projectHost}): ${status.lastError}`);
        }
      })
      .catch(() => {
        console.log('Supabase startup check deferred; using local fallback store.');
      });
  }

  // Supabase connection & schema readiness status (never returns secrets/keys)
  app.get('/api/admin/supabase-status', async (_req, res) => {
    const status = await supabase.probeAndInitialize(
      {
        products: store.products,
        shippingConfig: store.shippingConfig,
        orders: store.orders,
        accounts: store.accounts,
      },
      { force: true }
    );
    let schemaSql = '';
    try {
      if (fs.existsSync(SCHEMA_SQL_PATH)) {
        schemaSql = fs.readFileSync(SCHEMA_SQL_PATH, 'utf-8');
      }
    } catch {
      schemaSql = '';
    }
    res.json({ ...status, schemaSql });
  });

  app.post('/api/admin/supabase-sync', async (_req, res) => {
    const status = await supabase.probeAndInitialize(
      {
        products: store.products,
        shippingConfig: store.shippingConfig,
        orders: store.orders,
        accounts: store.accounts,
      },
      { force: true }
    );
    if (!status.tablesReady) {
      res.status(409).json({
        ...status,
        error: status.lastError
          ? status.lastError
          : status.configured
            ? 'Run supabase/schema.sql in your Supabase SQL Editor first to create required tables.'
            : 'Configure SUPABASE_URL + SUPABASE_ANON_KEY (or SUPABASE_PROJECT_ID + SUPABASE_PUBLISHABLE_KEY) in Settings -> Secrets.',
      });
      return;
    }
    res.json(status);
  });

  let lastSchemaCheckAt = 0;
  const SCHEMA_RECHECK_MS = 8_000;

  async function ensureSupabaseReady(): Promise<boolean> {
    if (!supabase.isConfigured()) return false;
    if (supabase.isActive()) return true;
    if (Date.now() - lastSchemaCheckAt < SCHEMA_RECHECK_MS) {
      return supabase.isActive();
    }
    lastSchemaCheckAt = Date.now();
    await supabase.probeAndInitialize({
      products: store.products,
      shippingConfig: store.shippingConfig,
      orders: store.orders,
      accounts: store.accounts,
    });
    return supabase.isActive();
  }

  // Storefront bootstrap
  app.get('/api/bootstrap', async (_req, res) => {
    try {
      if (await ensureSupabaseReady()) {
        const [products, shippingConfig] = await Promise.all([
          supabase.getProducts(),
          supabase.getShippingConfig(store.shippingConfig),
        ]);
        res.json({
          products: products.length > 0 ? products : store.products,
          shippingConfig,
          backendMode: 'supabase',
        });
        return;
      }
    } catch (err) {
      console.warn('Bootstrap Supabase fallback:', err);
    }
    res.json({
      products: store.products,
      shippingConfig: store.shippingConfig,
      backendMode: 'local-fallback',
    });
  });

  // Products CRUD
  app.get('/api/products', async (_req, res) => {
    try {
      if (await ensureSupabaseReady()) {
        const products = await supabase.getProducts();
        res.json(products);
        return;
      }
    } catch (err) {
      console.warn('GET /api/products Supabase fallback:', err);
    }
    res.json(store.products);
  });

  app.post('/api/products', async (req, res) => {
    const body = req.body as Partial<Product>;
    if (!body.name || !body.category || typeof body.price !== 'number') {
      res.status(400).json({ error: 'Product name, category, and numeric price are required.' });
      return;
    }
    const id =
      body.id ||
      `jgd-${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newProduct: Product = {
      id,
      name: body.name,
      subtitle: body.subtitle || 'Official Hardware',
      category: body.category,
      subcategory: body.subcategory || body.category,
      occasions: body.occasions?.length ? body.occasions : ['Best Sellers'],
      badge: body.badge || 'New Arrival',
      giftNote: body.giftNote,
      price: body.price,
      originalPrice: body.originalPrice || Math.round(body.price * 1.25),
      rating: body.rating ?? 4.8,
      reviewCount: body.reviewCount ?? 12,
      image: body.image || '/src/assets/jogad/prod-15-28.jpg',
      features: body.features || [
        'Official 12-month Nigerian replacement warranty',
        'Rapid charging & durable matte finish',
      ],
      specs: body.specs || [
        { label: 'Warranty', value: '12 Months Official' },
        { label: 'Authenticity', value: 'Serialized Hardware' },
      ],
      description: body.description || 'Authentic device backed by nationwide express delivery.',
      warrantyMonths: body.warrantyMonths ?? 12,
      collections: body.collections?.length ? body.collections : ['New Arrivals'],
      variants:
        body.variants && body.variants.length > 0
          ? body.variants
          : [
              {
                id: `v-${Date.now()}`,
                name: 'Obsidian Black',
                hex: '#18181B',
                sku: `JGD-${Date.now().toString().slice(-5)}`,
                stock: 25,
              },
            ],
    };

    try {
      if (await ensureSupabaseReady()) {
        const created = await supabase.upsertProduct(newProduct);
        store.products.unshift(created);
        saveStore(store);
        res.status(201).json(created);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json(newProduct);
  });

  app.patch('/api/products/:id', async (req, res) => {
    const patch = req.body as Partial<Product>;
    try {
      if (await ensureSupabaseReady()) {
        const updated = await supabase.updateProduct(req.params.id, patch);
        if (!updated) {
          res.status(404).json({ error: 'Product not found.' });
          return;
        }
        const idx = store.products.findIndex((p) => p.id === req.params.id);
        if (idx !== -1) store.products[idx] = updated;
        saveStore(store);
        res.json(updated);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    store.products[idx] = { ...store.products[idx], ...patch, id: store.products[idx].id };
    saveStore(store);
    res.json(store.products[idx]);
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      if (await ensureSupabaseReady()) {
        const deleted = await supabase.deleteProduct(req.params.id);
        if (!deleted) {
          res.status(404).json({ error: 'Product not found.' });
          return;
        }
        store.products = store.products.filter((p) => p.id !== req.params.id);
        saveStore(store);
        res.json({ deleted: true });
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== req.params.id);
    if (store.products.length === before) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    saveStore(store);
    res.json({ deleted: true });
  });

  // Shipping Configuration
  app.get('/api/shipping-config', async (_req, res) => {
    try {
      if (await ensureSupabaseReady()) {
        const cfg = await supabase.getShippingConfig(store.shippingConfig);
        res.json(cfg);
        return;
      }
    } catch (err) {
      console.warn('GET /api/shipping-config Supabase fallback:', err);
    }
    res.json(store.shippingConfig);
  });

  app.patch('/api/shipping-config', async (req, res) => {
    const patch = req.body as Partial<ShippingConfig>;
    const merged: ShippingConfig = {
      ...store.shippingConfig,
      ...patch,
    };
    try {
      if (await ensureSupabaseReady()) {
        const saved = await supabase.updateShippingConfig(merged);
        store.shippingConfig = saved;
        saveStore(store);
        res.json(saved);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    store.shippingConfig = merged;
    saveStore(store);
    res.json(store.shippingConfig);
  });

  // Orders & Guardrails
  app.get('/api/orders', async (_req, res) => {
    try {
      if (await ensureSupabaseReady()) {
        const orders = await supabase.getOrders();
        res.json(orders);
        return;
      }
    } catch (err) {
      console.warn('GET /api/orders Supabase fallback:', err);
    }
    res.json(store.orders);
  });

  app.get('/api/orders/track', async (req, res) => {
    const orderId = String(req.query.orderId || '').trim().toUpperCase();
    const contact = String(req.query.contact || '').trim().toLowerCase();
    if (!orderId || !contact) {
      res.status(400).json({ error: 'Both Order ID and phone/email are required.' });
      return;
    }

    let orderList = store.orders;
    if (await ensureSupabaseReady()) {
      try {
        orderList = await supabase.getOrders();
      } catch {
        orderList = store.orders;
      }
    }

    const found = orderList.find((o) => {
      const idMatch = o.id.toUpperCase() === orderId;
      const phoneClean = o.customer.phone.replace(/\s+/g, '').toLowerCase();
      const contactClean = contact.replace(/\s+/g, '');
      const emailMatch = o.customer.email.toLowerCase() === contact;
      const phoneMatch =
        phoneClean === contactClean ||
        phoneClean.endsWith(contactClean.slice(-10)) ||
        contactClean.endsWith(phoneClean.slice(-10));
      return idMatch && (emailMatch || phoneMatch);
    });

    if (!found) {
      res.status(404).json({
        error: 'No matching order found. Please check your Order ID and phone number or email.',
      });
      return;
    }
    res.json(found);
  });

  app.post('/api/orders', async (req, res) => {
    const body = req.body as {
      customer?: DeliveryAddress;
      items?: Array<{ productId: string; variantSku: string; quantity: number }>;
      paymentMethod?: PaymentMethod;
      paymentReference?: string;
    };

    if (!body.customer || !body.items || body.items.length === 0 || !body.paymentMethod) {
      res.status(400).json({ error: 'Customer address, cart items, and payment method are required.' });
      return;
    }

    const { recipientName, phone, email, state, city, streetAddress } = body.customer;
    if (!recipientName || !phone || !email || !state || !city || !streetAddress) {
      res.status(400).json({ error: 'All required delivery address fields must be completed.' });
      return;
    }

    const dbActive = await ensureSupabaseReady();
    const activeProducts = dbActive
      ? await supabase.getProducts().catch(() => store.products)
      : store.products;
    const activeShipping = dbActive
      ? await supabase.getShippingConfig(store.shippingConfig).catch(() => store.shippingConfig)
      : store.shippingConfig;
    const activeOrders = dbActive
      ? await supabase.getOrders().catch(() => store.orders)
      : store.orders;

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const line of body.items) {
      const product = activeProducts.find((p) => p.id === line.productId);
      if (!product) {
        res.status(400).json({ error: `Product ${line.productId} is no longer available.` });
        return;
      }
      const variant =
        product.variants.find((v) => v.sku === line.variantSku) || product.variants[0];
      const qty = Math.max(1, Math.floor(line.quantity || 1));
      subtotal += product.price * qty;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        image: product.image,
        unitPrice: product.price,
        quantity: qty,
      });
    }

    const shippingFee = computeShippingFee(state, subtotal, activeShipping);
    const total = subtotal + shippingFee;

    if (body.paymentMethod === 'cod' && total >= activeShipping.codMaxLimit) {
      res.status(422).json({
        error: `Cash on Delivery is unavailable for orders of ₦${activeShipping.codMaxLimit.toLocaleString()} or above. Prepayment via Paystack or Flutterwave is required.`,
      });
      return;
    }

    const requiresHighValueVerification = total >= activeShipping.codMaxLimit;
    const isPrepaid = body.paymentMethod === 'paystack' || body.paymentMethod === 'flutterwave';
    const existingOrderIds = new Set(activeOrders.map((o) => o.id));
    let nextNum = 1045 + activeOrders.length;
    while (existingOrderIds.has(`KT-2026-${nextNum}`)) {
      nextNum += 1;
    }
    const orderId = `KT-2026-${nextNum}`;
    const waybillNumber = `WB-NG-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const paymentRef = isPrepaid
      ? body.paymentReference ||
        `${body.paymentMethod === 'paystack' ? 'PSK' : 'FLW'}-${Math.floor(10000000 + Math.random() * 90000000)}`
      : undefined;

    const newOrder: Order = {
      id: orderId,
      waybillNumber,
      createdAt: now,
      customer: body.customer,
      items: orderItems,
      subtotal,
      shippingFee,
      total,
      paymentMethod: body.paymentMethod,
      paymentStatus: isPrepaid ? 'Paid' : 'COD Pending',
      paymentReference: paymentRef,
      highValueVerified: !requiresHighValueVerification,
      requiresHighValueVerification,
      currentStage: isPrepaid ? 'Confirmed' : 'Order Placed',
      courierName:
        state.toLowerCase() === 'lagos'
          ? 'JogadExpress Lagos Dispatch'
          : 'GIG / DHL Nationwide Express',
      milestones: [
        {
          stage: 'Order Placed',
          completed: true,
          timestamp: now,
          note: isPrepaid
            ? `Prepaid order created via ${body.paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}`
            : 'Cash on Delivery order created',
        },
        {
          stage: 'Confirmed',
          completed: isPrepaid,
          timestamp: isPrepaid ? now : undefined,
          note: isPrepaid
            ? `Payment confirmed (${paymentRef})`
            : 'Awaiting dispatch confirmation call',
        },
        {
          stage: 'Packed',
          completed: false,
          note: 'Pending hub packaging & serial inspection',
        },
        {
          stage: 'In Transit',
          completed: false,
          note: 'Pending courier pickup',
        },
        {
          stage: 'Delivered',
          completed: false,
          note: isPrepaid
            ? 'Prepaid — no cash collection required'
            : `Collect ₦${total.toLocaleString()} on delivery`,
        },
      ],
    };

    try {
      if (supabase.isActive()) {
        const createdOrder = await supabase.createOrder(newOrder);
        // Update variant stock in Supabase
        for (const item of orderItems) {
          const prod = activeProducts.find((p) => p.id === item.productId);
          if (prod) {
            const updatedVariants = prod.variants.map((v) =>
              v.sku === item.sku ? { ...v, stock: Math.max(0, v.stock - item.quantity) } : v
            );
            await supabase.updateProduct(prod.id, { variants: updatedVariants });
          }
        }
        store.orders.unshift(createdOrder);
        saveStore(store);
        res.status(201).json(createdOrder);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    for (const item of orderItems) {
      const prod = store.products.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.sku === item.sku);
      if (variant) {
        variant.stock = Math.max(0, variant.stock - item.quantity);
      }
    }

    store.orders.unshift(newOrder);
    saveStore(store);
    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id', async (req, res) => {
    const body = req.body as {
      currentStage?: FulfillmentStage;
      highValueVerified?: boolean;
      paymentStatus?: Order['paymentStatus'];
      courierName?: string;
      riderPhone?: string;
    };

    let order: Order | null = null;
    if (await ensureSupabaseReady()) {
      try {
        order = await supabase.getOrderById(req.params.id);
      } catch (err) {
        res.status(502).json({ error: (err as Error).message });
        return;
      }
    } else {
      order = store.orders.find((o) => o.id === req.params.id) || null;
    }

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const updatedOrder: Order = { ...order };
    if (typeof body.highValueVerified === 'boolean') {
      updatedOrder.highValueVerified = body.highValueVerified;
    }
    if (body.paymentStatus) {
      updatedOrder.paymentStatus = body.paymentStatus;
    }
    if (body.courierName) {
      updatedOrder.courierName = body.courierName;
    }
    if (body.riderPhone !== undefined) {
      updatedOrder.riderPhone = body.riderPhone;
    }
    if (body.currentStage && STAGE_ORDER.includes(body.currentStage)) {
      const targetIdx = STAGE_ORDER.indexOf(body.currentStage);
      const now = new Date().toISOString();
      updatedOrder.currentStage = body.currentStage;
      updatedOrder.milestones = updatedOrder.milestones.map((m) => {
        const mIdx = STAGE_ORDER.indexOf(m.stage);
        if (mIdx <= targetIdx) {
          return {
            ...m,
            completed: true,
            timestamp: m.timestamp || now,
          };
        }
        return { ...m, completed: false, timestamp: undefined };
      });
    }

    try {
      if (supabase.isActive()) {
        const saved = await supabase.updateOrder(updatedOrder);
        const idx = store.orders.findIndex((o) => o.id === saved.id);
        if (idx !== -1) store.orders[idx] = saved;
        saveStore(store);
        res.json(saved);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    const idx = store.orders.findIndex((o) => o.id === updatedOrder.id);
    if (idx !== -1) store.orders[idx] = updatedOrder;
    saveStore(store);
    res.json(updatedOrder);
  });

  // Customer Accounts & Address Book
  app.post('/api/accounts/login', async (req, res) => {
    const { contact, name } = req.body as { contact?: string; name?: string };
    const normalized = (contact || '').trim().toLowerCase();
    if (!normalized) {
      res.status(400).json({ error: 'Please enter a valid email or Nigerian phone number.' });
      return;
    }

    const accountList = (await ensureSupabaseReady())
      ? await supabase.getAccounts().catch(() => store.accounts)
      : store.accounts;

    let account = accountList.find(
      (a) =>
        a.contact.toLowerCase() === normalized ||
        a.email.toLowerCase() === normalized ||
        a.phone.replace(/\s+/g, '') === normalized.replace(/\s+/g, '')
    );

    if (!account) {
      const isEmail = normalized.includes('@');
      account = {
        id: `acc-${Date.now()}`,
        contact: normalized,
        name: (name || '').trim() || (isEmail ? normalized.split('@')[0] : 'Valued Customer'),
        email: isEmail ? normalized : '',
        phone: isEmail ? '' : (contact || '').trim(),
        addresses: [],
      };
      try {
        if (supabase.isActive()) {
          account = await supabase.upsertAccount(account);
        }
      } catch (err) {
        res.status(502).json({ error: (err as Error).message });
        return;
      }
      store.accounts.push(account);
      saveStore(store);
    }

    res.json(account);
  });

  app.post('/api/accounts/:id/addresses', async (req, res) => {
    const addr = req.body as DeliveryAddress;
    if (!addr.recipientName || !addr.phone || !addr.state || !addr.streetAddress) {
      res.status(400).json({ error: 'Recipient name, phone, state, and street address are required.' });
      return;
    }

    const account = (await ensureSupabaseReady())
      ? await supabase.getAccountById(req.params.id).catch(() => null)
      : store.accounts.find((a) => a.id === req.params.id) || null;

    if (!account) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const savedAddr: DeliveryAddress = {
      ...addr,
      id: addr.id || `addr-${Date.now()}`,
      label: addr.label || `${addr.city || addr.state} Address`,
    };
    const updatedAccount: CustomerAccount = {
      ...account,
      addresses: [savedAddr, ...account.addresses],
    };

    try {
      if (supabase.isActive()) {
        const persisted = await supabase.upsertAccount(updatedAccount);
        const idx = store.accounts.findIndex((a) => a.id === persisted.id);
        if (idx !== -1) store.accounts[idx] = persisted;
        saveStore(store);
        res.json(persisted);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    const idx = store.accounts.findIndex((a) => a.id === updatedAccount.id);
    if (idx !== -1) store.accounts[idx] = updatedAccount;
    saveStore(store);
    res.json(updatedAccount);
  });

  app.delete('/api/accounts/:id/addresses/:addrId', async (req, res) => {
    const account = (await ensureSupabaseReady())
      ? await supabase.getAccountById(req.params.id).catch(() => null)
      : store.accounts.find((a) => a.id === req.params.id) || null;

    if (!account) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const updatedAccount: CustomerAccount = {
      ...account,
      addresses: account.addresses.filter((a) => a.id !== req.params.addrId),
    };

    try {
      if (supabase.isActive()) {
        const persisted = await supabase.upsertAccount(updatedAccount);
        const idx = store.accounts.findIndex((a) => a.id === persisted.id);
        if (idx !== -1) store.accounts[idx] = persisted;
        saveStore(store);
        res.json(persisted);
        return;
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    const idx = store.accounts.findIndex((a) => a.id === updatedAccount.id);
    if (idx !== -1) store.accounts[idx] = updatedAccount;
    saveStore(store);
    res.json(updatedAccount);
  });

  // Newsletter
  app.post('/api/newsletter', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    try {
      if (await ensureSupabaseReady()) {
        await supabase.subscribeNewsletter(email);
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    if (!store.newsletter.some((n) => n.email === email)) {
      store.newsletter.push({ email, subscribedAt: new Date().toISOString() });
      saveStore(store);
    }
    res.json({ subscribed: true, email });
  });

  // Persistent Shopping Cart
  app.get('/api/cart/:cartKey', async (req, res) => {
    const cartKey = String(req.params.cartKey || '').trim().slice(0, 80);
    if (!cartKey) {
      res.status(400).json({ error: 'Cart key is required.' });
      return;
    }
    try {
      if ((await ensureSupabaseReady()) && supabase.isCartTableReady()) {
        const items = await supabase.getCart(cartKey);
        res.json({ items });
        return;
      }
    } catch (err) {
      console.warn('GET /api/cart fallback:', err);
    }
    res.json({ items: store.carts[cartKey] || [] });
  });

  app.put('/api/cart/:cartKey', async (req, res) => {
    const cartKey = String(req.params.cartKey || '').trim().slice(0, 80);
    if (!cartKey) {
      res.status(400).json({ error: 'Cart key is required.' });
      return;
    }
    const body = req.body as { items?: SavedCartItem[]; accountId?: string | null };
    const items = Array.isArray(body.items) ? body.items : [];

    try {
      if ((await ensureSupabaseReady()) && supabase.isCartTableReady()) {
        await supabase.saveCart(cartKey, items, body.accountId ?? null);
      }
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
      return;
    }

    store.carts[cartKey] = items;
    saveStore(store);
    res.json({ saved: true, count: items.length });
  });

  // Vite dev middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Jogad server running on http://0.0.0.0:${port}`);
  });
}

startServer();
