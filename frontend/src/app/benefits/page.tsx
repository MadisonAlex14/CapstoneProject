"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../../styles/auth.module.css";
import { getUserBenefits } from "../../lib/functions/getUserBenefits";
import { logBenefitUsage } from "../../lib/functions/logBenefitUsage";
import { deleteBenefitEntry } from "../../lib/functions/deleteBenefitEntry";

// ---------------------- TYPES ----------------------

type BenefitMerchant = { merchant_keyword: string; merchant_name: string | null };
type BenefitSpendingCategory = { spending_category: { spending_category_id: string; name: string } };

type Benefit = {
  benefit_id: string;
  name: string;
  description: string | null;
  value_amount: number;
  reset_frequency: string;
  targeting_type: string;
  value_unit: string;
  benefit_merchant: BenefitMerchant[];
  benefit_spending_category: BenefitSpendingCategory[];
};

type CreditCard = { credit_card_id: string; nickname: string; last_four: string };

type UserBenefitEntry = {
  user_benefit_entry_id: string;
  usage_date: string;
  merchant_name: string | null;
  amount: number;
  notes: string | null;
};

type UserBenefit = {
  user_benefit_id: string;
  cycle_start_date: string;
  amount_used: number;
  initial_amount_used: number;
  credit_card: CreditCard;
  benefit: Benefit;
  user_benefit_entry: UserBenefitEntry[];
};

// ---------------------- HELPERS ----------------------

function getAccessToken(): string | null {
  const local = localStorage.getItem("accessToken");
  if (local) return local;
  const supabaseToken = localStorage.getItem("supabase.auth.token");
  if (supabaseToken) {
    try {
      const session = JSON.parse(supabaseToken);
      return session?.currentSession?.access_token ?? session?.access_token ?? null;
    } catch { return null; }
  }
  return null;
}

