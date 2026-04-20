"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/auth.module.css";

type CardType = "points" | "miles" | "cash";

type Card = {
  id: string;
  name: string;
  last4: string;
  type: CardType;
  balance: number;
  cashValuePerUnit: number;
  active: boolean;
};

type Redemption = {
  id: string;
  date: string;
  cardName: string;
  last4: string;
  amount: number;
  type: string;
  notes?: string;
};

export default function RewardsPage() {
  // LOCAL STORAGE - CARDS
  const [cards, setCards] = useState<Card[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cards");
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "1",
              name: "Travel Platinum",
              last4: "1234",
              type: "points",
              balance: 47320,
              cashValuePerUnit: 0.0125,
              active: true,
            },
            {
              id: "2",
              name: "Cash Rewards",
              last4: "5678",
              type: "cash",
              balance: 34.2,
              cashValuePerUnit: 0.01,
              active: true,
            },
          ];
    }
    return [];
  });

  // LOCAL STORAGE - REDEMPTIONS
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("redemptions");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [usedAmount, setUsedAmount] = useState("");

  // EDIT MODE (ROW INLINE EDIT)
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const totalRewardsValue = cards.reduce(
    (sum, c) => sum + c.balance * c.cashValuePerUnit,
    0
  );

  const earnedThisMonth = 120;
  const redeemedThisYear = 300;

  // SAVE TO LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem("redemptions", JSON.stringify(redemptions));
  }, [redemptions]);

  function openModal(card?: Card) {
    setSelectedCard(card || null);
    setUsedAmount("");
    setShowModal(true);
  }

  function addRedemption() {
    if (!selectedCard || !usedAmount) return;

    const newRedemption: Redemption = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      cardName: selectedCard.name,
      last4: selectedCard.last4,
      amount: Number(usedAmount),
      type: "Usage Tracking",
    };

    setRedemptions([newRedemption, ...redemptions]);
    setShowModal(false);
  }

  function saveEdits() {
    setEditingCardId(null);
  }

  return (
    <div className={styles.R_page}>
      {/* HEADER */}
      <div className={styles.R_header}>
        <h1 className={styles.R_title}>Rewards</h1>
        <button className={styles.R_primaryBtn} onClick={() => openModal()}>
          + Log Redemption
        </button>
      </div>

      {/* SUMMARY */}
      <div className={styles.R_summaryGrid}>
        <div className={styles.R_statCard}>
          <p>Total Rewards Value</p>
          <h2>${totalRewardsValue.toFixed(2)}</h2>
        </div>

        <div className={styles.R_statCard}>
          <p>Earned This Month</p>
          <h2>${earnedThisMonth.toFixed(2)}</h2>
        </div>

        <div className={styles.R_statCard}>
          <p>Redeemed This Year</p>
          <h2>${redeemedThisYear.toFixed(2)}</h2>
        </div>
      </div>

      {/* CARDS TABLE */}
      <div className={styles.R_section}>
        <h2 className={styles.R_sectionTitle}>Rewards Balance</h2>

        <table className={styles.R_table}>
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
            {cards.map((card) => (
              <tr
                key={card.id}
                className={`${!card.active ? styles.R_inactiveRow : ""} ${
                  editingCardId === card.id ? styles.R_selectedRow : ""
                }`}
                onClick={() => setEditingCardId(card.id)}
              >
                {/* CARD */}
                <td>
                  {card.name} •••• {card.last4}
                  {!card.active && (
                    <span className={styles.R_badge}>Inactive</span>
                  )}
                </td>

                {/* TYPE */}
                <td>{card.type}</td>

                {/* RAW BALANCE (EDITABLE) */}
                <td>
                  {editingCardId === card.id ? (
                    <input
                      className={styles.R_input}
                      type="number"
                      value={card.balance}
                      onChange={(e) => {
                        const updated = cards.map((c) =>
                          c.id === card.id
                            ? { ...c, balance: Number(e.target.value) }
                            : c
                        );
                        setCards(updated);
                      }}
                    />
                  ) : card.type === "cash" ? (
                    `$${card.balance.toFixed(2)}`
                  ) : (
                    `${card.balance.toLocaleString()} ${
                      card.type === "points" ? "pts" : "mi"
                    }`
                  )}
                </td>

                {/* EST VALUE */}
                <td>
                  ${(card.balance * card.cashValuePerUnit).toFixed(2)}
                </td>

                {/* ACTIONS */}
                <td>
                  {card.type !== "cash" && (
                    <button
                      className={styles.R_smallBtn}
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 fixes conflict
                        openModal(card);     // 🔥 opens modal correctly
                      }}
                    >
                      Log Redemption
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAVE BAR */}
      {editingCardId && (
        <div className={styles.R_saveBar}>
          <p>Editing card...</p>

          <button
            className={styles.R_secondaryBtn}
            onClick={() => setEditingCardId(null)}
          >
            Cancel
          </button>

          <button
            className={styles.R_primaryBtn}
            onClick={saveEdits}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* REDEMPTION LOG */}
      <div className={styles.R_section}>
        <h2 className={styles.R_sectionTitle}>Redemption Log</h2>

        {redemptions.length === 0 ? (
          <p className={styles.R_empty}>
            No redemptions logged yet. Use the Log Redemption button.
          </p>
        ) : (
          <table className={styles.R_table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Card</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>
                    {r.cardName} •••• {r.last4}
                  </td>
                  <td>{r.amount}</td>
                  <td>{r.type}</td>
                  <td>{r.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.R_modalOverlay}>
          <div className={styles.R_modal}>
            <div>
              <h3 style={{ marginBottom: "10px" }}>
                Log Redemption
              </h3>

              <label className={styles.R_label}>Used Amount</label>

              <input
                className={styles.R_input}
                value={usedAmount}
                onChange={(e) => setUsedAmount(e.target.value)}
                type="number"
                placeholder="Enter amount used"
              />
            </div>

            <div className={styles.R_modalSummary}>
              <div>
                <div className={styles.R_modalSummaryTitle}>
                  Usage Tracking
                </div>

                <div className={styles.R_modalBigValue}>
                  {selectedCard && usedAmount
                    ? `$${Number(usedAmount).toFixed(2)} / $${(
                        selectedCard.balance *
                        selectedCard.cashValuePerUnit
                      ).toFixed(2)}`
                    : "—"}
                </div>

                <div className={styles.R_modalCardMeta}>
                  used / total available
                </div>
              </div>
            </div>

            <div className={styles.R_modalActions}>
              <button
                className={styles.R_secondaryBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className={styles.R_primaryBtn}
                onClick={addRedemption}
                disabled={!usedAmount || !selectedCard}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}