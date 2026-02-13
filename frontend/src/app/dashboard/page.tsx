"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (hasChecked.current) return;
      hasChecked.current = true;

      // Get the access token from URL params (email verification) or localStorage (login)
      const urlToken = searchParams.get("access_token");
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
      const accessToken = urlToken || storedToken;
      
      if (!accessToken) {
        // No token found, redirect to login
        router.push("/login");
        return;
      }

      try {
        // Call backend function to validate email status
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validate-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError("Failed to verify email status");
          setLoading(false);
          return;
        }

        if (data.emailVerified) {
          // Email is verified, store token and show dashboard
          localStorage.setItem("accessToken", accessToken);
          setEmail(data.email);
          setLoading(false);
        } else {
          // Email not verified yet
          setError("Please verify your email first");
          setLoading(false);
        }
      } catch (err) {
        setError("An error occurred");
        setLoading(false);
      }
    };

    checkEmailVerification();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-sm text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg text-gray-600">Welcome to the dashboard, {email}!</p>
    </div>
  );
}