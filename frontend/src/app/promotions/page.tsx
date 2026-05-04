"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../../styles/auth.module.css";
import { differenceInDays, parseISO, format, isThisYear } from "date-fns";
import Link from "next/link";
import { getUserPromotions, type UserPromotion } from "../../lib/functions/getUserPromotions";
import { upsertUserPromotion } from "../../lib/functions/upsertUserPromotion";
import { deleteUserPromotion } from "../../lib/functions/deleteUserPromotion";
import { getUserCards } from "../../lib/functions/getUserCards";
import { getCardTypes } from "../../lib/functions/getCardTypes";

// ---------------------- LOCAL TYPES ----------------------

type UserCard = {
  credit_card_id: string;
  nickname: string;
  last_four: string;
  credit_card_type: {
    credit_card_type_id: number;
    name: string;
  };
};

type CatalogPromotion = {
  promotion_id: string;
  name: string;
  description: string;
  promotion_category: string;
  valid_until: string | null;
};

type CardType = {
  credit_card_type_id: number;
  name: string;
  promotion: CatalogPromotion[];
};

// ---------------------- STATUS HELPER ----------------------

type PromoStatus = "Active" | "AtRisk" | "Completed" | "Expired";

function computeStatus(promo: UserPromotion): PromoStatus {
  if (promo.completed_at) return "Completed";

  const today = new Date();
  const endDate = parseISO(promo.end_date);

  if (endDate < today) return "Expired";

  const goalAmount = promo.promotion.promotion_condition[0]?.goal_amount ?? 0;
  const effectiveSpend = promo.spend_to_date + promo.initial_spend;

  if (effectiveSpend >= goalAmount) return "Completed";

  const daysLeft = differenceInDays(endDate, today);
  const remainingSpend = goalAmount - effectiveSpend;

  // At risk: less than 14 days left, or daily spend required exceeds $100
  if (daysLeft < 14 || remainingSpend / daysLeft > 100) return "AtRisk";

  return "Active";
}

function statusLabel(status: PromoStatus): string {
  if (status === "AtRisk") return "At Risk";
  return status;
}

// ---------------------- ACCESS TOKEN HELPER ----------------------

