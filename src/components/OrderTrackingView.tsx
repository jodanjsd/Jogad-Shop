import { useState, useEffect, type FormEvent } from 'react';
import {
  Search,
  CheckCircle2,
  Circle,
  Truck,
  FileText,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import type { Order } from '../types';
import { formatNaira } from '../utils/format';
import { ResilientImage } from './ResilientImage';
import { WaybillModal } from './WaybillModal';

interface OrderTrackingViewProps {
  initialOrder?: Order | null;
  onBackToStore: () => void;
}

const SAMPLE_LOOKUPS = [
  { label: 'KT-2026-1042 (In Transit)', orderId: 'KT-2026-1042', contact: '08031234567' },
  { label: 'KT-2026-1043 (High-Value)', orderId: 'KT-2026-1043', contact: '08098765432' },
  { label: 'KT-2026-1044 (COD Packed)', orderId: 'KT-2026-1044', contact: '07055511223' },
];

export function OrderTrackingView({ initialOrder, onBackToStore }: OrderTrackingViewProps) {
  const [orderId, setOrderId] = useState(initialOrder?.id || '');
  const [contact, setContact] = useState(initialOrder?.customer.phone || '');
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waybillOrder, setWaybillOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setOrderId(initialOrder.id);
      setContact(initialOrder.customer.phone);
    }
  }, [initialOrder]);

  const performLookup = async (id: string, contactVal: string) => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ orderId: id.trim(), contact: contactVal.trim() });
      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(data.error || 'Order not found.');
      } else {
        setOrder(data);
      }
    } catch {
      setError('Unable to reach tracking server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !contact.trim()) {
      setError('Please enter both your Order ID and phone number or email.');
      return;
    }
    performLookup(orderId, contact);
  };

  return (
    <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-[#111315] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Storefront
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111315]">
            Track Your Doorstep Delivery
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Enter your Order ID and checkout phone number or email to inspect live dispatch milestones.
          </p>
        </div>
      </div>

      {/* Search Card */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-[#111315] mb-1.5">Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. KT-2026-1042"
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-[#111315] mb-1.5">
              Phone Number or Email
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. 08031234567"
              className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-sm font-bold rounded-md transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Checking' : 'Track'}</span>
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-zinc-500">Quick sample orders:</span>
          {SAMPLE_LOOKUPS.map((sample) => (
            <button
              key={sample.orderId}
              type="button"
              onClick={() => {
                setOrderId(sample.orderId);
                setContact(sample.contact);
                performLookup(sample.orderId, sample.contact);
              }}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-[#111315] font-mono text-[11px] rounded-sm transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
            {error}
          </div>
        )}
      </section>

      {/* Order Status Result */}
      {order && (
        <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-mono text-lg font-bold tabular-nums text-[#111315]">
                  {order.id}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#82E600] text-[#111315] rounded-sm">
                  {order.currentStage}
                </span>
              </div>
              <div className="text-xs text-zinc-500 mt-1 font-mono tabular-nums">
                Waybill {order.waybillNumber} · Placed{' '}
                {new Date(order.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWaybillOrder(order)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border border-zinc-300 hover:border-[#111315] rounded-md transition-colors"
            >
              <FileText className="w-4 h-4" />
              View / Print Waybill
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Milestones Timeline */}
            <div className="lg:col-span-7 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Fulfillment Progress
              </h3>
              <ol className="space-y-4">
                {order.milestones.map((m, idx) => (
                  <li key={m.stage} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      {m.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#4D8A00] shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-300 shrink-0" />
                      )}
                      {idx < order.milestones.length - 1 && (
                        <div
                          className={`w-px flex-1 my-1 ${
                            m.completed ? 'bg-[#82E600]' : 'bg-zinc-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            m.completed ? 'text-[#111315]' : 'text-zinc-400'
                          }`}
                        >
                          {m.stage}
                        </span>
                        {m.timestamp && (
                          <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                            {new Date(m.timestamp).toLocaleString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">{m.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Dispatch & Itemized Summary */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 space-y-3 text-xs">
                <div className="font-semibold uppercase tracking-wider text-zinc-500">
                  Courier & Destination
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-[#4D8A00] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#111315]">{order.courierName}</div>
                    {order.riderPhone && (
                      <div className="font-mono text-zinc-600 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>Rider: {order.riderPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-zinc-200">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#111315]">
                      {order.customer.recipientName}
                    </div>
                    <div className="text-zinc-600 mt-0.5">
                      {order.customer.streetAddress}, {order.customer.city}, {order.customer.state}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                  <span className="text-zinc-500">Payment</span>
                  <span className="font-semibold text-[#111315]">
                    {order.paymentStatus} ({order.paymentMethod.toUpperCase()})
                  </span>
                </div>
                {order.requiresHighValueVerification && (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4D8A00]" />
                    <span>
                      High-value check:{' '}
                      <strong>{order.highValueVerified ? 'Verified' : 'Pending QC'}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="border border-zinc-200 rounded-md p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Items in Parcel
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="w-12 h-12 rounded bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                      <ResilientImage
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#111315] truncate">
                        {item.productName}
                      </div>
                      <div className="text-zinc-500">
                        {item.variantName} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-mono font-semibold tabular-nums">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-zinc-200 flex justify-between text-sm font-bold">
                  <span>Order Total</span>
                  <span className="font-mono tabular-nums">{formatNaira(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {waybillOrder && (
        <WaybillModal order={waybillOrder} onClose={() => setWaybillOrder(null)} />
      )}
    </main>
  );
}
