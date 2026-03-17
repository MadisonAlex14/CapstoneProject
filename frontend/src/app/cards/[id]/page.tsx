"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../styles/auth.module.css";

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

export default function CardDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [card, setCard] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCards = localStorage.getItem("userCards");

    if (!savedCards || !id) {
      setLoading(false);
      return;
    }

    try {
      const parsed: CreditCard[] = JSON.parse(savedCards);
      const foundCard = parsed.find(
        (item) => String(item.id) === String(id)
      );

      setCard(foundCard ?? null);
    } catch (error) {
      console.error("Failed to load card details:", error);
      setCard(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <main className={styles.CardDetailsPage}>Loading...</main>;
  }

  if (!card) {
    return (
      <main className={styles.CardDetailsPage}>
        <h1>Card not found</h1>
        <button onClick={() => router.push("/cards")}>Back to Cards</button>
      </main>
    );
  }

  return (
    <main className={styles.CardDetailsPage}>
            <button
              className={styles.CardBackButton}
             onClick={() => router.push("/cards")}
             >
             ← Back to Cards
             </button>

  <div className={styles.CardDetailsContainer}>

        <h1 className={styles.CardDetailsTitle}>{card.cardName}</h1>
        <p className={styles.CardDetailsIssuer}>{card.issuer}</p>

        <div className={styles.CardDetailsSection}>
          <h2>Card Info</h2>
          <p>{card.nameOnCard}</p>
          <p>•••• {card.last4}</p>
          <p>
            Expires: {card.expirationMonth}/{card.expirationYear.slice(-2)}
          </p>
          <p>Opened: {card.openDate}</p>
        </div>

        <div className={styles.CardDetailsSection}>
          <h2>Rewards Being Tracked</h2>
          {card.trackedRewards.length > 0 ? (
            <div className={styles.CardRewardTags}>
              {card.trackedRewards.map((reward) => (
                <span key={reward} className={styles.CardRewardTag}>
                  {reward}
                </span>
              ))}
            </div>
          ) : (
            <p>No tracked rewards yet.</p>
          )}
        </div>

        <div className={styles.CardDetailsSection}>
          <h2>Optional Details</h2>
          <p>Credit Limit: {card.creditLimit || "Not added"}</p>
          <p>Amount Used: {card.amountUsed || "Not added"}</p>
          <p>Notes: {card.notes || "No notes"}</p>
        </div>
      </div>
    </main>
  );
}