"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
};

const mccToCategory: Record<number, string> = {
  5411: 'Groceries',
  5812: 'Dining',
  5541: 'Fuel',
  5912: 'Pharmacy',
  5691: 'Clothing',
  4814: 'Communication',
  5311: 'Department Store',
  5999: 'Miscellaneous',
};

const sampleTransactions: Transaction[] = [
  {
    id: 'tx1',
    date: '2026-03-18',
    merchant: 'Amazon',
    mcc: 5311,
    amount: 42.17,
    card: 'Platinum 3472',
    category: 'Department Store',
    reward: 0.84,
    benefit: '5% cashback on groceries applied',
    notes: 'New headphones',
  },
  {
    id: 'tx2',
    date: '2026-03-17',
    merchant: 'Starbucks',
    mcc: 5812,
    amount: 6.89,
    card: 'Chroma Rewards 4481',
    category: 'Dining',
    reward: 0.69,
    benefit: '2x points promotion',
    notes: 'Morning coffee',
  },
  {
    id: 'tx3',
    date: '2026-03-16',
    merchant: 'Shell',
    mcc: 5541,
    amount: 55.0,
    card: 'Chroma Rewards 4481',
    category: 'Fuel',
    reward: 1.65,
    benefit: '3% gas bonus',
    notes: '',
  },
  {
    id: 'tx4',
    date: '2026-03-14',
    merchant: 'Whole Foods',
    mcc: 5411,
    amount: 87.34,
    card: 'Platinum 3472',
    category: 'Groceries',
    reward: 2.62,
    benefit: 'Grocery category credit',
    notes: 'Weekly shopping',
  },
  {
    id: 'tx5',
    date: '2026-03-13',
    merchant: 'CVS',
    mcc: 5912,
    amount: 23.76,
    card: 'Platinum 3472',
    category: 'Pharmacy',
    reward: 0.71,
    benefit: '',
    notes: 'Medicine refill',
  },
];

const currency = (value: number) => `$${value.toFixed(2)}`;

const TRANSACTIONS_STORAGE_KEY = 'capstone_transactions_v1';

