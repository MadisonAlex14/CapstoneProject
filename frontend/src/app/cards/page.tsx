"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth.module.css";

type CardOption = {
  value: string;
  label: string;
  issuer: string;
  trackableRewards: string[];
};

const CARD_OPTIONS: CardOption[] = [
  {
    value: "chase-freedom-unlimited",
    label: "Chase Freedom Unlimited",
    issuer: "Chase",
    trackableRewards: [
      "5% cash back on Chase Travel purchases",
      "3% cash back on dining",
      "3% cash back at drugstores",
    ],
  },
  {
    value: "discover-it-cash-back",
    label: "Discover it Cash Back",
    issuer: "Discover",
    trackableRewards: [
      "5% rotating quarterly category",
      "First-year Cashback Match",
      "1% cash back on all other purchases",
    ],
  },
  {
    value: "capital-one-venture-rewards",
    label: "Capital One Venture Rewards",
    issuer: "Capital One",
    trackableRewards: [
      "5X miles through Capital One Travel",
      "2X miles on every purchase",
      "TSA PreCheck / Global Entry credit",
    ],
  },
  {
    value: "amex-blue-cash-everyday",
    label: "Amex Blue Cash Everyday",
    issuer: "American Express",
    trackableRewards: [
      "3% at U.S. supermarkets",
      "3% at U.S. gas stations",
      "3% on U.S. online retail purchases",
    ],
  },
];

type CreditCard = {
  id: number;
  cardName: string;
  issuer: string;
  trackedRewards: string[];
  nameOnCard: string;
  last4: string;
  expirationMonth: string;
  expirationYear: string;
  openDate: string;
  creditLimit: string;
  amountUsed: string;
  notes: string;
};

type CardFormData = {
  cardName: string;
  issuer: string;
  trackedRewards: string[];
  nameOnCard: string;
  last4: string;
  expirationMonth: string;
  expirationYear: string;
  openDate: string;
  creditLimit: string;
  amountUsed: string;
  notes: string;
};

const emptyForm: CardFormData = {
  cardName: "",
  issuer: "",
  trackedRewards: [],
  nameOnCard: "",
  last4: "",
  expirationMonth: "",
  expirationYear: "",
  openDate: "",
  creditLimit: "",
  amountUsed: "",
  notes: "",
};

const monthOptions = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const yearOptions = Array.from({ length: 15 }, (_, i) =>
  String(new Date().getFullYear() + i)
);

function getCardOption(cardName: string) {
  return CARD_OPTIONS.find((card) => card.value === cardName);
}

