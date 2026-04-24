"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../styles/auth.module.css";
import { differenceInDays, parseISO, format } from "date-fns";

type Promotion = {
  credit_card_type_id: number;
  cardName: string;
  promotionName: string;
  description: string;
  threshold: number;
  currentAmount: number;
  award: string;
  start_date: string;
  end_date: string;
  status: "Active" | "At Risk" | "Completed" | "Expired";
};

const CARD_TYPES = [
  { id: 1, name: "Chase Freedom Unlimited" },
  { id: 2, name: "Amex Gold" },
  { id: 3, name: "Citi Double Cash" },
];

const CARD_PROMOTIONS: Record<number, Promotion[]> = {
  1: [
    {
      credit_card_type_id: 1,
      cardName: "Chase Freedom Unlimited",
      promotionName: "Grocery Cashback",
      description: "Spend $300 on groceries to get $50 back",
      threshold: 300,
      currentAmount: 0,
      award: "$50",
      start_date: "",
      end_date: "",
      status: "Active",
    },
    {
      credit_card_type_id: 1,
      cardName: "Chase Freedom Unlimited",
      promotionName: "Dining Bonus",
      description: "Spend $200 on dining to get $30 back",
      threshold: 200,
      currentAmount: 0,
      award: "$30",
      start_date: "",
      end_date: "",
      status: "Active",
    },
    {
      credit_card_type_id: 1,
      cardName: "Chase Freedom Unlimited",
      promotionName: "Online Shopping",
      description: "Spend $400 online to get $60 back",
      threshold: 400,
      currentAmount: 0,
      award: "$60",
      start_date: "",
      end_date: "",
      status: "Active",
    },
  ],
  2: [
    {
      credit_card_type_id: 2,
      cardName: "Amex Gold",
      promotionName: "Travel Bonus",
      description: "Spend $500 on travel to get $100 back",
      threshold: 500,
      currentAmount: 0,
      award: "$100",
      start_date: "",
      end_date: "",
      status: "Active",
    },
    {
      credit_card_type_id: 2,
      cardName: "Amex Gold",
      promotionName: "Restaurant Rewards",
      description: "Spend $250 at restaurants to get $25 back",
      threshold: 250,
      currentAmount: 0,
      award: "$25",
      start_date: "",
      end_date: "",
      status: "Active",
    },
    {
      credit_card_type_id: 2,
      cardName: "Amex Gold",
      promotionName: "Supermarket Cashback",
      description: "Spend $300 on groceries to get $40 back",
      threshold: 300,
      currentAmount: 0,
      award: "$40",
      start_date: "",
      end_date: "",
      status: "Active",
    },
  ],
  3: [
    {
      credit_card_type_id: 3,
      cardName: "Citi Double Cash",
      promotionName: "Fuel Bonus",
      description: "Spend $150 on fuel to get $20 back",
      threshold: 150,
      currentAmount: 0,
      award: "$20",
      start_date: "",
      end_date: "",
      status: "Active",
    },
    {
      credit_card_type_id: 3,
      cardName: "Citi Double Cash",
      promotionName: "Electronics Deal",
      description: "Spend $400 on electronics to get $50 back",
      threshold: 400,
      currentAmount: 0,
      award: "$50",
      start_date: "",
      end_date: "",
      status: "Active",
    },
    {
      credit_card_type_id: 3,
      cardName: "Citi Double Cash",
      promotionName: "Dining Cashback",
      description: "Spend $200 at restaurants to get $25 back",
      threshold: 200,
      currentAmount: 0,
      award: "$25",
      start_date: "",
      end_date: "",
      status: "Active",
    },
  ],
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | "">("");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [currentAmount, setCurrentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEnrollPopup, setShowEnrollPopup] = useState(false);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);

  // -------------------- LOAD FROM LOCALSTORAGE --------------------
  useEffect(() => {
    const saved = localStorage.getItem("promotions");
    if (saved) setPromotions(JSON.parse(saved));
  }, []);

  // -------------------- AUTO-COMPUTE STATUS --------------------
  const computeStatus = (promo: Promotion): Promotion["status"] => {
    if (promo.currentAmount >= promo.threshold) return "Completed";
    if (!promo.end_date) return "Active";
    const daysLeft = differenceInDays(parseISO(promo.end_date), new Date());
    if (daysLeft < 0) return "Expired";
    if (daysLeft < 14) return "At Risk";
    return "Active";
  };

  // -------------------- PROMOTION SUMMARY --------------------
  const summary = useMemo(() => {
    const active = promotions.filter((p) => p.status === "Active").length;
    const completedYTD = promotions.filter((p) => p.status === "Completed").length;
    const expiringThisMonth = promotions.filter((p) => {
      if (!p.end_date) return false;
      const daysLeft = differenceInDays(parseISO(p.end_date), new Date());
      return daysLeft <= 30 && daysLeft >= 0;
    }).length;
    const totalPotentialAward = promotions.reduce(
      (acc, p) => acc + parseFloat(p.award.replace("$", "")),
      0
    );
    return { active, completedYTD, expiringThisMonth, totalPotentialAward };
  }, [promotions]);

  // -------------------- HANDLERS --------------------
  const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cardId = Number(e.target.value);
    setSelectedCard(cardId);
    setSelectedPromotion(null);
  };

  const handlePromotionChange = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setCurrentAmount("");
    setStartDate("");
    setEndDate("");
  };

  const handleAddPromotion = () => {
    if (!selectedPromotion) return;

    const newPromotion: Promotion = {
      ...selectedPromotion,
      currentAmount: Number(currentAmount) || 0,
      start_date: startDate,
      end_date: endDate,
      status: computeStatus({
        ...selectedPromotion,
        currentAmount: Number(currentAmount) || 0,
        end_date: endDate,
      }),
    };

    const existingIndex = promotions.findIndex(
      (p) => p.promotionName === selectedPromotion.promotionName && p.cardName === selectedPromotion.cardName
    );

    let updatedPromotions;
    if (existingIndex !== -1) {
      updatedPromotions = [...promotions];
      updatedPromotions[existingIndex] = newPromotion;
    } else {
      updatedPromotions = [...promotions, newPromotion];
    }

    setPromotions(updatedPromotions);
    localStorage.setItem("promotions", JSON.stringify(updatedPromotions));

    setSelectedCard("");
    setSelectedPromotion(null);
    setCurrentAmount("");
    setStartDate("");
    setEndDate("");
    setShowEnrollPopup(false);
    setMenuOpenIndex(null);
  };

  const handleRemovePromotion = (index: number) => {
    const updated = promotions.filter((_, i) => i !== index);
    setPromotions(updated);
    localStorage.setItem("promotions", JSON.stringify(updated));
    setMenuOpenIndex(null);
  };

  const handleEditPromotion = (promo: Promotion) => {
    setSelectedCard(promo.credit_card_type_id);
    setSelectedPromotion(promo);
    setCurrentAmount(promo.currentAmount.toString());
    setStartDate(promo.start_date);
    setEndDate(promo.end_date);
    setShowEnrollPopup(true);
    setMenuOpenIndex(null);
  };

  // -------------------- STATUS AUTO-UPDATE --------------------
  useEffect(() => {
    const updated = promotions.map((p) => {
      const newStatus = computeStatus(p);
      return p.status !== newStatus ? { ...p, status: newStatus } : p;
    });

    const hasChange = updated.some((p, idx) => p.status !== promotions[idx].status);
    if (hasChange) {
      setPromotions(updated);
      localStorage.setItem("promotions", JSON.stringify(updated));
    }
  }, [promotions]);

  // -------------------- RENDER --------------------
  return (

    <div className={styles.promotionsPageContainer}>
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Promotions</h1>
          <p className={styles.PageSubtitle}>
            Discover limited-time offers, bonus rewards, and special credit card deals.
          </p>
       </div>


      <section className={styles.promotionsSummary}>
        <div className={styles.promotionsSummaryCards}>
          {[
            { label: "Active Promotions", value: summary.active },
            { label: "Total Potential Award", value: `$${summary.totalPotentialAward}` },
            { label: "Completed (YTD)", value: summary.completedYTD },
            { label: "Expiring This Month", value: summary.expiringThisMonth },
          ].map((stat, idx) => (
            <div key={idx} className={styles.promotionsSummaryCard}>
              <p className={styles.promotionsSummaryLabel}>{stat.label}</p>
              <p className={styles.promotionsSummaryValue}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Your Promotions */}
      <section>
        <h2 className={styles.promotionsListTitle}>Your Promotions</h2>
        <div className={styles.promotionsList}>
          {promotions.map((promo, idx) => {
            const daysLeft = promo.end_date ? differenceInDays(parseISO(promo.end_date), new Date()) : 0;
            const daysClass =
              daysLeft < 7
                ? styles.promotionsDaysRed
                : daysLeft < 14
                ? styles.promotionsDaysYellow
                : styles.promotionsDaysDefault;

            const progressPercent = Math.min(100, Math.round((promo.currentAmount / promo.threshold) * 100));

            const formattedStart = promo.start_date ? format(parseISO(promo.start_date), "MMMM d, yyyy") : "-";

            return (
              <div key={idx} className={styles.promotionsCard} style={{ position: "relative" }}>
                <div
                  className={styles.promotionsCardMenuIcon}
                  onClick={() => setMenuOpenIndex(menuOpenIndex === idx ? null : idx)}
                >
                  &#8942;
                </div>
                {menuOpenIndex === idx && (
                  <div className={styles.promotionsCardMenu}>
                    <div onClick={() => handleEditPromotion(promo)}>Edit</div>
                    <div onClick={() => handleRemovePromotion(idx)}>Remove</div>
                  </div>
                )}
                <p className={styles.promotionsCardHeader}>{promo.cardName}</p>
                <p className={styles.promotionsCardTitle}>{promo.promotionName}</p>
                <p className={styles.promotionsCardDescription}>{promo.description}</p>
                <div className={styles.promotionsCardRow}>
                  <span>Threshold: ${promo.threshold}</span>
                  <span>Award: {promo.award}</span>
                </div>
                <div className={styles.promotionsProgressBar}>
                  <div className={styles.promotionsProgressFill} style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className={styles.promotionsProgressText}>
                  {promo.currentAmount} / {promo.threshold}
                </p>
                <div className={styles.promotionsCardRow}>
                  <span>Start: {formattedStart}</span>
                  <span>
                    End: <span className={daysClass}>{daysLeft > 0 ? `${daysLeft} days left` : "Expired"}</span>
                  </span>
                </div>
                <span className={`${styles.promotionsStatusBadge} ${styles[promo.status.replace(/\s/g, "")]}`}>
                  {promo.status}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Enroll Button */}
      <section className={styles.promotionsActions}>
        <button className={styles.promotionsEnrollButton} onClick={() => setShowEnrollPopup(true)}>
          + Enroll in Promotion
        </button>
      </section>

      {/* Enroll Popup */}
      {showEnrollPopup && (
        <div className={styles.promotionsPopupOverlay}>
          <div className={styles.promotionsPopup}>
            <h3 className={styles.promotionsPopupTitle}>Enroll in Promotion</h3>

            <select className={styles.promotionsPopupSelect} value={selectedCard} onChange={handleCardChange}>
              <option value="">Select Card</option>
              {CARD_TYPES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {selectedCard && (
              <div className={styles.promotionsPopupChecklist}>
                {CARD_PROMOTIONS[selectedCard].map((p) => (
                  <label key={p.promotionName} className={styles.promotionsPopupChecklistItem}>
                    <input
                      type="radio"
                      name="promotion"
                      className={styles.promotionsPopupCheckbox}
                      checked={selectedPromotion?.promotionName === p.promotionName}
                      onChange={() => handlePromotionChange(p)}
                    />
                    <span>{p.promotionName}</span>
                    {selectedPromotion?.promotionName === p.promotionName && (
                      <p style={{ fontSize: "0.85rem", color: "#374151", marginLeft: "1.5rem" }}>{p.description}</p>
                    )}
                  </label>
                ))}
              </div>
            )}

            {selectedPromotion && (
              <>
                <input
                  type="number"
                  placeholder="Current Amount Spent"
                  className={styles.promotionsPopupInput}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Threshold"
                  className={styles.promotionsPopupInput}
                  value={selectedPromotion.threshold}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="Award"
                  className={styles.promotionsPopupInput}
                  value={selectedPromotion.award}
                  readOnly
                />
                <input
                  type="date"
                  className={styles.promotionsPopupInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className={styles.promotionsPopupInput}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            )}

            <div className={styles.promotionsPopupActions}>
              <button className={styles.promotionsPopupCancel} onClick={() => setShowEnrollPopup(false)}>
                Cancel
              </button>
              <button className={styles.promotionsPopupAdd} onClick={handleAddPromotion}>
                Add Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
