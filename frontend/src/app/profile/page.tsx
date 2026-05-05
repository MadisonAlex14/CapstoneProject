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

  const [profilePic, setProfilePic] = useState('')

  const menuRef = useRef<HTMLDivElement | null>(null)

  const presetAvatars = [
    '/ProfilePics/EdinaMode.jpg',
    '/ProfilePics/HomerRingCamera.jpg',
    '/ProfilePics/SmileDog.jpg'
  ]

  // LOAD DATA
  useEffect(() => {
    const savedFirstName = localStorage.getItem('firstName')
    const savedEmail = localStorage.getItem('userEmail')
    const savedMemberSince = localStorage.getItem('memberSince')
    const savedProfilePic = localStorage.getItem('profilePic')

    if (savedFirstName !== null) {
      setFirstName(savedFirstName)
      setEditFirstName(savedFirstName)
    }

    if (savedEmail !== null) {
      setEmail(savedEmail)
      setEditEmail(savedEmail)
    }

    if (!savedMemberSince) {
      const year = new Date().getFullYear().toString()
      localStorage.setItem('memberSince', year)
      setMemberSince(year)
    } else {
      setMemberSince(savedMemberSince)
    }

    if (savedProfilePic) setProfilePic(savedProfilePic)
  }, [])

  const userInitial = firstName
    ? firstName.charAt(0).toUpperCase()
    : 'U'

  return (
    <main className={styles.Page}>
      <section className={styles.PageContainer}>

        <div className={styles.PageHero}>
          <div>
            <h1 className={styles.PageTitle}>My Profile</h1>
            <p className={styles.PageSubtitle}>
              Manage your account details and view your CreditMaxxing profile.
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className={styles['p-grid']}>

          {/* PROFILE PICTURE CARD */}
          <div className={styles['card']}>

            <div className={styles.Section}>
              <h2 className={styles.SectionTitle}>
                Profile Picture
              </h2>
            </div>

            <div className={styles['p-avatarWrap']} ref={menuRef}>

              <div
                className={styles['p-avatar']}
                onClick={() => setShowMenu(!showMenu)}
              >
                {profilePic ? (
                  <img src={profilePic} className={styles['p-avatarImg']} />
                ) : (
                  <span className={styles['p-avatarFallback']}>
                    {userInitial}
                  </span>
                )}
              </div>

              {showMenu && (
                <div className={styles['dropdown']}>

                  <div className={styles['dropdownTitle']}>
                    Choose Your Avatar
                  </div>

                  <div className={styles['p-avatarGrid']}>
                    {presetAvatars.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        className={styles['p-avatarOption']}
                        onClick={() => {
                          setProfilePic(img)
                          localStorage.setItem('profilePic', img)
                          setShowMenu(false)
                        }}
                      />
                    ))}
                  </div>

                  <label className={styles['p-uploadLabel']}>
                    + Upload your own
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const reader = new FileReader()
                        reader.onload = () => {
                          const result = reader.result as string
                          setProfilePic(result)
                          localStorage.setItem('profilePic', result)
                          setShowMenu(false)
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>

                </div>
              )}

            </div>

          </div>

          {/* PERSONAL INFO CARD */}
          <div className={styles['card']}>

            <div className={styles.section}>
              <h2 className={styles.SectionTitle}>
                Personal Information
                  <button
                     className={styles['p-menuButton']}
                     onClick={() => setIsEditing(!isEditing)}
                    >
                     ⋮
                    </button>
              </h2>
            </div>

            <div className={styles['p-infoGroup']}>
              <label>First Name</label>
              <input
                value={isEditing ? editFirstName : firstName}
                readOnly={!isEditing}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label>Email</label>
              <input
                value={isEditing ? editEmail : email}
                readOnly={!isEditing}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label>Member Since</label>
              <input value={memberSince} readOnly />
            </div>

            {isEditing && (
              <div className={styles.buttonRow}>

                <button
                  className={styles.saveBtn}
                  onClick={() => {
                    setFirstName(editFirstName)
                    setEmail(editEmail)

                    localStorage.setItem('firstName', editFirstName)
                    localStorage.setItem('userEmail', editEmail)

                    setIsEditing(false)
                  }}
                >
                  Save
                </button>

                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setEditFirstName(firstName)
                    setEditEmail(email)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </button>

              </div>
            )}

          </div>

        </div>

      </section>
    </main>
  )
}