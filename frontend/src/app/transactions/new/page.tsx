"use client";

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/App.css';

type Transaction = {
  id: string;
  date: string;
  merchant: string;
  mcc: number;
  amount: number;
  card: string;
  category: string;
  reward: number;
  benefit: string;
  notes: string;
  bookedThroughPortal?: boolean;
};

const mccTable = [
  { mcc: 5411, description: 'Grocery Stores', category: 'Groceries' },
  { mcc: 5812, description: 'Eating Places, Restaurants', category: 'Dining' },
  { mcc: 5541, description: 'Service Stations', category: 'Fuel' },
  { mcc: 5912, description: 'Drug Stores and Pharmacies', category: 'Pharmacy' },
  { mcc: 5691, description: "Men's and Boys' Clothing", category: 'Clothing' },
  { mcc: 4814, description: 'Telecommunication Services', category: 'Communication' },
  { mcc: 5311, description: 'Department Stores', category: 'Department Store' },
  { mcc: 5999, description: 'Miscellaneous and Specialty Retailers', category: 'Miscellaneous' },
];

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
    mcc: 5411,
    amount: '',
    notes: '',
    bookedThroughPortal: false,
  });

  const [mccSearch, setMccSearch] = useState('');
  const [merchantQuery, setMerchantQuery] = useState('');

  const merchantSuggestions = useMemo(() => {
    if (!merchantQuery) return merchants.slice(0, 5);
    return merchants.filter((name) => name.toLowerCase().includes(merchantQuery.toLowerCase())).slice(0, 5);
  }, [merchants, merchantQuery]);

  const mccOptions = useMemo(() => {
    const query = mccSearch.trim().toLowerCase();
    if (!query) return mccTable;
    return mccTable.filter((item) =>
      item.mcc.toString().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query),
    );
  }, [mccSearch]);

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

    const targetMcc = mccTable.find((x) => x.mcc === Number(form.mcc));
    if (!targetMcc) {
      alert('Please select a valid MCC.');
      return;
    }

    const rewardBase = parsedAmount * 0.03;
    const reward = portalEligible && form.bookedThroughPortal ? parsedAmount * 0.05 : rewardBase;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: form.date,
      merchant: form.merchant,
      mcc: Number(form.mcc),
      amount: parsedAmount,
      card: form.card,
      category: targetMcc.category,
      reward,
      benefit: form.bookedThroughPortal ? `${targetMcc.category} portal bonus applied` : '',
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

      <form className="CardDetailsSection" onSubmit={handleSubmit}>
        <label>
          Card (Required)
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
        </label>

        <label>
          Transaction Date (Required)
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </label>

        <label>
          Merchant Name (Required)
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
        </label>

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

        <label>
          Merchant Category Code (MCC) (Required)
          <input
            type="text"
            value={mccSearch}
            onChange={(e) => setMccSearch(e.target.value)}
            placeholder="Search by MCC/description/category"
          />
          <select
            value={form.mcc}
            onChange={(e) => setForm((prev) => ({ ...prev, mcc: Number(e.target.value) }))}
            required
          >
            {mccOptions.map((item) => (
              <option key={item.mcc} value={item.mcc}>
                {item.mcc} - {item.description}
              </option>
            ))}
          </select>
        </label>

        <label>
          Amount (USD) (Required)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
        </label>

        <label>
          Notes (Optional)
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </label>

        {portalEligible && (
          <label>
            <input
              type="checkbox"
              checked={form.bookedThroughPortal}
              onChange={(e) => setForm((prev) => ({ ...prev, bookedThroughPortal: e.target.checked }))}
            />
            Booked through issuer portal for portal bonus (e.g., Chase 5x travel)
          </label>
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
