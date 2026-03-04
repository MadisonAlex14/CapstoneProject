// frontend/src/app/dashboard/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateEmail } from "@/lib/functions/validateEmail";
import styles from "../../styles/auth.module.css";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const hasChecked = useRef(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (hasChecked.current) return;
      hasChecked.current = true;

      // Read access_token from URL (email verification redirect)
      const urlToken =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("access_token")
          : null;

      // Or from localStorage (existing login)
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      const accessToken = urlToken || storedToken;

      if (!accessToken) {
        router.push("/login");
        return;
      }

      try {
        const data = await validateEmail(accessToken);

        if (data.emailVerified) {
          localStorage.setItem("accessToken", accessToken);
          setEmail(data.email);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setLoading(false);
        } else {
          setError("Please verify your email first");
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    checkEmailVerification();
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${styles.pageBg} bg-gray-100 flex items-center justify-center`}>
        <div className={`bg-white/80 backdrop-blur p-6 rounded-xl ${styles.cardShadow}`}>
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${styles.pageBg} bg-gray-100 flex items-center justify-center px-4`}>
        <div
          className={`bg-white p-6 rounded-xl w-full max-w-sm text-center ${styles.cardShadow} ${styles.fadeIn}`}
        >
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

 // Sucess state
  return (
    <div className={`min-h-screen ${styles.pageBg} bg-gray-100 flex items-center justify-center px-4`}>
      <div className={`bg-white p-8 rounded-2xl w-full max-w-xl text-center ${styles.cardShadow} ${styles.fadeIn}`}>
        <h1 className="text-3xl font-extrabold mb-3 text-gray-900">Dashboard</h1>
        <p className="text-lg text-gray-700">
          Welcome to the dashboard, <span className="font-semibold">
            {firstName && lastName ? `${firstName} ${lastName}` : email}
          </span>!
        </p>
      </div>
    </div>
  );
}
