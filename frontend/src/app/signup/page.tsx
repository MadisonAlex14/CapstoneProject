'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signup } from '@/lib/functions/signup'
import styles from '../../styles/auth.module.css'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const calculateStrength = (pwd: string): number => {
    let strength = 0
    if (pwd.length >= 8) strength += 25
    if (pwd.length >= 12) strength += 25
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25
    if (/[0-9]/.test(pwd)) strength += 15
    if (/[!@#$%^&*]/.test(pwd)) strength += 10
    return Math.min(strength, 100)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPass = e.target.value
    setPassword(newPass)
    setPasswordStrength(calculateStrength(newPass))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const data = await signup(email, password, firstName, lastName, birthdate)
      console.log('Signed up', data)

      localStorage.setItem('firstName', firstName)
      localStorage.setItem('userEmail', email)
      localStorage.setItem('memberSince', new Date().getFullYear().toString())

      setSignupComplete(true)
      window.dispatchEvent(new Event('auth-changed'))
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
              setConfirmPassword('')
            }}
          >
            Back to Signup
          </button>

          <button
            type="button"
            className={styles.button}
            onClick={() => router.push('/login')}
            style={{ marginTop: '0.75rem' }}
          >
            Go to Login
          </button>
        </div>
      </main>
    )
  }

  const getRequirementStyle = (isMet: boolean) => ({
    color: isMet ? '#388e3c' : '#999',
    textDecoration: isMet ? 'line-through' : 'none',
    fontSize: '0.85rem',
    marginBottom: '0.25rem',
  })

  const passwordStrengthContainerStyles: React.CSSProperties = {
    marginTop: '0.5rem',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
    transition: 'width 0.3s ease, background-color 0.3s ease',
  }

  const passwordStrengthTextStyles: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: '600',
    minWidth: '50px',
  }

  const passwordRequirementsStyles: React.CSSProperties = {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  }

  const requirementsTitleStyles: React.CSSProperties = {
    margin: '0 0 0.5rem 0',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#333',
  }

  const requirementsListStyles: React.CSSProperties = {
    margin: 0,
    paddingLeft: '1.25rem',
    listStyle: 'disc',
  }

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={`${styles.card} modular-form`}>
        <h2 className={styles.title}>Create Account</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className="form-field">
          <label htmlFor="firstName">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="Enter your first name"
          />
        </div>

        <div className="form-field">
          <label htmlFor="lastName">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Enter your last name"
          />
        </div>

        <div className="form-field">
          <label htmlFor="birthdate">
            Date of Birth
          </label>
          <input
            id="birthdate"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            placeholder="Create a password"
          />
          {password && (
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
          <div style={passwordRequirementsStyles}>
            <p style={requirementsTitleStyles}>Password Requirements:</p>
            <ul style={requirementsListStyles}>
              <li style={getRequirementStyle(password.length >= 8)}>At least 8 characters</li>
              <li style={getRequirementStyle(/[a-z]/.test(password) && /[A-Z]/.test(password))}>Mix of uppercase and lowercase letters</li>
              <li style={getRequirementStyle(/[0-9]/.test(password))}>At least one number</li>
              <li style={getRequirementStyle(/[!@#$%^&*]/.test(password))}>At least one special character (!@#$%^&*)</li>
            </ul>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="confirm-password">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />
          {confirmPassword && password !== confirmPassword && (
            <p style={{ color: '#d32f2f', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
              Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p style={{ color: '#388e3c', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
              ✓ Passwords match
            </p>
          )}
        </div>

        <button className={styles.button} type="submit" disabled={loading || password !== confirmPassword || password.length < 8}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </main>
  )
}