function normalizeStoredCards(rawCards: any[]): CreditCard[] {
  return rawCards.map((card) => ({
    id: card.id ?? Date.now(),
    cardName: card.cardName ?? "",
    issuer: card.issuer ?? getCardOption(card.cardName ?? "")?.issuer ?? "",
    trackedRewards: Array.isArray(card.trackedRewards)
      ? card.trackedRewards
      : card.rewardsType
        ? [card.rewardsType]
        : [],
    nameOnCard: card.nameOnCard ?? "",
    last4: card.last4 ?? "",
    expirationMonth: card.expirationMonth ?? "",
    expirationYear: card.expirationYear ?? "",
    openDate: card.openDate ?? "",
    creditLimit: card.creditLimit ?? "",
    amountUsed: card.amountUsed ?? "",
    notes: card.notes ?? "",
  }));
}

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CardFormData>(emptyForm);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const savedCards = localStorage.getItem("userCards");
    if (savedCards) {
      try {
        const parsed = JSON.parse(savedCards);
        setCards(normalizeStoredCards(parsed));
      } catch (error) {
        console.error("Failed to parse saved cards:", error);
      }
    }
  }, []);

  const saveCards = (updatedCards: CreditCard[]) => {
    setCards(updatedCards);
    localStorage.setItem("userCards", JSON.stringify(updatedCards));
  };

  const handleOpenAddForm = () => {
    setFormData(emptyForm);
    setEditingCardId(null);
    setFormError("");
    setShowForm(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setFormData({
      cardName: card.cardName,
      issuer: card.issuer,
      trackedRewards: card.trackedRewards ?? [],
      nameOnCard: card.nameOnCard ?? "",
      last4: card.last4,
      expirationMonth: card.expirationMonth ?? "",
      expirationYear: card.expirationYear ?? "",
      openDate: card.openDate ?? "",
      creditLimit: card.creditLimit ?? "",
      amountUsed: card.amountUsed ?? "",
      notes: card.notes ?? "",
    });

    setEditingCardId(card.id);
    setShowForm(true);
    setOpenMenuId(null);
    setFormError("");
  };

  const handleDeleteCard = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );

    if (!confirmed) return;

    const updatedCards = cards.filter((card) => card.id !== id);
    saveCards(updatedCards);
    setOpenMenuId(null);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "last4") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({
        ...prev,
        last4: digitsOnly,
      }));
      return;
    }

    if (name === "creditLimit" || name === "amountUsed") {
      const cleaned = value.replace(/[^\d.]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
      return;
    }

    if (name === "cardName") {
      const selectedCard = getCardOption(value);

      setFormData((prev) => ({
        ...prev,
        cardName: value,
        issuer: selectedCard?.issuer ?? "",
        trackedRewards: [],
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRewardToggle = (reward: string) => {
    setFormData((prev) => {
      const alreadySelected = prev.trackedRewards.includes(reward);

      return {
        ...prev,
        trackedRewards: alreadySelected
          ? prev.trackedRewards.filter((item) => item !== reward)
          : [...prev.trackedRewards, reward],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const requiredFieldsFilled =
      formData.cardName &&
      formData.nameOnCard.trim() &&
      formData.last4.length === 4 &&
      formData.expirationMonth &&
      formData.expirationYear &&
      formData.openDate;

    if (!requiredFieldsFilled) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (formData.trackedRewards.length === 0) {
      setFormError("Please choose at least one reward to track.");
      return;
    }

    const payload: CreditCard = {
      id: editingCardId ?? Date.now(),
      cardName: formData.cardName,
      issuer: formData.issuer,
      trackedRewards: formData.trackedRewards,
      nameOnCard: formData.nameOnCard.trim(),
      last4: formData.last4,
      expirationMonth: formData.expirationMonth,
      expirationYear: formData.expirationYear,
      openDate: formData.openDate,
      creditLimit: formData.creditLimit,
      amountUsed: formData.amountUsed,
      notes: formData.notes.trim(),
    };

    if (editingCardId !== null) {
      const updatedCards = cards.map((card) =>
        card.id === editingCardId ? payload : card
      );
      saveCards(updatedCards);
    } else {
      saveCards([...cards, payload]);
    }

    setShowForm(false);
    setEditingCardId(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCardId(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const selectedCard = getCardOption(formData.cardName);

  return (
    <main className={styles.CardPage}>
      <div className={styles.CardHeader}>
        <div>
          <h1 className={styles.CardTitle}>My Cards</h1>
          <p className={styles.CardSubtitle}>
            View and manage the credit cards connected to your account.
          </p>
        </div>

        <button className={styles.CardAddButton} onClick={handleOpenAddForm}>
          + Add Card
        </button>
      </div>

      {showForm && (
        <div className={styles.CardOverlay}>
          <div className={styles.CardModal}>
            <button
              type="button"
              className={styles.CardCloseButton}
              onClick={handleCancel}
            >
              ✕
            </button>

            <h2 className={styles.CardModalTitle}>
              {editingCardId ? "Edit Card" : "Add Card"}
            </h2>

            <form onSubmit={handleSubmit} className={styles.CardForm}>
              <h3 className={styles.CardSectionTitle}>Required Fields</h3>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Card Name</label>
                <select
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  className={styles.CardInput}
                  required
                >
                  <option value="">Select a card</option>
                  {CARD_OPTIONS.map((card) => (
                    <option key={card.value} value={card.value}>
                      {card.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCard && (
                <div className={styles.CardRewardsBox}>
                  <p className={styles.CardRewardsTitle}>
                    What rewards are you tracking?
                  </p>

                  <div className={styles.CardRewardsList}>
                    {selectedCard.trackableRewards.map((reward) => (
                      <label key={reward} className={styles.CardCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.trackedRewards.includes(reward)}
                          onChange={() => handleRewardToggle(reward)}
                        />
                        <span>{reward}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Name on Card</label>
                <input
                  name="nameOnCard"
                  placeholder="Enter full name"
                  value={formData.nameOnCard}
                  onChange={handleChange}
                  className={styles.CardInput}
                  required
                />
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Last 4 Digits</label>
                <input
                  name="last4"
                  placeholder="1234"
                  value={formData.last4}
                  onChange={handleChange}
                  className={styles.CardInput}
                  maxLength={4}
                  required
                />
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Expiration Date</label>
                <div className={styles.CardExpirationRow}>
                  <select
                    name="expirationMonth"
                    value={formData.expirationMonth}
                    onChange={handleChange}
                    className={styles.CardInput}
                    required
                  >
                    <option value="">Month</option>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <select
                    name="expirationYear"
                    value={formData.expirationYear}
                    onChange={handleChange}
                    className={styles.CardInput}
                    required
                  >
                    <option value="">Year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Card Open Date</label>
                <input
                  type="date"
                  name="openDate"
                  value={formData.openDate}
                  onChange={handleChange}
                  className={styles.CardInput}
                  required
                />
              </div>

              <h3 className={styles.CardSectionTitle}>Optional Fields</h3>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Credit Limit</label>
                <input
                  name="creditLimit"
                  placeholder="5000"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  className={styles.CardInput}
                  inputMode="decimal"
                />
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Amount Used</label>
                <input
                  name="amountUsed"
                  placeholder="1200"
                  value={formData.amountUsed}
                  onChange={handleChange}
                  className={styles.CardInput}
                  inputMode="decimal"
                />
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Notes</label>
                <textarea
                  name="notes"
                  placeholder="Add any notes here..."
                  value={formData.notes}
                  onChange={handleChange}
                  className={styles.CardTextarea}
                  rows={4}
                />
              </div>

              {formError && <p className={styles.CardError}>{formError}</p>}

              <div className={styles.CardActions}>
                <button
                  type="button"
                  className={styles.CardCancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button type="submit" className={styles.CardSaveButton}>
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className={styles.CardEmptyState}>
          <h2>No cards added yet</h2>
          <p>Click Add Card to add your first credit card.</p>
        </div>
      ) : (
        <div className={styles.CardGrid}>
          {cards.map((card) => {
            const selected = getCardOption(card.cardName);

            return (
              <div
                key={card.id}
                className={styles.CardBox}
                onClick={() => router.push(`/cards/${card.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/cards/${card.id}`);
                  }
                }}
              >
                <div className={styles.CardMenuWrapper}>
                  <button
                    className={styles.CardMenuButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === card.id ? null : card.id);
                    }}
                  >
                    ⋮
                  </button>

                  {openMenuId === card.id && (
                    <div
                      className={styles.CardMenuDropdown}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={styles.CardMenuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCard(card);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className={styles.CardMenuDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.CardTop}>
                  <span className={styles.CardIssuer}>{card.issuer}</span>
                </div>

                <h2 className={styles.CardName}>
                  {selected?.label ?? card.cardName}
                </h2>

                <p className={styles.CardNumber}>•••• •••• •••• {card.last4}</p>

                <div className={styles.CardBottomRow}>
                  <p className={styles.CardBottomValue}>{card.nameOnCard}</p>
                  <p className={styles.CardBottomValue}>
                    {card.expirationMonth}/{card.expirationYear.slice(-2)}
                  </p>
                </div>

                {card.trackedRewards.length > 0 && (
                  <div className={styles.CardTrackedRewards}>
                    <p className={styles.CardTrackedRewardsTitle}>
                      Tracking Rewards
                    </p>

                    <div className={styles.CardRewardTags}>
                      {card.trackedRewards.map((reward) => (
                        <span key={reward} className={styles.CardRewardTag}>
                          {reward}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}