"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../styles/auth.module.css";
import { getCardTransactions } from "../../../lib/functions/getCardTransactions";
import { getUserCards } from "../../../lib/functions/getUserCards";

type CreditCard = {
  credit_card_id: string;
  credit_card_type_id: string;
  cardName: string;
  credit_card_type?: { name: string };
  nickname?: string;
  issuer_id: string;
  last4: string;
  rewardsType: string;
};

type TransactionData = {
  transaction_id: string;
  transaction_date: string;
  merchant_name: string;
  amount: number;
  rewards_earned: number;
  rewards_currency: string;
  mcc?: { description: string };
};

export default function CardDashboard() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const cardId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [card, setCard] = useState<CreditCard | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) {
      setError("Invalid card id");
      setLoading(false);
      return;
    }

    const loadCardAndTransactions = async () => {
      try {
        setLoading(true);
        
        // Get access token
        let token: string | null = localStorage.getItem("accessToken");
        if (!token) {
          const supabaseToken = localStorage.getItem("supabase.auth.token");
          if (supabaseToken) {
            const session = JSON.parse(supabaseToken);
            token = session?.currentSession?.access_token || session?.access_token || null;
          }
        }

        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Load card details
        const cardsData = await getUserCards(token);
        const cardArray = Array.isArray(cardsData) ? cardsData : [];
        const foundCard = cardArray.find(
          (c: any) =>
            String(c.credit_card_id) === cardId ||
            String(c.credit_card_type_id) === cardId
        );

        if (foundCard) {
          setCard(foundCard);
        } else {
          setError("Card not found");
        }

        // Load 5 most recent transactions for this card
        try {
          const txData = await getCardTransactions(token, cardId, 5);
          
          // Extract transactions from the response structure
          if (Array.isArray(txData) && txData.length > 0 && txData[0].transaction) {
            setTransactions(txData[0].transaction);
          } else if (Array.isArray(txData)) {
            setTransactions(txData);
          }
        } catch (txError) {
          console.warn("Failed to load transactions", txError);
          setTransactions([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading card data:", err);
        setError(err instanceof Error ? err.message : "Failed to load card");
        setLoading(false);
      }
    };

    loadCardAndTransactions();
  }, [cardId]);



  if (loading) {
    return (
      <main className={styles.Page}>
        <div className={styles.PageContainer}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.Page}>
        <div className={styles.PageContainer}>
          <p style={{ color: "red" }}>Error: {error}</p>
          <button onClick={() => router.push("/cards")}>Back to Cards</button>
        </div>
      </main>
    );
  }

  if (!card) {
    return (
      <main className={styles.Page}>
        <div className={styles.PageContainer}>
          <p>Card not found</p>
          <button onClick={() => router.push("/cards")}>Back to Cards</button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.Page}>
      <div className={styles.PageContainer}>
        <section className={styles.PageHero}>
          <h1 className={styles.PageTitle}>
            {card.credit_card_type?.name || card.cardName || "Card"}
          </h1>
          <p className={styles.PageSubtitle}>
            {card.nickname || card.credit_card_type?.name} • •••• {card.last4}
          </p>
        </section>

        <button
          className={styles.BackButton}
          type="button"
          onClick={() => router.push("/cards")}
        >
          ← Back to Cards
        </button>

        <section className={styles.CardDetailsSection}>
          <h2 className={styles.SummaryTitle}>Recent Transactions (Last 5)</h2>

          {transactions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666" }}>No transactions found</p>
          ) : (
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
                  {transactions.map((tx) => (
                    <tr key={tx.transaction_id}>
                      <td>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                      <td>{tx.merchant_name}</td>
                      <td>{tx.mcc?.description || "Other"}</td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "#b42318",
                          fontWeight: 700,
                        }}
                      >
                        -${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {tx.rewards_earned.toFixed(2)} {tx.rewards_currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}