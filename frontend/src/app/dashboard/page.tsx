"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelf } from "@/lib/functions/getSelf";
import styles from "../../styles/auth.module.css";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [goalScore, setGoalScore] = useState<number | null>(null);

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
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

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

        if (typeof window !== "undefined") {
          const savedCurrentScore = localStorage.getItem("currentCreditScore");
          const savedGoalScore = localStorage.getItem("goalCreditScore");

          setCurrentScore(savedCurrentScore ? Number(savedCurrentScore) : null);
          setGoalScore(savedGoalScore ? Number(savedGoalScore) : null);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    loadUserProfile();

    const handleStorageRefresh = () => {
      const savedCurrentScore = localStorage.getItem("currentCreditScore");
      const savedGoalScore = localStorage.getItem("goalCreditScore");

      setCurrentScore(savedCurrentScore ? Number(savedCurrentScore) : null);
      setGoalScore(savedGoalScore ? Number(savedGoalScore) : null);
    };

    window.addEventListener("focus", handleStorageRefresh);
    window.addEventListener("storage", handleStorageRefresh);

    return () => {
      window.removeEventListener("focus", handleStorageRefresh);
      window.removeEventListener("storage", handleStorageRefresh);
    };
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

  const scoreRange = useMemo(() => {
    if (currentScore === null) {
      return { label: "Not set", className: styles.dScoreNeutral };
    }
    if (currentScore < 580) {
      return { label: "Poor", className: styles.dScorePoor };
    }
    if (currentScore < 670) {
      return { label: "Fair", className: styles.dScoreFair };
    }
    if (currentScore < 740) {
      return { label: "Good", className: styles.dScoreGood };
    }
    if (currentScore < 800) {
      return { label: "Very Good", className: styles.dScoreVeryGood };
    }
    return { label: "Excellent", className: styles.dScoreExcellent };
  }, [currentScore]);

  const meterProgress = useMemo(() => {
    if (currentScore === null) return 0;
    const min = 300;
    const max = 850;
    return ((currentScore - min) / (max - min)) * 100;
  }, [currentScore]);

  const progressToGoal = useMemo(() => {
    if (currentScore === null || goalScore === null) return 0;
    const safeGoal = Math.max(goalScore, currentScore);
    const min = currentScore;
    const max = safeGoal;
    if (max === min) return 100;
    return ((currentScore - min) / (max - min || 1)) * 100;
  }, [currentScore, goalScore]);

  const pointsToGoal = useMemo(() => {
    if (currentScore === null || goalScore === null) return null;
    return Math.max(goalScore - currentScore, 0);
  }, [currentScore, goalScore]);

  const insightText = useMemo(() => {
    if (currentScore === null && goalScore === null) {
      return "Add your current and goal credit scores in your profile to unlock personalized dashboard insights.";
    }

    if (currentScore !== null && goalScore !== null) {
      if (currentScore >= goalScore) {
        return "Amazing work — you’ve reached your score goal. Keep building healthy habits to maintain it.";
      }

      if (goalScore - currentScore <= 20) {
        return "You’re very close to your goal. A few consistent moves could push you over the line.";
      }

      if (currentScore < 670) {
        return "You’re in building mode. Small steady improvements can make a big difference over time.";
      }

      if (currentScore < 740) {
        return "You already have a solid base. Staying consistent can move you into an even stronger range.";
      }

      return "You’re doing great. Now it’s about refining your habits and closing the gap to your target.";
    }

    return "Your dashboard is ready. Add both scores to track progress more clearly.";
  }, [currentScore, goalScore]);

  const nextSteps = useMemo(() => {
    if (currentScore === null && goalScore === null) {
      return [
        "Add your current credit score",
        "Set a goal score to track progress",
        "Visit your profile to save your score details",
      ];
    }

    if (currentScore !== null && goalScore === null) {
      return [
        "Set a goal score",
        "Check your profile and add your target",
        "Come back here to track your progress visually",
      ];
    }

    if (currentScore !== null && goalScore !== null && currentScore >= goalScore) {
      return [
        "Celebrate hitting your goal 🎉",
        "Keep your score stable with consistent habits",
        "Set a new stretch goal when you're ready",
      ];
    }

    return [
      "Keep updating your score regularly",
      "Watch your progress toward your target",
      "Use your dashboard insights to stay motivated",
    ];
  }, [currentScore, goalScore]);

  if (loading) {
    return (
      <div className={styles.dPage}>
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

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (meterProgress / 100) * circumference;

  return (
    <main className={styles.dPage}>
      <section className={styles.dContainer}>
        <div className={styles.dHeroCard}>
          <div>
            <p className={styles.dGreeting}>{timeGreeting}</p>
            <h1 className={styles.dTitle}>
              Welcome, {displayName}!
            </h1>
            <p className={styles.dSubtitle}>
              Here is your personalized dashboard. You can see your credit score, have some personalized insight, and recommended next steps to boost your credit!
            </p>
          </div>

          <div className={styles.dHeroGlow}></div>
        </div>

        <div className={styles.dQuickActions}>
          <button
            type="button"
            className={styles.dQuickActionCard}
            onClick={() => router.push("/profile")}
          >
            <span className={styles.dQuickActionEmoji}>✨</span>
            <span className={styles.dQuickActionText}>Update Score</span>
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
            onClick={() => router.push("/help")}
          >
            <span className={styles.dQuickActionEmoji}>💡</span>
            <span className={styles.dQuickActionText}>Get Tips</span>
          </button>

          <button
            type="button"
            className={styles.dQuickActionCard}
            onClick={() => router.push("/profile")}
          >
            <span className={styles.dQuickActionEmoji}>🎯</span>
            <span className={styles.dQuickActionText}>View Goals</span>
          </button>
        </div>

         
      </section>
    </main>
  );
}
