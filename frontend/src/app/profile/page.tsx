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

  const [currentScore, setCurrentScore] = useState('')
  const [goalScore, setGoalScore] = useState('')

  const [profilePic, setProfilePic] = useState('')

  const menuRef = useRef<HTMLDivElement | null>(null)

  const presetAvatars = [
    '/ProfilePics/EdinaMode.jpg',
    '/ProfilePics/HomerRingCamera.jpg',
    '/ProfilePics/SmileDog.jpg'
  ]

  const [openSuggestion, setOpenSuggestion] = useState<number | null>(null)

  const toggleSuggestion = (index: number) => {
    setOpenSuggestion(openSuggestion === index ? null : index)
  }

  // LOAD DATA
  useEffect(() => {
    const savedFirstName = localStorage.getItem('firstName')
    const savedEmail = localStorage.getItem('userEmail')
    const savedMemberSince = localStorage.getItem('memberSince')
    const savedCurrentScore = localStorage.getItem('currentCreditScore')
    const savedGoalScore = localStorage.getItem('goalCreditScore')
    const savedProfilePic = localStorage.getItem('profilePic')

    if (savedFirstName) {
      setFirstName(savedFirstName)
      setEditFirstName(savedFirstName)
    }

    if (savedEmail) {
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

    if (savedCurrentScore) setCurrentScore(savedCurrentScore)
    if (savedGoalScore) setGoalScore(savedGoalScore)
    if (savedProfilePic) setProfilePic(savedProfilePic)
  }, [])

  const progress =
    currentScore && goalScore
      ? Math.min((Number(currentScore) / Number(goalScore)) * 100, 100)
      : 0

  const creditCategory =
    Number(currentScore) >= 740
      ? 'EXCELLENT'
      : Number(currentScore) >= 670
      ? 'GOOD'
      : Number(currentScore) >= 580
      ? 'FAIR'
      : 'POOR'

  const userInitial = firstName
    ? firstName.charAt(0).toUpperCase()
    : 'U'

  return (
    <main className={styles['p-page']}>
      <section className={styles['p-container']}>

        {/* HERO */}
        <div className={styles['p-heroCard']}>
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
              <div className={styles['p-avatarDropdown']}>

                <div className={styles['p-dropdownTitle']}>
                  Choose Avatar
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

          <div>
            <h1 className={styles['title']}>My Profile</h1>
            <p className={styles['p-subtitle']}>
              Manage your account details and view your CreditMaxxing profile.
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className={styles['p-grid']}>

          {/* PERSONAL INFO */}
          <div className={styles['card']}>

            <div className={styles['p-cardHeader']}>
              <h2 className={styles['p-cardTitle']}>
                Personal Information
              </h2>

              <button
                className={styles['p-menuButton']}
                onClick={() => setIsEditing(!isEditing)}
              >
                ⋮
              </button>
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
              <div className={styles['p-editActions']}>

                <button
                  className={styles['p-saveButton']}
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
                  className={styles['p-cancelButton']}
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

          {/* CREDIT SUGGESTIONS (MOVED HERE) */}
          <div className={styles['card']}>
            <h2 className={styles['p-cardTitle']}>
              Credit Suggestions 💡
            </h2>

            <div className={styles['p-suggestion']} onClick={() => toggleSuggestion(0)}>
              <div className={styles['p-suggestionTitle']}>
                💳 Keep utilization under 30%
              </div>
              {openSuggestion === 0 && (
                <div className={styles['p-suggestionDesc']}>
                  Helps maintain a strong credit profile by keeping usage low.
                </div>
              )}
            </div>

            <div className={styles['p-suggestion']} onClick={() => toggleSuggestion(1)}>
              <div className={styles['p-suggestionTitle']}>
                📅 Pay bills on time
              </div>
              {openSuggestion === 1 && (
                <div className={styles['p-suggestionDesc']}>
                  Payment history is the most important factor in your credit score.
                </div>
              )}
            </div>

            <div className={styles['p-suggestion']} onClick={() => toggleSuggestion(2)}>
              <div className={styles['p-suggestionTitle']}>
                📉 Limit hard inquiries
              </div>
              {openSuggestion === 2 && (
                <div className={styles['p-suggestionDesc']}>
                  Too many applications can temporarily lower your score.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* CREDIT OVERVIEW */}
        <div className={styles['creditOverview']}>

          <div className={styles['creditOverviewContent']}>

            <div className={styles['creditLeft']}>

              <div className={styles['creditGauge']}>
                <span>{currentScore || '—'}</span>
              </div>

              <div className={styles['creditScoreInfo']}>
                <div className={styles['creditScoreLabel']}>
                  Credit Score
                </div>

                <div className={styles['creditScoreBadge']}>
                  {creditCategory} • {Math.round(progress)}%
                </div>
              </div>

            </div>

            <div className={styles['creditStats']}>

              <div className={styles['statCard']}>
                <div className={styles['statValue']}>
                  {currentScore || '—'}
                </div>
                <div className={styles['statLabel']}>Current</div>
              </div>

              <div className={styles['statCard']}>
                <div className={styles['statValue']}>
                  {goalScore || '—'}
                </div>
                <div className={styles['statLabel']}>Goal</div>
              </div>

              <div className={styles['statCard']}>
                <div className={styles['statValue']}>
                  {Math.round(progress)}%
                </div>
                <div className={styles['statLabel']}>Progress</div>
              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  )
}