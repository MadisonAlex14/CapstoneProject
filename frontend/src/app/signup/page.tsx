'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signup } from '@/lib/functions/signup'
import styles from './signup.module.css'

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
    try {
      const data = await signup(email, password)
      console.log('Signed up', data)
      setSignupComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
      console.error('Error', err)
    } finally {
      setLoading(false)
    }
  }

  if (signupComplete) {
    return (
      <div className={styles.verificationContainer}>
        <div className={styles.verificationCard}>
          <h2 className={styles.verificationTitle}>Verify Your Email</h2>
          <p className={styles.verificationMessage}>
            We've sent a verification link to <span className={styles.verificationHighlight}>{email}</span>
          </p>
          <p className={styles.verificationMessage}>
            Please click the link in your email to verify your account. Once verified, you'll be able to access your dashboard.
          </p>
          <button
            onClick={() => {
              setSignupComplete(false)
              setEmail('')
              setPassword('')
            }}
            className={styles.backButton}
          >
            Back to Signup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.signupContainer}>
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <h2 className={styles.signupTitle}>Sign Up</h2>
        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}
        <div className={styles.inputGroup}>
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
          />
        </div>
        <div className={styles.inputGroup}>
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
          />
        </div>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}