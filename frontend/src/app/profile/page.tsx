'use client'

import { useEffect, useState } from 'react'
import styles from '../../styles/auth.module.css'

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [memberSince] = useState('2026')

  useEffect(() => {
    const savedFirstName = localStorage.getItem('firstName')
    const savedEmail = localStorage.getItem('userEmail')

    if (savedFirstName) setFirstName(savedFirstName)
    if (savedEmail) setEmail(savedEmail)
  }, [])

  return (
    <main className={styles['p-page']}>
      <section className={styles['p-container']}>
        <div className={styles['p-heroCard']}>
          <div className={styles['p-avatar']}>
            {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <h1 className={styles.title}>My Profile</h1>
            <p className={styles['p-subtitle']}>
              Manage your account details and view your CreditMaxxing profile.
            </p>
          </div>
        </div>

        <div className={styles['p-grid']}>
          <div className={styles.card}>
            <h2 className={styles['p-cardTitle']}>Personal Information</h2>

            <div className={styles['p-infoGroup']}>
              <label className={styles.label}>First Name</label>
              <input
                className={styles.input}
                type="text"
                value={firstName}
                readOnly
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label className={styles.label}>Email Address</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                readOnly
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label className={styles.label}>Member Since</label>
              <input
                className={styles.input}
                type="text"
                value={memberSince}
                readOnly
              />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles['p-cardTitle']}>Account Snapshot</h2>

            <div className={styles['p-statBox']}>
              <span className={styles['p-statLabel']}>Profile Status</span>
              <span className={styles['p-statValue']}>Active</span>
            </div>

            <div className={styles['p-statBox']}>
              <span className={styles['p-statLabel']}>Security</span>
              <span className={styles['p-statValue']}>Protected</span>
            </div>

            <div className={styles['p-statBox']}>
              <span className={styles['p-statLabel']}>Plan</span>
              <span className={styles['p-statValue']}>Standard</span>
            </div>

            <p className={styles['p-helperText']}>
              Later, this page can show connected cards, reward preferences,
              and account activity.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}