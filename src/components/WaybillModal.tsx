import { Printer, X } from 'lucide-react';
import type { Order } from '../types';
import { formatNaira } from '../utils/format';

interface WaybillModalProps {
  order: Order;
  onClose: () => void;
}

export function WaybillModal({ order, onClose }: WaybillModalProps) {
  const isCod = order.paymentMethod === 'cod' && order.paymentStatus === 'COD Pending';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Waybill ${order.waybillNumber}`}
    >
      <div className="bg-white w-full max-w-2xl border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h2 className="font-display text-base font-bold text-[#111315]">
              Dispatch Waybill Preview
            </h2>
            <p className="text-xs text-zinc-500 font-mono tabular-nums">
              {order.waybillNumber} · Order {order.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#111315] text-white rounded-md hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Print Waybill
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close waybill"
              className="p-2 text-zinc-500 hover:text-[#111315] rounded-md hover:bg-zinc-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 text-sm text-[#111315]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <img
                src="/src/assets/jogad/jogad-logo.webp"
                alt="Jogad"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain mix-blend-multiply"
              />
              <div className="text-xs text-zinc-500 mt-1.5">
                Jogad Logistics Hub · Ikeja Industrial Estate, Lagos
              </div>
              <div className="text-xs text-zinc-500">Dispatch Hotline: +234 809 555 0192</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Waybill Number</div>
              <div className="font-mono text-lg font-bold tabular-nums">{order.waybillNumber}</div>
              <div className="mt-2 flex items-center justify-end gap-0.5" aria-hidden="true">
                {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 2].map((w, idx) => (
                  <span
                    key={idx}
                    className="bg-[#111315] inline-block h-7"
                    style={{ width: `${w * 2}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-200 pb-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Recipient & Destination
              </div>
              <div className="font-semibold">{order.customer.recipientName}</div>
              <div className="text-zinc-600 font-mono text-xs mt-0.5">{order.customer.phone}</div>
              <div className="text-zinc-700 mt-1">{order.customer.streetAddress}</div>
              <div className="text-zinc-700">
                {order.customer.city}, {order.customer.state}
              </div>
              {order.customer.landmark && (
                <div className="text-xs text-zinc-500 mt-1">
                  Landmark: {order.customer.landmark}
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Collection & Verification
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-zinc-600">Order Reference</span>
                <span className="font-mono font-semibold tabular-nums">{order.id}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-zinc-600">Courier</span>
                <span className="font-medium">{order.courierName}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-zinc-600">Payment Mode</span>
                <span className="font-semibold uppercase">{order.paymentMethod}</span>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-zinc-600">
                  {isCod ? 'Cash to Collect' : 'Amount Due'}
                </span>
                <span className="font-mono text-base font-bold tabular-nums">
                  {isCod ? formatNaira(order.total) : '₦0 (PREPAID)'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Manifest Items
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="py-2 font-medium">SKU</th>
                  <th className="py-2 font-medium">Item Description</th>
                  <th className="py-2 font-medium text-right">Qty</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-zinc-100 text-xs">
                    <td className="py-2.5 font-mono text-zinc-600">{item.sku}</td>
                    <td className="py-2.5">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-zinc-500"> · {item.variantName}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end gap-6 text-xs text-zinc-600">
              <span>
                Shipping:{' '}
                <strong className="font-mono tabular-nums text-[#111315]">
                  {order.shippingFee === 0 ? 'FREE' : formatNaira(order.shippingFee)}
                </strong>
              </span>
              <span>
                Total Value:{' '}
                <strong className="font-mono tabular-nums text-[#111315]">
                  {formatNaira(order.total)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
