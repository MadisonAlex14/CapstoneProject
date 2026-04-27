"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import '@/App.css';
import styles from '../../../styles/auth.module.css';
import { getUserCards } from '../../../lib/functions/getUserCards';
import { upsertTransaction } from '../../../lib/functions/upsertTransaction';
import { getMccLookup } from '../../../lib/functions/getMccLookup';

type UserCard = {
  credit_card_id: string;
  nickname: string;
  last_four: string;
  credit_card_type: { name: string; issuer_id: string };
};

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
  const [card, setCard] = useState('');
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileError, setFileError] = useState('');
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get access token and cards on mount
  useEffect(() => {
    const getTokenAndCards = async () => {
      try {
        const localToken = localStorage.getItem('accessToken');
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        let accessToken: string | null = localToken;

        if (!accessToken && supabaseToken) {
          const session = JSON.parse(supabaseToken);
          accessToken = session?.currentSession?.access_token || session?.access_token || null;
        }

        if (!accessToken) throw new Error('No access token');

        setAccessToken(accessToken);

        const cards = await getUserCards(accessToken);
        setUserCards(cards ?? []);
        if (cards && cards.length > 0) {
          setCard(cards[0].credit_card_id);
        }
      } catch (err) {
        console.error('Failed to get token or cards:', err);
        setFileError('Failed to load cards. Please log in again.');
      } finally {
        setLoadingCards(false);
      }
    };
    getTokenAndCards();
  }, []);

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
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('#')); // Skip empty lines and comments
      
      const parsed = lines.map((line) => 
        line.split(',').map((cell) => cell.replace(/(^"|"$)/g, '').trim())
      );
      
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

  const importRows = async () => {
    if (!accessToken) {
      setFileError('No access token available. Please log in.');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setFileError('');

    const rowsToImport = validRows;
    setImportTotal(rowsToImport.length);

    let successCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Build a map of MCC codes to UUIDs by looking them up
    const mccCodeToIdMap: Record<string, string> = {};
    for (const row of rowsToImport) {
      if (!mccCodeToIdMap[row.mcc_id]) {
        try {
          const mccResults = await getMccLookup(accessToken, row.mcc_id);
          if (mccResults && mccResults.length > 0) {
            mccCodeToIdMap[row.mcc_id] = mccResults[0].mcc_id;
          }
        } catch (err) {
          console.error(`Failed to look up MCC ${row.mcc_id}:`, err);
        }
      }
    }

    // Import with concurrency limit (5 at a time to avoid overwhelming the API)
    const BATCH_SIZE = 5;

    for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
      const batch = rowsToImport.slice(i, Math.min(i + BATCH_SIZE, rowsToImport.length));

      const promises = batch.map((row, batchIndex) =>
        (async () => {
          const rowNum = i + batchIndex + 2; // +2 because header is row 1, data starts at row 2
          const amountVal = Number(row.amount);
          const mccUuid = mccCodeToIdMap[row.mcc_id];

          if (!mccUuid) {
            errors.push({ row: rowNum, error: `MCC ${row.mcc_id} not found` });
            setImportProgress((prev) => prev + 1);
            return;
          }

          try {
            await upsertTransaction(accessToken!, {
              credit_card_id: card,
              transaction_date: row.transaction_date,
              merchant_name: row.merchant_name,
              mcc_id: mccUuid,
              amount: amountVal,
              booked_through_issuer_portal: false,
              notes: row.notes || undefined,
            });

            successCount++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            errors.push({ row: rowNum, error: errorMsg });
          }

          setImportProgress((prev) => prev + 1);
        })()
      );

      await Promise.all(promises);
    }

    setIsImporting(false);

    if (successCount === rowsToImport.length) {
      // All successful
      router.push('/transactions');
    } else {
      // Show errors but allow user to try again or navigate
      setFileError(
        `Import complete: ${successCount} succeeded, ${errors.length} failed.\n${errors
          .map((e) => `Row ${e.row}: ${e.error}`)
          .join('\n')}`
      );
    }
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
              <select value={card} onChange={(e) => setCard(e.target.value)} disabled={loadingCards}>
                {loadingCards ? (
                  <option>Loading cards...</option>
                ) : userCards.length === 0 ? (
                  <option>No cards available</option>
                ) : (
                  userCards.map((c) => (
                    <option key={c.credit_card_id} value={c.credit_card_id}>
                      {c.credit_card_type.name} •••• {c.last_four}
                    </option>
                  ))
                )}
              </select>
            </label>
            <div className="CardDetailsActionRow">
              <button className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions')}>Cancel</button>
              <button className="CardDetailsButtonPrimary" onClick={() => setStep(2)} disabled={!card}>Next</button>
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
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.75rem" }}>
              Download template file (transaction_date, merchant_name, mcc, amount, notes)
            </p>
            <a href="/transactions-import-template.csv" download style={{ color: "#0066cc", textDecoration: "underline", fontSize: "0.9rem", cursor: "pointer" }}>
              Download template
            </a>
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
            {isImporting && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    Importing: {importProgress} / {importTotal}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    {importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '24px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0}%`,
                      backgroundColor: '#4caf50',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {importTotal > 0 && Math.round((importProgress / importTotal) * 100) > 5
                      ? `${Math.round((importProgress / importTotal) * 100)}%`
                      : ''}
                  </div>
                </div>
              </div>
            )}
            {fileError && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{fileError}</p>}
            <div className="CardDetailsActionRow" style={{ marginTop: '1rem' }}>
              <button className="CardDetailsButtonSecondary" onClick={() => setStep(2)} disabled={isImporting}>Back</button>
              <button className="CardDetailsButtonPrimary" disabled={validRows.length === 0 || isImporting} onClick={importRows}>
                {isImporting ? `Importing... (${importProgress}/${importTotal})` : `Import ${validRows.length} Transaction${validRows.length === 1 ? '' : 's'}`}
              </button>
              <button className="CardDetailsButtonSecondary" onClick={() => router.push('/transactions')} disabled={isImporting}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
