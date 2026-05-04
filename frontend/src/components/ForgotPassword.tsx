'use client'

import { useState } from 'react'
import styles from '../styles/auth.module.css'

interface ForgotPasswordProps {
  isOpen: boolean
  onClose: () => void
}

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

export default function ForgotPassword({ isOpen, onClose }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)

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
        setAttempts(0)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 3000)
      } else {
        const userFriendlyError = getErrorMessage(data.error)
        setError(userFriendlyError)
        setAttempts(prev => prev + 1)
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
      setAttempts(prev => prev + 1)
    }
  }

  if (!isOpen) return null

  return (
    <div style={overlayStyles}>
      <div style={modalStyles}>
        <button
          onClick={onClose}
          style={closeButtonStyles}
          type="button"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className={styles.title}>Reset Password</h2>

        {success ? (
          <div style={successMessageStyles}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              ✓ Reset link sent!
            </p>
            <p>
              If an account exists with this email, you will receive a password reset link
              shortly. Please check your email (including spam folder).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.error}>
                <p style={{ margin: 0, marginBottom: '0.5rem' }}>{error}</p>
                {attempts >= 3 && (
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                    Having trouble? Try again or contact support if the issue persists.
                  </p>
                )}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reset-email">
                Email Address
              </label>
              <input
                className={styles.input}
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={cancelButtonStyles}
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '2rem',
  maxWidth: '400px',
  width: '90%',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
  position: 'relative',
}

const closeButtonStyles: React.CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  cursor: 'pointer',
  color: '#999',
  transition: 'color 0.2s ease',
}

const cancelButtonStyles: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem',
  borderRadius: '12px',
  border: '2px solid #dcdcdc',
  backgroundColor: 'transparent',
  color: '#666',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '0.5rem',
  transition: 'all 0.2s ease',
}

const successMessageStyles: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '12px',
  backgroundColor: '#e8f5e9',
  border: '1px solid #a5d6a7',
  color: '#1b5e20',
  textAlign: 'center',
}
