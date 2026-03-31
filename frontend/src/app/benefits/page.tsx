"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../styles/auth.module.css";

// ---------------------- TYPES ----------------------
type BenefitHistory = {
  id: number;
  amount: number;
  date: string;
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
  resetType: "monthly" | "yearly" | "4years";
  history: BenefitHistory[];
};

const STORAGE_KEY = "creditmaxxing_benefits";

// ---------------------- DATA ----------------------
const CARD_OPTIONS = ["Chase Freedom Unlimited", "Amex Platinum", "Citi Double Cash"];

const BENEFIT_OPTIONS: Record<string, string[]> = {
  "Chase Freedom Unlimited": ["5% Grocery", "3% Gas", "1.5% Cashback Everywhere"],
  "Amex Platinum": ["$200 Airline Credit", "Lounge Access", "$100 Uber Credit"],
  "Citi Double Cash": ["2% Cashback All Purchases", "0% Intro APR", "Balance Transfer Fee Waiver"],
};

// ---------------------- COMPONENT ----------------------
export default function BenefitsPage() {
  // ---------------------- STATE ----------------------
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);

  const [selectedCard, setSelectedCard] = useState("");
  const [selectedBenefit, setSelectedBenefit] = useState("");
  const [selectedResetType, setSelectedResetType] = useState<"monthly" | "yearly" | "4years" | "">("");

  const [form, setForm] = useState({
    card: "",
    benefitName: "",
    appliesTo: "",
    allotted: "",
    used: "",
    resetType: "monthly" as "monthly" | "yearly" | "4years",
    startDate: "",
    notes: "",
  });

  // ---------------------- EFFECTS ----------------------
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBenefits(JSON.parse(stored));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(benefits));
  }, [benefits, isLoaded]);

  // ---------------------- HELPERS ----------------------
  const resetForm = () => {
    setSelectedCard("");
    setSelectedBenefit("");
    setSelectedResetType("");
    setEditingBenefitId(null);
    setForm({
      card: "",
      benefitName: "",
      appliesTo: "",
      allotted: "",
      used: "",
      resetType: "monthly",
      startDate: "",
      notes: "",
    });
  };

  const getNextResetDate = (type: "monthly" | "yearly" | "4years") => {
    const now = new Date();
    if (type === "monthly") return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    if (type === "4years") return new Date(now.getFullYear() + 4, now.getMonth(), now.getDate());
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  };

  const getProgress = (benefit: Benefit) => {
    const now = new Date();
    const reset = new Date(benefit.resetDate);
    if (benefit.resetType === "monthly") {
      const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = Math.max(0, (reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return Math.min((daysLeft / totalDays) * 100, 100);
    }
    if (benefit.resetType === "yearly") {
      const monthsLeft = 12 - now.getMonth();
      return (monthsLeft / 12) * 100;
    }
    if (benefit.resetType === "4years") {
      const yearsLeft = reset.getFullYear() - now.getFullYear();
      const monthsLeft = 12 - now.getMonth();
      return Math.min(((yearsLeft * 12 + monthsLeft) / 48) * 100, 100);
    }
    return 0;
  };

  const getProgressText = (benefit: Benefit) => {
    const now = new Date();
    const reset = new Date(benefit.resetDate);
    if (benefit.resetType === "monthly") {
      const daysLeft = Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return `${daysLeft} days left`;
    }
    if (benefit.resetType === "yearly") {
      const monthsLeft = Math.max(0, 12 - now.getMonth());
      return `${monthsLeft} months left`;
    }
    if (benefit.resetType === "4years") {
      const yearsLeft = reset.getFullYear() - now.getFullYear();
      const monthsLeft = Math.max(0, 12 - now.getMonth());
      return `${yearsLeft} yrs ${monthsLeft} months left`;
    }
    return "";
  };

  const getCashback = (b: Benefit) => {
    let rate = 0;
    if (b.card === "Chase Freedom Unlimited" && b.benefitName === "5% Grocery") rate = 0.05;
    if (b.card === "Chase Freedom Unlimited" && b.benefitName === "3% Gas") rate = 0.03;
    if (b.card === "Chase Freedom Unlimited" && b.benefitName === "1.5% Cashback Everywhere") rate = 0.015;
    if (b.card === "Citi Double Cash" && b.benefitName === "2% Cashback All Purchases") rate = 0.02;
    if (b.card === "Amex Platinum" && b.benefitName === "$100 Uber Credit") rate = 0.1;
    if (b.card === "Amex Platinum" && b.benefitName === "$200 Airline Credit") rate = 1;
    return b.used * rate;
  };

  // ---------------------- MEMO ----------------------
  const summary = useMemo(() => {
    let totalSpent = 0;
    let cashbackUsed = 0;
    let benefitsRemaining = 0;
    let benefitsExpiring = 0;
    const now = new Date();
    benefits.forEach((b) => {
      totalSpent += b.used;
      cashbackUsed += getCashback(b);
      benefitsRemaining += b.remaining;
      const diffDays = Math.ceil((new Date(b.resetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && b.remaining > 0) benefitsExpiring += 1;
    });
    return { totalSpent, cashbackUsed, benefitsRemaining, benefitsExpiring };
  }, [benefits]);

  // ---------------------- HANDLERS ----------------------
  const handleSave = () => {
    const allotted = Number(form.allotted);
    const usedAmount = Number(form.used) || 0;
    if (!form.card || !form.benefitName || isNaN(allotted)) return;

    const resetDate = getNextResetDate(form.resetType).toISOString().split("T")[0];

    const benefitData: Benefit = {
      id: editingBenefitId || Date.now(),
      card: form.card,
      benefitName: form.benefitName,
      appliesTo: form.appliesTo,
      allotted,
      used: usedAmount,
      remaining: allotted - usedAmount,
      resetDate,
      resetType: form.resetType,
      history: [
        {
          id: Date.now(),
          amount: usedAmount,
          date: new Date().toISOString().split("T")[0],
          notes: form.notes,
        },
      ],
    };

    if (editingBenefitId) {
      setBenefits((prev) => prev.map((b) => (b.id === editingBenefitId ? benefitData : b)));
    } else {
      setBenefits((prev) => [...prev, benefitData]);
    }

    resetForm();
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this benefit?")) {
      setBenefits((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleEdit = (b: Benefit) => {
    setEditingBenefitId(b.id);
    setSelectedCard(b.card);
    setSelectedBenefit(b.benefitName);
    setSelectedResetType(b.resetType);
    setForm({
      card: b.card,
      benefitName: b.benefitName,
      appliesTo: b.appliesTo,
      allotted: b.allotted.toString(),
      used: b.used.toString(),
      resetType: b.resetType,
      startDate: b.resetDate,
      notes: b.history?.[0]?.notes || "",
    });
    setShowModal(true);
  };

  if (!isLoaded) return null;

  // ---------------------- RENDER ----------------------
  return (
    <div className={styles.BenefitContainer}>
      {/* Summary */}
      <div className={styles.BenefitOverviewCard}>
        <h2 className={styles.BenefitOverviewTitle}>✨ Perks Overview</h2>
        <div className={styles.BenefitOverviewStats}>
          <div className={styles.BenefitOverviewItem}>
            <span>Total Spent</span>
            <p>${summary.totalSpent}</p>
          </div>
          <div className={styles.BenefitOverviewItem}>
            <span>Cashback Used</span>
            <p>${summary.cashbackUsed.toFixed(2)}</p>
          </div>
          <div className={styles.BenefitOverviewItem}>
            <span>Benefits Remaining</span>
            <p>{summary.benefitsRemaining}</p>
          </div>
          <div className={styles.BenefitOverviewItemExpiring}>
            <span>Benefits Expiring</span>
            <p>{summary.benefitsExpiring}</p>
          </div>
        </div>
      </div>

      {/* Tracked Benefits */}
      <div className={styles.BenefitTrackedCard}>
        <h2 className={styles.BenefitTrackedTitle}>Tracked Benefits</h2>
        <div className={styles.BenefitCardsContainer}>
          {benefits.map((b) => (
            <div key={b.id} className={styles.BenefitCardItem}>
              <div className={styles.BenefitCardHeader}>
                <h3>{b.card}</h3>
                <p>{b.benefitName}</p>
              </div>
              <p className={styles.BenefitAppliesTo}>{b.appliesTo}</p>

              {/* Progress Bar */}
              <div className={styles.ProgressBarContainer}>
                <div
                  className={styles.ProgressBar}
                  style={{
                    width: `${getProgress(b)}%`,
                    backgroundColor: getProgress(b) > 30 ? "#4ade80" : "#facc15",
                  }}
                >
                  <span className={styles.BenefitProgressBarText}>{getProgressText(b)}</span>
                </div>
              </div>

              <p className={styles.CashbackText}>💰 Estimated Cashback: ${getCashback(b).toFixed(2)}</p>

              <div className={styles.BenefitCardActions}>
                <button className={styles.BenefitEditBtn} onClick={() => handleEdit(b)}>Edit</button>
                <button className={styles.BenefitDeleteBtn} onClick={() => handleDelete(b.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.BenefitPrimaryBtn} onClick={() => { resetForm(); setShowModal(true); }}>
        + Add a Benefit
      </button>

      {/* Modal */}
      {showModal && (
        <div className={styles.BenefitModalOverlay}>
          <div className={styles.BenefitModal}>
            {/* Card Selection */}
            <select
              className={styles.BenefitInput}
              value={selectedCard}
              onChange={(e) => {
                const card = e.target.value;
                setSelectedCard(card);
                setSelectedBenefit("");
                setSelectedResetType("");
                setForm({ ...form, card, benefitName: "" });
              }}
            >
              <option value="">Select Card</option>
              {CARD_OPTIONS.map((card) => (
                <option key={card} value={card}>{card}</option>
              ))}
            </select>

            {/* Benefit Selection */}
            {selectedCard && (
              <select
                className={styles.BenefitInput}
                value={selectedBenefit}
                onChange={(e) => {
                  const benefit = e.target.value;
                  setSelectedBenefit(benefit);
                  setForm({ ...form, benefitName: benefit });
                }}
              >
                <option value="">Select Benefit</option>
                {BENEFIT_OPTIONS[selectedCard].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {/* Reset Type Selection */}
            {selectedBenefit && (
              <select
                className={styles.BenefitInput}
                value={selectedResetType}
                onChange={(e) => {
                  const type = e.target.value as "monthly" | "yearly" | "4years";
                  setSelectedResetType(type);
                  setForm({ ...form, resetType: type });
                }}
              >
                <option value="">Select Reset Type</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="4years">4 Years</option>
              </select>
            )}

            {/* Used Amount & Notes */}
            {selectedResetType && (
              <>
                <input
                  type="number"
                  placeholder="Used Amount"
                  className={styles.BenefitInput}
                  value={form.used}
                  onChange={(e) => setForm({ ...form, used: e.target.value })}
                />
                <textarea
                  placeholder="Notes"
                  className={styles.BenefitTextarea}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </>
            )}

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
          </div>
        </div>
      )}
    </div>
  );
}