'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../../styles/auth.module.css'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      )

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        if (data.session?.access_token) {
          localStorage.setItem('accessToken', data.session.access_token)
        }

        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userEmail', email)

        if (data.user?.firstName) {
          localStorage.setItem('firstName', data.user.firstName)
        }

        if (!localStorage.getItem('memberSince')) {
          localStorage.setItem('memberSince', new Date().getFullYear().toString())
        }

        window.dispatchEvent(new Event('auth-changed'))
        router.push('/dashboard')
      } else {
        setError(data.error || 'An error occurred during login')
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
      setError('Unable to log in right now')
    }
  }

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.title}>Login</h2>

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
            placeholder="Enter your password"
          />
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
    </main>
  )
}
