"use client";

import { useRef, useState } from "react";
import { upsertTransaction } from "../functions/upsertTransaction";

type ImportRow = {
  transaction_date: string;
  merchant_name: string;
  mcc_id: string;
  amount: string;
  notes?: string;
};

type ImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
};

interface TransactionCsvImportProps {
  creditCardId: string;
  accessToken: string;
  onImportComplete?: (result: ImportResult) => void;
}

export function TransactionCsvImport({
  creditCardId,
  accessToken,
  onImportComplete,
}: TransactionCsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split("\n");
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const rows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      const values = line.split(",").map((v) => v.trim());
      const row: ImportRow = {
        transaction_date: values[header.indexOf("transaction_date")] || "",
        merchant_name: values[header.indexOf("merchant_name")] || "",
        mcc_id: values[header.indexOf("mcc_id")] || "",
        amount: values[header.indexOf("amount")] || "",
        notes: values[header.indexOf("notes")] || "",
      };
      rows.push(row);
    }

    return rows;
  };

  const validateRow = (row: ImportRow, rowNum: number): string | null => {
    if (!row.transaction_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.transaction_date)) {
      return `Row ${rowNum}: Invalid date format (expected YYYY-MM-DD)`;
    }
    if (!row.merchant_name || row.merchant_name.length === 0) {
      return `Row ${rowNum}: Missing merchant name`;
    }
    if (!row.mcc_id || !/^\d+$/.test(row.mcc_id)) {
      return `Row ${rowNum}: Invalid MCC ID (must be numeric)`;
    }
    if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
      return `Row ${rowNum}: Invalid amount (must be positive number)`;
    }
    return null;
  };

  const importTransactions = async (rows: ImportRow[]) => {
    setIsImporting(true);
    setProgress(0);
    setTotal(rows.length);
    setResult(null);
    setError(null);

    const errors: Array<{ row: number; error: string }> = [];
    let successCount = 0;

    // Import with concurrency limit (5 at a time to avoid overwhelming the API)
    const BATCH_SIZE = 5;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));

      const promises = batch.map((row, batchIndex) =>
        (async () => {
          const rowNum = i + batchIndex + 2; // +2 because header is row 1, data starts at row 2

          try {
            await upsertTransaction(accessToken, {
              credit_card_id: creditCardId,
              transaction_date: row.transaction_date,
              merchant_name: row.merchant_name,
              mcc_id: row.mcc_id,
              amount: Number(row.amount),
              booked_through_issuer_portal: false,
              notes: row.notes || undefined,
            });
            successCount++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            errors.push({ row: rowNum, error: errorMsg });
          }

          setProgress((prev) => prev + 1);
        })()
      );

      await Promise.all(promises);
    }

    const importResult: ImportResult = {
      success: successCount,
      failed: errors.length,
      errors,
    };

    setResult(importResult);
    setIsImporting(false);
    onImportComplete?.(importResult);
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setError("No transactions found in CSV");
        return;
      }

      // Validate all rows before importing
      const validationErrors: Array<{ row: number; error: string }> = [];
      const validRows: ImportRow[] = [];

      rows.forEach((row, index) => {
        const validationError = validateRow(row, index + 2); // +2 for header and 0-indexing
        if (validationError) {
          validationErrors.push({ row: index + 2, error: validationError });
        } else {
          validRows.push(row);
        }
      });

      if (validationErrors.length > 0) {
        const errorMsg = validationErrors
          .map((e) => e.error)
          .join("\n");
        setError(`Validation errors:\n${errorMsg}`);
        return;
      }

      await importTransactions(validRows);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to read file";
      setError(errorMsg);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      await processFile(file);
    } else {
      setError("Please drop a CSV or XLSX file");
    }
  };

  const progressPercentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem", fontWeight: "600" }}>
        Step 2: Upload File
      </h3>

      {!isImporting && !result && (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: "2px dashed #999",
              borderRadius: "8px",
              padding: "2rem",
              textAlign: "center",
              backgroundColor: isDragActive ? "#f0f0f0" : "#fafafa",
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginBottom: "1.5rem",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <p style={{ margin: "0", fontSize: "1rem", color: "#333" }}>
              Drag and drop .csv (or .xlsx) here, or{" "}
              <span style={{ color: "#0066cc", textDecoration: "underline" }}>browse</span>.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              disabled={isImporting}
              style={{ display: "none" }}
            />
          </div>

          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.75rem" }}>
            Download template file (transaction_date, merchant_name, mcc, amount, notes)
          </p>
          <a
            href="/transactions-import-template.csv"
            download="transactions-import-template.csv"
            style={{
              color: "#0066cc",
              textDecoration: "underline",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
            title="Download CSV template"
          >
            Download template
          </a>
        </>
      )}

      {isImporting && (
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              marginBottom: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
              Uploading: {progress} / {total}
            </span>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>
              {progressPercentage}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "24px",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercentage}%`,
                backgroundColor: "#4caf50",
                transition: "width 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              {progressPercentage > 5 && `${progressPercentage}%`}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              padding: "1rem",
              backgroundColor:
                result.failed === 0 ? "#e8f5e9" : "#fff3e0",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            <div style={{ marginBottom: "0.5rem", fontWeight: "600" }}>
              Import Complete
            </div>
            <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              ✓ {result.success} transactions uploaded successfully
            </div>
            {result.failed > 0 && (
              <div style={{ fontSize: "0.9rem", color: "#d32f2f" }}>
                ✗ {result.failed} transactions failed
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "4px",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                Errors:
              </div>
              <div style={{ fontSize: "0.85rem", maxHeight: "200px", overflowY: "auto" }}>
                {result.errors.map((err, idx) => (
                  <div key={idx} style={{ marginBottom: "0.25rem" }}>
                    <strong>Row {err.row}:</strong> {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setError(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Import More Transactions
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#ffebee",
            border: "1px solid #ef5350",
            borderRadius: "4px",
            color: "#c62828",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
