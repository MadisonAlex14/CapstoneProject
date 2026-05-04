'use client'

import { useState } from 'react'
import styles from '../../styles/auth.module.css'

// Map error messages to user-friendly text
const getErrorMessage = (error: string): string => {
  if (!error) return 'An error occurred while processing your request'
  
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('email') && errorLower.includes('invalid')) {
    return 'Please enter a valid email address'
  }
  if (errorLower.includes('invalid')) {
    return 'Invalid request. Please check your email and try again'
  }
  if (errorLower.includes('network') || errorLower.includes('timeout')) {
    return 'Network error. Please check your connection and try again'
  }
  if (errorLower.includes('too many') || errorLower.includes('rate')) {
    return 'Too many attempts. Please wait a few minutes before trying again'
  }
  if (errorLower.includes('not found')) {
    return 'No account found with this email address'
  }
  if (errorLower.includes('server') || errorLower.includes('500')) {
    return 'Server error. Please try again later'
  }
  if (errorLower.includes('configuration') || errorLower.includes('email')) {
    return 'Email service is temporarily unavailable. Please try again later'
  }
  if (errorLower.includes('unexpected')) {
    return 'An unexpected error occurred. Please try again'
  }
  
  return error
}

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      setLoading(false)
      setError('Please enter a valid email address')
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      )

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        setSuccess(true)
        setEmail('')
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      } else {
        const userFriendlyError = getErrorMessage(data.error)
        setError(userFriendlyError)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
      
      // Check if it's a network error
      if (err instanceof TypeError) {
        setError('Connection error. Please check your internet connection and try again')
      } else {
        setError('Unable to process request. Please try again later')
      }
    }
  }

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={`${styles.card} modular-form`}>
        <h2 className={styles.title}>Settings</h2>
        <h3 className={styles.subtitle}>Forgot Password</h3>
        <p className={styles.text}>
          Enter your email address to receive a password reset link.
        </p>

        {error && (
          <div className={styles.error}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {success ? (
          <div style={successMessageStyles}>
            <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: '600' }}>
              ✓ Password Reset Email Sent!
            </p>
            <p style={{ margin: 0 }}>
              Check your email for instructions to reset your password.
            </p>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            <button 
              className={styles.button} 
              type="submit" 
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </>
        )}
      </form>
    </main>
  )
}

const successMessageStyles: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '12px',
  backgroundColor: '#e8f5e9',
  border: '1px solid #a5d6a7',
  color: '#1b5e20',
  textAlign: 'center',
  lineHeight: '1.6',
}