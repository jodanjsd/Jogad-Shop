import { useState, type FormEvent } from 'react';
import {
  ShieldCheck,
  Award,
  Truck,
  Headphones,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { ProductCategory, ShippingConfig } from '../types';
import { formatNaira } from '../utils/format';
import type { ActiveView } from './Header';

interface TrustAndFooterProps {
  shippingConfig: ShippingConfig;
  onNavigateView: (view: ActiveView) => void;
  onSelectCategory: (category: ProductCategory | 'All') => void;
}

export function TrustAndFooter({
  shippingConfig,
  onNavigateView,
  onSelectCategory,
}: TrustAndFooterProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribedMsg, setSubscribedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubscribedMsg(null);
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not subscribe.');
      } else {
        setSubscribedMsg('Subscribed to KoraTech launch drops & flash sale alerts.');
        setEmail('');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Why Buy From Us Trust Strip */}
      <section
        id="trust-strip"
        className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200 mt-10"
      >
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-[#111315]">
            Why Buy Directly From Jogad Nigeria
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Built for peace of mind with verified hardware, clear COD guardrails, and rapid nationwide hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <ShieldCheck className="w-6 h-6 text-[#4D8A00] mb-3" />
            <h3 className="font-display font-bold text-sm text-[#111315]">
              365-Day Official Warranty
            </h3>
            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              Direct 12-to-18 month hardware replacement warranty serviced at Lagos, Abuja, and PH care centers.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <Award className="w-6 h-6 text-[#4D8A00] mb-3" />
            <h3 className="font-display font-bold text-sm text-[#111315]">
              100% Authentic Serials
            </h3>
            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              Every device ships factory-sealed with serialized anti-counterfeit tracking verified at dispatch.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <Truck className="w-6 h-6 text-[#4D8A00] mb-3" />
            <h3 className="font-display font-bold text-sm text-[#111315]">
              Free Delivery Over {formatNaira(shippingConfig.freeShippingThreshold)}
            </h3>
            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              1–2 day Lagos metro riders and express nationwide air/road linehaul across 36 states & FCT.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <Headphones className="w-6 h-6 text-[#4D8A00] mb-3" />
            <h3 className="font-display font-bold text-sm text-[#111315]">
              Flexible Paystack, Flutterwave & COD
            </h3>
            <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
              Pay on delivery for orders under {formatNaira(shippingConfig.codMaxLimit)}, or prepay securely for higher-value kits.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Column Footer */}
      <footer id="site-footer" className="bg-[#111315] text-zinc-300 border-t border-zinc-800 no-print">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand & Customer Care Hours */}
          <div className="md:col-span-4 space-y-4">
            <div className="inline-block bg-white/95 rounded px-2.5 py-1">
              <img
                src="/src/assets/jogad/jogad-logo.webp"
                alt="Jogad"
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Official Jogad Nigerian direct-to-consumer store for power banks, wireless audio, laptops, smartwatches, and lifestyle gadgets.
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-[#82E600] shrink-0" />
                <span>Customer Service: Mon–Sat · 8:00 AM – 7:00 PM WAT</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="w-3.5 h-3.5 text-[#82E600] shrink-0" />
                <span className="font-mono tabular-nums">
                  WhatsApp Support: +234 809 555 0192 · +234 809 555 0193
                </span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Shop Gear
            </div>
            <ul className="space-y-2 text-xs">
              {(['All', 'Audio', 'Power', 'Smart & Office', 'Personal & Home'] as const).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateView('storefront');
                      onSelectCategory(cat);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#82E600] transition-colors text-left"
                  >
                    {cat === 'All' ? 'All Products' : cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Policies */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Orders & Policies
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateView('track');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#82E600] transition-colors"
                >
                  Track Your Order & Waybill
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateView('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#82E600] transition-colors"
                >
                  Operations & Logistics Admin
                </button>
              </li>
              <li className="text-zinc-400">
                7-Day Unopened Return Policy · 365-Day Replacement Warranty
              </li>
              <li className="text-zinc-400">
                COD Limit: Under {formatNaira(shippingConfig.codMaxLimit)} (Prepayment above)
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white">
              Flash Drop Alerts
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get notified on restocks, Lagos bundle deals, and new Jogad launches.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.ng"
                  aria-label="Email address for newsletter"
                  className="flex-1 min-w-0 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#82E600]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Subscribe to newsletter"
                  className="px-3.5 py-2 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-bold text-xs rounded-md transition-colors shrink-0 inline-flex items-center gap-1"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {subscribedMsg && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#82E600]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{subscribedMsg}</span>
                </div>
              )}
              {errorMsg && <div className="text-[11px] text-rose-400">{errorMsg}</div>}
            </form>
          </div>
        </div>

        <div className="border-t border-zinc-800">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500">
            <span>© 2026 Jogad Gadgets Nigeria. All rights reserved.</span>
            <span>Secured by Paystack & Flutterwave · Nationwide Express Dispatch</span>
          </div>
        </div>
      </footer>
    </>
  );
}
