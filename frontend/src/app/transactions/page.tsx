"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserTransactions } from '../../lib/functions/getUserTransactions';
import { getUserCards } from '../../lib/functions/getUserCards';
import { upsertTransaction } from '../../lib/functions/upsertTransaction';
import { deleteTransaction } from '../../lib/functions/deleteTransaction';
import { getMccLookup } from '../../lib/functions/getMccLookup';

type Transaction = {
  transaction_id: string;
  transaction_date: string;
  merchant_name: string;
  mcc_code: string;
  mcc_description: string;
  mcc_id: string;
  amount: number;
  rewards_earned: number;
  rewards_currency: string;
  notes: string;
  credit_card_id: string;
  card_label: string;
};

type UserCard = {
  credit_card_id: string;
  nickname: string;
  last_four: string;
  credit_card_type: { name: string };
};

type MccResult = {
  mcc_id: string;
  code: string;
  description: string;
};

const currency = (value: number) => `$${value.toFixed(2)}`;

export default function Page() {
  const router = useRouter();
  const fetchGuard = useRef(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  const [selectedCard, setSelectedCard] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Transaction>('transaction_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    transaction_date: '',
    merchant_name: '',
    mcc_id: '',
    mcc_label: '',
    amount: '',
    credit_card_id: '',
    notes: '',
  });

  const [mccQuery, setMccQuery] = useState('');
  const [mccResults, setMccResults] = useState<MccResult[]>([]);
  const [mccSearching, setMccSearching] = useState(false);
  const mccDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------- DATA LOADING --------------------
  useEffect(() => {
    if (fetchGuard.current) return;
    fetchGuard.current = true;

    const loadData = async () => {
      try {
        const localToken = localStorage.getItem('accessToken');
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        let accessToken: string | null = localToken;

        if (!accessToken && supabaseToken) {
          const session = JSON.parse(supabaseToken);
          accessToken = session?.currentSession?.access_token || session?.access_token || null;
        }

        if (!accessToken) {
          throw new Error('No access token');
        }

        const [cardsData, txData] = await Promise.all([
          getUserCards(accessToken),
          getUserTransactions(accessToken),
        ]);

        setUserCards(cardsData ?? []);

        // txData is an array of cards with nested transactions — flatten it
        const flat: Transaction[] = [];
        for (const cardGroup of (txData ?? [])) {
          const cardLabel = cardGroup.nickname
            ? `${cardGroup.nickname} ••••${cardGroup.last_four}`
            : `${cardGroup.credit_card_type?.name ?? 'Card'} ••••${cardGroup.last_four}`;

          for (const tx of (cardGroup.transaction ?? [])) {
            flat.push({
              transaction_id: tx.transaction_id,
              transaction_date: tx.transaction_date,
              merchant_name: tx.merchant_name,
              mcc_code: tx.mcc?.code ?? '',
              mcc_description: tx.mcc?.description ?? '',
              mcc_id: tx.mcc_id ?? '',
              amount: tx.amount,
              rewards_earned: tx.rewards_earned ?? 0,
              rewards_currency: tx.rewards_currency ?? '',
              notes: tx.notes ?? '',
              credit_card_id: cardGroup.credit_card_id,
              card_label: cardLabel,
            });
          }
        }

        setTransactions(flat);
      } catch (err: any) {
        console.warn('Failed to load transactions', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // -------------------- MCC SEARCH --------------------
  useEffect(() => {
    if (mccDebounceRef.current) clearTimeout(mccDebounceRef.current);
    if (!mccQuery || mccQuery.length < 2) {
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
          const results = await getMccLookup(accessToken, mccQuery);
          setMccResults(results ?? []);
        }
      } catch (err) {
        console.error('MCC lookup failed', err);
        setMccResults([]);
      } finally {
        setMccSearching(false);
      }
    }, 300);
  }, [mccQuery]);

  // -------------------- FILTERS + SORT --------------------
  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => selectedCard === 'all' || tx.credit_card_id === selectedCard)
      .filter((tx) => {
        if (fromDate && tx.transaction_date < fromDate) return false;
        if (toDate && tx.transaction_date > toDate) return false;
        return true;
      })
      .filter((tx) => tx.merchant_name.toLowerCase().includes(search.toLowerCase()));
  }, [transactions, selectedCard, fromDate, toDate, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: string | number = a[sortBy] ?? '';
      let bVal: string | number = b[sortBy] ?? '';

      if (sortBy === 'transaction_date') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const visible = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const changeSort = (column: keyof Transaction) => {
    const nextDir = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDir(nextDir);
  };

  // -------------------- SAVE (ADD / EDIT) --------------------
  const handleSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setFormError('');

    if (!form.credit_card_id || !form.mcc_id) {
      setFormError('Please select a card and an MCC category.');
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

      if (!accessToken) {
        throw new Error('No access token');
      }

      await upsertTransaction(accessToken, {
        transaction_id: editItem?.transaction_id,
        credit_card_id: form.credit_card_id,
        transaction_date: form.transaction_date,
        merchant_name: form.merchant_name,
        amount: Number(form.amount),
        mcc_id: form.mcc_id,
        notes: form.notes,
      });

      // Re-fetch after save so rewards_earned reflects server calculation
      const txData = await getUserTransactions(accessToken);
      const flat: Transaction[] = [];
      for (const cardGroup of (txData ?? [])) {
        const cardLabel = cardGroup.nickname
          ? `${cardGroup.nickname} ••••${cardGroup.last_four}`
          : `${cardGroup.credit_card_type?.name ?? 'Card'} ••••${cardGroup.last_four}`;
        for (const tx of (cardGroup.transaction ?? [])) {
          flat.push({
            transaction_id: tx.transaction_id,
            transaction_date: tx.transaction_date,
            merchant_name: tx.merchant_name,
            mcc_code: tx.mcc?.code ?? '',
            mcc_description: tx.mcc?.description ?? '',
            mcc_id: tx.mcc_id ?? '',
            amount: tx.amount,
            rewards_earned: tx.rewards_earned ?? 0,
            rewards_currency: tx.rewards_currency ?? '',
            notes: tx.notes ?? '',
            credit_card_id: cardGroup.credit_card_id,
            card_label: cardLabel,
          });
        }
      }
      setTransactions(flat);

      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save transaction');
      console.error('Error saving transaction:', err);
    } finally {
      setSaving(false);
    }
  };

  // -------------------- DELETE --------------------
  const handleDelete = async (transactionId: string) => {
    if (!window.confirm('Delete this transaction?')) return;

    try {
      const localToken = localStorage.getItem('accessToken');
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      let accessToken: string | null = localToken;

      if (!accessToken && supabaseToken) {
        const session = JSON.parse(supabaseToken);
        accessToken = session?.currentSession?.access_token || session?.access_token || null;
      }

      if (!accessToken) {
        throw new Error('No access token');
      }

      await deleteTransaction(accessToken, transactionId);
      setTransactions((curr) => curr.filter((tx) => tx.transaction_id !== transactionId));
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
    }
  };

  // -------------------- MODAL --------------------
  const openEdit = (tx: Transaction) => {
    setEditItem(tx);
    setFormError('');
    setForm({
      transaction_date: tx.transaction_date,
      merchant_name: tx.merchant_name,
      mcc_id: tx.mcc_id,
      mcc_label: tx.mcc_code ? `${tx.mcc_code} – ${tx.mcc_description}` : '',
      amount: tx.amount.toString(),
      credit_card_id: tx.credit_card_id,
      notes: tx.notes,
    });
    setMccQuery('');
    setMccResults([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormError('');
    setMccQuery('');
    setMccResults([]);
  };

  // -------------------- CSV EXPORT --------------------
  const exportCsv = () => {
    const header = ['Date', 'Merchant', 'MCC Code', 'MCC Description', 'Amount', 'Card', 'Rewards Earned', 'Rewards Currency', 'Notes'];
    const body = sorted.map((tx) => [
      tx.transaction_date,
      tx.merchant_name,
      tx.mcc_code,
      tx.mcc_description,
      tx.amount.toFixed(2),
      tx.card_label,
      tx.rewards_earned.toFixed(2),
      tx.rewards_currency,
      tx.notes,
    ]);
    const csvContent = [header, ...body]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // -------------------- RENDER --------------------
  if (loading) {
    return <div className="main-content transactions-page CardDetailsPage"><p>Loading transactions...</p></div>;
  }

  return (
    <div className="main-content transactions-page CardDetailsPage">
      <h1>Transactions</h1>
      <p>View and manage all of your recent credit card transactions here.</p>

      <section className="CardDetailsSection">
        <div className="CardDetailsActionRow">
          <label>
            Card
            <select
              value={selectedCard}
              onChange={(e) => { setSelectedCard(e.target.value); setPage(1); }}
            >
              <option value="all">All Cards</option>
              {userCards.map((c) => (
                <option key={c.credit_card_id} value={c.credit_card_id}>
                  {c.nickname ? `${c.nickname} ••••${c.last_four}` : `${c.credit_card_type?.name} ••••${c.last_four}`}
                </option>
              ))}
            </select>
          </label>

          <label>
            From
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          </label>

          <label>
            To
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
          </label>

          <label>
            Search merchant
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search merchant name"
            />
          </label>

          <button className="CardDetailsButtonPrimary" onClick={() => router.push('/transactions/new')}>
            + Log Transaction
          </button>
          <button className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions/import')}>
            Import Transactions
          </button>
          <button className="CardDetailsButtonSecondary" onClick={exportCsv}>
            Export CSV
          </button>
        </div>

        <div className="transactions-table-wrapper">
          <table className="CardDashboardTable">
            <thead>
              <tr>
                {[
                  { label: 'Date', key: 'transaction_date' },
                  { label: 'Merchant', key: 'merchant_name' },
                  { label: 'MCC', key: 'mcc_code' },
                  { label: 'Amount', key: 'amount' },
                  { label: 'Card', key: 'card_label' },
                  { label: 'Rewards Earned', key: 'rewards_earned' },
                  { label: 'Notes', key: 'notes' },
                  { label: 'Actions', key: 'actions' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'actions' && changeSort(col.key as keyof Transaction)}
                    style={{ cursor: col.key !== 'actions' ? 'pointer' : 'default' }}
                  >
                    {col.label}
                    {sortBy === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '1rem' }}>
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : (
                visible.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td>{tx.transaction_date}</td>
                    <td>{tx.merchant_name}</td>
                    <td title={tx.mcc_description}>{tx.mcc_code}</td>
                    <td style={{ textAlign: 'right', color: '#1f4d3a' }}>
                      +{currency(tx.amount)}
                    </td>
                    <td>{tx.card_label}</td>
                    <td style={{ textAlign: 'right' }}>
                      {tx.rewards_currency === 'cash' ? tx.rewards_earned.toFixed(2) : tx.rewards_earned} {tx.rewards_currency}
                    </td>
                    <td>{tx.notes || '--'}</td>
                    <td>
                      <button onClick={() => openEdit(tx)} title="Edit" style={{ marginRight: '0.35rem' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(tx.transaction_id)} title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="transactions-pagination">
          <div>Page {page} of {pageCount}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="CardDetailsButtonSecondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <button className="CardDetailsButtonSecondary" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '560px', maxWidth: '95%', padding: '1.5rem', boxShadow: '0 16px 34px rgba(0,0,0,0.25)' }}>
            <h2>Edit Transaction</h2>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label>
                  Date
                  <input
                    type="date"
                    required
                    value={form.transaction_date}
                    onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))}
                  />
                </label>
                <label>
                  Merchant
                  <input
                    type="text"
                    required
                    value={form.merchant_name}
                    onChange={(e) => setForm((f) => ({ ...f, merchant_name: e.target.value }))}
                  />
                </label>
              </div>

              <label>
                Card
                <select
                  required
                  value={form.credit_card_id}
                  onChange={(e) => setForm((f) => ({ ...f, credit_card_id: e.target.value }))}
                >
                  <option value="">Select a card</option>
                  {userCards.map((c) => (
                    <option key={c.credit_card_id} value={c.credit_card_id}>
                      {c.nickname ? `${c.nickname} ••••${c.last_four}` : `${c.credit_card_type?.name} ••••${c.last_four}`}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount ($)
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </label>

              <label>
                MCC Category
                {form.mcc_id && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#374151' }}>
                    Selected: {form.mcc_label}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mcc_id: '', mcc_label: '' }))}
                      style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ✕ clear
                    </button>
                  </span>
                )}
                {!form.mcc_id && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by description or code (e.g. Grocery, 5411)"
                      value={mccQuery}
                      onChange={(e) => setMccQuery(e.target.value)}
                    />
                    {mccSearching && <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Searching...</p>}
                    {mccResults.length > 0 && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                        maxHeight: '160px', overflowY: 'auto', margin: 0, padding: 0,
                        listStyle: 'none', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}>
                        {mccResults.map((m) => (
                          <li
                            key={m.mcc_id}
                            onClick={() => {
                              setForm((f) => ({ ...f, mcc_id: m.mcc_id, mcc_label: `${m.code} – ${m.description}` }));
                              setMccQuery('');
                              setMccResults([]);
                            }}
                            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                          >
                            <strong>{m.code}</strong> — {m.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </label>

              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </label>

              {formError && (
                <p style={{ color: '#b42318', fontSize: '0.875rem', margin: 0 }}>{formError}</p>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button type="button" className="CardDetailsButtonSecondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="CardDetailsButtonPrimary" disabled={saving || !form.mcc_id}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
