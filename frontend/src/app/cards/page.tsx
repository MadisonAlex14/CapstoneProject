"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserCards } from "../../lib/functions/getUserCards";
import { getCardTypes } from "../../lib/functions/getCardTypes";
import { upsertUserCard } from "../../lib/functions/upsertUserCard";
import { deleteUserCard } from "../../lib/functions/deleteUserCard";
import styles from "../../styles/auth.module.css";

type CardBenefit = {
  credit_card_type_id: string;
  label: string;
};

type CardPromotion = {
  credit_card_type_id: string;
  label: string;
};

type ApiBenefit = {
  benefit_id: string;
  name: string;
  description: string;
  value_unit: string;
  value_amount: number;
  reset_frequency: string;
};

type ApiPromotion = {
  promotion_id: string;
  name: string;
  description: string;
  promotion_category: string;
};

type CardType = {
  credit_card_type_id: string;
  name: string;
  issuer_id: string;
  network_id: string;
  annual_fee: number;
  description?: string;
  image_url?: string | null;
  reward_currency_type: string;
  reward_unit_name: string;
  reward_unit_symbol: string;
  cash_value_per_unit: number;
  benefit?: ApiBenefit[];
  promotion?: ApiPromotion[];
};

type BenefitUsageState = Record<string, string>;

type PromotionState = Record<
  string,
  {
    active: boolean;
    start_date: string;
    initial_spend: string;
  }
>;

type CreditCard = {
  credit_card_type_id: string;
  cardName: string;
  issuer_id: string;
  last4: string;
  rewardsType: string;
  cardNickname: string;
  network_id: string;
  openDate: string;
  creditLimit: number | null;
  annual_fee: number | null;
  notes: string;
  createdAt: string;

  initialCardState: {
    currentRewardsBalance: number | null;
    benefitsUsed: Record<string, number | null>;
    benefitCycleDates: Record<string, string>;
    activePromotions: Record<
      string,
      {
        active: boolean;
        start_date: string;
        initial_spend: string;
      }
    >;
    statementClosingDate: number | null;
  };
};

const STORAGE_KEY = "userCards";

function normalizeStoredCards(rawCards: any[], cardTypes: CardType[] = []): CreditCard[] {
  return rawCards.map((card, index) => {
    const matchedType =
      cardTypes.find(
        (type: CardType) =>
          type.credit_card_type_id === card.cardTypeId ||
          type.name === card.cardName ||
          type.name === card.credit_card_type?.name
      ) || null;

    const normalizedId =
      card.credit_card_id || card.credit_card_type_id || card.id || `${Date.now()}-${index}`;
    
    const nickname = card.nickname || card.cardNickname || matchedType?.name || "";
    const cardNameFromType = card.credit_card_type?.name || matchedType?.name || "";
    const cardName = card.cardName || nickname || cardNameFromType;

    const issuer =
      card.issuer_id || card.issuer || matchedType?.issuer_id || card.credit_card_type?.issuer_id || "";

    // Extract benefits from user_benefit array
    const benefitsUsedMap: Record<string, number | null> = {};
    const benefitCycleDatesMap: Record<string, string> = {};
    
    if (Array.isArray(card.user_benefit)) {
      card.user_benefit.forEach((ub: any) => {
        if (ub.benefit_id) {
          benefitsUsedMap[ub.benefit_id] = ub.initial_amount_used ?? null;
          benefitCycleDatesMap[ub.benefit_id] = ub.cycle_start_date ?? "";
        }
      });
    }

    // Extract promotions from user_promotion array
    const activePromotionsMap: Record<string, { active: boolean; start_date: string; initial_spend: string }> = {};
    
    if (Array.isArray(card.user_promotion)) {
      card.user_promotion.forEach((up: any) => {
        if (up.promotion_id) {
          activePromotionsMap[up.promotion_id] = {
            active: true,
            start_date: up.start_date ?? "",
            initial_spend: up.initial_spend?.toString() ?? "0",
          };
        }
      });
    }

    return {
      credit_card_type_id: String(normalizedId),
      cardName: cardName,
      issuer_id: issuer,
      last4: card.last4 ?? card.last_four ?? "",
      rewardsType: card.rewardsType ?? matchedType?.reward_unit_name ?? "Points",
      cardNickname: card.cardNickname ?? card.nickname ?? matchedType?.name ?? "",
      network_id: card.network_id ?? card.network ?? matchedType?.network_id ?? "",

      openDate: card.openDate ?? card.open_date ?? "",
      creditLimit:
        card.creditLimit !== null &&
        card.creditLimit !== undefined &&
        card.creditLimit !== ""
          ? Number(card.creditLimit)
          : null,
      annual_fee:
        card.annual_fee !== null &&
        card.annual_fee !== undefined &&
        card.annual_fee !== ""
          ? Number(card.annual_fee)
          : matchedType?.annual_fee ?? null,
      notes: card.notes ?? "",
      createdAt: card.createdAt ?? card.tracking_start_date ?? new Date().toISOString(),

      initialCardState: {
        currentRewardsBalance:
          (card.initialCardState?.currentRewardsBalance ?? card.initial_rewards_balance) !== null &&
          (card.initialCardState?.currentRewardsBalance ?? card.initial_rewards_balance) !== undefined &&
          (card.initialCardState?.currentRewardsBalance ?? card.initial_rewards_balance) !== ""
            ? Number(card.initialCardState?.currentRewardsBalance ?? card.initial_rewards_balance)
            : null,
        benefitsUsed: Object.keys(benefitsUsedMap).length > 0 ? benefitsUsedMap : (card.initialCardState?.benefitsUsed ?? {}),
        benefitCycleDates: benefitCycleDatesMap,
        activePromotions: Object.keys(activePromotionsMap).length > 0 ? activePromotionsMap : (card.initialCardState?.activePromotions ?? {}),
        statementClosingDate:
          (card.initialCardState?.statementClosingDate ?? card.statement_close_day) !== null &&
          (card.initialCardState?.statementClosingDate ?? card.statement_close_day) !== undefined &&
          (card.initialCardState?.statementClosingDate ?? card.statement_close_day) !== ""
            ? Number(card.initialCardState?.statementClosingDate ?? card.statement_close_day)
            : null,
      },
    };
  });
}