function computeCycleEndDate(resetFrequency: string, cycleStartDate: string): Date | null {
  const start = new Date(cycleStartDate);
  if (resetFrequency === "monthly") return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
  if (resetFrequency === "annual") return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  if (resetFrequency === "semi_annual") return new Date(start.getFullYear(), start.getMonth() + 6, start.getDate());
  return null;
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatResetFrequency(rf: string): string {
  const map: Record<string, string> = { monthly: "Monthly", annual: "Annual", semi_annual: "Semi-Annual", one_time: "One Time" };
  return map[rf] ?? rf;
}

function formatValueUnit(value: number, unit: string): string {
  if (unit === "dollars") return `$${value.toLocaleString()}`;
  if (unit === "points") return `${value.toLocaleString()} pts`;
  if (unit === "miles") return `${value.toLocaleString()} mi`;
  return `${value.toLocaleString()} ${unit}`;
}

function formatAmount(amount: number, unit: string): string {
  if (unit === "dollars") return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (unit === "points") return `${amount.toLocaleString()} pts`;
  if (unit === "miles") return `${amount.toLocaleString()} mi`;
  return `${amount.toLocaleString()}`;
}

function getAppliesTo(benefit: Benefit): string {
  if (benefit.targeting_type === "merchant") {
    const names = benefit.benefit_merchant?.map((m) => m.merchant_name ?? m.merchant_keyword).filter(Boolean) ?? [];
    return names.length > 0 ? names.join(", ") : "Select merchants";
  }
  if (benefit.targeting_type === "category") {
    const cats = benefit.benefit_spending_category?.map((s) => s.spending_category?.name).filter(Boolean) ?? [];
    return cats.length > 0 ? cats.join(", ") : "Select categories";
  }
  return "All purchases";
}

// ---------------------- COMPONENT ----------------------

export default function BenefitsPage() {
  const [userBenefits, setUserBenefits] = useState<UserBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCardId, setFilterCardId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReset, setFilterReset] = useState("all");

  // Expanded history row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Log Usage modal
  const [showModal, setShowModal] = useState(false);
  const [modalBenefit, setModalBenefit] = useState<(UserBenefit & { remaining: number }) | null>(null);
  const [modalAmount, setModalAmount] = useState("");
  const [modalDate, setModalDate] = useState(new Date().toISOString().split("T")[0]);
  const [modalMerchant, setModalMerchant] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ---------------------- DATA LOAD ----------------------

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const data = await getUserBenefits(token);
      setUserBenefits(data ?? []);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load benefits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ---------------------- DERIVED DATA ----------------------

  const cards = useMemo(() => {
    const seen = new Set<string>();
    return userBenefits
      .filter((ub) => ub.credit_card != null)
      .filter((ub) => { if (seen.has(ub.credit_card.credit_card_id)) return false; seen.add(ub.credit_card.credit_card_id); return true; })
      .map((ub) => ub.credit_card);
  }, [userBenefits]);

  const enriched = useMemo(() => {
    return userBenefits
      .filter((ub) => ub.credit_card != null && ub.benefit != null)
      .map((ub) => {
        const used = ub.amount_used + ub.initial_amount_used;
        const remaining = Math.max(0, ub.benefit.value_amount - used);
        const cycleEnd = computeCycleEndDate(ub.benefit.reset_frequency, ub.cycle_start_date);
        const days = daysUntil(cycleEnd);
        const isFullyUsed = remaining <= 0;
        const isExpiringSoon = days !== null && days <= 7 && !isFullyUsed;
        return { ...ub, used, remaining, cycleEnd, days, isFullyUsed, isExpiringSoon };
      });
  }, [userBenefits]);

  const filtered = useMemo(() => {
    return enriched.filter((ub) => {
      if (filterCardId !== "all" && ub.credit_card.credit_card_id !== filterCardId) return false;
      if (filterStatus === "active" && (ub.isFullyUsed || ub.isExpiringSoon)) return false;
      if (filterStatus === "used_up" && !ub.isFullyUsed) return false;
      if (filterStatus === "expiring" && !ub.isExpiringSoon) return false;
      if (filterReset !== "all" && ub.benefit.reset_frequency !== filterReset) return false;
      return true;
    });
  }, [enriched, filterCardId, filterStatus, filterReset]);

  const summary = useMemo(() => ({
    totalAvailable: enriched.reduce((s, ub) => s + ub.benefit.value_amount, 0),
    totalUsed: enriched.reduce((s, ub) => s + ub.used, 0),
    totalRemaining: enriched.reduce((s, ub) => s + ub.remaining, 0),
    expiringSoon: enriched.filter((ub) => ub.isExpiringSoon).length,
  }), [enriched]);

  // ---------------------- HANDLERS ----------------------

  function openLogModal(ub: typeof enriched[number]) {
    setModalBenefit(ub);
    setModalAmount(String(ub.remaining));
    setModalDate(new Date().toISOString().split("T")[0]);
    setModalMerchant("");
    setModalNotes("");
    setModalError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setModalBenefit(null);
    setModalError(null);
  }

  async function handleLogUsage() {
    if (!modalBenefit) return;
    const amount = parseFloat(modalAmount);
    if (isNaN(amount) || amount <= 0) { setModalError("Enter a valid amount greater than 0."); return; }
    if (amount > modalBenefit.remaining) { setModalError(`Amount cannot exceed remaining balance (${modalBenefit.remaining}).`); return; }
    if (!modalDate) { setModalError("Please select a date."); return; }
    try {
      setModalLoading(true);
      setModalError(null);
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      await logBenefitUsage(token, {
        benefit_id: modalBenefit.benefit.benefit_id,
        credit_card_id: modalBenefit.credit_card.credit_card_id,
        amount,
        usage_date: modalDate,
        merchant_name: modalMerchant || undefined,
        notes: modalNotes || undefined,
      });
      closeModal();
      await load();
    } catch (err) {
      setModalError((err as Error).message ?? "Failed to log usage");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!window.confirm("Delete this usage entry?")) return;
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      await deleteBenefitEntry(token, entryId);
      await load();
    } catch (err) {
      alert((err as Error).message ?? "Failed to delete entry");
    }
  }

  // ---------------------- RENDER ----------------------

  return (
    <div className="main-content transactions-page CardDetailsPage">
      {/* Hero */}
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Benefits</h1>
        <p className={styles.PageSubtitle}>
          Track and maximize the perks that come with your credit cards.
        </p>
      </div>

      {/* Summary */}
      <section className={styles.Summary}>
        <div className={styles.SummaryCards}>
          {[
            { label: "Total Available", value: `$${summary.totalAvailable.toLocaleString()}` },
            { label: "Total Used", value: `$${summary.totalUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: "Total Remaining", value: `$${summary.totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: "Expiring Soon", value: summary.expiringSoon },
          ].map((stat, idx) => (
            <div key={idx} className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>{stat.label}</p>
              <p className={styles.SummaryValue}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filters + Table */}
      <div className="CardDetailsSection" style={{ marginTop: "1.5rem" }}>
        <h2>Tracked Benefits</h2>

        {/* Filter row — matches transaction page pattern */}
        <div className="CardDetailsActionRow">
          <label>
            Card
            <select value={filterCardId} onChange={(e) => setFilterCardId(e.target.value)}>
              <option value="all">All Cards</option>
              {cards.map((c) => (
                <option key={c.credit_card_id} value={c.credit_card_id}>
                  {c.nickname} ···{c.last_four}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="used_up">Used Up</option>
              <option value="expiring">Expiring Soon</option>
            </select>
          </label>

          <label>
            Reset Cycle
            <select value={filterReset} onChange={(e) => setFilterReset(e.target.value)}>
              <option value="all">All Cycles</option>
              <option value="monthly">Monthly</option>
              <option value="semi_annual">Semi-Annual</option>
              <option value="annual">Annual</option>
              <option value="one_time">One Time</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading benefits…</p>
        ) : error ? (
          <p style={{ color: "#b42318" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#64748b", padding: "1rem 0" }}>
            {enriched.length === 0
              ? "No benefits found. Benefits are tied to your credit cards — add a card to get started."
              : "No benefits match the current filters."}
          </p>
        ) : (
          <div className="transactions-table-wrapper">
            <table className="CardDashboardTable">
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Benefit</th>
                  <th>Applies To</th>
                  <th>Credit Amount</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Resets</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ub) => {
                  const isExpanded = expandedId === ub.user_benefit_id;
                  const pct = Math.min(100, (ub.used / ub.benefit.value_amount) * 100);

                  // Row highlight via inline style (amber = expiring, no change = normal)
                  const rowStyle: React.CSSProperties = ub.isExpiringSoon
                    ? { background: "#fffbeb" }
                    : ub.isFullyUsed
                    ? { opacity: 0.65 }
                    : {};

                  return (
                    <React.Fragment key={ub.user_benefit_id}>
                      <tr
                        style={{ ...rowStyle, cursor: "pointer" }}
                        onClick={() => setExpandedId(isExpanded ? null : ub.user_benefit_id)}
                      >
                        <td>
                          <div style={{ fontWeight: 600 }}>{ub.credit_card.nickname}</div>
                          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>···{ub.credit_card.last_four}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{ub.benefit.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{formatResetFrequency(ub.benefit.reset_frequency)}</div>
                        </td>
                        <td style={{ color: "#6b7280", fontSize: "0.85rem" }}>{getAppliesTo(ub.benefit)}</td>
                        <td style={{ fontWeight: 600 }}>{formatValueUnit(ub.benefit.value_amount, ub.benefit.value_unit)}</td>
                        <td>
                          <div>{formatAmount(ub.used, ub.benefit.value_unit)}</div>
                          {/* Mini progress bar */}
                          <div style={{ height: 5, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginTop: 4, minWidth: 80 }}>
                            <div style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: ub.isExpiringSoon
                                ? "linear-gradient(90deg,#f59e0b,#d97706)"
                                : "linear-gradient(90deg,#10b981,#059669)",
                              borderRadius: 999,
                            }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {ub.isFullyUsed ? (
                            <span style={{ padding: "0.2rem 0.6rem", borderRadius: 999, background: "#e5e7eb", color: "#6b7280", fontSize: "0.75rem", fontWeight: 600 }}>
                              Fully Used
                            </span>
                          ) : ub.isExpiringSoon ? (
                            <>
                              {formatAmount(ub.remaining, ub.benefit.value_unit)}{" "}
                              <span style={{ padding: "0.15rem 0.5rem", borderRadius: 999, background: "#fef3c7", color: "#92400e", fontSize: "0.72rem", fontWeight: 700 }}>
                                {ub.days === 0 ? "Today" : `${ub.days}d`}
                              </span>
                            </>
                          ) : (
                            formatAmount(ub.remaining, ub.benefit.value_unit)
                          )}
                        </td>
                        <td style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                          {ub.benefit.reset_frequency === "one_time"
                            ? "Lifetime"
                            : ub.cycleEnd ? ub.cycleEnd.toLocaleDateString() : "—"}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {ub.isFullyUsed ? (
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>—</span>
                          ) : (
                            <button
                              className="CardDetailsButtonPrimary"
                              style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                              onClick={() => openLogModal(ub)}
                            >
                              Log Usage
                            </button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${ub.user_benefit_id}-history`}>
                          <td colSpan={8} style={{ padding: 0, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <div style={{ padding: "0.75rem 1rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                                Usage History
                              </div>
                              {ub.user_benefit_entry.length === 0 ? (
                                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>No usage logged yet.</p>
                              ) : (
                                <table className="CardDashboardTable" style={{ minWidth: "unset" }}>
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Merchant</th>
                                      <th>Amount</th>
                                      <th>Notes</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ub.user_benefit_entry
                                      .slice()
                                      .sort((a, b) => b.usage_date.localeCompare(a.usage_date))
                                      .map((entry) => (
                                        <tr key={entry.user_benefit_entry_id}>
                                          <td>{new Date(entry.usage_date + "T00:00:00").toLocaleDateString()}</td>
                                          <td>{entry.merchant_name ?? "—"}</td>
                                          <td>{formatAmount(entry.amount, ub.benefit.value_unit)}</td>
                                          <td style={{ color: "#6b7280" }}>{entry.notes ?? "—"}</td>
                                          <td>
                                            <button
                                              title="Delete entry"
                                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0.1rem 0.3rem" }}
                                              onClick={() => handleDeleteEntry(entry.user_benefit_entry_id)}
                                            >
                                              🗑️
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Usage Modal — matches transaction edit modal pattern */}
      {showModal && modalBenefit && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 2000,
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", width: "520px",
            maxWidth: "95%", padding: "1.5rem",
            boxShadow: "0 16px 34px rgba(0,0,0,0.25)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <h2 style={{ margin: "0 0 0.25rem" }}>Log Benefit Usage</h2>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "#6b7280" }}>
              <strong>{modalBenefit.benefit.name}</strong> — {modalBenefit.credit_card.nickname} ···{modalBenefit.credit_card.last_four}
              <br />
              Remaining: {formatAmount(modalBenefit.remaining, modalBenefit.benefit.value_unit)}
            </p>

            <form style={{ display: "grid", gap: "0.75rem" }} onSubmit={(e) => { e.preventDefault(); handleLogUsage(); }}>
              <label>
                Amount Used
                <input
                  type="number"
                  required
                  min={0.01}
                  max={modalBenefit.remaining}
                  step={0.01}
                  style={{ display: "block", width: "100%", padding: "0.6rem", marginTop: "0.3rem", backgroundColor: "#e1f5e7", border: "2px solid #314634", borderRadius: "6px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  required
                  style={{ display: "block", width: "100%", padding: "0.6rem", marginTop: "0.3rem", backgroundColor: "#e1f5e7", border: "2px solid #314634", borderRadius: "6px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                />
              </label>

              <label>
                Merchant (optional)
                <input
                  type="text"
                  style={{ display: "block", width: "100%", padding: "0.6rem", marginTop: "0.3rem", backgroundColor: "#e1f5e7", border: "2px solid #314634", borderRadius: "6px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  placeholder="e.g. Delta, Uber, Whole Foods"
                  value={modalMerchant}
                  onChange={(e) => setModalMerchant(e.target.value)}
                />
                {modalBenefit.benefit.targeting_type === "merchant" && modalBenefit.benefit.benefit_merchant?.length > 0 && (
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.25rem", display: "block" }}>
                    Eligible merchants: {modalBenefit.benefit.benefit_merchant.map((m) => m.merchant_name ?? m.merchant_keyword).filter(Boolean).join(", ")}
                  </span>
                )}
              </label>

              <label>
                Notes (optional)
                <input
                  type="text"
                  style={{ display: "block", width: "100%", padding: "0.6rem", marginTop: "0.3rem", backgroundColor: "#e1f5e7", border: "2px solid #314634", borderRadius: "6px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  placeholder="e.g. Round trip LAX–JFK"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                />
              </label>

              {modalError && (
                <p style={{ color: "#b42318", fontSize: "0.875rem", margin: 0 }}>{modalError}</p>
              )}

              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" className="CardDetailsButtonSecondary" onClick={closeModal} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className="CardDetailsButtonPrimary" disabled={modalLoading}>
                  {modalLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
