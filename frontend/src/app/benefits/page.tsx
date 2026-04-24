"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../styles/auth.module.css";

// ---------------------- TYPES ----------------------
type BenefitHistory = {
  id: number;
  amount: number;
  date: string;
  merchant: string;
  notes: string;
};

type Benefit = {
  id: number;
  card: string;
  benefitName: string;
  appliesTo: string;
  allotted: number;
  used: number;
  remaining: number;
  resetDate: string;
  resetType: string;
  history: BenefitHistory[];
};

const STORAGE_KEY = "creditmaxxing_benefits";

// ---------------------- CARDS & BENEFITS ----------------------
const CARD_OPTIONS = ["Chase Freedom Unlimited", "Amex Platinum", "Citi Double Cash"];

const BENEFIT_OPTIONS: Record<string, string[]> = {
  "Chase Freedom Unlimited": ["5% Grocery", "3% Gas", "1.5% Cashback Everywhere"],
  "Amex Platinum": ["$200 Airline Credit", "Lounge Access", "$100 Uber Credit"],
  "Citi Double Cash": ["2% Cashback All Purchases", "0% Intro APR", "Balance Transfer Fee Waiver"],
};

// Card color themes
const CARD_THEMES: Record<string, { bg: string; gradient: string }> = {
  "Chase Freedom Unlimited": { bg: "#e0f7f1", gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
  "Amex Platinum": { bg: "#f0f4ff", gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  "Citi Double Cash": { bg: "#fff4e6", gradient: "linear-gradient(135deg, #f59e0b, #fcd34d)" },
};

// ---------------------- COMPONENT ----------------------
export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedBenefit, setSelectedBenefit] = useState("");
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const [form, setForm] = useState({
    card: "",
    benefitName: "",
    appliesTo: "",
    allotted: "",
    used: "",
    resetType: "",
    date: "",
    merchant: "",
    notes: "",
  });

  // ---------------------- EFFECTS ----------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setBenefits(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load benefits from localStorage", err);
    }
  }, []);

  const saveBenefitsToStorage = (data: Benefit[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save benefits to localStorage", err);
    }
  };

  // ---------------------- HELPERS ----------------------
  const getNextResetDate = (type: string) => {
    const now = new Date();
    if (type === "monthly") return new Date(now.setMonth(now.getMonth() + 1));
    if (type === "4years") return new Date(now.setFullYear(now.getFullYear() + 4));
    return new Date(now.setFullYear(now.getFullYear() + 1));
  };

  const resetForm = () => {
    setSelectedCard("");
    setSelectedBenefit("");
    setEditingBenefitId(null);
    setForm({
      card: "",
      benefitName: "",
      appliesTo: "",
      allotted: "",
      used: "",
      resetType: "",
      date: "",
      merchant: "",
      notes: "",
    });
  };

  const getDaysLeft = (resetDate: string) => {
    const today = new Date();
    const reset = new Date(resetDate);
    const diff = Math.ceil((reset.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const calculateReward = (b: Benefit) => {
    const percentMatch = b.benefitName.match(/(\d+(\.\d+)?)%/);
    if (percentMatch) {
      const percent = Number(percentMatch[1]);
      return ((percent / 100) * b.used).toFixed(2);
    }
    const flatMatch = b.benefitName.match(/\$(\d+)/);
    if (flatMatch) return flatMatch[1];
    return "0";
  };

  // ---------------------- SUMMARY ----------------------
  const summary = useMemo(() => {
    let totalSpent = 0;
    let cashBack = 0;
    let remaining = 0;
    let expiring = 0;

    benefits.forEach((b) => {
      const daysLeft = getDaysLeft(b.resetDate);
      totalSpent += b.used;
      cashBack += Number(calculateReward(b));
      if (daysLeft > 30) remaining += 1;
      if (daysLeft <= 10) expiring += 1;
    });

    return { totalSpent, cashBack, remaining, expiring };
  }, [benefits]);

  // ---------------------- HANDLERS ----------------------
  const handleSave = () => {
    const allotted = Number(form.allotted) || 100;
    const usedAmount = Number(form.used);

    if (!form.card || !form.benefitName || isNaN(usedAmount) || !form.resetType) {
      alert("Please fill all required fields correctly!");
      return;
    }

    const resetDate = getNextResetDate(form.resetType).toISOString().split("T")[0];

    const benefitData: Benefit = {
      id: editingBenefitId || Date.now(),
      card: form.card,
      benefitName: form.benefitName,
      appliesTo: form.appliesTo || "Default",
      allotted,
      used: usedAmount,
      remaining: allotted - usedAmount,
      resetDate,
      resetType: form.resetType,
      history: [
        {
          id: Date.now(),
          amount: usedAmount,
          date: form.date,
          merchant: form.merchant,
          notes: form.notes,
        },
      ],
    };

    let updatedBenefits: Benefit[];
    if (editingBenefitId) {
      updatedBenefits = benefits.map((b) => (b.id === editingBenefitId ? benefitData : b));
    } else {
      updatedBenefits = [...benefits, benefitData];
    }

    setBenefits(updatedBenefits);
    saveBenefitsToStorage(updatedBenefits);
    resetForm();
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this benefit?")) {
      const updated = benefits.filter((b) => b.id !== id);
      setBenefits(updated);
      saveBenefitsToStorage(updated);
    }
    setMenuOpenId(null);
  };

  const handleEdit = (b: Benefit) => {
    setEditingBenefitId(b.id);
    setSelectedCard(b.card);
    setSelectedBenefit(b.benefitName);
    setForm({
      card: b.card,
      benefitName: b.benefitName,
      appliesTo: b.appliesTo,
      allotted: b.allotted.toString(),
      used: b.used.toString(),
      resetType: b.resetType,
      date: b.history?.[0]?.date || "",
      merchant: b.history?.[0]?.merchant || "",
      notes: b.history?.[0]?.notes || "",
    });
    setShowModal(true);
    setMenuOpenId(null);
  };

  // ---------------------- RENDER ----------------------
  return (

    <div className={styles.BenefitContainer}>
      <div className={styles.PageHero}>
       <h1 className={styles.PageTitle}>Benefits</h1>
         <p className={styles.PageSubtitle}>
           Maximize the value of your credit cards with curated perks, cash back, and exclusive offers.
          </p>
      </div>




      <div className={styles.BenefitPerksSummary}>
        <div className={styles.BenefitSummaryTopRow}>
          <div className={styles.BenefitSummaryCard}>
            <h3>Total Amount Spent</h3>
            <p>${summary.totalSpent}</p>
          </div>
          <div className={styles.BenefitSummaryCard}>
            <h3>Eligible Cash Back</h3>
            <p>${summary.cashBack}</p>
          </div>
          <div className={styles.BenefitSummaryCard}>
            <h3>Remaining Benefits Active</h3>
            <p>{summary.remaining}</p>
          </div>
          <div className={styles.BenefitSummaryCardExpiring}>
            <h3>Expiring Benefits</h3>
            <p>{summary.expiring}</p>
          </div>
        </div>
      </div>

      {/* ---------- Tracked Benefits Heading ---------- */}
      <div className={styles.BenefitTracked}>
        <h2>Tracked Benefits</h2>
      </div>

      {/* ---------- Benefit Cards ---------- */}
      <div className={styles.BenefitCardsContainer}>
        {benefits.map((b) => {
          const daysLeft = getDaysLeft(b.resetDate);
          return (
            <div
              key={b.id}
              className={styles.BenefitCardItem}
              style={{ background: CARD_THEMES[b.card].bg }}
            >
              <div className={styles.BenefitCardTop}>
                <h3>{b.card}</h3>
                <div className={styles.BenefitCardMenu}>
                  <button onClick={() => setMenuOpenId(menuOpenId === b.id ? null : b.id)}>⋮</button>
                  {menuOpenId === b.id && (
                    <div className={styles.BenefitCardMenuDropdown}>
                      <button onClick={() => handleEdit(b)}>Edit</button>
                      <button onClick={() => handleDelete(b.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.ProgressBarContainer}>
                <div
                  className={styles.ProgressBar}
                  style={{
                    width: `${Math.min((b.used / b.allotted) * 100, 100)}%`,
                    background: CARD_THEMES[b.card].gradient,
                  }}
                >
                  {daysLeft} days left
                </div>
              </div>

              <div className={styles.BenefitCardBottom}>
                <span>${calculateReward(b)}</span>
                <span>{b.benefitName}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- Log Benefit Button ---------- */}
      <button
        className={styles.BenefitPrimaryBtn}
        onClick={() => { resetForm(); setShowModal(true); }}
      >
        + Log Benefit Usage
      </button>

      {/* ---------- Modal (Wizard Steps) ---------- */}
      {showModal && (
        <div className={styles.BenefitModalOverlay}>
          <div className={styles.BenefitModal}>
            <div className={styles.BenefitModalHeader}>
              <h2>{editingBenefitId ? "Edit Benefit Usage" : "Log Benefit Usage"}</h2>
              <button
                className={styles.BenefitModalCloseBtn}
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                ×
              </button>
            </div>

            <select
              className={styles.BenefitInput}
              value={form.card}
              onChange={(e) => {
                const card = e.target.value;
                setForm({ ...form, card });
                setSelectedCard(card);
                setSelectedBenefit("");
              }}
            >
              <option value="">Select a Card</option>
              {CARD_OPTIONS.map((card) => (
                <option key={card} value={card}>{card}</option>
              ))}
            </select>

            {selectedCard && (
              <select
                className={styles.BenefitInput}
                value={form.benefitName}
                onChange={(e) => {
                  const benefit = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    benefitName: benefit,
                    date: editingBenefitId ? prev.date : new Date().toISOString().split("T")[0],
                  }));
                  setSelectedBenefit(benefit);
                }}
              >
                <option value="">Select a Benefit</option>
                {BENEFIT_OPTIONS[selectedCard].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {selectedBenefit && (
              <input
                type="number"
                placeholder="Input Amount Spent"
                className={styles.BenefitInput}
                value={form.used}
                onChange={(e) => setForm({ ...form, used: e.target.value })}
              />
            )}

            {selectedBenefit && (
              <>
                <select
                  className={styles.BenefitInput}
                  value={form.resetType}
                  onChange={(e) => setForm({ ...form, resetType: e.target.value })}
                >
                  <option value="">Choose Time Frame</option>
                  <option value="monthly">1 Month</option>
                  <option value="yearly">1 Year</option>
                  <option value="4years">4 Years</option>
                </select>

                {form.resetType && (
                  <div className={styles.BenefitStartDateContainer}>
                    <label className={styles.BenefitStartDateLabel}>Start Date</label>
                    <input
                      type="date"
                      className={styles.BenefitInput}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            {selectedBenefit && (
              <div className={styles.BenefitModalActions}>
                <button className={styles.BenefitSaveBtn} onClick={handleSave}>
                  {editingBenefitId ? "Update" : "Save"}
                </button>
                <button
                  className={styles.BenefitCancelBtn}
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