export default function CardsPage() {
  const cardsFetchGuard = useRef(false);
  const router = useRouter();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [hasLoadedCards, setHasLoadedCards] = useState(false);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [loadingCardTypes, setLoadingCardTypes] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Step 1
  const [selectedCardTypeId, setSelectedCardTypeId] = useState("");

  // Step 2
  const [cardNickname, setCardNickname] = useState("");
  const [last4, setLast4] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  // Step 3
  const [currentRewardsBalance, setCurrentRewardsBalance] = useState("");
  const [benefitsUsed, setBenefitsUsed] = useState<BenefitUsageState>({});
  const [benefitCycleDates, setBenefitCycleDates] = useState<Record<string, string>>({});
  const [activePromotions, setActivePromotions] = useState<PromotionState>({});
  const [statementClosingDate, setStatementClosingDate] = useState("");

  const [openSections, setOpenSections] = useState({
    step1: true,
    step2: false,
    step3: false,
  });

  useEffect(() => {
    if (cardsFetchGuard.current) return;
    cardsFetchGuard.current = true;

    const loadCards = async () => {
      let fetchedCards: any[] | null = null;

      try {
        const localToken = localStorage.getItem('accessToken');
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        let accessToken: string | null = localToken;

        if (!accessToken && supabaseToken) {
          const session = JSON.parse(supabaseToken);
          accessToken = session?.currentSession?.access_token || session?.access_token || null;
        }

        if (!accessToken) {
          throw new Error('No access token')
        }

        const cardData = await getUserCards(accessToken)
        if (Array.isArray(cardData)) {
          fetchedCards = cardData
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cardData))
        }
      } catch (apiError) {
        console.warn('API card load failed, falling back to local cache', apiError)
      }

      if (fetchedCards) {
        setCards(normalizeStoredCards(fetchedCards, cardTypes))
      } else {
        try {
          const savedCards = localStorage.getItem(STORAGE_KEY)
          if (savedCards) {
            const parsed = JSON.parse(savedCards)
            setCards(Array.isArray(parsed) ? normalizeStoredCards(parsed, cardTypes) : [])
          } else {
            setCards([])
          }
        } catch (error) {
          console.error('Failed to load cards from local cache:', error)
          setCards([])
        }
      }

      setHasLoadedCards(true)
    }

    loadCards()
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
    return cardTypes.find((card: CardType) => card.credit_card_type_id === selectedCardTypeId) || null;
  }, [selectedCardTypeId, cardTypes]);

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
    setExpirationDate("");
    setCurrentRewardsBalance("");
    setBenefitsUsed({});
    setBenefitCycleDates({});
    setActivePromotions({});
    setStatementClosingDate("");
    setOpenSections({
      step1: true,
      step2: false,
      step3: false,
    });
  };

  const handleOpenAddCard = async () => {
    resetForm();
    setLoadingCardTypes(true);
    try {
      const localToken = localStorage.getItem('accessToken');
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      let accessToken: string | null = localToken;

      if (!accessToken && supabaseToken) {
        const session = JSON.parse(supabaseToken);
        accessToken = session?.currentSession?.access_token || session?.access_token || null;
      }

      if (accessToken) {
        const types = await getCardTypes(accessToken);
        setCardTypes(Array.isArray(types) ? types : []);
      }
    } catch (error) {
      console.error('Failed to load card types:', error);
      setCardTypes([]);
    } finally {
      setLoadingCardTypes(false);
    }
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

  const handleBenefitCycleDateChange = (benefitId: string, date: string) => {
    setBenefitCycleDates((prev) => ({
      ...prev,
      [benefitId]: date,
    }));
  };

  const handlePromotionToggle = (promotionId: string) => {
    setActivePromotions((prev) => {
      const current = prev[promotionId] || {
        active: false,
        start_date: "",
        initial_spend: "",
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
    field: "start_date" | "initial_spend",
    value: string
  ) => {
    setActivePromotions((prev) => {
      const current = prev[promotionId] || {
        active: true,
        start_date: "",
        initial_spend: "",
      };

      return {
        ...prev,
        [promotionId]: {
          ...current,
          [field]: field === "initial_spend" ? value.replace(/[^\d]/g, "") : value,
        },
      };
    });
  };

  const handleDeleteCard = async (cardId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this card? This action cannot be undone.");
    if (!confirmed) return;

    try {
      // Get the access token
      let token: string | null = localStorage.getItem("accessToken");
      if (!token) {
        // Try to get from Supabase auth session
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        );
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || null;
      }

      if (!token) {
        alert("Please log in to delete a card");
        return;
      }

      // Call the delete API
      await deleteUserCard(token, cardId);
      
      // Remove from local state
      setCards((prev) => prev.filter((card) => card.credit_card_type_id !== cardId));
      setOpenMenuId(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete card";
      alert(`Error deleting card: ${errorMessage}`);
    }
  };

  const handleCardClick = (cardId: string) => {
    router.push(`/cards/${cardId}`);
  };

  const handleEditCard = (card: CreditCard) => {
    const matchedType =
      cardTypes.find((type: CardType) => type.name === card.cardName) || null;

    setEditingCardId(card.credit_card_type_id);
    setFormError("");
    setSelectedCardTypeId(matchedType?.credit_card_type_id || "");
    setCardNickname(card.cardNickname || "");
    setLast4(card.last4 || "");
    setOpenDate(card.openDate || "");
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

    setBenefitCycleDates(card.initialCardState.benefitCycleDates || {});

    const loadedPromotions: PromotionState = {};
    Object.entries(card.initialCardState.activePromotions || {}).forEach(
      ([key, value]) => {
        loadedPromotions[key] = {
          active: value.active,
          start_date: value.start_date || "",
          initial_spend: value.initial_spend || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!step1Complete || !step2Complete || !selectedCardType) {
      setFormError("Please complete the required card details.");
      return;
    }

    const finalNickname = cardNickname.trim() || selectedCardType.name;

    // Validate benefits - check that usage doesn't exceed benefit value_amount
    for (const benefit of selectedCardType?.benefit || []) {
      const usedAmount = benefitsUsed[benefit.benefit_id]
        ? Number(benefitsUsed[benefit.benefit_id])
        : 0;
      
      if (usedAmount > benefit.value_amount) {
        alert(
          `Invalid benefit usage for "${benefit.name}": Usage (${usedAmount}) cannot exceed the benefit value (${benefit.value_amount})`
        );
        return;
      }
    }

    // Prepare benefits data
    const benefits = (selectedCardType?.benefit || [])
      .map((benefit: ApiBenefit) => ({
        benefit_id: benefit.benefit_id,
        initial_amount_used: benefitsUsed[benefit.benefit_id]
          ? Number(benefitsUsed[benefit.benefit_id])
          : 0,
      }));

    // Prepare promotions data
    const promotions = (selectedCardType?.promotion || [])
      .filter((promo: ApiPromotion) => activePromotions[promo.promotion_id]?.active)
      .map((promo: ApiPromotion) => {
        const promoData = activePromotions[promo.promotion_id];
        return {
          promotion_id: promo.promotion_id,
          start_date: promoData.start_date || new Date().toISOString().split('T')[0], // Use today if not set
          initial_spend: promoData.initial_spend
            ? Number(promoData.initial_spend)
            : 0,
        };
      });

    console.log('Sending data:', {
      benefits: benefits.length,
      promotions: promotions.length,
      activePromotions,
      selectedCardType: selectedCardType?.promotion?.length,
    });

    try {
      const localToken = localStorage.getItem('accessToken');
      const supabaseToken = localStorage.getItem('supabase.auth.token');
      let accessToken: string | null = localToken;

      if (!accessToken && supabaseToken) {
        const session = JSON.parse(supabaseToken);
        accessToken = session?.currentSession?.access_token || session?.access_token || null;
      }

      if (!accessToken) {
        throw new Error('No access token');
      }

      const response = await upsertUserCard(accessToken, {
        credit_card_id: editingCardId || undefined,
        credit_card_type_id: selectedCardType.credit_card_type_id,
        nickname: finalNickname,
        last_four: last4,
        open_date: openDate,
        expiration_date: expirationDate,
        statement_close_day: statementClosingDate ? Number(statementClosingDate) : 0,
        initial_rewards_balance: currentRewardsBalance ? Number(currentRewardsBalance) : 0,
        tracking_start_date: new Date().toISOString(),
        benefits: benefits.length > 0 ? benefits : undefined,
        promotions: promotions.length > 0 ? promotions : undefined,
      });

      const cardToSave: CreditCard = {
        credit_card_type_id: editingCardId ?? String(Date.now()),
        cardName: selectedCardType.name,
        issuer_id: selectedCardType.issuer_id,
        last4: last4,
        rewardsType: selectedCardType.reward_unit_name,

        cardNickname: finalNickname,
        network_id: selectedCardType.network_id,
        openDate: openDate,
        creditLimit: null,
        annual_fee: selectedCardType.annual_fee,
        notes: "",
        createdAt: editingCardId
          ? cards.find((card) => card.credit_card_type_id === editingCardId)?.createdAt ||
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
          benefitCycleDates: benefitCycleDates,
          activePromotions: activePromotions,
          statementClosingDate: statementClosingDate
            ? Number(statementClosingDate)
            : null,
        },
      };

      setCards((prevCards) => {
        if (editingCardId !== null) {
          return prevCards.map((card) =>
            card.credit_card_type_id === editingCardId ? cardToSave : card
          );
        }

        return [...prevCards, cardToSave];
      });

      handleCloseAddCard();
      resetForm();
    } catch (error) {
      const err = error as Error;
      setFormError(err.message || 'Failed to save card');
      console.error('Error saving card:', error);
    }
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
              key={card.credit_card_type_id}
              className={`
                ${styles.CardBox}
                ${card.cardName.toLowerCase().includes("chase") ? styles.chase :
                  card.cardName.toLowerCase().includes("amex") ? styles.amex :
                  card.cardName.toLowerCase().includes("capital one") ? styles.capitalone :
                  styles.defaultCard
                }
              `}
              onClick={() => handleCardClick(card.credit_card_type_id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(card.credit_card_type_id);
                }
              }}
            >
              <div className={styles.CardTop}>
                <span className={styles.CardIssuerID}>{card.issuer_id}</span>

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
                      setOpenMenuId((prev) => (prev === card.credit_card_type_id ? null : card.credit_card_type_id));
                    }}
                  >
                    ⋯
                  </button>

                  {openMenuId === card.credit_card_type_id && (
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
                          handleDeleteCard(card.credit_card_type_id);
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
                      {loadingCardTypes ? (
                        <p>Loading card types...</p>
                      ) : cardTypes.length > 0 ? (
                        cardTypes.map((card: CardType) => {
                          const selected = selectedCardTypeId === card.credit_card_type_id;

                          return (
                            <button
                              key={card.credit_card_type_id}
                              type="button"
                              onClick={() => setSelectedCardTypeId(card.credit_card_type_id)}
                              className={`${styles.CardTypeOption} ${
                                selected ? styles.CardTypeOptionSelected : ""
                              }`}
                            >
                              {card.image_url && (
                                <img
                                  src={card.image_url}
                                  alt={card.name}
                                  style={{
                                    width: '100%',
                                    height: '120px',
                                    objectFit: 'cover',
                                    marginBottom: '0.5rem',
                                    borderRadius: '4px',
                                  }}
                                />
                              )}
                              <div className={styles.CardTypeOptionTop}>
                                <span className={styles.CardTypeName}>
                                  {card.name}
                                </span>
                              </div>

                              <div className={styles.CardTypeMeta}>
                                <span>${card.annual_fee} AF</span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p>No card types available</p>
                      )}
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
                              ? `Defaults to ${selectedCardType.name}`
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
                        <label className={styles.FormLabel}>
                          Expiration Date{" "}
                          <span className={styles.RequiredStar}>*</span>
                        </label>
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className={styles.FormInput}
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
                      <div className={`${styles.FormGroup} ${styles.CenteredFormGroup}`}>
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

                      <div className={styles.FormGroupFull}>
                        <label className={styles.FormLabel}>
                          Benefits
                        </label>
                        {editingCardId ? (
                          <div className={styles.ReadOnlyMessage}>
                            <p>Seed state for promotions and benefits are not updatable</p>
                          </div>
                        ) : selectedCardType?.benefit && selectedCardType.benefit.length > 0 ? (
                          <div className={styles.DynamicFieldList}>
                            {selectedCardType.benefit.map((benefit: ApiBenefit) => (
                              <div key={benefit.benefit_id} className={styles.BenefitCard}>
                                <div className={styles.BenefitHeader}>
                                  <h4 className={styles.BenefitName}>{benefit.name}</h4>
                                  <p className={styles.BenefitDescription}>{benefit.description}</p>
                                  <p className={styles.BenefitMeta}>
                                    Resets: {benefit.reset_frequency}
                                  </p>
                                </div>
                                <div className={styles.BenefitFields}>
                                  <div className={styles.FormGroup}>
                                    <label className={styles.FormLabel}>
                                      Usage So Far
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={benefitsUsed[benefit.benefit_id] || ""}
                                      onChange={(e) =>
                                        handleBenefitUsedChange(
                                          benefit.benefit_id,
                                          e.target.value
                                        )
                                      }
                                      className={styles.FormInput}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.HelperText}>
                            No benefits available for this card.
                          </p>
                        )}
                      </div>

                      <div className={styles.FormGroupFull}>
                        <label className={styles.FormLabel}>
                          Active Promotions
                        </label>
                        {editingCardId ? (
                          <div className={styles.ReadOnlyMessage}>
                            <p>Seed state for promotions and benefits are not updatable</p>
                          </div>
                        ) : selectedCardType?.promotion && selectedCardType.promotion.length > 0 ? (
                          <div className={styles.CheckboxList}>
                            {selectedCardType.promotion.map((promotion: ApiPromotion) => {
                              const promotionState =
                                activePromotions[promotion.promotion_id] || {
                                  active: false,
                                  start_date: "",
                                  initial_spend: "",
                                };

                              return (
                                <div
                                  key={promotion.promotion_id}
                                  className={styles.PromotionItem}
                                >
                                  <label className={styles.CheckboxRow}>
                                    <input
                                      type="checkbox"
                                      checked={promotionState.active}
                                      onChange={() =>
                                        handlePromotionToggle(promotion.promotion_id)
                                      }
                                    />
                                    <div>
                                      <span className={styles.PromotionName}>{promotion.name}</span>
                                      <p className={styles.PromotionDescription}>
                                        {promotion.description}
                                      </p>
                                      <p className={styles.PromotionCategory}>
                                        Category: {promotion.promotion_category}
                                      </p>
                                    </div>
                                  </label>

                                  {promotionState.active && (
                                    <div className={styles.PromotionSubFields}>
                                      <div className={styles.FormGroup}>
                                        <label className={styles.FormLabel}>
                                          Start Date
                                        </label>
                                        <input
                                          type="date"
                                          value={promotionState.start_date}
                                          onChange={(e) =>
                                            handlePromotionFieldChange(
                                              promotion.promotion_id,
                                              "start_date",
                                              e.target.value
                                            )
                                          }
                                          className={styles.FormInput}
                                        />
                                      </div>

                                      <div className={styles.FormGroup}>
                                        <label className={styles.FormLabel}>
                                          Initial Spend
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={promotionState.initial_spend}
                                          onChange={(e) =>
                                            handlePromotionFieldChange(
                                              promotion.promotion_id,
                                              "initial_spend",
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
                            No active promotions for this card.
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