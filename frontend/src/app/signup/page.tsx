'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../../styles/auth.module.css'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    )

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      console.log('Signed up', data)
      setSignupComplete(true)
    } else {
      setError(data.error || 'An error occurred during signup')
      console.error('Error', data.error)
    }
  }

  if (signupComplete) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.title}>Verify Your Email</h2>

          <p className={styles.text}>
            We&apos;ve sent a verification link to <strong>{email}</strong>
          </p>
          <p className={styles.text}>
            Please click the link in your email to verify your account. Once
            verified, you&apos;ll be able to access your dashboard.
          </p>

          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setSignupComplete(false)
              setEmail('')
              setPassword('')
            }}
          >
            Back to Signup
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.title}>Signup</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            className={styles.input}
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            className={styles.input}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </main>
  )
}
