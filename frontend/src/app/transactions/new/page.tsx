"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/auth.module.css';
import { getUserCards } from '../../../lib/functions/getUserCards';
import { getMccLookup } from '../../../lib/functions/getMccLookup';
import { upsertTransaction } from '../../../lib/functions/upsertTransaction';
import { logBenefitUsage } from '../../../lib/functions/logBenefitUsage';

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

type TriggeredBenefit = {
  benefit_id: string;
  name: string;
  value_amount: number;
  value_unit: string;
  remaining: number;
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

  // -------------------- BENEFIT PROMPT STATE --------------------
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [triggeredBenefits, setTriggeredBenefits] = useState<TriggeredBenefit[]>([]);
  const [pendingTransactionId, setPendingTransactionId] = useState('');
  const [pendingCardId, setPendingCardId] = useState('');
  const [pendingDate, setPendingDate] = useState('');
  const [pendingMerchant, setPendingMerchant] = useState('');
  const [pendingAmount, setPendingAmount] = useState(0);
  const [benefitAmounts, setBenefitAmounts] = useState<Record<string, string>>({});
  const [benefitChecked, setBenefitChecked] = useState<Record<string, boolean>>({});
  const [benefitErrors, setBenefitErrors] = useState<Record<string, string>>({});
  const [loggingBenefits, setLoggingBenefits] = useState(false);

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

      const result = await upsertTransaction(accessToken, {
        credit_card_id: form.credit_card_id,
        transaction_date: form.date,
        merchant_name: form.merchant,
        amount: parsedAmount,
        mcc_id: form.mcc_id,
        booked_through_issuer_portal: form.bookedThroughPortal,
        notes: form.notes,
      });

      const benefits: TriggeredBenefit[] = result.triggered_benefits ?? [];
      if (benefits.length > 0) {
        // Pre-fill amounts to min(transaction amount, benefit remaining)
        const amounts: Record<string, string> = {};
        const checked: Record<string, boolean> = {};
        for (const b of benefits) {
          amounts[b.benefit_id] = String(Math.min(parsedAmount, b.remaining));
          checked[b.benefit_id] = true;
        }
        setTriggeredBenefits(benefits);
        setPendingTransactionId(result.data.transaction_id);
        setPendingCardId(form.credit_card_id);
        setPendingDate(form.date);
        setPendingMerchant(form.merchant);
        setPendingAmount(parsedAmount);
        setBenefitAmounts(amounts);
        setBenefitChecked(checked);
        setShowBenefitModal(true);
      } else {
        router.push('/transactions');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save transaction');
      console.error('Error saving transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  // -------------------- BENEFIT LOGGING --------------------
  const formatBenefitAmount = (amount: number, unit: string) => {
    if (unit === 'dollars' || unit === 'usd' || unit === 'cash') return `$${amount.toFixed(2)}`;
    return `${amount.toLocaleString()} ${unit}`;
  };

  const handleLogBenefits = async () => {
    // Validate all checked benefits before making any calls
    const errors: Record<string, string> = {};
    for (const b of triggeredBenefits) {
      if (!benefitChecked[b.benefit_id]) continue;
      const amount = Number(benefitAmounts[b.benefit_id]);
      if (!amount || amount <= 0) {
        errors[b.benefit_id] = 'Amount must be greater than 0.';
      } else if (amount > pendingAmount) {
        errors[b.benefit_id] = `Cannot exceed transaction amount (${formatBenefitAmount(pendingAmount, b.value_unit)}).`;
      } else if (amount > b.remaining) {
        errors[b.benefit_id] = `Cannot exceed remaining balance (${formatBenefitAmount(b.remaining, b.value_unit)}).`;
      }
    }
    if (Object.keys(errors).length > 0) {
      setBenefitErrors(errors);
      return;
    }

    setLoggingBenefits(true);
    try {
      const localToken = localStorage.getItem('accessToken');
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      let accessToken: string | null = localToken;
      if (!accessToken && supabaseToken) {
        const session = JSON.parse(supabaseToken);
        accessToken = session?.currentSession?.access_token || session?.access_token || null;
      }
      if (!accessToken) throw new Error('No access token');

      // Sequential — if one fails we catch it and stop rather than leaving partial state
      for (const b of triggeredBenefits) {
        if (!benefitChecked[b.benefit_id]) continue;
        await logBenefitUsage(accessToken, {
          benefit_id: b.benefit_id,
          credit_card_id: pendingCardId,
          transaction_id: pendingTransactionId,
          amount: Number(benefitAmounts[b.benefit_id]),
          usage_date: pendingDate,
          merchant_name: pendingMerchant,
        });
      }

      router.push('/transactions');
    } catch (err: any) {
      setBenefitErrors({ _general: err.message || 'Failed to log benefit usage.' });
    } finally {
      setLoggingBenefits(false);
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="main-content transactions-page CardDetailsPage">
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Add Transaction</h1>
        <p className={styles.PageSubtitle}>Enter transaction details to add it into your portfolio.</p>
      </div>

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

      {/* Triggered Benefits Modal */}
      {showBenefitModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxWidth: '95%', padding: '1.5rem', boxShadow: '0 16px 34px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 0.25rem' }}>Benefits Detected</h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: '#6b7280' }}>
              This transaction may qualify for the following benefits. Uncheck any you don't want to apply.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {triggeredBenefits.map((b) => (
                <div key={b.benefit_id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', background: benefitChecked[b.benefit_id] ? '#f9fffe' : '#f9fafb' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={benefitChecked[b.benefit_id] ?? true}
                      onChange={(e) => {
                        setBenefitChecked((prev) => ({ ...prev, [b.benefit_id]: e.target.checked }));
                        setBenefitErrors((prev) => { const next = { ...prev }; delete next[b.benefit_id]; return next; });
                      }}
                      style={{ marginTop: '0.2rem', width: '18px', height: '18px', cursor: 'pointer', accentColor: '#314634', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, margin: '0 0 0.15rem', fontSize: '0.95rem' }}>{b.name}</p>
                      <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 0.6rem' }}>
                        {formatBenefitAmount(b.remaining, b.value_unit)} remaining of {formatBenefitAmount(b.value_amount, b.value_unit)} total
                      </p>
                      {benefitChecked[b.benefit_id] && (
                        <label style={{ fontSize: '0.875rem', display: 'block' }}>
                          Amount to apply ({b.value_unit})
                          <input
                            type="number"
                            min="0.01"
                            max={Math.min(pendingAmount, b.remaining)}
                            step="0.01"
                            value={benefitAmounts[b.benefit_id] ?? ''}
                            onChange={(e) => {
                              setBenefitAmounts((prev) => ({ ...prev, [b.benefit_id]: e.target.value }));
                              setBenefitErrors((prev) => { const next = { ...prev }; delete next[b.benefit_id]; return next; });
                            }}
                            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.3rem', backgroundColor: '#e1f5e7', border: '2px solid #314634', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                          />
                          {benefitErrors[b.benefit_id] && (
                            <p style={{ color: '#b42318', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{benefitErrors[b.benefit_id]}</p>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {benefitErrors._general && (
              <p style={{ color: '#b42318', fontSize: '0.875rem', margin: '1rem 0 0' }}>{benefitErrors._general}</p>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="CardDetailsButtonSecondary"
                onClick={() => router.push('/transactions')}
                disabled={loggingBenefits}
              >
                Skip
              </button>
              <button
                type="button"
                className="CardDetailsButtonPrimary"
                onClick={handleLogBenefits}
                disabled={loggingBenefits || triggeredBenefits.every((b) => !benefitChecked[b.benefit_id])}
                style={triggeredBenefits.every((b) => !benefitChecked[b.benefit_id]) ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                {loggingBenefits ? 'Logging...' : 'Log Benefits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
