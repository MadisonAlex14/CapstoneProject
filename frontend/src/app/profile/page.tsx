'use client'

import { useEffect, useRef, useState } from 'react'
import styles from '../../styles/auth.module.css'

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [memberSince, setMemberSince] = useState('')

  const [editFirstName, setEditFirstName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const savedFirstName = localStorage.getItem('firstName')
    const savedEmail = localStorage.getItem('userEmail')
    const savedMemberSince = localStorage.getItem('memberSince')

    if (savedFirstName) {
      setFirstName(savedFirstName)
      setEditFirstName(savedFirstName)
    }

    if (savedEmail) {
      setEmail(savedEmail)
      setEditEmail(savedEmail)
    }

    if (savedMemberSince) {
      setMemberSince(savedMemberSince)
    } else {
      const year = new Date().getFullYear().toString()
      localStorage.setItem('memberSince', year)
      setMemberSince(year)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleEditClick = () => {
    setEditFirstName(firstName)
    setEditEmail(email)
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleCancel = () => {
    setEditFirstName(firstName)
    setEditEmail(email)
    setIsEditing(false)
  }

  const handleSave = () => {
    setFirstName(editFirstName)
    setEmail(editEmail)

    localStorage.setItem('firstName', editFirstName)
    localStorage.setItem('userEmail', editEmail)

    window.dispatchEvent(new Event('auth-changed'))
    setIsEditing(false)
  }

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : 'U'

  return (
    <main className={styles['p-page']}>
      <section className={styles['p-container']}>
        <div className={styles['p-heroCard']}>
          <div className={styles['p-avatar']}>{userInitial}</div>

          <div>
            <h1 className={styles.title}>My Profile</h1>
            <p className={styles['p-subtitle']}>
              Manage your account details and view your CreditMaxxing profile.
            </p>
          </div>
        </div>

        <div className={styles['p-grid']}>
          <div className={styles.card}>
            <div className={styles['p-cardHeader']}>
              <h2 className={styles['p-cardTitle']}>Personal Information</h2>

              <div className={styles['p-menuWrap']} ref={menuRef}>
                <button
                  type="button"
                  className={styles['p-menuButton']}
                  onClick={() => setShowMenu(!showMenu)}
                >
                  ⋮
                </button>

                {showMenu && !isEditing && (
                  <div className={styles['p-menuDropdown']}>
                    <button
                      type="button"
                      className={styles['p-menuItem']}
                      onClick={handleEditClick}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['p-infoGroup']}>
              <label className={styles.label}>First Name</label>
              <input
                className={styles.input}
                type="text"
                value={isEditing ? editFirstName : firstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                readOnly={!isEditing}
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label className={styles.label}>Email Address</label>
              <input
                className={styles.input}
                type="email"
                value={isEditing ? editEmail : email}
                onChange={(e) => setEditEmail(e.target.value)}
                readOnly={!isEditing}
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label className={styles.label}>Member Since</label>
              <input
                className={styles.input}
                type="text"
                value={memberSince || ''}
                readOnly
              />
            </div>

            {isEditing && (
              <div className={styles['p-editActions']}>
                <button
                  type="button"
                  className={styles['p-saveButton']}
                  onClick={handleSave}
                >
                  Save
                </button>

                <button
                  type="button"
                  className={styles['p-cancelButton']}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            )}
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