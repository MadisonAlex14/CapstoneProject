'use client'

import { useEffect, useState } from 'react'
import styles from '../../styles/auth.module.css'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [spendingAlerts, setSpendingAlerts] = useState(true)
  const [monthlyReports, setMonthlyReports] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const savedEmailNotifications = localStorage.getItem('emailNotifications')
    const savedSpendingAlerts = localStorage.getItem('spendingAlerts')
    const savedMonthlyReports = localStorage.getItem('monthlyReports')
    const savedDarkMode = localStorage.getItem('darkMode')

    if (savedEmailNotifications !== null) {
      setEmailNotifications(savedEmailNotifications === 'true')
    }

    if (savedSpendingAlerts !== null) {
      setSpendingAlerts(savedSpendingAlerts === 'true')
    }

    if (savedMonthlyReports !== null) {
      setMonthlyReports(savedMonthlyReports === 'true')
    }

    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true')
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('emailNotifications', String(emailNotifications))
    localStorage.setItem('spendingAlerts', String(spendingAlerts))
    localStorage.setItem('monthlyReports', String(monthlyReports))
    localStorage.setItem('darkMode', String(darkMode))

    setSavedMessage('Your settings were saved successfully.')

    setTimeout(() => {
      setSavedMessage('')
    }, 2500)
  }

  return (
    <main className={styles['s-page']}>
      <section className={styles['s-container']}>

        <div className={styles.card}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.text}>
            Customize your account experience and notification preferences.
          </p>

          <h2 className={styles['s-cardTitle']}>Notifications</h2>

          <div className={styles['s-settingRow']}>
            <div>
              <p className={styles['s-settingTitle']}>Email Notifications</p>
              <p className={styles['s-settingText']}>
                Receive updates about account activity and important alerts.
              </p>
            </div>

            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className={styles['s-checkbox']}
            />
          </div>

          <div className={styles['s-settingRow']}>
            <div>
              <p className={styles['s-settingTitle']}>Spending Alerts</p>
              <p className={styles['s-settingText']}>
                Get notified when major purchases are detected.
              </p>
            </div>

            <input
              type="checkbox"
              checked={spendingAlerts}
              onChange={(e) => setSpendingAlerts(e.target.checked)}
              className={styles['s-checkbox']}
            />
          </div>

          <div className={styles['s-settingRow']}>
            <div>
              <p className={styles['s-settingTitle']}>Monthly Reports</p>
              <p className={styles['s-settingText']}>
                Receive a monthly summary of rewards and spending activity.
              </p>
            </div>

            <input
              type="checkbox"
              checked={monthlyReports}
              onChange={(e) => setMonthlyReports(e.target.checked)}
              className={styles['s-checkbox']}
            />
          </div>

          <div className={styles['s-settingRow']}>
            <div>
              <p className={styles['s-settingTitle']}>Dark Mode</p>
              <p className={styles['s-settingText']}>
                Save your visual preference for future versions of the app.
              </p>
            </div>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className={styles['s-checkbox']}
            />
          </div>

          <button className={styles['s-saveButton']} onClick={handleSave}>
            Save Settings
          </button>

          {savedMessage && (
            <p className={styles['s-successMessage']}>{savedMessage}</p>
          )}

        </div>

      </section>
    </main>
  )
}