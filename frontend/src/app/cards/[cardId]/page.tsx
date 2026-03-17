"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../styles/auth.module.css";

type CreditCard = {
  id: number;
  cardName: string;
  issuer: string;
  last4: string;
  rewardsType: string;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  rewardValue: number;
};

type Promotion = {
  id: string;
  title: string;
  details?: string;
  startDate: string;
  expires: string;
  threshold: number;
  reward: number;
  spentToDate: number;
};

export default function CardDashboard({
  params,
}: {
  params: { cardId: string };
}) {
  const router = useRouter();
  const { cardId } = params;

  const [card, setCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    const storedCards = typeof window !== "undefined" ? localStorage.getItem("userCards") : null;
    if (storedCards) {
      try {
        const parsed = JSON.parse(storedCards) as CreditCard[];
        const found = parsed.find((c) => String(c.id) === cardId);
        if (found) {
          setCard(found);
          return;
        }
      } catch {
        // ignore parsing errors
      }
    }

    // Fallback dummy card for wireframe
    setCard({
      id: Number(cardId),
      cardName: "Everyday Rewards",
      issuer: "Acme Bank",
      last4: "1234",
      rewardsType: "Cash Back",
    });
  }, [cardId]);

  const annualFee = 95.0;

  const [rewardFilter, setRewardFilter] = useState<"month" | "year" | "all" | "custom">("month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const [benefits, setBenefits] = useState<{
    id: string;
    name: string;
    merchant?: string;
    allotted: number;
    used: number;
    resetDate: string;
  }[]>([
    {
      id: "benefit-1",
      name: "Dining credit",
      merchant: "Any restaurant",
      allotted: 120,
      used: 70,
      resetDate: "2026-04-01",
    },
    {
      id: "benefit-2",
      name: "Travel reimbursement",
      merchant: "Airlines",
      allotted: 150,
      used: 150,
      resetDate: "2026-03-25",
    },
    {
      id: "benefit-3",
      name: "Streaming credit",
      merchant: "Entertainment",
      allotted: 60,
      used: 20,
      resetDate: "2026-05-01",
    },
  ]);

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: "promo-1",
      title: "Spend $500, earn $50 back",
      expires: "2026-04-15",
      details: "Earn $50 statement credit after $500 spend.",
      startDate: "2026-03-01",
      threshold: 500,
      reward: 50,
      spentToDate: 320,
    },
    {
      id: "promo-2",
      title: "2x dining points",
      expires: "2026-03-22",
      details: "Earn double points on dining this month.",
      startDate: "2026-03-01",
      threshold: 0,
      reward: 0,
      spentToDate: 420,
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx-1",
      date: "Mar 15, 2026",
      description: "Coffee Shop",
      amount: -6.82,
      category: "Dining",
      rewardValue: 0.34,
    },
    {
      id: "tx-2",
      date: "Mar 14, 2026",
      description: "Grocery Store",
      amount: -112.34,
      category: "Groceries",
      rewardValue: 1.12,
    },
    {
      id: "tx-3",
      date: "Mar 11, 2026",
      description: "Monthly Subscription",
      amount: -15.99,
      category: "Services",
      rewardValue: 0.16,
    },
    {
      id: "tx-4",
      date: "Mar 09, 2026",
      description: "Refund - Online Store",
      amount: 25.0,
      category: "Refund",
      rewardValue: 0,
    },
  ]);

  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState<string | null>(null);
  const [benefitUseAmount, setBenefitUseAmount] = useState("");
  const [benefitNote, setBenefitNote] = useState("");

  const [showEnrollPromoModal, setShowEnrollPromoModal] = useState(false);
  const [newPromoTitle, setNewPromoTitle] = useState("");
  const [newPromoStart, setNewPromoStart] = useState("");
  const [newPromoEnd, setNewPromoEnd] = useState("");
  const [newPromoThreshold, setNewPromoThreshold] = useState("");
  const [newPromoReward, setNewPromoReward] = useState("");
  const [newPromoSpent, setNewPromoSpent] = useState("");

  const rewardsBreakdown = useMemo(
    () => [
      { category: "Dining", spent: 380.12, rate: 0.05, earned: 19.0 },
      { category: "Travel", spent: 640.0, rate: 0.03, earned: 19.2 },
      { category: "Groceries", spent: 510.5, rate: 0.02, earned: 10.21 },
    ],
    []
  );

  const annualFeeValue = annualFee;
  const rewardsEarned = useMemo(
    () => rewardsBreakdown.reduce((sum, row) => sum + row.earned, 0),
    [rewardsBreakdown]
  );
  const benefitsUsed = useMemo(
    () => benefits.reduce((sum, item) => sum + item.used, 0),
    [benefits]
  );
  const promotionsEarned = useMemo(
    () =>
      promotions
        .filter((p) => p.spentToDate >= (p.threshold ?? 0))
        .reduce((sum, p) => sum + (p.reward ?? 0), 0),
    [promotions]
  );

  const netValue = useMemo(
    () => rewardsEarned + benefitsUsed + promotionsEarned - annualFeeValue,
    [rewardsEarned, benefitsUsed, promotionsEarned, annualFeeValue]
  );

  const defaultModuleOrder = ["rewards", "benefits", "promotions", "transactions"];
  const [moduleOrder, setModuleOrder] = useState<string[]>(defaultModuleOrder);

  useEffect(() => {
    const storedOrder =
      typeof window !== "undefined"
        ? localStorage.getItem(`cardModuleOrder:${cardId}`)
        : null;

    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setModuleOrder(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [cardId]);

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    e.dataTransfer.setData("text/plain", moduleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    setModuleOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(draggedId);
      const toIndex = next.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedId);

      if (typeof window !== "undefined") {
        localStorage.setItem(`cardModuleOrder:${cardId}`, JSON.stringify(next));
      }

      return next;
    });
  };

  const selectedBenefit = selectedBenefitId
    ? benefits.find((b) => b.id === selectedBenefitId)
    : null;

  const handleMarkBenefitUsed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBenefit) return;

    const amount = Number(benefitUseAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    setBenefits((prev) =>
      prev.map((b) =>
        b.id === selectedBenefit.id
          ? { ...b, used: Math.min(b.allotted, b.used + amount) }
          : b
      )
    );

    setShowBenefitModal(false);
    setBenefitUseAmount("");
    setBenefitNote("");
  };

  const handleEnrollPromotion = (e: React.FormEvent) => {
    e.preventDefault();

    const newPromo = {
      id: `promo-${Date.now()}`,
      title: newPromoTitle || "Custom promotion",
      expires: newPromoEnd || "",
      details: "",
      startDate: newPromoStart || "",
      threshold: Number(newPromoThreshold) || 0,
      reward: Number(newPromoReward) || 0,
      spentToDate: Number(newPromoSpent) || 0,
    } as Promotion;

    setPromotions((prev) => [newPromo, ...prev]);
    setShowEnrollPromoModal(false);
    setNewPromoTitle("");
    setNewPromoStart("");
    setNewPromoEnd("");
    setNewPromoThreshold("");
    setNewPromoReward("");
    setNewPromoSpent("");
  };

  if (!card) {
    return (
      <main className={styles.cardsPage}>
        <div className={styles.cardsHeader}>
          <h1 className={styles.cardsTitle}>Loading card...</h1>
        </div>
        <div className={styles.cardsEmptyState}>
          <p>Loading card details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.cardsPage}>
      <div className={styles.cardsHeader}>
        <div>
          <h1 className={styles.cardsTitle}>{card.cardName}</h1>
          <p className={styles.cardsSubtitle}>
            {card.issuer} • •••• {card.last4} • {card.rewardsType}
          </p>
        </div>

        <button
          className={styles.addCardBtn}
          type="button"
          onClick={() => router.push("/cards")}
        >
          ← Back to Cards
        </button>
      </div>

      <div className={styles.cardDashboardGrid}>
        <section className={`${styles.card} ${styles.cardDashboardKpiBar}`}>
          <div className={styles.cardDashboardKpiItem}>
            <span className={styles.cardDashboardKpiLabel}>Annual fee</span>
            <span className={styles.cardDashboardKpiValue}>-${annualFeeValue.toFixed(2)}</span>
          </div>
          <div className={styles.cardDashboardKpiItem}>
            <span className={styles.cardDashboardKpiLabel}>Rewards earned</span>
            <span className={styles.cardDashboardKpiValue}>${rewardsEarned.toFixed(2)}</span>
          </div>
          <div className={styles.cardDashboardKpiItem}>
            <span className={styles.cardDashboardKpiLabel}>Benefits used</span>
            <span className={styles.cardDashboardKpiValue}>${benefitsUsed.toFixed(2)}</span>
          </div>
          <div className={styles.cardDashboardKpiItem}>
            <span className={styles.cardDashboardKpiLabel}>Promotions earned</span>
            <span className={styles.cardDashboardKpiValue}>${promotionsEarned.toFixed(2)}</span>
          </div>
          <div className={styles.cardDashboardKpiItem}>
            <span className={styles.cardDashboardKpiLabel}>Net value</span>
            <span
              className={styles.cardDashboardKpiValue}
              style={{ color: netValue < 0 ? "#b42318" : "#1f4d3a" }}
            >
              {netValue < 0 ? "-" : "+"}${Math.abs(netValue).toFixed(2)}
            </span>
          </div>
        </section>

        {moduleOrder.map((moduleId) => {
          const isRewards = moduleId === "rewards";
          const isBenefits = moduleId === "benefits";
          const isPromotions = moduleId === "promotions";
          const isTransactions = moduleId === "transactions";

          return (
            <section
              key={moduleId}
              className={`${styles.card} ${styles.cardDashboardModule}`}
              draggable
              onDragStart={(e) => handleDragStart(e, moduleId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, moduleId)}
            >
              <div className={styles.cardModuleHeader}>
                <h2 className={styles.cardsTitle}>
                  {isRewards
                    ? "Rewards Breakdown"
                    : isBenefits
                    ? "Benefits"
                    : isPromotions
                    ? "Promotions"
                    : "Recent Transactions"}
                </h2>
                <span className={styles.cardModuleDragHandle} title="Drag to reorder">
                  ☰
                </span>
              </div>

              {isRewards && (
                <>
                  <div className={styles.cardSectionActions}>
                    <label className={styles.cardSectionActionLabel}>Date range</label>
                    <select
                      value={rewardFilter}
                      onChange={(e) => setRewardFilter(e.target.value as any)}
                      className={styles.cardSectionSelect}
                    >
                      <option value="month">This month</option>
                      <option value="year">This year</option>
                      <option value="all">All time</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {rewardFilter === "custom" && (
                    <div className={styles.cardSectionCustomRange}>
                      <label>
                        From
                        <input
                          type="date"
                          value={customRange.start}
                          onChange={(e) =>
                            setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                          }
                        />
                      </label>
                      <label>
                        To
                        <input
                          type="date"
                          value={customRange.end}
                          onChange={(e) =>
                            setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                          }
                        />
                      </label>
                    </div>
                  )}

                  <div className={styles.cardDashboardTableWrapCompact}>
                    <table className={styles.cardDashboardTable}>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Total spent</th>
                          <th>Reward rate</th>
                          <th>Rewards earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewardsBreakdown.map((row) => (
                          <tr key={row.category}>
                            <td>{row.category}</td>
                            <td>${row.spent.toFixed(2)}</td>
                            <td>{(row.rate * 100).toFixed(0)}%</td>
                            <td>${row.earned.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right" }}>
                            Total rewards earned
                          </td>
                          <td>${rewardsEarned.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              {isBenefits && (
                <>
                  <div className={styles.cardSectionHeader}>
                    <button
                      className={styles.dPrimaryButton}
                      type="button"
                      onClick={() => router.push(`/benefits?cardId=${cardId}`)}
                    >
                      View all benefits
                    </button>
                  </div>

                  <div className={styles.cardDashboardList}>
                    {benefits.map((benefit) => {
                      const progress = Math.min((benefit.used / benefit.allotted) * 100, 100);
                      const isComplete = benefit.used >= benefit.allotted;
                      const expiresSoon =
                        new Date(benefit.resetDate).getTime() - Date.now() <=
                        7 * 24 * 60 * 60 * 1000;

                      return (
                        <div
                          key={benefit.id}
                          className={`${styles.cardDashboardPromoItem} ${
                            isComplete ? styles.cardDashboardBenefitComplete : ""
                          } ${
                            !isComplete && expiresSoon
                              ? styles.cardDashboardBenefitExpiring
                              : ""
                          }`}
                        >
                          <div className={styles.cardDashboardListRow}>
                            <div>
                              <p className={styles.cardDashboardListTitle}>{benefit.name}</p>
                              <p className={styles.cardDashboardListSubtitle}>
                                {benefit.merchant ?? "Any merchant"} • Reset {benefit.resetDate}
                              </p>
                            </div>
                            <button
                              type="button"
                              className={styles.cardDashboardSmallButton}
                              onClick={() => {
                                setSelectedBenefitId(benefit.id);
                                setShowBenefitModal(true);
                              }}
                            >
                              Mark used
                            </button>
                          </div>

                          <div className={styles.cardDashboardProgressRow}>
                            <div className={styles.cardDashboardProgressLabel}>
                              {benefit.used.toFixed(0)}/{benefit.allotted.toFixed(0)} used
                            </div>
                            <div className={styles.cardDashboardProgress}>
                              <div
                                className={styles.cardDashboardProgressFill}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {isPromotions && (
                <>
                  <div className={styles.cardSectionHeader}>
                    <button
                      className={styles.dPrimaryButton}
                      type="button"
                      onClick={() => setShowEnrollPromoModal(true)}
                    >
                      Enroll in promotion
                    </button>
                  </div>

                  <div className={styles.cardDashboardList}>
                    {promotions.map((promo) => {
                      const now = new Date();
                      const end = new Date(promo.expires);
                      const completed = promo.spentToDate >= (promo.threshold ?? 0);
                      const expired = end < now && !completed;
                      const pct = promo.threshold
                        ? Math.min((promo.spentToDate / promo.threshold) * 100, 100)
                        : 100;

                      return (
                        <div
                          key={promo.id}
                          className={`${styles.cardDashboardPromoItem} ${
                            completed ? styles.cardDashboardPromoComplete : ""
                          } ${expired ? styles.cardDashboardPromoExpired : ""}`}
                        >
                          <div className={styles.cardDashboardListRow}>
                            <div>
                              <p className={styles.cardDashboardListTitle}>{promo.title}</p>
                              <p className={styles.cardDashboardListSubtitle}>
                                {promo.details}
                              </p>
                            </div>
                            <div>{completed ? "✅" : expired ? "⚪" : "⏳"}</div>
                          </div>

                          <div className={styles.cardDashboardPromoMeta}>
                            <span>
                              {promo.spentToDate.toFixed(0)}/{promo.threshold.toFixed(0)} spent
                            </span>
                            <span>Ends {promo.expires}</span>
                            <span>Reward ${promo.reward.toFixed(2)}</span>
                          </div>

                          <div className={styles.cardDashboardProgress}>
                            <div
                              className={styles.cardDashboardProgressFill}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {isTransactions && (
                <>
                  <div className={styles.cardSectionActions}>
                    <button
                      className={styles.dPrimaryButton}
                      type="button"
                      onClick={() => router.push(`/transactions?cardId=${cardId}`)}
                    >
                      View all
                    </button>
                    <button
                      className={styles.dPrimaryButton}
                      type="button"
                      onClick={() => router.push(`/transactions/new?cardId=${cardId}`)}
                    >
                      + Log transaction
                    </button>
                  </div>

                  <div className={styles.cardDashboardTableWrap}>
                    <table className={styles.cardDashboardTable}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Merchant</th>
                          <th>Category</th>
                          <th className={styles.cardDashboardAmountColumn}>Amount</th>
                          <th className={styles.cardDashboardAmountColumn}>Rewards</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 10).map((tx) => (
                          <tr key={tx.id}>
                            <td>{tx.date}</td>
                            <td>{tx.description}</td>
                            <td>{tx.category}</td>
                            <td
                              className={styles.cardDashboardAmountColumn}
                              style={{
                                color: tx.amount < 0 ? "#b42318" : "#1f4d3a",
                              }}
                            >
                              {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                            </td>
                            <td className={styles.cardDashboardAmountColumn}>
                              ${tx.rewardValue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>

      {showBenefitModal && selectedBenefit && (
        <div className={styles.cardFormOverlay}>
          <div className={styles.cardFormBox}>
            <h2 className={styles.cardFormTitle}>Log benefit use</h2>
            <p className={styles.text}>
              {selectedBenefit.name} ({selectedBenefit.merchant ?? "Any merchant"})
            </p>
            <form onSubmit={handleMarkBenefitUsed} className={styles.cardForm}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount used"
                value={benefitUseAmount}
                onChange={(e) => setBenefitUseAmount(e.target.value)}
                className={styles.formInput}
              />
              <input
                placeholder="Merchant / notes (optional)"
                value={benefitNote}
                onChange={(e) => setBenefitNote(e.target.value)}
                className={styles.formInput}
              />
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowBenefitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveCardBtn}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEnrollPromoModal && (
        <div className={styles.cardFormOverlay}>
          <div className={styles.cardFormBox}>
            <h2 className={styles.cardFormTitle}>Enroll in a promotion</h2>
            <form onSubmit={handleEnrollPromotion} className={styles.cardForm}>
              <input
                placeholder="Promotion name"
                value={newPromoTitle}
                onChange={(e) => setNewPromoTitle(e.target.value)}
                className={styles.formInput}
              />
              <input
                type="date"
                value={newPromoStart}
                onChange={(e) => setNewPromoStart(e.target.value)}
                className={styles.formInput}
              />
              <input
                type="date"
                value={newPromoEnd}
                onChange={(e) => setNewPromoEnd(e.target.value)}
                className={styles.formInput}
              />
              <input
                type="number"
                placeholder="Spend threshold"
                value={newPromoThreshold}
                onChange={(e) => setNewPromoThreshold(e.target.value)}
                className={styles.formInput}
              />
              <input
                type="number"
                placeholder="Reward amount"
                value={newPromoReward}
                onChange={(e) => setNewPromoReward(e.target.value)}
                className={styles.formInput}
              />
              <input
                type="number"
                placeholder="Spend to date"
                value={newPromoSpent}
                onChange={(e) => setNewPromoSpent(e.target.value)}
                className={styles.formInput}
              />
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEnrollPromoModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveCardBtn}>
                  Add promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
