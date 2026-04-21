"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/App.css';
import styles from '../../../styles/auth.module.css';

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

type ImportRow = {
  transaction_date: string;
  merchant_name: string;
  mcc_id: string;
  amount: string;
  notes: string;
  errors: string[];
};

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [card, setCard] = useState(sampleCardOptions[0]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileError, setFileError] = useState('');
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  const validateRow = (raw: Partial<ImportRow>): ImportRow => {
    const errors: string[] = [];

    const dateVal = raw.transaction_date?.trim() || '';
    if (!dateVal) errors.push('transaction_date required');

    const merchant = raw.merchant_name?.trim() || '';
    if (!merchant) errors.push('merchant_name required');

    const mccString = raw.mcc_id?.trim() || '';
    if (!/^[0-9]{4}$/.test(mccString)) {
      errors.push('mcc_id must be 4-digit');
    } else if (!Object.keys(mccToCategory).includes(String(Number(mccString)))) {
      errors.push('mcc_id not recognized');
    }

    const amountVal = Number(raw.amount);
    if (Number.isNaN(amountVal)) {
      errors.push('amount required numeric');
    }

    return {
      transaction_date: dateVal,
      merchant_name: merchant,
      mcc_id: mccString,
      amount: raw.amount || '',
      notes: raw.notes || '',
      errors: errors.length > 0 ? errors : [], // Default to an empty array if no errors
    };
  };

  const onFile = async (file: File) => {
    setFileError('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      const text = await file.text();
      const parsed = text
        .trim()
        .split('\n')
        .map((line) => line.split(',').map((cell) => cell.replace(/(^"|"$)/g, '').trim()));
      if (parsed.length < 2) { setFileError('CSV has no data'); return; }
      const [header, ...body] = parsed;
      const keyMap = {
        transaction_date: header.indexOf('transaction_date'),
        merchant_name: header.indexOf('merchant_name'),
        mcc_id: header.indexOf('mcc_id'),
        amount: header.indexOf('amount'),
        notes: header.indexOf('notes'),
      };
      const newRows = body.map((row) => validateRow({
        transaction_date: row[keyMap.transaction_date],
        merchant_name: row[keyMap.merchant_name],
        mcc_id: row[keyMap.mcc_id],
        amount: row[keyMap.amount],
        notes: row[keyMap.notes],
      }));
      setRows(newRows);
      setStep(3);
    } else if (extension === 'xlsx') {
      setFileError('XLSX support not available in this build. Please use CSV.');
      return;
    } else {
      setFileError('File type must be .csv or .xlsx');
      return;
    }
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) await onFile(file);
  };

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onFile(file);
  };

  const handleRemove = (index: number) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== index));
  };

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);

  const importRows = () => {
    const valid = validRows.map((row) => {
      const mccVal = Number(row.mcc);
      const amountVal = Number(row.amount);
      return {
        id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: row.transaction_date.includes('/') ? row.transaction_date.split('/').map((p, i) => (i===2 ? p : p.padStart(2,'0')).toString()).join('-') : row.transaction_date,
        merchant: row.merchant_name,
        mcc: mccVal,
        amount: amountVal,
        card,
        category: mccToCategory[mccVal] || 'Uncategorized',
        reward: amountVal * 0.03,
        benefit: '',
        notes: row.notes,
      };
    });

    const existing = getSavedTransactions();
    const next = [...valid, ...existing];
    saveTransactions(next);
    router.push('/transactions');
  };

  const handleEdit = (index: number) => {
    setEditingRowIndex(index);
  };

  const handleSave = (index: number, updatedRow: ImportRow) => {
    setRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index] = updatedRow;
      return newRows;
    });
    setEditingRowIndex(null);
  };

  const handleInputChange = (index: number, field: keyof ImportRow, value: string) => {
    setRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  return (
    <div className="main-content transactions-page CardDetailsPage">
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Import Transactions</h1>
        <p className={styles.PageSubtitle}>Import multiple transactions from CSV (or XLSX when supported).</p>
      </div>

      <div className="CardDetailsSection">
        <h2>Step {step}: {step === 1 ? 'Select Card' : step === 2 ? 'Upload File' : 'Preview & Confirm'}</h2>

        {step === 1 && (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <label>
              Card
              <select value={card} onChange={(e) => setCard(e.target.value)}>
                {sampleCardOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="CardDetailsActionRow">
              <button className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions')}>Cancel</button>
              <button className="CardDetailsButtonPrimary" onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              style={{ padding: '1.1rem', border: '2px dashed #a7aaaf', borderRadius: '14px', textAlign: 'center', background: '#f5fafd', cursor: 'pointer' }}
            >
              Drag and drop .csv (or .xlsx) here, or <label htmlFor="import-file" style={{ color: '#1f4d3a', cursor: 'pointer', textDecoration: 'underline' }}>browse</label>.
              <input id="import-file" type="file" accept=".csv,.xlsx" hidden onChange={onFileInput} />
            </div>
            <p>
              <a href="/transactions-import-template.csv" download>Download template file</a> (transaction_date, merchant_name, mcc, amount, notes)
            </p>
            {fileError && <p style={{ color: 'red' }}>{fileError}</p>}
            <div className="CardDetailsActionRow">
              <button className="CardDetailsButtonSecondary" onClick={() => setStep(1)}>Back</button>
              <button
                className="CardDetailsButtonPrimary"
                onClick={() => {
                  if (!rows.length) {
                    setFileError('Please upload a file first.');
                    return;
                  }
                  setStep(3);
                }}
              >
                Preview
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="CardDashboardTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>MCC</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Errors</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className={row.errors.length > 0 ? 'error-row' : ''}>
                    {editingRowIndex === index ? (
                      <>
                        <td><input value={row.transaction_date} onChange={(e) => handleInputChange(index, 'transaction_date', e.target.value)} /></td>
                        <td><input value={row.merchant_name} onChange={(e) => handleInputChange(index, 'merchant_name', e.target.value)} /></td>
                        <td><input value={row.mcc_id} onChange={(e) => handleInputChange(index, 'mcc_id', e.target.value)} /></td>
                        <td><input value={row.amount} onChange={(e) => handleInputChange(index, 'amount', e.target.value)} /></td>
                        <td><input value={row.notes} onChange={(e) => handleInputChange(index, 'notes', e.target.value)} /></td>
                        <td>
                          <button onClick={() => handleSave(index, row)}>
                            <span role="img" aria-label="Save">💾</span>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{row.transaction_date}</td>
                        <td>{row.merchant_name}</td>
                        <td>{row.mcc_id}</td>
                        <td>{row.amount}</td>
                        <td>{row.notes}</td>
                        <td>{row.errors.length > 0 ? row.errors.join('; ') : ''}</td> {/* Display errors only if they exist */}
                        <td>
                          {editingRowIndex === index ? (
                            <button onClick={() => handleSave(index, row)}>
                              <span role="img" aria-label="Save">💾</span>
                            </button>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(index)}>
                                <span role="img" aria-label="Edit">✏️</span>
                              </button>
                              <button onClick={() => handleRemove(index)}>
                                <span role="img" aria-label="Remove">🗑️</span>
                              </button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="CardDetailsActionRow" style={{ marginTop: '1rem' }}>
              <button className="CardDetailsButtonSecondary" onClick={() => setStep(2)}>Back</button>
              <button className="CardDetailsButtonPrimary" disabled={validRows.length === 0} onClick={importRows}>
                Import {validRows.length} Transaction{validRows.length === 1 ? '' : 's'}
              </button>
              <button className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions')}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
