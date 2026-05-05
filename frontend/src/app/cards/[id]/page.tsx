"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../styles/auth.module.css";

type CreditCard = {
  credit_card_type_id: number;
  cardName: string;
  issuer_id: string;
  last4: string;
  rewardsType: string;
};

type Transaction = {
  credit_card_type_id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  rewardValue: number;
};

type Promotion = {
  credit_card_type_id: string;
  title: string;
  details?: string;
  created_at: string;
  expires: string;
  threshold: number;
  reward: number;
  spentToDate: number;
};

type Benefit = {
  credit_card_type_id: string;
  name: string;
  merchant?: string;
  allotted: number;
  used: number;
  resetDate: string;
};

export default function CardDashboard({
  params,
}: {
  params: { cardId: string };
}) {
  const router = useRouter();
  const { cardId } = params;

  const [card, setCard] = useState<CreditCard | null>(null);

  const [openMoveMenuId, setOpenMoveMenuId] = useState<string | null>(null);
  const [dragEnabledId, setDragEnabledId] = useState<string | null>(null);

  useEffect(() => {
    const storedCards =
      typeof window !== "undefined" ? localStorage.getItem("userCards") : null;

    if (storedCards) {
      try {
        const parsed = JSON.parse(storedCards) as CreditCard[];
        const found = parsed.find((c) => String(c.credit_card_type_id) === cardId);
        if (found) {
          setCard(found);
          return;
        }
      } catch {
        // ignore parsing errors
      }
    }

    setCard({
      credit_card_type_id: Number(cardId),
      cardName: "Everyday Rewards",
      issuer_id: "Acme Bank",
      last4: "1234",
      rewardsType: "Cash Back",
    });
  }, [cardId]);

  const annual_fee = 95.0;

  const [rewardFilter, setRewardFilter] = useState<"month" | "year" | "all" | "custom">("month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const [benefits, setBenefits] = useState<Benefit[]>([
    {
      credit_card_type_id: "benefit-1",
      name: "Dining credit",
      merchant: "Any restaurant",
      allotted: 120,
      used: 70,
      resetDate: "2026-04-01",
    },
    {
      credit_card_type_id: "benefit-2",
      name: "Travel reimbursement",
      merchant: "Airlines",
      allotted: 150,
      used: 150,
      resetDate: "2026-03-25",
    },
    {
      credit_card_type_id: "benefit-3",
      name: "Streaming credit",
      merchant: "Entertainment",
      allotted: 60,
      used: 20,
      resetDate: "2026-05-01",
    },
  ]);

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      credit_card_type_id: "promo-1",
      title: "Spend $500, earn $50 back",
      expires: "2026-04-15",
      details: "Earn $50 statement credit after $500 spend.",
      created_at: "2026-03-01",
      threshold: 500,
      reward: 50,
      spentToDate: 320,
    },
    {
      credit_card_type_id: "promo-2",
      title: "2x dining points",
      expires: "2026-03-22",
      details: "Earn double points on dining this month.",
      created_at: "2026-03-01",
      threshold: 0,
      reward: 0,
      spentToDate: 420,
    },
  ]);

  const transactions: Transaction[] = [
    {
      credit_card_type_id: "tx-1",
      date: "Mar 15, 2026",
      description: "Coffee Shop",
      amount: -6.82,
      category: "Dining",
      rewardValue: 0.34,
    },
    {
      credit_card_type_id: "tx-2",
      date: "Mar 14, 2026",
      description: "Grocery Store",
      amount: -112.34,
      category: "Groceries",
      rewardValue: 1.12,
    },
    {
      credit_card_type_id: "tx-3",
      date: "Mar 11, 2026",
      description: "Monthly Subscription",
      amount: -15.99,
      category: "Services",
      rewardValue: 0.16,
    },
    {
      credit_card_type_id: "tx-4",
      date: "Mar 09, 2026",
      description: "Refund - Online Store",
      amount: 25.0,
      category: "Refund",
      rewardValue: 0,
    },
  ];

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

  const annual_feeValue = annual_fee;

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
        .filter((p) => p.spentToDate >= p.threshold)
        .reduce((sum, p) => sum + p.reward, 0),
    [promotions]
  );

  const netValue = useMemo(
    () => rewardsEarned + benefitsUsed + promotionsEarned - annual_feeValue,
    [rewardsEarned, benefitsUsed, promotionsEarned, annual_feeValue]
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

  const saveModuleOrder = (nextOrder: string[]) => {
    setModuleOrder(nextOrder);

    if (typeof window !== "undefined") {
      localStorage.setItem(`cardModuleOrder:${cardId}`, JSON.stringify(nextOrder));
    }
  };

  const moveModuleToTop = (moduleId: string) => {
    const filtered = moduleOrder.filter((id) => id !== moduleId);
    const next = [moduleId, ...filtered];
    saveModuleOrder(next);
    setOpenMoveMenuId(null);
  };

  const moveModuleToBottom = (moduleId: string) => {
    const filtered = moduleOrder.filter((id) => id !== moduleId);
    const next = [...filtered, moduleId];
    saveModuleOrder(next);
    setOpenMoveMenuId(null);
  };

  const enableMoveMode = (moduleId: string) => {
    setDragEnabledId(moduleId);
    setOpenMoveMenuId(null);
  };

  const disableMoveMode = () => {
    setDragEnabledId(null);
  };

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

    const next = [...moduleOrder];
    const fromIndex = next.indexOf(draggedId);
    const toIndex = next.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, draggedId);

    saveModuleOrder(next);
    disableMoveMode();
  };

  const selectedBenefit = selectedBenefitId
    ? benefits.find((b) => b.credit_card_type_id === selectedBenefitId)
    : null;

  const handleMarkBenefitUsed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBenefit) return;

    const amount = Number(benefitUseAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    setBenefits((prev) =>
      prev.map((b) =>
        b.credit_card_type_id === selectedBenefit.credit_card_type_id
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

    const newPromo: Promotion = {
      credit_card_type_id: `promo-${Date.now()}`,
      title: newPromoTitle || "Custom promotion",
      expires: newPromoEnd || "",
      details: "",
      created_at: newPromoStart || "",
      threshold: Number(newPromoThreshold) || 0,
      reward: Number(newPromoReward) || 0,
      spentToDate: Number(newPromoSpent) || 0,
    };

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
      <main className={styles.Page}>
        <div className={styles.PageContainer}>
          <section className={styles.CardDetailsSection}>
            <h2>Loading card...</h2>
            <p>Loading card details...</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.Page}>
      <div className={styles.PageContainer}>

        <section className={styles.PageHero}>
          <h1 className={styles.PageTitle}>{card.cardName}</h1>
          <p className={styles.PageSubtitle}>
            {card.issuer_id} • •••• {card.last4} • {card.rewardsType}
          </p>
        </section>

          <button
            className={styles.BackButton}
            type="button"
            onClick={() => router.push("/cards")}
           >
             ← Back to Cards
            </button>



        <section className={styles.Summary}>
           <div className={styles.SummaryCards}>
            {[
               { label: "Annual fee",
                  value: `-$${annual_feeValue.toFixed(2)}`,},
               { label: "Rewards earned",
                value: `$${rewardsEarned.toFixed(2)}`,},
               { label: "Benefits used",
                 value: `$${benefitsUsed.toFixed(2)}`,},
               { label: "Promotions earned",
                  value: `$${promotionsEarned.toFixed(2)}`,},
               { label: "Net value",
                  value: (netValue < 0 ? "-" : "+") + `$${Math.abs(netValue).toFixed(2)}`, isNet: true, },
                ].map((stat, idx) => (
             <div key={idx} className={styles.SummaryCard}>
               <p className={styles.SummaryLabel}>{stat.label}</p>
               <p className={styles.SummaryValue}
                  style={{
                    color: stat.isNet
                       ? netValue < 0
                       ? "#b42318"
                       : "#059669"
                       : undefined,
                   }}
                  >
               {stat.value}
                </p>
             </div>
           ))}
          </div>
        </section>

        <div className={styles.CardDetailsGrid}>
          <div className={styles.CardDetailsMain}>
            {moduleOrder.map((moduleId) => {
              const isRewards = moduleId === "rewards";
              const isBenefits = moduleId === "benefits";
              const isPromotions = moduleId === "promotions";
              const isTransactions = moduleId === "transactions";

              return (
                <section
                  key={moduleId}
                  className={`${styles.CardDetailsSection} ${
                    dragEnabledId === moduleId ? styles.CardDetailsSectionMoving : ""
                  }`}
                  draggable={dragEnabledId === moduleId}
                  onDragStart={(e) => handleDragStart(e, moduleId)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, moduleId)}
                >
                  <div>
                    <h2 className={styles.SummaryTitle} style={{ marginTop: "30px", marginBottom: "30px", textAlign: "center", fontSize: "25px", justifyContent: "center"}}
                     >
                      {isRewards
                        ? "Rewards Breakdown"
                        : isBenefits
                        ? "Benefits"
                        : isPromotions
                        ? "Promotions"
                        : "Recent Transactions"}
                    </h2>

                    <div className={styles.MoveWrapper}>
                      <button
                        type="button"
                        className={styles.MoveButton}
                        title="Reorder section"
                        onClick={() =>
                          setOpenMoveMenuId((prev) => (prev === moduleId ? null : moduleId))
                        }
                      >
                        ⋮
                      </button>

                      {openMoveMenuId === moduleId && (
                        <div className={styles.MoveDropdown}>
                          <button
                            type="button"
                            className={styles.MoveMenu}
                            onClick={() => moveModuleToTop(moduleId)}
                          >
                            Move to Top
                          </button>
                          <button
                            type="button"
                            className={styles.MoveMenu}
                            onClick={() => enableMoveMode(moduleId)}
                          >
                            Move
                          </button>
                          <button
                            type="button"
                            className={styles.MoveMenu}
                            onClick={() => moveModuleToBottom(moduleId)}
                          >
                            Move to Bottom
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {dragEnabledId === moduleId && (
                    <p className={styles.CardMoveHint}>
                      Drag this section to where you want it, then drop it.
                    </p>
                  )}

                  {isRewards && (
                    <>
                      <div className={styles.CardActions} style={{ justifyContent: "space-between" }}>
                        <label className={styles.CardLabel}>Date range</label>
                        <select
                          value={rewardFilter}
                          onChange={(e) =>
                            setRewardFilter(
                              e.target.value as "month" | "year" | "all" | "custom"
                            )
                          }
                          className={styles.CardInput}
                          style={{ maxWidth: "220px" }}
                        >
                          <option value="month">This month</option>
                          <option value="year">This year</option>
                          <option value="all">All time</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {rewardFilter === "custom" && (
                        <div className={styles.CardExpirationRow} style={{ marginTop: "1rem" }}>
                          <div className={styles.CardFieldGroup}>
                            <label className={styles.CardLabel}>From</label>
                            <input
                              type="date"
                              value={customRange.start}
                              onChange={(e) =>
                                setCustomRange((prev) => ({
                                  ...prev,
                                  start: e.target.value,
                                }))
                              }
                              className={styles.CardInput}
                            />
                          </div>

                          <div className={styles.CardFieldGroup}>
                            <label className={styles.CardLabel}>To</label>
                            <input
                              type="date"
                              value={customRange.end}
                              onChange={(e) =>
                                setCustomRange((prev) => ({
                                  ...prev,
                                  end: e.target.value,
                                }))
                              }
                              className={styles.CardInput}
                            />
                          </div>
                        </div>
                      )}

                      <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                        <table className={styles.table}>
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
                              <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>
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
                      <div className={styles.buttonRow}>
                        <button
                          className={styles.SecondaryButton}
                          type="button"
                          onClick={() => router.push(`/benefits?cardId=${cardId}`)}
                        >
                          View all benefits
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "1rem" }}>
                        {benefits.map((benefit) => {
                          const progress = Math.min((benefit.used / benefit.allotted) * 100, 100);
                          const isComplete = benefit.used >= benefit.allotted;
                          const expiresSoon =
                            new Date(benefit.resetDate).getTime() - Date.now() <=
                            7 * 24 * 60 * 60 * 1000;

                          return (
                            <div
                              key={benefit.credit_card_type_id}
                              className={styles.CardRewardsBox}
                              style={{
                                borderColor: isComplete
                                  ? "#86efac"
                                  : !isComplete && expiresSoon
                                  ? "#facc15"
                                  : undefined,
                                background: isComplete
                                  ? "#f0fdf4"
                                  : !isComplete && expiresSoon
                                  ? "#fefce8"
                                  : undefined,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "1rem",
                                  marginBottom: "0.85rem",
                                }}
                              >
                                <div>
                                  <p style={{ margin: 0, fontWeight: 800, color: "#173b29" }}>
                                    {benefit.name}
                                  </p>
                                  <p style={{ margin: "0.25rem 0 0 0", color: "#5f7068" }}>
                                    {benefit.merchant ?? "Any merchant"} • Reset {benefit.resetDate}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className={styles.SecondaryButton}
                                  onClick={() => {
                                    setSelectedBenefitId(benefit.credit_card_type_id);
                                    setShowBenefitModal(true);
                                  }}
                                >
                                  Mark used
                                </button>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#476154" }}>
                                  {benefit.used.toFixed(0)}/{benefit.allotted.toFixed(0)} used
                                </div>
                                <div
                                  style={{
                                    width: "100%",
                                    height: "10px",
                                    borderRadius: "999px",
                                    overflow: "hidden",
                                    background: "#e2e8f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${progress}%`,
                                      height: "100%",
                                      borderRadius: "999px",
                                      background: "linear-gradient(90deg, #16a34a, #22c55e)",
                                    }}
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
                      <div className={styles.buttonRow}>
                        <button
                          className={styles.ModalButton}
                          type="button"
                          onClick={() => setShowEnrollPromoModal(true)}
                        >
                          Enroll in promotion
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "1rem" }}>
                        {promotions.map((promo) => {
                          const now = new Date();
                          const end = new Date(promo.expires);
                          const completed = promo.spentToDate >= promo.threshold;
                          const expired = end < now && !completed;
                          const pct = promo.threshold
                            ? Math.min((promo.spentToDate / promo.threshold) * 100, 100)
                            : 100;

                          return (
                            <div
                              key={promo.credit_card_type_id}
                              className={styles.CardRewardsBox}
                              style={{
                                borderColor: completed
                                  ? "#86efac"
                                  : expired
                                  ? "#fecaca"
                                  : undefined,
                                background: completed
                                  ? "#f0fdf4"
                                  : expired
                                  ? "#fef2f2"
                                  : undefined,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "1rem",
                                  marginBottom: "0.85rem",
                                }}
                              >
                                <div>
                                  <p style={{ margin: 0, fontWeight: 800, color: "#173b29" }}>
                                    {promo.title}
                                  </p>
                                  <p style={{ margin: "0.25rem 0 0 0", color: "#5f7068" }}>
                                    {promo.details}
                                  </p>
                                </div>
                                <div style={{ fontSize: "1.2rem" }}>
                                  {completed ? "✅" : expired ? "⚪" : "⏳"}
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.75rem 1rem",
                                  marginBottom: "0.85rem",
                                  color: "#476154",
                                  fontSize: "0.9rem",
                                }}
                              >
                                <span>
                                  {promo.spentToDate.toFixed(0)}/{promo.threshold.toFixed(0)} spent
                                </span>
                                <span>Ends {promo.expires}</span>
                                <span>Reward ${promo.reward.toFixed(2)}</span>
                              </div>

                              <div
                                style={{
                                  width: "100%",
                                  height: "10px",
                                  borderRadius: "999px",
                                  overflow: "hidden",
                                  background: "#e2e8f0",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: "100%",
                                    borderRadius: "999px",
                                    background: "linear-gradient(90deg, #16a34a, #22c55e)",
                                  }}
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
                      <div className={styles.CardDetailsActionRow}>
                        <button
                          className={styles.SecondaryButton}
                          type="button"
                          onClick={() => router.push(`/transactions?cardId=${cardId}`)}
                        >
                          View all
                        </button>
                        <button
                          className={styles.ModalButton}
                          type="button"
                          onClick={() => router.push(`/transactions/new?cardId=${cardId}`)}
                        >
                          + Log transaction
                        </button>
                      </div>

                      <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Merchant</th>
                              <th>Category</th>
                              <th style={{ textAlign: "right" }}>Amount</th>
                              <th style={{ textAlign: "right" }}>Rewards</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.slice(0, 10).map((tx) => (
                              <tr key={tx.credit_card_type_id}>
                                <td>{tx.date}</td>
                                <td>{tx.description}</td>
                                <td>{tx.category}</td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    color: tx.amount < 0 ? "#b42318" : "#1f4d3a",
                                    fontWeight: 700,
                                  }}
                                >
                                  {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                                </td>
                                <td style={{ textAlign: "right" }}>
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

          <aside className={styles.CardDetailsSidebar}>
            <section className={styles.Summary}>
              <h2 className={styles.SummaryTitle}>Card Snapshot</h2>
              <p>
                Track how this card performs over time, which perks you are actually using,
                and whether the annual fee is worth it.
              </p>
            </section>

            <section className={styles.Summary}>
              <h2 className={styles.SummaryTitle}>Quick Actions</h2>
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.ModalButton}
                  onClick={() => router.push(`/transactions/new?cardId=${cardId}`)}
                >
                  + Add Transaction
                </button>
                <button
                  type="button"
                  className={styles.ModalButton}
                  onClick={() => setShowEnrollPromoModal(true)}
                >
                  + Add Promotion
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showBenefitModal && selectedBenefit && (
        <div className={styles.ModalOverlay}>
          <div className={styles.Modal}>
            <h2 className={styles.ModalTitle}>Log Benefit Use For:</h2>
            <p className={styles.SummaryValue}>
              {selectedBenefit.name} ({selectedBenefit.merchant ?? "Any merchant"})
            </p>

            <form onSubmit={handleMarkBenefitUsed} className={styles.CardForm}>
              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Amount used</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount used"
                  value={benefitUseAmount}
                  onChange={(e) => setBenefitUseAmount(e.target.value)}
                  className={styles.ModalInput}
                />
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Merchant / notes</label>
                <input
                  placeholder="Merchant / notes (optional)"
                  value={benefitNote}
                  onChange={(e) => setBenefitNote(e.target.value)}
                  className={styles.ModalInput}
                />
              </div>

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowBenefitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEnrollPromoModal && (
        <div className={styles.ModalOverlay}>
          <div className={styles.Modal}>
            <h2 className={styles.ModalTitle}>Enroll in a promotion</h2>

            <form onSubmit={handleEnrollPromotion} className={styles.CardForm}>
              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Promotion name</label>
                <input
                  placeholder="Promotion name"
                  value={newPromoTitle}
                  onChange={(e) => setNewPromoTitle(e.target.value)}
                  className={styles.ModalInput}
                />
              </div>

              <div className={styles.CardExpirationRow}>
                <div className={styles.CardFieldGroup}>
                  <label className={styles.CardLabel}>Start date</label>
                  <input
                    type="date"
                    value={newPromoStart}
                    onChange={(e) => setNewPromoStart(e.target.value)}
                    className={styles.ModalInput}
                  />
                </div>

                <div className={styles.CardFieldGroup}>
                  <label className={styles.CardLabel}>End date</label>
                  <input
                    type="date"
                    value={newPromoEnd}
                    onChange={(e) => setNewPromoEnd(e.target.value)}
                    className={styles.ModalInput}
                  />
                </div>
              </div>

              <div className={styles.CardExpirationRow}>
                <div className={styles.CardFieldGroup}>
                  <label className={styles.CardLabel}>Spend threshold</label>
                  <input
                    type="number"
                    placeholder="Spend threshold"
                    value={newPromoThreshold}
                    onChange={(e) => setNewPromoThreshold(e.target.value)}
                    className={styles.ModalInput}
                  />
                </div>

                <div className={styles.CardFieldGroup}>
                  <label className={styles.CardLabel}>Reward amount</label>
                  <input
                    type="number"
                    placeholder="Reward amount"
                    value={newPromoReward}
                    onChange={(e) => setNewPromoReward(e.target.value)}
                    className={styles.ModalInput}
                  />
                </div>
              </div>

              <div className={styles.CardFieldGroup}>
                <label className={styles.CardLabel}>Spend to date</label>
                <input
                  type="number"
                  placeholder="Spend to date"
                  value={newPromoSpent}
                  onChange={(e) => setNewPromoSpent(e.target.value)}
                  className={styles.ModalInput}
                />
              </div>

              <div className={styles.ButtonRow}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEnrollPromoModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
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