function getAccessToken(): string | null {
  const local = localStorage.getItem("accessToken");
  if (local) return local;

  const supabaseToken = localStorage.getItem("supabase.auth.token");
  if (supabaseToken) {
    try {
      const session = JSON.parse(supabaseToken);
      return session?.currentSession?.access_token ?? session?.access_token ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

// ---------------------- PAGE ----------------------

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);

  // Filters
  const [filterCardId, setFilterCardId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Collapsible completed section
  const [showCompleted, setShowCompleted] = useState(false);

  // Enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCardId, setEnrollCardId] = useState<string>("");
  const [enrollPromotionId, setEnrollPromotionId] = useState<string>("");
  const [enrollStartDate, setEnrollStartDate] = useState<string>("");
  const [enrollInitialSpend, setEnrollInitialSpend] = useState<string>("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Remove confirmation modal
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Three-dot menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // ---------------------- LOAD DATA ----------------------

  useEffect(() => {
    async function load() {
      try {
        const token = getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const [promos, cards, types] = await Promise.all([
          getUserPromotions(token),
          getUserCards(token),
          getCardTypes(token),
        ]);

        setUserPromotions(promos ?? []);
        setUserCards(cards ?? []);
        setCardTypes(types ?? []);
      } catch (err) {
        setError((err as Error).message ?? "Failed to load promotions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------------------- DERIVED DATA ----------------------

  const promotionsWithStatus = useMemo(
    () =>
      userPromotions
        .filter((p) => p.credit_card != null) // guard against join-filter bug nulls
        .map((p) => ({ ...p, _status: computeStatus(p) })),
    [userPromotions]
  );

  const filteredPromotions = useMemo(() => {
    return promotionsWithStatus.filter((p) => {
      if (filterCardId !== "all" && p.credit_card.credit_card_id !== filterCardId) return false;
      if (filterStatus !== "all" && p._status !== filterStatus) return false;
      return true;
    });
  }, [promotionsWithStatus, filterCardId, filterStatus]);

  // When a specific status filter is selected, show all results in the main list.
  // Only split into active/collapsible when showing "all" statuses.
  const isSpecificStatusFilter = filterStatus !== "all";

  const activePromotions = isSpecificStatusFilter
    ? filteredPromotions
    : filteredPromotions.filter((p) => p._status === "Active" || p._status === "AtRisk");

  const completedExpiredPromotions = isSpecificStatusFilter
    ? []
    : filteredPromotions.filter((p) => p._status === "Completed" || p._status === "Expired");

  const summary = useMemo(() => {
    const active = promotionsWithStatus.filter(
      (p) => p._status === "Active" || p._status === "AtRisk"
    ).length;

    const completedYTD = promotionsWithStatus.filter(
      (p) => p._status === "Completed" && p.completed_at != null && isThisYear(new Date(p.completed_at))
    ).length;

    const expiringThisMonth = promotionsWithStatus.filter((p) => {
      if (p._status === "Completed" || p._status === "Expired") return false;
      const daysLeft = differenceInDays(parseISO(p.end_date), new Date());
      return daysLeft >= 0 && daysLeft <= 30;
    }).length;

    return { active, completedYTD, expiringThisMonth };
  }, [promotionsWithStatus]);

  // ---------------------- ENROLL MODAL HELPERS ----------------------

  const selectedEnrollCard = userCards.find((c) => c.credit_card_id === enrollCardId);
  const selectedCardType = selectedEnrollCard
    ? cardTypes.find((ct) => ct.credit_card_type_id === selectedEnrollCard.credit_card_type.credit_card_type_id)
    : null;

  // Filter out promotions the user is already enrolled in for this card
  const availablePromotions: CatalogPromotion[] = useMemo(() => {
    if (!selectedCardType) return [];

    const enrolledIds = new Set(
      userPromotions
        .filter((p) => p.credit_card?.credit_card_id === enrollCardId)
        .map((p) => p.promotion.promotion_id)
    );

    return selectedCardType.promotion.filter((p) => !enrolledIds.has(p.promotion_id));
  }, [selectedCardType, enrollCardId, userPromotions]);

  function resetEnrollModal() {
    setEnrollCardId("");
    setEnrollPromotionId("");
    setEnrollStartDate("");
    setEnrollInitialSpend("");
    setEnrollError(null);
    setShowEnrollModal(false);
  }

  async function handleEnroll() {
    if (!enrollCardId || !enrollPromotionId || !enrollStartDate) {
      setEnrollError("Please fill in all required fields.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setEnrollError("Not authenticated.");
      return;
    }

    setEnrollLoading(true);
    setEnrollError(null);

    try {
      const newPromotion = await upsertUserPromotion({
        accessToken: token,
        credit_card_id: enrollCardId,
        promotion_id: enrollPromotionId,
        start_date: enrollStartDate,
        initial_spend: enrollInitialSpend ? Number(enrollInitialSpend) : undefined,
      });

      setUserPromotions((prev) => [...prev, newPromotion]);
      resetEnrollModal();
    } catch (err) {
      setEnrollError((err as Error).message ?? "Enrollment failed.");
    } finally {
      setEnrollLoading(false);
    }
  }

  // ---------------------- REMOVE HANDLERS ----------------------

  async function handleRemove() {
    if (!confirmRemoveId) return;

    const token = getAccessToken();
    if (!token) return;

    setRemoveLoading(true);
    try {
      await deleteUserPromotion(token, confirmRemoveId);
      setUserPromotions((prev) =>
        prev.filter((p) => p.user_promotion_id !== confirmRemoveId)
      );
      setConfirmRemoveId(null);
    } catch (err) {
      console.error("Failed to remove promotion:", err);
    } finally {
      setRemoveLoading(false);
    }
  }

  // ---------------------- RENDER HELPERS ----------------------

  function renderProgressBar(promo: UserPromotion) {
    const goal = promo.promotion.promotion_condition[0]?.goal_amount ?? 0;
    const effective = promo.spend_to_date + promo.initial_spend;
    const pct = goal > 0 ? Math.min(100, Math.round((effective / goal) * 100)) : 0;

    return (
      <>
        <div className={styles.promotionsProgressBar}>
          <div className={styles.promotionsProgressFill} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.promotionsProgressText}>
          ${effective.toFixed(2)} / ${goal.toFixed(2)} &mdash; {pct}%
        </p>
      </>
    );
  }

  function renderDaysLeft(endDate: string) {
    const daysLeft = differenceInDays(parseISO(endDate), new Date());
    if (daysLeft < 0) return <span className={styles.promotionsDaysRed}>Expired</span>;
    if (daysLeft < 7) return <span className={styles.promotionsDaysRed}>{daysLeft}d left</span>;
    if (daysLeft < 14) return <span className={styles.promotionsDaysYellow}>{daysLeft}d left</span>;
    return <span className={styles.promotionsDaysDefault}>{daysLeft}d left</span>;
  }

  function renderCard(promo: UserPromotion & { _status: PromoStatus }) {
    const goal = promo.promotion.promotion_condition[0]?.goal_amount ?? 0;
    const rewardAmount = promo.promotion.promotion_reward[0]?.reward_amount ?? 0;
    const rewardCurrency = promo.promotion.promotion_reward[0]?.reward_currency ?? "cash";
    const awardDisplay =
      rewardCurrency === "cash"
        ? `$${rewardAmount}`
        : `${rewardAmount} ${rewardCurrency}`;

    return (
      <div key={promo.user_promotion_id} className={styles.promotionsCard} style={{ position: "relative" }}>
        {/* Three-dot menu */}
        <div
          className={styles.promotionsCardMenuIcon}
          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === promo.user_promotion_id ? null : promo.user_promotion_id); }}
        >
          &#8942;
        </div>
        {menuOpenId === promo.user_promotion_id && (
          <div className={styles.promotionsCardMenu} onClick={(e) => e.stopPropagation()}>
            <div
              onClick={() => {
                setMenuOpenId(null);
                setConfirmRemoveId(promo.user_promotion_id);
              }}
            >
              Remove
            </div>
          </div>
        )}

        <Link
          href={`/cards/${promo.credit_card.credit_card_id}`}
          className={styles.promotionsCardHeader}
          style={{ textDecoration: "none", cursor: "pointer" }}
          onClick={(e) => e.stopPropagation()}
        >
          {promo.credit_card.nickname
            ? `${promo.credit_card.nickname} ••••${promo.credit_card.last_four}`
            : `••••${promo.credit_card.last_four}`}
        </Link>
        <p className={styles.promotionsCardTitle}>{promo.promotion.name}</p>
        <p className={styles.promotionsCardDescription}>{promo.promotion.description}</p>

        <div className={styles.promotionsCardRow}>
          <span>Goal: ${goal.toFixed(2)}</span>
          <span>Award: {awardDisplay}</span>
        </div>

        {renderProgressBar(promo)}

        <div className={styles.promotionsCardRow}>
          <span>Start: {format(parseISO(promo.start_date), "MMM d, yyyy")}</span>
          <span>End: {renderDaysLeft(promo.end_date)}</span>
        </div>

        <span className={`${styles.promotionsStatusBadge} ${styles[promo._status]}`}>
          {statusLabel(promo._status)}
        </span>

        {promo._status === "Completed" && promo.award_earned != null && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#065f46", fontWeight: 600 }}>
            Earned: {rewardCurrency === "cash" ? `$${promo.award_earned}` : `${promo.award_earned} ${rewardCurrency}`}
          </p>
        )}
      </div>
    );
  }

  // ---------------------- RENDER ----------------------

  if (loading) {
    return (
      <div className={styles.PageContainer}>
        <div className={styles.PageHero}>
          <h1 className={styles.PageTitle}>Promotions</h1>
        </div>
        <p style={{ padding: "2rem", color: "#6b7280" }}>Loading promotions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.PageContainer}>
        <div className={styles.PageHero}>
          <h1 className={styles.PageTitle}>Promotions</h1>
        </div>
        <p style={{ padding: "2rem", color: "#dc2626" }}>{error}</p>
      </div>
    );
  }
  
  return (
    <div className={styles.PageContainer} onClick={() => setMenuOpenId(null)}>
      <div className={styles.PageHero}>
        <h1 className={styles.PageTitle}>Promotions</h1>
        <p className={styles.PageSubtitle}>
          Discover limited-time offers, bonus rewards, and special credit card deals.
        </p>
      </div>

      {/* Summary */}
      <section className={styles.Summary}>
        <div className={styles.SummaryCards}>
          {[
            { label: "Active Promotions", value: summary.active },
            { label: "Completed (YTD)", value: summary.completedYTD },
            { label: "Expiring This Month", value: summary.expiringThisMonth },
          ].map((stat, idx) => (
            <div key={idx} className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>{stat.label}</p>
              <p className={styles.SummaryValue}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      
      {/* Filters */}
      <section className={styles.promotionsFilters}>
        <select
          className={styles.promotionsSelect}
          value={filterCardId}
          onChange={(e) => setFilterCardId(e.target.value)}
        >
          <option value="all">All Cards</option>
          {userCards.map((c) => (
            <option key={c.credit_card_id} value={c.credit_card_id}>
              {c.nickname ? `${c.nickname} ••••${c.last_four}` : `••••${c.last_four}`}
            </option>
          ))}
        </select>

        <select
          className={styles.promotionsSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="AtRisk">At Risk</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
        </select>
      </section>

      {/* Main promotions list */}
      <section>
        <h2 className={styles.promotionsListTitle}>
          {filterStatus === "Completed" ? "Completed Promotions"
            : filterStatus === "Expired" ? "Expired Promotions"
            : filterStatus === "AtRisk" ? "At Risk Promotions"
            : "Your Promotions"}
        </h2>
        <button
          className={styles.promotionsEnrollButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowEnrollModal(true);
          }}
        >
          + Enroll in Promotion
        </button>
        <div className={styles.promotionsList}>
          {activePromotions.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "1rem 0" }}>No promotions found.</p>
          ) : (
            activePromotions.map(renderCard)
          )}
        </div>
      </section>

      {/* Completed / Expired collapsible */}
      {completedExpiredPromotions.length > 0 && (
        <section>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#374151",
              padding: "0.75rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {showCompleted ? "▾" : "▸"} Completed &amp; Expired ({completedExpiredPromotions.length})
          </button>
          {showCompleted && (
            <div className={styles.promotionsList}>
              {completedExpiredPromotions.map(renderCard)}
            </div>
          )}
        </section>
      )}


      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className={styles.promotionsPopupOverlay} onClick={resetEnrollModal}>
          <div
            className={styles.promotionsPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.promotionsPopupTitle}>Enroll in Promotion</h3>

            {/* Card selector */}
            <select
              className={styles.promotionsPopupSelect}
              value={enrollCardId}
              onChange={(e) => {
                setEnrollCardId(e.target.value);
                setEnrollPromotionId("");
              }}
            >
              <option value="">Select a card</option>
              {userCards.map((c) => (
                <option key={c.credit_card_id} value={c.credit_card_id}>
                  {c.nickname ? `${c.nickname} ••••${c.last_four}` : `${c.credit_card_type.name} ••••${c.last_four}`}
                </option>
              ))}
            </select>

            {/* Promotion list for selected card */}
            {enrollCardId && (
              <>
                {availablePromotions.length === 0 ? (
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0.5rem 0" }}>
                    No available promotions for this card.
                  </p>
                ) : (
                  <div className={styles.promotionsPopupChecklist}>
                    {availablePromotions.map((p) => (
                      <label key={p.promotion_id} className={styles.promotionsPopupChecklistItem}>
                        <input
                          type="radio"
                          name="enrollPromotion"
                          className={styles.promotionsPopupCheckbox}
                          checked={enrollPromotionId === p.promotion_id}
                          onChange={() => setEnrollPromotionId(p.promotion_id)}
                        />
                        <span>{p.name}</span>
                        {enrollPromotionId === p.promotion_id && (
                          <p style={{ fontSize: "0.85rem", color: "#374151", marginLeft: "1.5rem" }}>
                            {p.description}
                          </p>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}











            {/* Start date + initial spend */}
            {enrollPromotionId && (
              <>
                <input
                  type="date"
                  className={styles.promotionsPopupInput}
                  value={enrollStartDate}
                  onChange={(e) => setEnrollStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <input
                  type="number"
                  className={styles.promotionsPopupInput}
                  value={enrollInitialSpend}
                  onChange={(e) => setEnrollInitialSpend(e.target.value)}
                  placeholder="Amount already spent (optional)"
                  min="0"
                  step="0.01"
                />
                <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "-0.25rem" }}>
                  End date is calculated automatically from the promotion's time window.
                </p>
              </>
            )}

            {enrollError && (
              <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>{enrollError}</p>
            )}

            <div className={styles.buttonRow}>
              <button className={styles.cancelBtn} onClick={resetEnrollModal}>
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleEnroll}
                disabled={enrollLoading}
              >
                {enrollLoading ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {confirmRemoveId && (
        <div className={styles.promotionsPopupOverlay} onClick={() => setConfirmRemoveId(null)}>
          <div
            className={styles.promotionsPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.promotionsPopupTitle}>Remove Promotion</h3>
            <p style={{ color: "#374151", marginBottom: "1rem" }}>
              Are you sure you want to remove this promotion? This cannot be undone.
            </p>
            <div className={styles.promotionsPopupActions}>
              <button
                className={styles.promotionsPopupCancel}
                onClick={() => setConfirmRemoveId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.promotionsRemoveButton}
                onClick={handleRemove}
                disabled={removeLoading}
              >
                {removeLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>



      )}
    </div>
  );
}
