import { useState, type FormEvent } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Banknote,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Lock,
} from 'lucide-react';
import type {
  CustomerAccount,
  DeliveryAddress,
  Order,
  PaymentMethod,
  ShippingConfig,
} from '../types';
import type { CartItem } from './CartDrawer';
import { formatNaira, getShippingRate, NIGERIAN_STATES } from '../utils/format';

interface CheckoutModalProps {
  items: CartItem[];
  shippingConfig: ShippingConfig;
  account: CustomerAccount | null;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onOpenAccount: () => void;
  onTrackOrder: (order: Order) => void;
}

export function CheckoutModal({
  items,
  shippingConfig,
  account,
  onClose,
  onOrderCreated,
  onOpenAccount,
  onTrackOrder,
}: CheckoutModalProps) {
  const defaultAddr = account?.addresses?.[0];

  const [recipientName, setRecipientName] = useState(
    defaultAddr?.recipientName || account?.name || ''
  );
  const [phone, setPhone] = useState(defaultAddr?.phone || account?.phone || '');
  const [email, setEmail] = useState(defaultAddr?.email || account?.email || '');
  const [state, setState] = useState(defaultAddr?.state || 'Lagos');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [streetAddress, setStreetAddress] = useState(defaultAddr?.streetAddress || '');
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || '');

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shippingInfo = getShippingRate(state, subtotal, shippingConfig);
  const total = subtotal + shippingInfo.fee;
  const codDisabled = total >= shippingConfig.codMaxLimit;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    codDisabled ? 'paystack' : 'paystack'
  );
  const [gatewayModal, setGatewayModal] = useState<'paystack' | 'flutterwave' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const effectivePaymentMethod: PaymentMethod =
    codDisabled && paymentMethod === 'cod' ? 'paystack' : paymentMethod;

  const applySavedAddress = (addr: DeliveryAddress) => {
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setEmail(addr.email);
    setState(addr.state);
    setCity(addr.city);
    setStreetAddress(addr.streetAddress);
    setLandmark(addr.landmark || '');
  };

  const submitOrder = async (method: PaymentMethod, paymentRef?: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            recipientName,
            phone,
            email,
            state,
            city,
            streetAddress,
            landmark,
          },
          items: items.map((i) => ({
            productId: i.product.id,
            variantSku: i.variant.sku,
            quantity: i.quantity,
          })),
          paymentMethod: method,
          paymentReference: paymentRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not complete order.');
      } else {
        setConfirmedOrder(data);
        setGatewayModal(null);
        onOrderCreated(data);
      }
    } catch {
      setError('Network error submitting order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recipientName.trim() || !phone.trim() || !email.trim() || !city.trim() || !streetAddress.trim()) {
      setError('Please complete all required recipient and delivery address fields.');
      return;
    }
    if (effectivePaymentMethod === 'paystack' || effectivePaymentMethod === 'flutterwave') {
      setGatewayModal(effectivePaymentMethod);
      return;
    }
    submitOrder('cod');
  };

  if (confirmedOrder) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Order Confirmed"
      >
        <div className="bg-white w-full max-w-lg rounded-lg border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#82E600]/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#4D8A00]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#111315]">
                  Order {confirmedOrder.id} Confirmed
                </h2>
                <p className="text-xs text-zinc-500">
                  Waybill <span className="font-mono font-semibold">{confirmedOrder.waybillNumber}</span> ·{' '}
                  {confirmedOrder.paymentStatus}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close confirmation"
              className="p-1.5 text-zinc-400 hover:text-[#111315]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Delivering To</span>
              <span className="font-semibold text-[#111315] text-right">
                {confirmedOrder.customer.recipientName} ({confirmedOrder.customer.city},{' '}
                {confirmedOrder.customer.state})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Courier Dispatch</span>
              <span className="font-medium text-[#111315]">{confirmedOrder.courierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment Method</span>
              <span className="font-semibold uppercase text-[#111315]">
                {confirmedOrder.paymentMethod}
              </span>
            </div>
            {confirmedOrder.paymentReference && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Transaction Reference</span>
                <span className="font-mono font-semibold text-[#111315]">
                  {confirmedOrder.paymentReference}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-bold">
              <span>Total Amount</span>
              <span className="font-mono tabular-nums">{formatNaira(confirmedOrder.total)}</span>
            </div>
          </div>

          {confirmedOrder.requiresHighValueVerification && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
              High-value order queued for rapid serial verification before insured dispatch.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onTrackOrder(confirmedOrder)}
              className="flex-1 py-2.5 px-4 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-xs font-bold rounded-md inline-flex items-center justify-center gap-1.5"
            >
              <span>Track Live Delivery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-zinc-300 text-xs font-semibold rounded-md hover:bg-zinc-50"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="bg-white w-full max-w-4xl rounded-lg border border-zinc-200 shadow-2xl overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-[#111315]">
              Secure Checkout & Doorstep Dispatch
            </h2>
            <p className="text-xs text-zinc-500">
              Guest or signed-in checkout · Nationwide Nigerian logistics
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-2 text-zinc-500 hover:text-[#111315] rounded-md hover:bg-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Delivery & Payment */}
          <div className="lg:col-span-7 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-zinc-200">
            {/* Account Bar */}
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-md px-3.5 py-2.5 text-xs">
              <span>
                {account
                  ? `Checking out as ${account.name}`
                  : 'Checking out as Guest (optional account sign-in)'}
              </span>
              <button
                type="button"
                onClick={onOpenAccount}
                className="font-semibold text-[#4D8A00] hover:underline"
              >
                {account ? 'Manage Addresses' : 'Sign In'}
              </button>
            </div>

            {account && account.addresses.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-zinc-600">Saved Addresses</div>
                <div className="flex flex-wrap gap-2">
                  {account.addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applySavedAddress(addr)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-zinc-300 hover:border-[#111315] rounded-md transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#4D8A00]" />
                      <span>{addr.label || addr.city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                1. Delivery Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Chidi Okonkwo"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nigerian Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Email Address (for receipt & tracking)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chidi@example.ng"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Delivery State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md bg-white focus:outline-none focus:border-[#111315]"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    City / LGA
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lekki Phase 1 / Wuse II"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nearest Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Opposite Ebeano"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House number, street name, estate"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                />
              </div>
            </div>

            {/* Payment Method & COD Guardrail */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                2. Payment Method
              </div>

              {codDisabled && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Prepayment Required Above {formatNaira(shippingConfig.codMaxLimit)}:</strong>{' '}
                    Cash on Delivery is unavailable for this order total ({formatNaira(total)}) to
                    protect insured high-value fulfillment. Please select Paystack or Flutterwave.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    effectivePaymentMethod === 'paystack'
                      ? 'border-[#111315] bg-zinc-50 ring-1 ring-[#111315]'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CreditCard className="w-4 h-4 text-[#111315]" />
                    <span className="text-[10px] font-bold uppercase text-[#4D8A00]">Instant</span>
                  </div>
                  <div className="font-display font-bold text-xs mt-2">Paystack</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Card · Transfer · USSD</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('flutterwave')}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    effectivePaymentMethod === 'flutterwave'
                      ? 'border-[#111315] bg-zinc-50 ring-1 ring-[#111315]'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CreditCard className="w-4 h-4 text-[#111315]" />
                    <span className="text-[10px] font-bold uppercase text-[#4D8A00]">Instant</span>
                  </div>
                  <div className="font-display font-bold text-xs mt-2">Flutterwave</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Card · Bank · Mobile</div>
                </button>

                <button
                  type="button"
                  disabled={codDisabled}
                  onClick={() => !codDisabled && setPaymentMethod('cod')}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    codDisabled
                      ? 'border-zinc-200 bg-zinc-100 opacity-60 cursor-not-allowed'
                      : effectivePaymentMethod === 'cod'
                      ? 'border-[#111315] bg-zinc-50 ring-1 ring-[#111315]'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Banknote className="w-4 h-4 text-[#111315]" />
                    <span className="text-[10px] font-mono text-zinc-500">
                      &lt;{formatNaira(shippingConfig.codMaxLimit)}
                    </span>
                  </div>
                  <div className="font-display font-bold text-xs mt-2">Cash on Delivery</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {codDisabled ? 'Disabled ≥₦150k' : 'Pay rider at doorstep'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 bg-zinc-50 p-6 flex flex-col justify-between space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Order Summary ({items.reduce((a, b) => a + b.quantity, 0)} items)
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.variant.sku} className="flex justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#111315] truncate">
                        {item.product.name}
                      </div>
                      <div className="text-zinc-500">
                        {item.variant.name} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-mono font-semibold tabular-nums shrink-0">
                      {formatNaira(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">
                    Shipping ({shippingInfo.zoneName} · {shippingInfo.etaDays})
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-[#4D8A00]">
                    {shippingInfo.isFree ? 'FREE' : formatNaira(shippingInfo.fee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex justify-between text-base font-bold text-[#111315]">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{formatNaira(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-sm font-bold rounded-md transition-colors inline-flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Processing Order...'
                    : effectivePaymentMethod === 'cod'
                    ? `Place COD Order · ${formatNaira(total)}`
                    : `Pay ${formatNaira(total)} with ${
                        effectivePaymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'
                      }`}
                </span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4D8A00]" />
                <span>365-Day Official Warranty · Instant Waybill Issued</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Simulated Paystack / Flutterwave Gateway Authorization Modal */}
      {gatewayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white w-full max-w-sm rounded-lg border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {gatewayModal === 'paystack' ? 'Paystack Checkout' : 'Flutterwave Checkout'}
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-[#111315] mt-0.5">
                  {formatNaira(total)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGatewayModal(null)}
                aria-label="Cancel payment"
                className="p-1.5 text-zinc-400 hover:text-[#111315]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Authorize instant NGN payment for <strong>{email}</strong> via{' '}
              {gatewayModal === 'paystack'
                ? 'Paystack (Card / Bank Transfer / USSD)'
                : 'Flutterwave (Card / Bank / Mobile)'}
              .
            </p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  submitOrder(
                    gatewayModal,
                    `${gatewayModal === 'paystack' ? 'PSK' : 'FLW'}-${Math.floor(
                      10000000 + Math.random() * 90000000
                    )}`
                  )
                }
                className="w-full py-2.5 bg-[#111315] hover:bg-zinc-800 text-white text-xs font-bold rounded-md transition-colors"
              >
                {submitting ? 'Confirming Payment...' : 'Authorize & Complete Payment'}
              </button>
              <button
                type="button"
                onClick={() => setGatewayModal(null)}
                className="w-full py-2 text-xs text-zinc-600 hover:text-[#111315]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
