"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelf } from "@/lib/functions/getSelf";
import styles from "../../styles/auth.module.css";
import { getUserCards } from "@/lib/functions/getUserCards";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const hasChecked = useRef(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (hasChecked.current) return;
      hasChecked.current = true;

      const urlToken =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("access_token")
          : null;

      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const accessToken = urlToken || storedToken;

      if (!accessToken) {
        router.push("/login");
        return;
      }

      try {
        const profileData = await getSelf(accessToken);

        localStorage.setItem("accessToken", accessToken);
        setEmail(profileData.email);
        setFirstName(profileData.firstName || "");
        setLastName(profileData.lastName || "");     




        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [router]);

  const displayName = useMemo(() => {
    if (firstName) return firstName;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return email || "there";
  }, [firstName, lastName, email]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning ☀️";
    if (hour < 18) return "Good afternoon ✨";
    return "Good evening 🌙";
  }, []);


  const [summary, setSummary] = useState({
    totalCards: 0,
    rewardsYTD: 0,
    benefitsRemaining: 0,
    netValue: 0,
  });










/* MAIN content area*/
  if (loading) {
    return (
      <div className={styles.PageContainer}>
        <div className={styles.dLoadingCard}>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dPage}>
        <div className={styles.dErrorCard}>
          <p className={styles.dErrorText}>{error}</p>
          <button
            onClick={() => router.push("/login")}
            className={styles.dPrimaryButton}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <section className={styles.PageContainer}>
 
        <div className={styles.dHeroCard}>
          <div>
            <p className={styles.dGreeting}>{timeGreeting}</p>
            <h1 className={styles.dTitle}>Welcome, {displayName}!</h1>
            <p className={styles.dSubtitle}>
              Here is your personalized dashboard!
            </p>
          </div>

          <div className={styles.dHeroGlow}></div>
        </div>

        {/* QUICK ACTIONS */}
        <div className={styles.SummaryTitle} style={{ marginBottom: "20px"}}>
          Quick Actions
        </div>
        <div className={styles.dQuickActions}>
          <button
            type="button"
            className={styles.dQuickActionCard}
            onClick={() => router.push("/")}
          >
            <span className={styles.dQuickActionEmoji}>🏠</span>
            <span className={styles.dQuickActionText}>Home Page</span>
          </button>

          <button
            type="button"
            className={styles.dQuickActionCard}
            onClick={() => router.push("/cards")}
          >
            <span className={styles.dQuickActionEmoji}>💳</span>
            <span className={styles.dQuickActionText}>View Cards</span>
          </button>

          <button
            type="button"
            className={styles.dQuickActionCard}
            onClick={() => router.push("/profile")}
          >
            <span className={styles.dQuickActionEmoji}>🪪</span>
            <span className={styles.dQuickActionText}>View Profile</span>
          </button>

          <button
            type="button"
            className={styles.dQuickActionCard}
            onClick={() => router.push("/help")}
          >
            <span className={styles.dQuickActionEmoji}>💡</span>
            <span className={styles.dQuickActionText}>Get Help</span>
          </button>

        </div>



         {/* TOP SUMMARY BAR */}
        <section className={styles.Summary}>
          <div className={styles.SummaryCards}>

            <div className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>Total Cards</p>
              <p className={styles.SummaryValue}>{summary.totalCards}</p>
            </div>

            <div className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>Total Rewards Earned (YTD)</p>
              <p className={styles.SummaryValue}>
                ${summary.rewardsYTD.toFixed(2)}
              </p>
            </div>

            <div className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>
                Total Benefit Value Remaining
              </p>
              <p className={styles.SummaryValue}>
                ${summary.benefitsRemaining.toFixed(2)}
              </p>
            </div>

            <div className={styles.SummaryCard}>
              <p className={styles.SummaryLabel}>Net Value (YTD)</p>
              <p className={styles.SummaryValue}>
                ${summary.netValue.toFixed(2)}
              </p>
            </div>

          </div>
        </section>



      </section>
    </main>
  );
}