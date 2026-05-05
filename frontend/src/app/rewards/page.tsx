"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "../../styles/auth.module.css";
import { getRewardsBalance } from "../../lib/functions/getRewardsBalance";
import { getRewardsEarnedOverTime, type RewardsEarnedEntry } from "../../lib/functions/getRewardsEarnedOverTime";
import { getUserRedemptions, type UserRedemption } from "../../lib/functions/getUserRedemptions";
import { logUserRedemption } from "../../lib/functions/logUserRedemption";
import { deleteUserRedemption } from "../../lib/functions/deleteUserRedemption";
import { px } from "framer-motion";

// -------------------- CONSTANTS --------------------

const REDEMPTION_TYPES = [
  { value: "travel_portal", label: "Travel Portal" },
  { value: "cash_back_conversion", label: "Cash Back Conversion" },
  { value: "transfer_partner", label: "Transfer Partner" },
  { value: "gift_card", label: "Gift Card" },
  { value: "other", label: "Other" },
];

const CHART_COLORS = [
  "#314634", "#617672", "#A6A969", "#C1CCCA", "#9ECFAD",
  "#617672", "#A6A969", "#C1CCCA", "#9ECFAD", "#314634",
];

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.6rem",
  marginTop: "0.3rem",
  backgroundColor: "#e1f5e7",
  border: "2px solid #314634",
  borderRadius: "6px",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

// -------------------- HELPERS --------------------

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

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
}

function formatRedemptionType(t: string): string {
  return REDEMPTION_TYPES.find((r) => r.value === t)?.label ?? t;
}

// -------------------- COMPONENT --------------------

