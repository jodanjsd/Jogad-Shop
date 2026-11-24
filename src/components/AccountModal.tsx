import { useState, type FormEvent } from 'react';
import { X, MapPin, Plus, Trash2, LogOut, UserCheck } from 'lucide-react';
import type { CustomerAccount, DeliveryAddress } from '../types';
import { NIGERIAN_STATES } from '../utils/format';

interface AccountModalProps {
  account: CustomerAccount | null;
  onClose: () => void;
  onAccountUpdated: (account: CustomerAccount | null) => void;
}

export function AccountModal({ account, onClose, onAccountUpdated }: AccountModalProps) {
  const [contactInput, setContactInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');

  const handleLogin = async (e: FormEvent, overrideContact?: string) => {
    e.preventDefault();
    setError(null);
    const contact = overrideContact ?? contactInput;
    if (!contact.trim()) {
      setError('Enter your phone number or email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/accounts/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, name: nameInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
      } else {
        onAccountUpdated(data);
        setContactInput('');
      }
    } catch {
      setError('Network error signing in.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setError(null);
    setLoading(true);
    try {
      const payload: DeliveryAddress = {
        label: addrLabel || `${city || state}`,
        recipientName: recipientName || account.name,
        phone: phone || account.phone,
        email: email || account.email,
        state,
        city,
        streetAddress,
        landmark,
      };
      const res = await fetch(`/api/accounts/${account.id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save address.');
      } else {
        onAccountUpdated(data);
        setShowAddForm(false);
        setAddrLabel('');
        setCity('');
        setStreetAddress('');
        setLandmark('');
      }
    } catch {
      setError('Network error saving address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!account) return;
    const res = await fetch(`/api/accounts/${account.id}/addresses/${addrId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const updated = await res.json();
      onAccountUpdated(updated);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Customer Account and Saved Addresses"
    >
      <div className="bg-white w-full max-w-xl rounded-lg border border-zinc-200 shadow-2xl overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-[#111315]">
              {account ? 'Customer Account & Delivery Addresses' : 'Sign In or Continue as Guest'}
            </h2>
            <p className="text-xs text-zinc-500">
              {account
                ? `Signed in as ${account.name}`
                : 'Access saved Nigerian delivery addresses for faster checkout.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account dialog"
            className="p-2 text-zinc-500 hover:text-[#111315] rounded-md hover:bg-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              {error}
            </div>
          )}

          {!account ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111315] mb-1.5">
                  Phone Number or Email
                </label>
                <input
                  type="text"
                  required
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  placeholder="08031234567 or you@example.ng"
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111315] mb-1.5">
                  Full Name (for new accounts)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Chidi Okonkwo"
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:border-[#111315]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-xs font-bold rounded-md transition-colors"
                >
                  {loading ? 'Signing In...' : 'Continue with Phone / Email'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleLogin(e, 'chidi.okonkwo@example.ng')}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-[#111315] text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Use Demo Customer
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-md p-3.5">
                <div className="text-xs">
                  <div className="font-bold text-[#111315]">{account.name}</div>
                  <div className="text-zinc-500 font-mono mt-0.5">
                    {account.email || account.phone}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAccountUpdated(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-300 rounded hover:bg-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Saved Delivery Addresses ({account.addresses.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#4D8A00] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Address
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleAddAddress}
                  className="bg-zinc-50 border border-zinc-200 rounded-md p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Label (e.g. Home, Office)"
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Recipient Full Name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone (e.g. 0803...)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="City / LGA (e.g. Lekki, Wuse II)"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Street Address"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Nearest Landmark (Optional)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-md"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-zinc-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-[#111315] text-white text-xs font-semibold rounded"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {account.addresses.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center border border-dashed border-zinc-300 rounded-md">
                    No saved addresses yet. Add one above or during checkout.
                  </p>
                ) : (
                  account.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start justify-between gap-3 p-3.5 border border-zinc-200 rounded-md"
                    >
                      <div className="flex items-start gap-2.5 text-xs">
                        <MapPin className="w-4 h-4 text-[#4D8A00] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[#111315]">
                            {addr.label || addr.city} · {addr.recipientName}
                          </div>
                          <div className="text-zinc-600 mt-0.5">
                            {addr.streetAddress}, {addr.city}, {addr.state}
                          </div>
                          <div className="text-zinc-500 font-mono text-[11px] mt-0.5">
                            {addr.phone}
                          </div>
                        </div>
                      </div>
                      {addr.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id!)}
                          aria-label="Delete saved address"
                          className="text-zinc-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
