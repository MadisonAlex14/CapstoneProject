'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signup } from '@/lib/functions/signup'
import styles from '../../styles/auth.module.css'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await signup(email, password, firstName, lastName, birthdate)
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
              setFirstName('')
              setLastName('')
              setBirthdate('')
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
          <label className={styles.label} htmlFor="firstName">
            First Name
          </label>
          <input
            className={styles.input}
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="Enter your first name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="lastName">
            Last Name
          </label>
          <input
            className={styles.input}
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Enter your last name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="birthdate">
            Date of Birth
          </label>
          <input
            className={styles.input}
            id="birthdate"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />
        </div>

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