export default function RewardsPage() {
  // --- data state ---
  type BalanceData = Awaited<ReturnType<typeof getRewardsBalance>>;
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [chartEntries, setChartEntries] = useState<RewardsEarnedEntry[]>([]);
  const [redemptions, setRedemptions] = useState<UserRedemption[]>([]);

  // --- loading / error ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // --- chart filters ---
  const [chartTimeRange, setChartTimeRange] = useState<"3m" | "6m" | "12m" | "all">("6m");
  const [chartCardId, setChartCardId] = useState("all");

  // --- redemption log filter ---
  const [logCardId, setLogCardId] = useState("all");

  // --- log redemption modal ---
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    cardId: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    type: "",
    notes: "",
  });
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  // --- delete confirm modal ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -------------------- DATA LOADING --------------------

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const [bal, reds] = await Promise.all([
        getRewardsBalance(token),
        getUserRedemptions(token),
      ]);
      setBalanceData(bal);
      setRedemptions(reds);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChart = useCallback(async () => {
    try {
      setChartLoading(true);
      const token = getAccessToken();
      if (!token) return;
      const cardParam = chartCardId !== "all" ? chartCardId : undefined;
      const data = await getRewardsEarnedOverTime(token, chartTimeRange, cardParam);
      setChartEntries(data);
    } catch {
      // chart failure is non-critical
    } finally {
      setChartLoading(false);
    }
  }, [chartTimeRange, chartCardId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadChart(); }, [loadChart]);

  // -------------------- DERIVED DATA --------------------

  const allCards = balanceData?.cards ?? [];
  const eligibleCards = useMemo(
    () => allCards.filter((c) => c.reward_currency_type !== "cash"),
    [allCards]
  );

  const filteredRedemptions = useMemo(() => {
    if (logCardId === "all") return redemptions;
    return redemptions.filter((r) => r.credit_card?.credit_card_id === logCardId);
  }, [redemptions, logCardId]);

  const { chartRows, chartCardIds, cardLabelMap } = useMemo(() => {
    const monthMap = new Map<string, Record<string, number>>();
    const labelMap = new Map<string, string>();
    const ids = new Set<string>();

    for (const entry of chartEntries) {
      ids.add(entry.credit_card_id);
      labelMap.set(entry.credit_card_id, entry.card_label);
      if (!monthMap.has(entry.month)) monthMap.set(entry.month, {});
      const row = monthMap.get(entry.month)!;
      row[entry.credit_card_id] = (row[entry.credit_card_id] ?? 0) + entry.earned_dollar_equivalent;
    }

    const rows = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month: formatMonth(month), ...vals }));

    return { chartRows: rows, chartCardIds: Array.from(ids), cardLabelMap: labelMap };
  }, [chartEntries]);

  const selectedLogCard = useMemo(
    () => eligibleCards.find((c) => c.credit_card_id === logForm.cardId) ?? null,
    [eligibleCards, logForm.cardId]
  );

  const estimatedDollarValue = useMemo(() => {
    if (!selectedLogCard || !logForm.amount) return null;
    const val = Number(logForm.amount) * selectedLogCard.cash_value_per_unit;
    return isNaN(val) ? null : val;
  }, [selectedLogCard, logForm.amount]);

  // -------------------- HANDLERS --------------------

  function openLogModal(preselectedCardId?: string) {
    setLogForm({
      cardId: preselectedCardId ?? eligibleCards[0]?.credit_card_id ?? "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      type: "",
      notes: "",
    });
    setLogError(null);
    setShowLogModal(true);
  }

  function closeLogModal() {
    setShowLogModal(false);
    setLogError(null);
  }

  async function handleLogRedemption(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!selectedLogCard) return;
    const amount = Number(logForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setLogError("Amount must be a positive number.");
      return;
    }
    try {
      setLogLoading(true);
      setLogError(null);
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      await logUserRedemption(token, {
        credit_card_id: logForm.cardId,
        redemption_date: logForm.date,
        amount_redeemed: amount,
        redemption_type: logForm.type,
        notes: logForm.notes || undefined,
      });
      closeLogModal();
      await load();
    } catch (err) {
      setLogError((err as Error).message ?? "Failed to log redemption");
    } finally {
      setLogLoading(false);
    }
  }

  async function handleDeleteRedemption(id: string) {
    try {
      setDeleteLoading(true);
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      await deleteUserRedemption(token, id);
      setDeleteId(null);
      await load();
    } catch (err) {
      alert((err as Error).message ?? "Failed to delete redemption");
    } finally {
      setDeleteLoading(false);
    }
  }

  const summary = balanceData?.summary;

  // -------------------- RENDER --------------------

  return (
    <div className="main-content transactions-page CardDetailsPage">
      {/* Hero */}
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Rewards</h1>
        <p className={styles.PageSubtitle}>
          Track your points, miles, and cashback rewards across all your credit cards.
        </p>
      </div>

      {/* Summary */}
      <section className={styles.Summary}>
        <div className={styles.SummaryCards}>
          {[
            {
              label: "Total Rewards Value",
              value: summary
                ? `$${summary.total_rewards_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—",
            },
            {
              label: "Earned This Month",
              value: summary
                ? `$${summary.earned_this_month.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—",
            },
            {
              label: "Redeemed This Year",
              value: summary
                ? `$${summary.redeemed_this_year.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—",
            },
          ].map((stat, idx) => (
            <div key={idx} className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>{stat.label}</p>
              <p className={styles.SummaryValue}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <p style={{ color: "#64748b", padding: "2rem 0" }}>Loading rewards…</p>
      ) : error ? (
        <p style={{ color: "#b42318", padding: "2rem 0" }}>{error}</p>
      ) : (
        <>
          <h2 className={styles.SummaryTitle} style={{ marginBottom: "20px", textAlign: "center", fontSize: "25px", justifyContent: "center"}}>
                Rewards Earned Over Time
              </h2>
          <div className="CardDetailsSection" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="CardDetailsActionRow" style={{ margin: 0 }}>
                <label>
                  Card
                  <select value={chartCardId} onChange={(e) => setChartCardId(e.target.value)}>
                    <option value="all">All Cards</option>
                    {allCards.map((c) => (
                      <option key={c.credit_card_id} value={c.credit_card_id}>
                        {c.nickname ? `${c.nickname} ••••${c.last_four}` : `••••${c.last_four}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Time Range
                  <select
                    value={chartTimeRange}
                    onChange={(e) => setChartTimeRange(e.target.value as "3m" | "6m" | "12m" | "all")}
                  >
                    <option value="3m">Last 3 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="12m">Last 12 Months</option>
                    <option value="all">All Time</option>
                  </select>
                </label>
              </div>
            </div>

            {chartLoading ? (
              <p style={{ color: "#64748b" }}>Loading chart…</p>
            ) : chartRows.length === 0 ? (
              <p style={{ color: "#64748b" }}>No transaction data in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartRows} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 12 }} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]} />
                  <Tooltip formatter={(val) => typeof val === "number" ? `$${val.toFixed(2)}` : val} />
                  <Legend />
                  {chartCardIds.map((cId, i) => (
                    <Bar
                      key={cId}
                      dataKey={cId}
                      name={cardLabelMap.get(cId) ?? cId}
                      stackId="a"
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rewards Balance Per Card */}
          <h2 className={styles.SummaryTitle} style={{ marginTop: "30px", marginBottom: "30px", textAlign: "center", fontSize: "25px", justifyContent: "center"}}>
                Rewards Balance
              </h2>
          <div className="CardDetailsSection" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              
              {eligibleCards.length > 0 && (
               <button className={styles.ModalButton} onClick={() => openLogModal()}>
                  + Log Redemption
                </button>

              )}
            </div>

            {allCards.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No cards found. Add a card to start tracking rewards.
              </p>
            ) : (
              <div className="transactions-table-wrapper">
                <table className="CardDashboardTable">
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Type</th>
                      <th>Raw Balance</th>
                      <th>Est. Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCards.map((card) => {
                      const unit =
                        card.reward_currency_type !== "cash"
                          ? (card.reward_unit_symbol ?? card.reward_unit_name ?? "")
                          : null;
                      return (
                        <tr key={card.credit_card_id} style={!card.is_active ? { opacity: 0.6 } : {}}>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {card.nickname ?? card.card_type_name}
                              {!card.is_active && (
                                <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", background: "#e5e7eb", color: "#6b7280", borderRadius: 999, padding: "0.1rem 0.4rem" }}>
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>••••{card.last_four}</div>
                          </td>
                          <td style={{ textTransform: "capitalize" }}>{card.reward_currency_type}</td>
                          <td>
                            {card.reward_currency_type === "cash"
                              ? `$${card.raw_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `${card.raw_balance.toLocaleString()} ${unit}`}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            ${card.est_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>
                            {card.reward_currency_type !== "cash" && (
                              <button className={styles.ModalButton}
                                onClick={() => openLogModal(card.credit_card_id)}
                              >
                              Log Redemption
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Redemption Log */}
          <h2 className={styles.SummaryTitle} style={{ marginTop: "30px", marginBottom: "30px", textAlign: "center", fontSize: "25px", justifyContent: "center"}}>
                Redemption Log
              </h2>
          <div className="CardDetailsSection" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
              
              <div className="CardDetailsActionRow" style={{ margin: 0 }}>
                <label>
                  Card
                  <select value={logCardId} onChange={(e) => setLogCardId(e.target.value)}>
                    <option value="all">All Cards</option>
                    {eligibleCards.map((c) => (
                      <option key={c.credit_card_id} value={c.credit_card_id}>
                        {c.nickname ? `${c.nickname} ••••${c.last_four}` : `••••${c.last_four}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {filteredRedemptions.length === 0 ? (
              <p style={{ color: "#64748b", padding: "1rem 0" }}>
                {redemptions.length === 0
                  ? "No redemptions logged yet. Use the Log Redemption button above to record a redemption."
                  : "No redemptions match the current filter."}
              </p>
            ) : (
              <div className="transactions-table-wrapper">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Card</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRedemptions.map((r) => {
                      const ct = r.credit_card?.credit_card_type;
                      const unit = ct?.reward_unit_symbol ?? ct?.reward_unit_name ?? "";
                      const dollarEq = ct
                        ? r.amount_redeemed * Number(ct.cash_value_per_unit)
                        : null;
                      return (
                        <tr key={r.redemption_id}>
                          <td>{new Date(r.redemption_date + "T00:00:00").toLocaleDateString()}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.credit_card?.nickname ?? "—"}</div>
                            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>••••{r.credit_card?.last_four}</div>
                          </td>
                          <td>
                            {r.amount_redeemed.toLocaleString()} {unit}
                            {dollarEq !== null && (
                              <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                ≈ ${dollarEq.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td>{formatRedemptionType(r.redemption_type)}</td>
                          <td style={{ color: "#6b7280" }}>{r.notes ?? "—"}</td>
                          <td>
                            <button
                              title="Delete"
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.1rem 0.3rem" }}
                              onClick={() => setDeleteId(r.redemption_id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Log Redemption Modal */}
      {showLogModal && (
        <div className={styles.ModalOverlay}>
          <div className={styles.Modal}>
            <h2 className={styles.ModalTitle}>Log Redemption</h2>
            <form style={{ display: "grid", gap: "0.75rem" }} onSubmit={handleLogRedemption}>
              <label> Card
                <select
                  required
                  style={inputStyle}
                  value={logForm.cardId}
                  onChange={(e) => setLogForm({ ...logForm, cardId: e.target.value })}
                >
                  <option value="">Select card</option>
                  {eligibleCards.map((c) => (
                    <option key={c.credit_card_id} value={c.credit_card_id}>
                      {c.nickname ? `${c.nickname} ••••${c.last_four}` : `••••${c.last_four}`}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Redemption Date
                <input
                  type="date"
                  required
                  style={inputStyle}
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                />
              </label>

              <label>
                Amount ({selectedLogCard?.reward_unit_symbol ?? selectedLogCard?.reward_unit_name ?? "units"})
                <input
                  type="number"
                  required
                  min={0.01}
                  step="any"
                  style={inputStyle}
                  placeholder="e.g. 5000"
                  value={logForm.amount}
                  onChange={(e) => setLogForm({ ...logForm, amount: e.target.value })}
                />
                {estimatedDollarValue !== null && (
                  <span style={{ fontSize: "0.82rem", color: "#314634", fontWeight: 600, marginTop: "0.25rem", display: "block" }}>
                    ≈ ${estimatedDollarValue.toFixed(2)} estimated value
                  </span>
                )}
              </label>

              <label>
                Redemption Type
                <select
                  required
                  style={inputStyle}
                  value={logForm.type}
                  onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  {REDEMPTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes (optional)
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="e.g. Booked flight to NYC"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                />
              </label>

              {logError && (
                <p style={{ color: "#b42318", fontSize: "0.875rem", margin: 0 }}>{logError}</p>
              )}

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeLogModal}
                  disabled={logLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={logLoading || !logForm.cardId || !logForm.type}
                >
                  {logLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "400px", maxWidth: "95%", padding: "1.5rem", boxShadow: "0 16px 34px rgba(0,0,0,0.25)" }}>
            <h2 style={{ margin: "0 0 0.75rem", textAlign:"center", padding:"20px"  }}>Delete Redemption</h2>
            <p style={{ color: "#6b7280", marginBottom: "1.25rem" }}>
              Are you sure you want to delete this redemption? This cannot be undone.
            </p>
            <div className={styles.buttonRow}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                style={{ background: "#b42318", borderColor: "#b42318", color:"white"}}
                onClick={() => handleDeleteRedemption(deleteId)}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