export default function Page() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === 'undefined') return sampleTransactions;
    try {
      const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Transaction[];
    } catch {
      // ignore
    }
    return sampleTransactions;
  });

  const [selectedCard, setSelectedCard] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Transaction>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    date: '',
    merchant: '',
    mcc: 5411,
    amount: '',
    card: '',
    notes: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cardOptions = useMemo(() => {
    const cards = Array.from(new Set(transactions.map((tx) => tx.card)));
    return ['All Cards', ...cards];
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(Object.values(mccToCategory)));
    return ['All Categories', ...categories];
  }, []);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => (selectedCard === 'all' ? true : tx.card === selectedCard))
      .filter((tx) => (selectedCategory === 'all' ? true : tx.category === selectedCategory))
      .filter((tx) => {
        if (fromDate && tx.date < fromDate) return false;
        if (toDate && tx.date > toDate) return false;
        return true;
      })
      .filter((tx) => tx.merchant.toLowerCase().includes(search.toLowerCase()));
  }, [transactions, selectedCard, selectedCategory, fromDate, toDate, search]);

  const sorted = useMemo(() => {
    const sortedCopy = [...filtered];
    sortedCopy.sort((a, b) => {
      let aVal: string | number = a[sortBy];
      let bVal: string | number = b[sortBy];

      if (sortBy === 'date') {
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
    return sortedCopy;
  }, [filtered, sortBy, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const visibleTransactions = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const changeSort = (column: keyof Transaction) => {
    const nextDir = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDir(nextDir);
  };

  const applyAddOrUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleaned: Transaction = {
      id: editItem ? editItem.id : `tx-${Date.now()}`,
      date: form.date,
      merchant: form.merchant,
      mcc: Number(form.mcc),
      amount: Number(form.amount),
      card: form.card,
      category: mccToCategory[Number(form.mcc)] || 'Uncategorized',
      reward: Number(form.amount) * 0.03,
      benefit: form.notes.includes('cashback') ? form.notes : '',
      notes: form.notes,
    };

    setTransactions((curr) => {
      if (editItem) {
        return curr.map((tx) => (tx.id === editItem.id ? cleaned : tx));
      }
      return [cleaned, ...curr];
    });

    setEditItem(null);
    setShowModal(false);
    setForm({ date: '', merchant: '', mcc: 5411, amount: '', card: '', notes: '' });
  };

  const startEdit = (tx: Transaction) => {
    setEditItem(tx);
    setForm({ date: tx.date, merchant: tx.merchant, mcc: tx.mcc, amount: tx.amount.toString(), card: tx.card, notes: tx.notes });
    setShowModal(true);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((curr) => curr.filter((tx) => tx.id !== id));
  };

  const exportCsv = () => {
    const header = ['Date', 'Merchant', 'MCC', 'Amount', 'Card', 'Category', 'Rewards Earned', 'Benefit Applied', 'Notes'];

    const body = sorted.map((tx) => [
      tx.date,
      tx.merchant,
      tx.mcc,
      tx.amount.toFixed(2),
      tx.card,
      tx.category,
      tx.reward.toFixed(2),
      tx.benefit,
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

  const parseCsv = (text: string) => {
    const rows = text
      .trim()
      .split('\n')
      .map((row) => row.split(',').map((cell) => cell.replace(/(^"|"$)/g, '').trim()));

    const [headings, ...data] = rows;

    const neededColumns = {
      date: headings.indexOf('Date'),
      merchant: headings.indexOf('Merchant'),
      mcc: headings.indexOf('MCC'),
      amount: headings.indexOf('Amount'),
      card: headings.indexOf('Card'),
      notes: headings.indexOf('Notes'),
    };

    const imported = data
      .filter((row) => row.length >= 5)
      .map((row, idx) => {
        const mcc = Number(row[neededColumns.mcc] || 0) || 0;
        const amount = Number(row[neededColumns.amount] || 0) || 0;
        return {
          id: `imp-${Date.now()}-${idx}`,
          date: row[neededColumns.date] || '',
          merchant: row[neededColumns.merchant] || 'Imported',
          mcc,
          amount,
          card: row[neededColumns.card] || 'Imported Card',
          category: mccToCategory[mcc] || 'Uncategorized',
          reward: amount * 0.03,
          benefit: '',
          notes: row[neededColumns.notes] || '',
        };
      });

    setTransactions((curr) => [...imported, ...curr]);
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') parseCsv(text);
    };
    reader.readAsText(file);
  };

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
              onChange={(e) => {
                setSelectedCard(e.target.value);
                setPage(1);
              }}
            >
              {cardOptions.map((card) => (
                <option key={card} value={card === 'All Cards' ? 'all' : card}>
                  {card}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category === 'All Categories' ? 'all' : category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            Search merchant
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
                  { label: 'Date', key: 'date' },
                  { label: 'Merchant', key: 'merchant' },
                  { label: 'MCC', key: 'mcc' },
                  { label: 'Amount', key: 'amount' },
                  { label: 'Card', key: 'card' },
                  { label: 'Category', key: 'category' },
                  { label: 'Rewards Earned', key: 'reward' },
                  { label: 'Benefit Applied', key: 'benefit' },
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
              {visibleTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '1rem' }}>
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : (
                visibleTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>{tx.merchant}</td>
                    <td>{tx.mcc}</td>
                    <td style={{ textAlign: 'right', color: tx.amount >= 0 ? '#1f4d3a' : '#b42318' }}>
                      {tx.amount >= 0 ? '+' : '-'}{currency(Math.abs(tx.amount))}
                    </td>
                    <td>{tx.card}</td>
                    <td>{tx.category}</td>
                    <td style={{ textAlign: 'right' }}>{currency(tx.reward)}</td>
                    <td>{tx.benefit || '--'}</td>
                    <td>{tx.notes || '--'}</td>
                    <td>
                      <button onClick={() => startEdit(tx)} title="Edit" style={{ marginRight: '0.35rem' }}>
                        ✏️
                      </button>
                      <button onClick={() => deleteTransaction(tx.id)} title="Delete">
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
          <div>
            Page {page} of {pageCount}
          </div>
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

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '560px', maxWidth: '95%', padding: '1rem', boxShadow: '0 16px 34px rgba(0,0,0,0.25)' }}>
            <h2>{editItem ? 'Edit Transaction' : 'Log Transaction'}</h2>
            <form onSubmit={applyAddOrUpdate} style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label>
                  Date
                  <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </label>
                <label>
                  Merchant
                  <input type="text" required value={form.merchant} onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label>
                  MCC
                  <input type="number" required value={form.mcc} onChange={(e) => setForm((f) => ({ ...f, mcc: Number(e.target.value) }))} />
                </label>
                <label>
                  Amount
                  <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </label>
              </div>
              <label>
                Card Nickname + Last4
                <input type="text" required value={form.card} onChange={(e) => setForm((f) => ({ ...f, card: e.target.value }))} />
              </label>
              <label>
                Notes
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button type="button" className="CardDetailsButtonSecondary" onClick={() => { setShowModal(false); setEditItem(null); }}>
                  Cancel
                </button>
                <button type="submit" className="CardDetailsButtonPrimary">
                  {editItem ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={onFileSelected} />
    </div>
  );
}
