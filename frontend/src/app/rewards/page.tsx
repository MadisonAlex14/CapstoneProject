"use client";

import { useState } from "react";
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
  const [cards] = useState<Card[]>([
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
  ]);

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [amount, setAmount] = useState("");

  const totalRewardsValue = cards.reduce((sum, c) => {
    return sum + c.balance * c.cashValuePerUnit;
  }, 0);

  const earnedThisMonth = 120; // placeholder
  const redeemedThisYear = 300; // placeholder

  function openModal(card?: Card) {
    setSelectedCard(card || null);
    setAmount("");
    setShowModal(true);
  }

  function addRedemption() {
    if (!selectedCard) return;

    const newRedemption: Redemption = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      cardName: selectedCard.name,
      last4: selectedCard.last4,
      amount: Number(amount),
      type: "Travel Portal",
    };

    setRedemptions([newRedemption, ...redemptions]);
    setShowModal(false);
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
                className={!card.active ? styles.R_inactiveRow : ""}
                onClick={() => (window.location.href = `/cards/${card.id}`)}
              >
                <td>
                  {card.name} •••• {card.last4}
                  {!card.active && (
                    <span className={styles.R_badge}>Inactive</span>
                  )}
                </td>

                <td>{card.type}</td>

                <td>
                  {card.type === "cash"
                    ? `$${card.balance.toFixed(2)}`
                    : `${card.balance.toLocaleString()} ${
                        card.type === "points" ? "pts" : "mi"
                      }`}
                </td>

                <td>
                  $
                  {(card.balance * card.cashValuePerUnit).toFixed(2)}
                </td>

                <td>
                  {card.type !== "cash" && (
                    <button
                      className={styles.R_smallBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(card);
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
            <h3>Log Redemption</h3>

            <label>Amount Redeemed</label>
            <input
              className={styles.R_input}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
            />

            {selectedCard && amount && (
              <p className={styles.R_preview}>
                ≈ $
                {(Number(amount) * selectedCard.cashValuePerUnit).toFixed(2)}
              </p>
            )}

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