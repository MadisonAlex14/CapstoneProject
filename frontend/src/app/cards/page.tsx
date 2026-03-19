"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth.module.css";

type CardBenefit = {
  id: string;
  label: string;
};

type CardPromotion = {
  id: string;
  label: string;
};

type CardType = {
  id: string;
  cardName: string;
  issuer: string;
  network: string;
  annualFee: number;
  rewardsType: string;
  description?: string;
  benefits: CardBenefit[];
  promotions: CardPromotion[];
};

type BenefitUsageState = Record<string, string>;

type PromotionState = Record<
  string,
  {
    active: boolean;
    startDate: string;
    spent: string;
  }
>;

type CreditCard = {
  id: number;
  cardName: string;
  issuer: string;
  last4: string;
  rewardsType: string;

  // extra fields for your cards page
  cardNickname: string;
  network: string;
  openDate: string;
  creditLimit: number | null;
  annualFee: number | null;
  notes: string;
  createdAt: string;

  initialCardState: {
    currentRewardsBalance: number | null;
    benefitsUsed: Record<string, number | null>;
    activePromotions: Record<
      string,
      {
        active: boolean;
        startDate: string;
        spent: string;
      }
    >;
    statementClosingDate: number | null;
  };
};

const STORAGE_KEY = "userCards";

const CARD_TYPES: CardType[] = [
  {
    id: "amex-gold",
    cardName: "Amex Gold",
    issuer: "American Express",
    network: "Amex",
    annualFee: 325,
    rewardsType: "Points",
    description: "Premium rewards on dining and groceries.",
    benefits: [
      { id: "dining-credit", label: "Dining Credit" },
      { id: "uber-cash", label: "Uber Cash" },
    ],
    promotions: [
      { id: "restaurant-bonus", label: "Restaurant Bonus Offer" },
      { id: "travel-credit-bonus", label: "Travel Credit Bonus" },
    ],
  },
  {
    id: "chase-sapphire-preferred",
    cardName: "Chase Sapphire Preferred",
    issuer: "Chase",
    network: "Visa",
    annualFee: 95,
    rewardsType: "Points",
    description: "Travel rewards card with flexible redemption options.",
    benefits: [
      { id: "hotel-credit", label: "Hotel Credit" },
      { id: "dashpass", label: "DashPass Benefit" },
    ],
    promotions: [
      { id: "welcome-offer", label: "Welcome Offer Tracker" },
      { id: "travel-promo", label: "Limited Time Travel Promo" },
    ],
  },
  {
    id: "capital-one-venture-x",
    cardName: "Capital One Venture X",
    issuer: "Capital One",
    network: "Visa",
    annualFee: 395,
    rewardsType: "Miles",
    description: "Premium travel card with lounge access and miles rewards.",
    benefits: [
      { id: "travel-credit", label: "Annual Travel Credit" },
      { id: "anniversary-miles", label: "Anniversary Miles" },
      { id: "lounge-access", label: "Lounge Benefit Usage" },
    ],
    promotions: [
      { id: "spend-bonus", label: "Spend Bonus Promotion" },
      { id: "transfer-bonus", label: "Transfer Bonus Promotion" },
    ],
  },
];

function normalizeStoredCards(rawCards: any[]): CreditCard[] {
  return rawCards.map((card, index) => {
    const matchedType =
      CARD_TYPES.find(
        (type) => type.id === card.cardTypeId || type.cardName === card.cardName
      ) || null;

    return {
      id: Number(card.id ?? Date.now() + index),
      cardName: card.cardName ?? matchedType?.cardName ?? "",
      issuer: card.issuer ?? matchedType?.issuer ?? "",
      last4: card.last4 ?? "",
      rewardsType: card.rewardsType ?? matchedType?.rewardsType ?? "Points",

      cardNickname: card.cardNickname ?? card.cardName ?? matchedType?.cardName ?? "",
      network: card.network ?? matchedType?.network ?? "",
      openDate: card.openDate ?? "",
      creditLimit:
        card.creditLimit !== null &&
        card.creditLimit !== undefined &&
        card.creditLimit !== ""
          ? Number(card.creditLimit)
          : null,
      annualFee:
        card.annualFee !== null &&
        card.annualFee !== undefined &&
        card.annualFee !== ""
          ? Number(card.annualFee)
          : matchedType?.annualFee ?? null,
      notes: card.notes ?? "",
      createdAt: card.createdAt ?? new Date().toISOString(),

      initialCardState: {
        currentRewardsBalance:
          card.initialCardState?.currentRewardsBalance !== null &&
          card.initialCardState?.currentRewardsBalance !== undefined &&
          card.initialCardState?.currentRewardsBalance !== ""
            ? Number(card.initialCardState.currentRewardsBalance)
            : null,
        benefitsUsed: card.initialCardState?.benefitsUsed ?? {},
        activePromotions: card.initialCardState?.activePromotions ?? {},
        statementClosingDate:
          card.initialCardState?.statementClosingDate !== null &&
          card.initialCardState?.statementClosingDate !== undefined &&
          card.initialCardState?.statementClosingDate !== ""
            ? Number(card.initialCardState.statementClosingDate)
            : null,
      },
    };
  });
}

