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
  // ---------------- HYDRATION ----------------
  const [hydrated, setHydrated] = useState(false);

  // ---------------- STATE ----------------
  const [cards, setCards] = useState<Card[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  // ---------------- MODALS ----------------
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [usedAmount, setUsedAmount] = useState("");

  // ---------------- INLINE EDIT ----------------
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // ---------------- FORM ----------------
  const [form, setForm] = useState({
    cardId: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    type: "",
    notes: "",
  });

  // ---------------- LOAD ----------------
  useEffect(() => {
    const savedCards = localStorage.getItem("cards");
    const savedRedemptions = localStorage.getItem("redemptions");

    if (savedCards) {
      setCards(JSON.parse(savedCards));
    } else {
      setCards([
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
    }

    if (savedRedemptions) {
      setRedemptions(JSON.parse(savedRedemptions));
    }

    setHydrated(true);
  }, []);

  // ---------------- STORAGE ----------------
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("cards", JSON.stringify(cards));
    }
  }, [cards, hydrated]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("redemptions", JSON.stringify(redemptions));
    }
  }, [redemptions, hydrated]);

  // ---------------- SUMMARY ----------------
  const totalRewardsValue = cards.reduce(
    (sum, c) => sum + c.balance * c.cashValuePerUnit,
    0
  );

  const earnedThisMonth = 120;

  const redeemedThisYear = redemptions.reduce(
    (sum, r) => sum + r.amount,
    0
  );

  const eligibleCards = cards.filter(
    (c) => c.type === "points" || c.type === "miles"
  );

  const selected = cards.find((c) => c.id === form.cardId);

  const unitLabel =
    selected?.type === "points"
      ? "pts"
      : selected?.type === "miles"
      ? "mi"
      : "";

  const estimatedValue =
    selected && form.amount
      ? Number(form.amount) * selected.cashValuePerUnit
      : 0;

  const exceedsBalance =
    selected && form.amount
      ? Number(form.amount) > selected.balance
      : false;

  // ---------------- REDDEMPTION ----------------
  function openRedemptionModal() {
    setForm({
      cardId: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      type: "",
      notes: "",
    });
    setShowRedemptionModal(true);
  }

  function addRedemption() {
    if (!selected || !form.amount || !form.type) return;

    const amountNum = Number(form.amount);
    if (amountNum <= 0 || amountNum > selected.balance) return;

    const newEntry: Redemption = {
      id: crypto.randomUUID(),
      date: form.date,
      cardName: selected.name,
      last4: selected.last4,
      amount: amountNum,
      type: form.type,
      notes: form.notes,
    };

    setCards(
      cards.map((c) =>
        c.id === selected.id
          ? { ...c, balance: c.balance - amountNum }
          : c
      )
    );

    setRedemptions([newEntry, ...redemptions]);
    setShowRedemptionModal(false);
  }

  // ---------------- USAGE ----------------
  function openUsageModal(card: Card) {
    setSelectedCard(card);
    setUsedAmount("");
    setShowUsageModal(true);
  }

  function addUsage() {
    if (!selectedCard || !usedAmount) return;

    const amountNum = Number(usedAmount);

    const newEntry: Redemption = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      cardName: selectedCard.name,
      last4: selectedCard.last4,
      amount: amountNum,
      type: "Usage Tracking",
    };

    setCards(
      cards.map((c) =>
        c.id === selectedCard.id
          ? { ...c, balance: c.balance - amountNum }
          : c
      )
    );

    setRedemptions([newEntry, ...redemptions]);
    setShowUsageModal(false);
  }

  // ---------------- INLINE EDIT ----------------
  function updateBalance(cardId: string, value: string) {
    const num = Number(value);
    if (isNaN(num)) return;

    setCards(
      cards.map((c) =>
        c.id === cardId ? { ...c, balance: num } : c
      )
    );
  }

  function saveEdits() {
    setEditingCardId(null);
  }

  // ---------------- HYDRATION GUARD ----------------
  if (!hydrated) {
    return <div className={styles.R_page}>Loading...</div>;
  }

  // ---------------- UI ----------------
  return (
    <div className={styles.R_page}>
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Rewards</h1>
          <p className={styles.PageSubtitle}>
           Track your points, miles, and cashback rewards across all your credit cards.
          </p>
       </div>  


      {/* SUMMARY */}
      <section className={styles.Summary}>
        <div className={styles.SummaryCards}>
         {[
          { label: "Total Rewards Value", value: `$${totalRewardsValue.toFixed(2)}` },
          { label: "Earned This Month", value: `$${earnedThisMonth.toFixed(2)}` },
          { label: "Redeemed This Year", value: `$${redeemedThisYear.toFixed(2)}` },
          ].map((stat, idx) => (
           <div key={idx} className={styles.SummaryCard}>
             <p className={styles.SummaryLabel}>{stat.label}</p>
            <p className={styles.SummaryValue}>{stat.value}</p>
          </div>
         ))}
        </div>
      </section>


      {/* ================= TABLE ================= */}
      <div className={styles.Section}>
        <h2 className={styles.SectionTitle}>Rewards Balance</h2>

        <table className={styles.table}>
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
              <tr key={card.id}>
                <td>
                  {card.name} •••• {card.last4}
                </td>

                <td>{card.type}</td>

                <td
                  onClick={() => {
                    setEditingCardId(card.id);
                    setEditValue(String(card.balance));
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {editingCardId === card.id ? (
                    <input
                      type="number"
                      value={editValue}
                      autoFocus
                      className={styles.ModalInput}
                      onChange={(e) =>
                        setEditValue(e.target.value)
                      }
                      onBlur={() => {
                        updateBalance(card.id, editValue);
                        setEditingCardId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateBalance(card.id, editValue);
                          setEditingCardId(null);
                        }
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

                <td>
                  ${(card.balance * card.cashValuePerUnit).toFixed(2)}
                </td>

                <td>
                  {card.type !== "cash" && (
                    <button
                      className={styles.SecondaryButton}
                      onClick={() => openUsageModal(card)}
                    >
                      Track Usage
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= REDEMPTION LOG ================= */}
      <div className={styles.Section}>
        <h2 className={styles.SectionTitle}>Redemption Log</h2>

        {redemptions.length === 0 ? (
          <p className={styles.R_empty}>No usage logged yet.</p>
        ) : (
          <table className={styles.table}>
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
                  <td>${r.amount}</td>
                  <td>{r.type}</td>
                  <td>{r.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      <button
          className={styles.ModalButton}
          onClick={openRedemptionModal}
        >
          + Log Redemption
        </button>

      {/* ================= USAGE MODAL ================= */}
      {showUsageModal && selectedCard && (
        <div className={styles.ModalOverlay}>
          <div className={styles.Modal}>
            <h3>Track Usage</h3>


            <button
              type="button"
               className={styles.ModalXBtn}
               onClick={() => setShowUsageModal(false)}
               >
               x
              </button>



            <input
              className={styles.ModalInput}
              value={usedAmount}
              onChange={(e) => setUsedAmount(e.target.value)}
              type="number"
              placeholder="Enter amount"
            />

            <div style={{ marginTop: "10px", fontWeight: 500 }}>
              {usedAmount ? (
                <>
                  ${Number(usedAmount).toFixed(2)} / $
                  {(
                    selectedCard.balance *
                    selectedCard.cashValuePerUnit
                  ).toFixed(2)}
                </>
              ) : (
                "—"
              )}
            </div>

           <div className={styles.buttonRow}>
            <button
             type="button"
            className={styles.cancelBtn}
            onClick={() => setShowUsageModal(false)}
            >
            Cancel
            </button>

           <button
              type="button"
              className={styles.saveBtn}
             onClick={addUsage}
             >
            Save
           </button>
          </div>

          </div>
        </div>
      )}

      {/* ================= REDEMPTION MODAL ================= */}
      {showRedemptionModal && (
        <div className={styles.ModalOverlay}>
          <div className={styles.Modal}>
            <h3>Log Redemption</h3>


        <button
         type="button"
         className={styles.ModalXBtn}
         onClick={() => setShowRedemptionModal(false)}
         >
         x
        </button>

            <select
              className={styles.ModalInput}
              value={form.cardId}
              onChange={(e) =>
                setForm({ ...form, cardId: e.target.value })
              }
            >
              <option value="">Select card</option>
              {eligibleCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} •••• {c.last4}
                </option>
              ))}
            </select>

            <input
              type="date"
              className={styles.ModalInput}
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              type="number"
              className={styles.ModalInput}
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
              placeholder={`Amount (${unitLabel})`}
            />

            <select
              className={styles.ModalInput}
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="">Type</option>
              <option>Travel Portal</option>
              <option>Cash Back Conversion</option>
              <option>Transfer Partner</option>
              <option>Gift Card</option>
              <option>Other</option>
            </select>

            <textarea
              className={styles.ModalInput}
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              placeholder="Notes"
            />

           <div className={styles.buttonRow}>
             <button
               type="button"
               className={styles.cancelBtn}
               onClick={() => setShowRedemptionModal(false)}
             >
              Cancel
             </button>

             <button
              type="button"
              className={styles.saveBtn}
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
