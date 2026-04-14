'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../styles/auth.module.css'

// Map error messages to user-friendly text
const getResetErrorMessage = (error: string): string => {
  if (!error) return 'An error occurred while resetting your password'
  
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('expired')) {
    return 'Your reset link has expired. Please request a new password reset link'
  }
  if (errorLower.includes('invalid')) {
    return 'Invalid or expired reset link. Please request a new one'
  }
  if (errorLower.includes('token')) {
    return 'Reset link is no longer valid. Please request a new password reset'
  }
  if (errorLower.includes('network') || errorLower.includes('timeout')) {
    return 'Network error. Please check your connection and try again'
  }
  if (errorLower.includes('server') || errorLower.includes('500')) {
    return 'Server error. Please try again later'
  }
  if (errorLower.includes('weak') || errorLower.includes('strong')) {
    return 'Password is not strong enough. Use at least 8 characters with mixed cases'
  }
  
  return error
}

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isValidLink, setIsValidLink] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Check if reset link is valid on mount
  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (!token || type !== 'recovery') {
      setIsValidLink(false)
      setError('Invalid or expired reset link. Please request a new password reset')
    }
  }, [searchParams])

  // Calculate password strength
  const calculateStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 15
    if (/[!@#$%^&*]/.test(password)) strength += 10
    return Math.min(strength, 100)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPass = e.target.value
    setNewPassword(newPass)
    setPasswordStrength(calculateStrength(newPass))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength (minimum 8 characters)
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'recovery') {
        setError('Invalid or expired reset link. Please request a new password reset')
        setLoading(false)
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      )

      const data = await res.json()
      setLoading(false)

      if (res.ok) {
        setSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        const userFriendlyError = getResetErrorMessage(data.error)
        setError(userFriendlyError)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
      
      // Check if it's a network error
      if (err instanceof TypeError) {
        setError('Connection error. Please check your internet connection and try again')
      } else {
        setError('Unable to reset password. Please try again later')
      }
    }
  }

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.title}>Reset Password</h2>

        {!isValidLink ? (
          <div style={invalidLinkStyles}>
            <p style={{ margin: 0, marginBottom: '1rem', fontWeight: '600' }}>
              ✗ Invalid Reset Link
            </p>
            <p style={{ margin: 0, marginBottom: '1rem' }}>
              Your password reset link has expired or is invalid. 
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={cancelButtonStyles}
            >
              Back to Login
            </button>
          </div>
        ) : success ? (
          <div style={successMessageStyles}>
            <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: '600' }}>
              ✓ Password Reset Successfully!
            </p>
            <p style={{ margin: 0 }}>
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className={styles.error}>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-password">
                New Password
              </label>
              <input
                className={styles.input}
                id="new-password"
                type="password"
                value={newPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Enter new password (min 8 characters)"
                disabled={loading}
              />
              {newPassword && (
                <div style={passwordStrengthContainerStyles}>
                  <div style={passwordStrengthBarStyles}>
                    <div 
                      style={{
                        ...passwordStrengthFillStyles,
                        width: `${passwordStrength}%`,
                        backgroundColor: 
                          passwordStrength < 40 ? '#d32f2f' : 
                          passwordStrength < 70 ? '#f57c00' : 
                          '#388e3c'
                      }}
                    />
                  </div>
                  <span style={passwordStrengthTextStyles}>
                    {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                className={styles.input}
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                disabled={loading}
              />
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <span style={matchCheckStyles}>✓ Passwords match</span>
              )}
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <span style={matchErrorStyles}>✗ Passwords don't match</span>
              )}
            </div>

            <button 
              className={styles.button} 
              type="submit" 
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/login')}
              style={cancelButtonStyles}
              disabled={loading}
            >
              Back to Login
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

const invalidLinkStyles: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '12px',
  backgroundColor: '#ffebee',
  border: '1px solid #ef9a9a',
  color: '#c62828',
  textAlign: 'center',
  lineHeight: '1.6',
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

const passwordStrengthContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '0.5rem',
  marginBottom: '1rem',
}

const passwordStrengthBarStyles: React.CSSProperties = {
  flex: 1,
  height: '6px',
  backgroundColor: '#e0e0e0',
  borderRadius: '3px',
  overflow: 'hidden',
}

const passwordStrengthFillStyles: React.CSSProperties = {
  height: '100%',
  transition: 'all 0.3s ease',
}

const passwordStrengthTextStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: '600',
  minWidth: '45px',
}

const matchCheckStyles: React.CSSProperties = {
  display: 'block',
  color: '#388e3c',
  fontSize: '0.85rem',
  fontWeight: '600',
  marginTop: '0.25rem',
}

const matchErrorStyles: React.CSSProperties = {
  display: 'block',
  color: '#d32f2f',
  fontSize: '0.85rem',
  fontWeight: '600',
  marginTop: '0.25rem',
}