export default function CardsPage() {
  const router = useRouter();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [hasLoadedCards, setHasLoadedCards] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  // Step 1
  const [selectedCardTypeId, setSelectedCardTypeId] = useState("");

  // Step 2
  const [cardNickname, setCardNickname] = useState("");
  const [last4, setLast4] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [annualFee, setAnnualFee] = useState("");
  const [notes, setNotes] = useState("");

  // Step 3
  const [currentRewardsBalance, setCurrentRewardsBalance] = useState("");
  const [benefitsUsed, setBenefitsUsed] = useState<BenefitUsageState>({});
  const [activePromotions, setActivePromotions] = useState<PromotionState>({});
  const [statementClosingDate, setStatementClosingDate] = useState("");

  const [openSections, setOpenSections] = useState({
    step1: true,
    step2: false,
    step3: false,
  });

  useEffect(() => {
    try {
      const savedCards = localStorage.getItem(STORAGE_KEY);
      if (savedCards) {
        const parsed = JSON.parse(savedCards);
        setCards(Array.isArray(parsed) ? normalizeStoredCards(parsed) : []);
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error("Failed to load cards:", error);
      setCards([]);
    } finally {
      setHasLoadedCards(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCards) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error("Failed to save cards:", error);
    }
  }, [cards, hasLoadedCards]);

  const selectedCardType = useMemo(() => {
    return CARD_TYPES.find((card) => card.id === selectedCardTypeId) || null;
  }, [selectedCardTypeId]);

  const step1Complete = !!selectedCardTypeId;

  const step2Complete =
    !!selectedCardTypeId && last4.trim().length === 4 && !!openDate.trim();

  useEffect(() => {
    if (step1Complete) {
      setOpenSections((prev) => ({
        ...prev,
        step2: true,
      }));
    }
  }, [step1Complete]);

  useEffect(() => {
    if (step2Complete) {
      setOpenSections((prev) => ({
        ...prev,
        step3: true,
      }));
    }
  }, [step2Complete]);

  const resetForm = () => {
    setEditingCardId(null);
    setFormError("");
    setSelectedCardTypeId("");
    setCardNickname("");
    setLast4("");
    setOpenDate("");
    setCreditLimit("");
    setAnnualFee("");
    setNotes("");
    setCurrentRewardsBalance("");
    setBenefitsUsed({});
    setActivePromotions({});
    setStatementClosingDate("");
    setOpenSections({
      step1: true,
      step2: false,
      step3: false,
    });
  };

  const handleOpenAddCard = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseAddCard = () => {
    setShowAddModal(false);
    setOpenMenuId(null);
    setFormError("");
  };

  const toggleSection = (section: "step1" | "step2" | "step3") => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleBenefitUsedChange = (benefitId: string, value: string) => {
    setBenefitsUsed((prev) => ({
      ...prev,
      [benefitId]: value.replace(/[^\d]/g, ""),
    }));
  };

  const handlePromotionToggle = (promotionId: string) => {
    setActivePromotions((prev) => {
      const current = prev[promotionId] || {
        active: false,
        startDate: "",
        spent: "",
      };

      return {
        ...prev,
        [promotionId]: {
          ...current,
          active: !current.active,
        },
      };
    });
  };

  const handlePromotionFieldChange = (
    promotionId: string,
    field: "startDate" | "spent",
    value: string
  ) => {
    setActivePromotions((prev) => {
      const current = prev[promotionId] || {
        active: true,
        startDate: "",
        spent: "",
      };

      return {
        ...prev,
        [promotionId]: {
          ...current,
          [field]: field === "spent" ? value.replace(/[^\d]/g, "") : value,
        },
      };
    });
  };

  const handleDeleteCard = (cardId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );
    if (!confirmed) return;

    setCards((prev) => prev.filter((card) => card.id !== cardId));
    setOpenMenuId(null);
  };

  const handleCardClick = (cardId: number) => {
    router.push(`/cards/${cardId}`);
  };

  const handleEditCard = (card: CreditCard) => {
    const matchedType =
      CARD_TYPES.find((type) => type.cardName === card.cardName) || null;

    setEditingCardId(card.id);
    setFormError("");
    setSelectedCardTypeId(matchedType?.id || "");
    setCardNickname(card.cardNickname || "");
    setLast4(card.last4 || "");
    setOpenDate(card.openDate || "");
    setCreditLimit(card.creditLimit?.toString() || "");
    setAnnualFee(card.annualFee?.toString() || "");
    setNotes(card.notes || "");
    setCurrentRewardsBalance(
      card.initialCardState.currentRewardsBalance?.toString() || ""
    );

    const loadedBenefits: BenefitUsageState = {};
    Object.entries(card.initialCardState.benefitsUsed || {}).forEach(
      ([key, value]) => {
        loadedBenefits[key] = value?.toString() || "";
      }
    );
    setBenefitsUsed(loadedBenefits);

    const loadedPromotions: PromotionState = {};
    Object.entries(card.initialCardState.activePromotions || {}).forEach(
      ([key, value]) => {
        loadedPromotions[key] = {
          active: value.active,
          startDate: value.startDate || "",
          spent: value.spent || "",
        };
      }
    );
    setActivePromotions(loadedPromotions);

    setStatementClosingDate(
      card.initialCardState.statementClosingDate?.toString() || ""
    );

    setOpenSections({
      step1: true,
      step2: true,
      step3: true,
    });

    setShowAddModal(true);
    setOpenMenuId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!step1Complete || !step2Complete || !selectedCardType) {
      setFormError("Please complete the required card details.");
      return;
    }

    const finalNickname = cardNickname.trim() || selectedCardType.cardName;

    const cardToSave: CreditCard = {
      id: editingCardId ?? Date.now(),
      cardName: selectedCardType.cardName,
      issuer: selectedCardType.issuer,
      last4: last4,
      rewardsType: selectedCardType.rewardsType,

      cardNickname: finalNickname,
      network: selectedCardType.network,
      openDate: openDate,
      creditLimit: creditLimit ? Number(creditLimit) : null,
      annualFee: annualFee ? Number(annualFee) : selectedCardType.annualFee,
      notes: notes.trim(),
      createdAt: editingCardId
        ? cards.find((card) => card.id === editingCardId)?.createdAt ||
          new Date().toISOString()
        : new Date().toISOString(),

      initialCardState: {
        currentRewardsBalance: currentRewardsBalance
          ? Number(currentRewardsBalance)
          : null,
        benefitsUsed: Object.entries(benefitsUsed).reduce(
          (acc, [key, value]) => {
            acc[key] = value === "" ? null : Number(value);
            return acc;
          },
          {} as Record<string, number | null>
        ),
        activePromotions: activePromotions,
        statementClosingDate: statementClosingDate
          ? Number(statementClosingDate)
          : null,
      },
    };

    setCards((prevCards) => {
      if (editingCardId !== null) {
        return prevCards.map((card) =>
          card.id === editingCardId ? cardToSave : card
        );
      }

      return [...prevCards, cardToSave];
    });

    handleCloseAddCard();
    resetForm();
  };

  return (
    <div className={styles.CardPage}>
      <div className={styles.CardHeader}>
        <div>
          <h1 className={styles.CardTitle}>My Cards</h1>
          <p className={styles.CardSubtitle}>
            Track your cards, benefits, promos, and starting balances all in one
            place.
          </p>
        </div>

        <button
          type="button"
          className={styles.CardAddButton}
          onClick={handleOpenAddCard}
        >
          Add Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className={styles.CardEmptyState}>
          <h2 className={styles.CardSectionTitle}>No cards added yet</h2>
          <p className={styles.CardSubtitle}>
            Add your first card to start tracking rewards, benefits, and promos.
          </p>
          <button
            type="button"
            className={styles.CardAddButton}
            onClick={handleOpenAddCard}
          >
            Add Card
          </button>
        </div>
      ) : (
        <div className={styles.CardGrid}>
          {cards.map((card) => (
            <div
              key={card.id}
              className={styles.CardBox}
              onClick={() => handleCardClick(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(card.id);
                }
              }}
            >
              <div className={styles.CardTop}>
                <span className={styles.CardIssuer}>{card.issuer}</span>

                <div
                  className={styles.CardMenuWrapper}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={styles.CardMenuButton}
                    aria-label={`Open menu for ${
                      card.cardNickname || card.cardName
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === card.id ? null : card.id));
                    }}
                  >
                    ⋯
                  </button>

                  {openMenuId === card.id && (
                    <div className={styles.CardMenuDropdown}>
                      <button
                        type="button"
                        className={styles.CardMenuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCard(card);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
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
              </div>

              <div className={styles.CardCardBody}>
                <h2 className={styles.CardName}>{card.cardName}</h2>

                {card.cardNickname && card.cardNickname !== card.cardName && (
                  <p className={styles.CardMeta}>{card.cardNickname}</p>
                )}
              </div>

              <div className={styles.CardBottomRow}>
                <p className={styles.CardNumber}>•••• {card.last4}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className={styles.CardOverlay} onClick={handleCloseAddCard}>
          <div
            className={styles.CardModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.CardCloseButton}
              onClick={handleCloseAddCard}
              aria-label="Close add card modal"
            >
              ×
            </button>

            <h2 className={styles.CardModalTitle}>
              {editingCardId ? "Edit Card" : "Add a Card"}
            </h2>

            <form onSubmit={handleSubmit} className={styles.CardForm}>
              <section className={styles.CardStepSection}>
                <button
                  type="button"
                  className={styles.CardStepHeader}
                  onClick={() => toggleSection("step1")}
                >
                  <div className={styles.CardStepHeaderLeft}>
                    <span
                      className={`${styles.CardStepStatus} ${
                        step1Complete ? styles.CardStepStatusComplete : ""
                      }`}
                    >
                      {step1Complete ? "✓" : "1"}
                    </span>

                    <div>
                      <h3 className={styles.CardStepTitle}>
                        Select a card type
                      </h3>
                      <p className={styles.CardStepSubtitle}>
                        Choose the card you want to add.
                      </p>
                    </div>
                  </div>

                  <span className={styles.CardStepChevron}>
                    {openSections.step1 ? "−" : "+"}
                  </span>
                </button>

                {openSections.step1 && (
                  <div className={styles.CardStepContent}>
                    <div className={styles.CardTypeGrid}>
                      {CARD_TYPES.map((card) => {
                        const selected = selectedCardTypeId === card.id;

                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => setSelectedCardTypeId(card.id)}
                            className={`${styles.CardTypeOption} ${
                              selected ? styles.CardTypeOptionSelected : ""
                            }`}
                          >
                            <div className={styles.CardTypeOptionTop}>
                              <span className={styles.CardTypeName}>
                                {card.cardName}
                              </span>
                              <span className={styles.CardTypeIssuer}>
                                {card.issuer}
                              </span>
                            </div>

                            <div className={styles.CardTypeMeta}>
                              <span>{card.network}</span>
                              <span>${card.annualFee} AF</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              <section className={styles.CardStepSection}>
                <button
                  type="button"
                  className={styles.CardStepHeader}
                  onClick={() => toggleSection("step2")}
                >
                  <div className={styles.CardStepHeaderLeft}>
                    <span
                      className={`${styles.CardStepStatus} ${
                        step2Complete ? styles.CardStepStatusComplete : ""
                      }`}
                    >
                      {step2Complete ? "✓" : "2"}
                    </span>

                    <div>
                      <h3 className={styles.CardStepTitle}>
                        Fill in card details
                      </h3>
                      <p className={styles.CardStepSubtitle}>
                        Required fields are marked with an asterisk.
                      </p>
                    </div>
                  </div>

                  <span className={styles.CardStepChevron}>
                    {openSections.step2 ? "−" : "+"}
                  </span>
                </button>

                {openSections.step2 && (
                  <div className={styles.CardStepContent}>
                    <div className={styles.FormGrid}>
                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>Card Nickname</label>
                        <input
                          type="text"
                          value={cardNickname}
                          onChange={(e) => setCardNickname(e.target.value)}
                          className={styles.FormInput}
                          placeholder={
                            selectedCardType
                              ? `Defaults to ${selectedCardType.cardName}`
                              : "Defaults to selected card name"
                          }
                        />
                      </div>

                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>
                          Last 4 Digits{" "}
                          <span className={styles.RequiredStar}>*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={last4}
                          onChange={(e) =>
                            setLast4(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          className={styles.FormInput}
                          placeholder="1234"
                        />
                      </div>

                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>
                          Open Date{" "}
                          <span className={styles.RequiredStar}>*</span>
                        </label>
                        <input
                          type="date"
                          value={openDate}
                          onChange={(e) => setOpenDate(e.target.value)}
                          className={styles.FormInput}
                        />
                      </div>

                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>Credit Limit</label>
                        <input
                          type="number"
                          min="0"
                          value={creditLimit}
                          onChange={(e) => setCreditLimit(e.target.value)}
                          className={styles.FormInput}
                          placeholder="5000"
                        />
                      </div>

                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>Annual Fee</label>
                        <input
                          type="number"
                          min="0"
                          value={annualFee}
                          onChange={(e) => setAnnualFee(e.target.value)}
                          className={styles.FormInput}
                          placeholder="95"
                        />
                      </div>

                      <div className={styles.FormGroupFull}>
                        <label className={styles.FormLabel}>Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className={styles.FormTextarea}
                          rows={4}
                          placeholder="Anything you want to remember about this card"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className={styles.CardStepSection}>
                <button
                  type="button"
                  className={styles.CardStepHeader}
                  onClick={() => toggleSection("step3")}
                >
                  <div className={styles.CardStepHeaderLeft}>
                    <span className={styles.CardStepStatus}>3</span>

                    <div>
                      <h3 className={styles.CardStepTitle}>
                        Fill in initial card state
                      </h3>
                      <p className={styles.CardStepSubtitle}>
                        Everything in this section is optional.
                      </p>
                    </div>
                  </div>

                  <span className={styles.CardStepChevron}>
                    {openSections.step3 ? "−" : "+"}
                  </span>
                </button>

                {openSections.step3 && (
                  <div className={styles.CardStepContent}>
                    <div className={styles.FormGrid}>
                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>
                          Current Rewards Balance
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentRewardsBalance}
                          onChange={(e) =>
                            setCurrentRewardsBalance(e.target.value)
                          }
                          className={styles.FormInput}
                          placeholder="0"
                        />
                      </div>

                      <div className={styles.FormGroup}>
                        <label className={styles.FormLabel}>
                          Statement Closing Date
                        </label>
                        <select
                          value={statementClosingDate}
                          onChange={(e) =>
                            setStatementClosingDate(e.target.value)
                          }
                          className={styles.FormInput}
                        >
                          <option value="">Select a day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className={styles.FormGroupFull}>
                        <label className={styles.FormLabel}>
                          Benefits Already Used This Cycle
                        </label>

                        {selectedCardType?.benefits.length ? (
                          <div className={styles.DynamicFieldList}>
                            {selectedCardType.benefits.map((benefit) => (
                              <div key={benefit.id} className={styles.FormGroup}>
                                <label className={styles.FormLabel}>
                                  {benefit.label}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={benefitsUsed[benefit.id] || ""}
                                  onChange={(e) =>
                                    handleBenefitUsedChange(
                                      benefit.id,
                                      e.target.value
                                    )
                                  }
                                  className={styles.FormInput}
                                  placeholder="0"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.HelperText}>
                            Select a card type to load benefit usage fields.
                          </p>
                        )}
                      </div>

                      <div className={styles.FormGroupFull}>
                        <label className={styles.FormLabel}>
                          Active Promotions
                        </label>

                        {selectedCardType?.promotions.length ? (
                          <div className={styles.CheckboxList}>
                            {selectedCardType.promotions.map((promotion) => {
                              const promotionState =
                                activePromotions[promotion.id] || {
                                  active: false,
                                  startDate: "",
                                  spent: "",
                                };

                              return (
                                <div
                                  key={promotion.id}
                                  className={styles.PromotionItem}
                                >
                                  <label className={styles.CheckboxRow}>
                                    <input
                                      type="checkbox"
                                      checked={promotionState.active}
                                      onChange={() =>
                                        handlePromotionToggle(promotion.id)
                                      }
                                    />
                                    <span>{promotion.label}</span>
                                  </label>

                                  {promotionState.active && (
                                    <div className={styles.PromotionSubFields}>
                                      <div className={styles.FormGroup}>
                                        <label className={styles.FormLabel}>
                                          Promotion Start Date
                                        </label>
                                        <input
                                          type="date"
                                          value={promotionState.startDate}
                                          onChange={(e) =>
                                            handlePromotionFieldChange(
                                              promotion.id,
                                              "startDate",
                                              e.target.value
                                            )
                                          }
                                          className={styles.FormInput}
                                        />
                                      </div>

                                      <div className={styles.FormGroup}>
                                        <label className={styles.FormLabel}>
                                          Amount Already Spent
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={promotionState.spent}
                                          onChange={(e) =>
                                            handlePromotionFieldChange(
                                              promotion.id,
                                              "spent",
                                              e.target.value
                                            )
                                          }
                                          className={styles.FormInput}
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={styles.HelperText}>
                            Select a card type to load promotion tracking.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {formError && <p className={styles.CardError}>{formError}</p>}

              <div className={styles.CardActions}>
                <button
                  type="button"
                  className={styles.CardCancelButton}
                  onClick={handleCloseAddCard}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={styles.CardSaveButton}
                  disabled={!step1Complete || !step2Complete}
                >
                  {editingCardId ? "Update Card" : "Save Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}