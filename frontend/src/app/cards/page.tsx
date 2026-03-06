"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../../styles/auth.module.css";

type CreditCard = {
  id: number;
  cardName: string;
  issuer: string;
  last4: string;
  rewardsType: string;
};

type CardFormData = {
  cardName: string;
  issuer: string;
  last4: string;
  rewardsType: string;
};

const emptyForm: CardFormData = {
  cardName: "",
  issuer: "",
  last4: "",
  rewardsType: "",
};

export default function CardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CardFormData>(emptyForm);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedCards = localStorage.getItem("userCards");
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    }
  }, []);

  const saveCards = (updatedCards: CreditCard[]) => {
    setCards(updatedCards);
    localStorage.setItem("userCards", JSON.stringify(updatedCards));
  };

  const handleOpenAddForm = () => {
    setFormData(emptyForm);
    setEditingCardId(null);
    setShowForm(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setFormData({
      cardName: card.cardName,
      issuer: card.issuer,
      last4: card.last4,
      rewardsType: card.rewardsType,
    });

    setEditingCardId(card.id);
    setShowForm(true);
    setOpenMenuId(null);
  };

  /* ---------------- DELETE WITH CONFIRMATION ---------------- */

  const handleDeleteCard = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );

    if (!confirmed) return;

    const updatedCards = cards.filter((card) => card.id !== id);
    saveCards(updatedCards);
    setOpenMenuId(null);
  };

  /* ----------------------------------------------------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "last4") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.cardName ||
      !formData.issuer ||
      !formData.last4 ||
      !formData.rewardsType
    ) {
      return;
    }

    if (editingCardId !== null) {
      const updatedCards = cards.map((card) =>
        card.id === editingCardId
          ? {
              ...card,
              cardName: formData.cardName,
              issuer: formData.issuer,
              last4: formData.last4,
              rewardsType: formData.rewardsType,
            }
          : card
      );

      saveCards(updatedCards);
    } else {
      const newCard: CreditCard = {
        id: Date.now(),
        cardName: formData.cardName,
        issuer: formData.issuer,
        last4: formData.last4,
        rewardsType: formData.rewardsType,
      };

      saveCards([...cards, newCard]);
    }

    setShowForm(false);
    setEditingCardId(null);
    setFormData(emptyForm);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCardId(null);
    setFormData(emptyForm);
  };

  return (
    <main className={styles.cardsPage}>
      <div className={styles.cardsHeader}>
        <div>
          <h1 className={styles.cardsTitle}>My Cards</h1>
          <p className={styles.cardsSubtitle}>
            View and manage the credit cards connected to your account.
          </p>
        </div>

        <button className={styles.addCardBtn} onClick={handleOpenAddForm}>
          + Add Card
        </button>
      </div>

      {showForm && (
        <div className={styles.cardFormOverlay}>
          <div className={styles.cardFormBox}>
            <h2 className={styles.cardFormTitle}>
              {editingCardId ? "Edit Card" : "Add Card"}
            </h2>

            <form onSubmit={handleSubmit} className={styles.cardForm}>
              <input
                name="cardName"
                placeholder="Card Name"
                value={formData.cardName}
                onChange={handleChange}
                className={styles.formInput}
              />

              <input
                name="issuer"
                placeholder="Issuer"
                value={formData.issuer}
                onChange={handleChange}
                className={styles.formInput}
              />

              <input
                name="last4"
                placeholder="Last 4 digits"
                value={formData.last4}
                onChange={handleChange}
                className={styles.formInput}
              />

              <select
                name="rewardsType"
                value={formData.rewardsType}
                onChange={handleChange}
                className={styles.formInput}
              >
                <option value="">Rewards Type</option>
                <option value="Cash Back">Cash Back</option>
                <option value="Points">Points</option>
                <option value="Travel">Travel</option>
                <option value="Miles">Miles</option>
              </select>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button type="submit" className={styles.saveCardBtn}>
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className={styles.cardsEmptyState}>
          <h2>No cards added yet</h2>
          <p>Click Add Card to add your first credit card.</p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {cards.map((card) => (
            <div key={card.id} className={styles.creditCardBox}>
              <div className={styles.cardMenuWrapper}>
                <button
                  className={styles.cardMenuButton}
                  onClick={() =>
                    setOpenMenuId(openMenuId === card.id ? null : card.id)
                  }
                >
                  ⋮
                </button>

                {openMenuId === card.id && (
                  <div className={styles.cardMenuDropdown}>
                    <button
                      className={styles.cardMenuItem}
                      onClick={() => handleEditCard(card)}
                    >
                      Edit
                    </button>

                    <button
                      className={styles.cardMenuItemDelete}
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.creditCardTop}>
                <span className={styles.cardIssuer}>{card.issuer}</span>
              </div>

              <h2 className={styles.cardName}>{card.cardName}</h2>

              <p className={styles.cardNumber}>
                •••• •••• •••• {card.last4}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}