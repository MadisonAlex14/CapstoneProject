"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserCards } from '../../../lib/functions/getUserCards';
import { getMccLookup } from '../../../lib/functions/getMccLookup';
import { upsertTransaction } from '../../../lib/functions/upsertTransaction';

type UserCard = {
  credit_card_id: string;
  nickname: string;
  last_four: string;
  credit_card_type: { name: string; issuer_id: string };
};

type MccResult = {
  mcc_id: string;
  code: string;
  description: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function Page() {
  const router = useRouter();

  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    credit_card_id: '',
    date: todayIso(),
    merchant: '',
    mcc_id: '',
    mcc_label: '',
    amount: '',
    notes: '',
    bookedThroughPortal: false,
  });

  const [mccSearch, setMccSearch] = useState('');
  const [mccResults, setMccResults] = useState<MccResult[]>([]);
  const [mccSearching, setMccSearching] = useState(false);
  const mccDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------- LOAD CARDS --------------------
  useEffect(() => {
    const loadCards = async () => {
      try {
        const localToken = localStorage.getItem('accessToken');
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        let accessToken: string | null = localToken;

        if (!accessToken && supabaseToken) {
          const session = JSON.parse(supabaseToken);
          accessToken = session?.currentSession?.access_token || session?.access_token || null;
        }

        if (!accessToken) throw new Error('No access token');

        const cards = await getUserCards(accessToken);
        setUserCards(cards ?? []);
        if (cards?.length > 0) {
          setForm((f) => ({ ...f, credit_card_id: cards[0].credit_card_id }));
        }
      } catch (err) {
        console.error('Failed to load cards', err);
      } finally {
        setLoadingCards(false);
      }
    };

    loadCards();
  }, []);

  // -------------------- MCC SEARCH --------------------
  useEffect(() => {
    if (mccDebounceRef.current) clearTimeout(mccDebounceRef.current);
    if (!mccSearch || mccSearch.length < 2) {
      setMccResults([]);
      return;
    }
    mccDebounceRef.current = setTimeout(async () => {
      setMccSearching(true);
      try {
        const localToken = localStorage.getItem('accessToken');
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        let accessToken: string | null = localToken;

        if (!accessToken && supabaseToken) {
          const session = JSON.parse(supabaseToken);
          accessToken = session?.currentSession?.access_token || session?.access_token || null;
        }

        if (accessToken) {
          const results = await getMccLookup(accessToken, mccSearch);
          setMccResults(results ?? []);
        }
      } catch (err) {
        console.error('MCC lookup failed', err);
        setMccResults([]);
      } finally {
        setMccSearching(false);
      }
    }, 300);
  }, [mccSearch]);

  // Portal eligible if selected card is Chase
  const portalEligible = useMemo(() => {
    const card = userCards.find((c) => c.credit_card_id === form.credit_card_id);
    const name = card?.credit_card_type?.name ?? '';
    return name.toLowerCase().includes('chase');
  }, [form.credit_card_id, userCards]);

  // -------------------- SUBMIT --------------------
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setFormError('');

    if (!form.credit_card_id || !form.date || !form.merchant || !form.mcc_id || !form.amount) {
      setFormError('Please fill all required fields.');
      return;
    }

    const parsedAmount = Number(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount === 0) {
      setFormError('Amount must be a valid non-zero number.');
      return;
    }

    setSaving(true);
    try {
      const localToken = localStorage.getItem('accessToken');
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      let accessToken: string | null = localToken;

      if (!accessToken && supabaseToken) {
        const session = JSON.parse(supabaseToken);
        accessToken = session?.currentSession?.access_token || session?.access_token || null;
      }

      if (!accessToken) throw new Error('No access token');

      await upsertTransaction(accessToken, {
        credit_card_id: form.credit_card_id,
        transaction_date: form.date,
        merchant_name: form.merchant,
        amount: parsedAmount,
        mcc_id: form.mcc_id,
        booked_through_issuer_portal: form.bookedThroughPortal,
        notes: form.notes,
      });

      router.push('/transactions');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save transaction');
      console.error('Error saving transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="main-content transactions-page CardDetailsPage">
      <h1>Add Transaction</h1>
      <p>Enter transaction details to add it into your portfolio.</p>

      <form className="CardDetailsSection modular-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Card (Required)</label>
          {loadingCards ? (
            <p>Loading cards...</p>
          ) : (
            <select
              value={form.credit_card_id}
              onChange={(e) => setForm((prev) => ({ ...prev, credit_card_id: e.target.value }))}
              required
            >
              <option value="">Select a card</option>
              {userCards.map((c) => (
                <option key={c.credit_card_id} value={c.credit_card_id}>
                  {c.nickname ? `${c.nickname} ••••${c.last_four}` : `${c.credit_card_type?.name} ••••${c.last_four}`}
                </option>
              ))}
            </select>
          )}
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
            onChange={(e) => setForm((prev) => ({ ...prev, merchant: e.target.value }))}
            placeholder="e.g. Chipotle Mexican Grill"
            required
          />
        </div>

        <div className="form-field">
          <label>Merchant Category Code (MCC) (Required)</label>
          {form.mcc_id ? (
            <div>
              <span>{form.mcc_label}</span>
              <button
                type="button"
                onClick={() => { setForm((f) => ({ ...f, mcc_id: '', mcc_label: '' })); setMccSearch(''); setMccResults([]); }}
                style={{ marginLeft: '0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={mccSearch}
                onChange={(e) => setMccSearch(e.target.value)}
                placeholder="Search by MCC code or description (e.g. Grocery, 5411)"
              />
              {mccSearching && <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0' }}>Searching...</p>}
              {mccResults.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '0.4rem 0', padding: 0, border: '1px solid #d8e5de', borderRadius: 10, maxHeight: 180, overflowY: 'auto', background: 'white' }}>
                  {mccResults.map((m) => (
                    <li
                      key={m.mcc_id}
                      style={{ padding: '0.45rem 0.65rem', cursor: 'pointer', borderBottom: '1px solid #edf2f7' }}
                      onClick={() => {
                        setForm((f) => ({ ...f, mcc_id: m.mcc_id, mcc_label: `${m.code} - ${m.description}` }));
                        setMccSearch('');
                        setMccResults([]);
                      }}
                    >
                      <strong>{m.code}</strong> — {m.description}
                    </li>
                  ))}
                </ul>
              )}
            </>
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
              {' '}Booked through issuer portal for portal bonus (e.g., Chase 5x travel)
            </label>
          </div>
        )}

        {formError && (
          <p style={{ color: '#b42318', fontSize: '0.875rem' }}>{formError}</p>
        )}

        <div className="CardDetailsActionRow">
          <button type="button" className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions')}>
            Cancel
          </button>
          <button type="submit" className="CardDetailsButtonPrimary" disabled={saving || !form.mcc_id}>
            {saving ? 'Saving...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
