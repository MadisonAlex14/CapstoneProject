"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMccLookup } from '@/lib/functions/getMccLookup';
import '@/App.css';

type Transaction = {
  id: string;
  date: string;
  merchant: string;
  mcc: string;
  amount: number;
  card: string;
  category: string;
  reward: number;
  benefit: string;
  notes: string;
  bookedThroughPortal?: boolean;
};

type MccOption = {
  mcc_id: string;
  code: string;
  description: string;
};

const STORAGE_KEY = 'capstone_transactions_v1';

function getSavedTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved) as Transaction[];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: Transaction[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

const sampleCardOptions = ['Platinum 3472', 'Chase Sapphire Preferred 1234', 'Chroma Rewards 4481'];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectCard = searchParams.get('cardId') || '';

  const transactions = useMemo(() => getSavedTransactions(), []);
  const availableCards = useMemo(() => {
    const sourceCards = new Set(sampleCardOptions);
    transactions.forEach((t) => sourceCards.add(t.card));
    return Array.from(sourceCards);
  }, [transactions]);

  const merchants = useMemo(() => {
    const names = Array.from(new Set(transactions.map((tx) => tx.merchant).filter(Boolean)));
    return names.sort();
  }, [transactions]);

  const [form, setForm] = useState({
    card: preselectCard || availableCards[0] || '',
    date: todayIso(),
    merchant: '',
    mcc: '',
    amount: '',
    notes: '',
    bookedThroughPortal: false,
  });

  const [mccSearch, setMccSearch] = useState('');
  const [merchantQuery, setMerchantQuery] = useState('');
  const [mccOptions, setMccOptions] = useState<MccOption[]>([]);
  const [isLoadingMcc, setIsLoadingMcc] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get access token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
  }, []);

  // Fetch MCC options when search changes
  useEffect(() => {
    if (!accessToken || !mccSearch.trim()) {
      setMccOptions([]);
      return;
    }

    const fetchMccOptions = async () => {
      setIsLoadingMcc(true);
      try {
        const results = await getMccLookup(accessToken, mccSearch);
        setMccOptions(results);
      } catch (error) {
        console.error('Failed to fetch MCC options:', error);
        setMccOptions([]);
      } finally {
        setIsLoadingMcc(false);
      }
    };

    // Debounce the search
    const timer = setTimeout(fetchMccOptions, 300);
    return () => clearTimeout(timer);
  }, [mccSearch, accessToken]);

  const merchantSuggestions = useMemo(() => {
    if (!merchantQuery) return merchants.slice(0, 5);
    return merchants.filter((name) => name.toLowerCase().includes(merchantQuery.toLowerCase())).slice(0, 5);
  }, [merchants, merchantQuery]);

  const portalEligible = form.card.toLowerCase().includes('chase');

  const handleMerchantSelect = (name: string) => {
    const existing = transactions.find((tx) => tx.merchant.toLowerCase() === name.toLowerCase());
    setForm((prev) => ({
      ...prev,
      merchant: name,
      mcc: existing?.mcc ?? prev.mcc,
    }));
    setMerchantQuery('');
  };

  const handleMccSelect = (option: MccOption) => {
    setForm((prev) => ({
      ...prev,
      mcc: option.code,
    }));
    setMccSearch('');
    setMccOptions([]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.card || !form.date || !form.merchant || !form.mcc || !form.amount) {
      alert('Please fill all required fields.');
      return;
    }

    const parsedAmount = Number(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount === 0) {
      alert('Amount must be a valid non-zero number.');
      return;
    }

    const selectedMcc = mccOptions.find((x) => x.code === form.mcc);
    const category = selectedMcc?.description || 'Other';

    const rewardBase = parsedAmount * 0.03;
    const reward = portalEligible && form.bookedThroughPortal ? parsedAmount * 0.05 : rewardBase;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: form.date,
      merchant: form.merchant,
      mcc: form.mcc,
      amount: parsedAmount,
      card: form.card,
      category: category,
      reward,
      benefit: form.bookedThroughPortal ? `${category} portal bonus applied` : '',
      notes: form.notes,
      bookedThroughPortal: form.bookedThroughPortal,
    };

    const current = getSavedTransactions();
    const next = [newTx, ...current];
    saveTransactions(next);

    router.push('/transactions');
  };

  return (
    <div className="main-content transactions-page CardDetailsPage">
      <h1>Add Transaction</h1>
      <p>Enter transaction details to add it into your portfolio.</p>

      <form className="CardDetailsSection modular-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Card (Required)</label>
          <select
            value={form.card}
            onChange={(e) => setForm((prev) => ({ ...prev, card: e.target.value }))}
            required
          >
            {availableCards.map((card) => (
              <option key={card} value={card}>
                {card}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Transaction Date (Required)</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>

        <div className="form-field">
          <label>Merchant Name (Required)</label>
          <input
            type="text"
            value={form.merchant}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, merchant: e.target.value }));
              setMerchantQuery(e.target.value);
            }}
            placeholder="e.g. Chipotle Mexican Grill"
            required
          />
          {merchantSuggestions.length > 0 && form.merchant && (
            <ul style={{ listStyle: 'none', margin: '0.4rem 0', padding: 0, border: '1px solid #d8e5de', borderRadius: 10, maxHeight: 150, overflowY: 'auto', background: 'white' }}>
              {merchantSuggestions.map((name) => (
                <li
                  key={name}
                  style={{ padding: '0.45rem 0.65rem', cursor: 'pointer', borderBottom: '1px solid #edf2f7' }}
                  onClick={() => handleMerchantSelect(name)}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-field">
          <label>Merchant Category Code (MCC) (Required)</label>
          <input
            type="text"
            value={mccSearch}
            onChange={(e) => setMccSearch(e.target.value)}
            placeholder="Search by MCC code or description"
          />
          {isLoadingMcc && <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.3rem' }}>Loading MCC options...</p>}
          {mccOptions.length > 0 && mccSearch && (
            <ul style={{ listStyle: 'none', margin: '0.4rem 0', padding: 0, border: '1px solid #d8e5de', borderRadius: 10, maxHeight: 200, overflowY: 'auto', background: 'white' }}>
              {mccOptions.map((option) => (
                <li
                  key={option.mcc_id}
                  style={{ padding: '0.6rem 0.65rem', cursor: 'pointer', borderBottom: '1px solid #edf2f7' }}
                  onClick={() => handleMccSelect(option)}
                >
                  <strong>{option.code}</strong> - {option.description}
                </li>
              ))}
            </ul>
          )}
          {form.mcc && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0f8f5', borderRadius: 5, fontSize: '0.9rem' }}>
              Selected MCC: <strong>{form.mcc}</strong>
            </div>
          )}
        </div>

        <div className="form-field">
          <label>Amount (USD) (Required)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>

        <div className="form-field">
          <label>Notes (Optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {portalEligible && (
          <div className="form-field">
            <label>
              <input
                type="checkbox"
                checked={form.bookedThroughPortal}
                onChange={(e) => setForm((prev) => ({ ...prev, bookedThroughPortal: e.target.checked }))}
              />
              Booked through issuer portal for portal bonus (e.g., Chase 5x travel)
            </label>
          </div>
        )}

        <div className="CardDetailsActionRow">
          <button type="button" className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions')}>
            Cancel
          </button>
          <button type="submit" className="CardDetailsButtonPrimary">
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
}
