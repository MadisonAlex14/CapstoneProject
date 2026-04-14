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

  const [editCurrentScore, setEditCurrentScore] = useState('')
  const [editGoalScore, setEditGoalScore] = useState('')

  const [showScoreMenu, setShowScoreMenu] = useState(false)

  const [profilePic, setProfilePic] = useState('')
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)

  const menuRef = useRef<HTMLDivElement | null>(null)
  const scoreMenuRef = useRef<HTMLDivElement | null>(null)
  const avatarMenuRef = useRef<HTMLDivElement | null>(null)

  const presetAvatars = [
    '/ProfilePics/EdinaMode.jpg',
    '/ProfilePics/HomerRingCamera.jpg',
    '/ProfilePics/SmileDog.jpg'
  ]

  // ---------------- LOAD ----------------
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

    if (savedMemberSince) {
      setMemberSince(savedMemberSince)
    } else {
      const year = new Date().getFullYear().toString()
      localStorage.setItem('memberSince', year)
      setMemberSince(year)
    }

    if (savedCurrentScore) {
      setCurrentScore(savedCurrentScore)
      setEditCurrentScore(savedCurrentScore)
    }

    if (savedGoalScore) {
      setGoalScore(savedGoalScore)
      setEditGoalScore(savedGoalScore)
    }

    if (savedProfilePic) {
      setProfilePic(savedProfilePic)
    }
  }, [])

  // ---------------- CLICK OUTSIDE ----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }

      if (
        scoreMenuRef.current &&
        !scoreMenuRef.current.contains(event.target as Node)
      ) {
        setShowScoreMenu(false)
      }

      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target as Node)
      ) {
        setShowAvatarMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ---------------- AVATAR ----------------
  const handleSelectAvatar = (src: string) => {
    setProfilePic(src)
    localStorage.setItem('profilePic', src)
    setShowAvatarMenu(false)
  }

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setProfilePic(result)
      localStorage.setItem('profilePic', result)
    }

    reader.readAsDataURL(file)
    setShowAvatarMenu(false)
  }

  // ---------------- PROFILE ----------------
  const handleSave = () => {
    setFirstName(editFirstName)
    setEmail(editEmail)

    localStorage.setItem('firstName', editFirstName)
    localStorage.setItem('userEmail', editEmail)

    setIsEditing(false)
  }

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

  // ---------------- SCORES ----------------
  const handleDeleteScores = () => {
    setCurrentScore('')
    setGoalScore('')
    setEditCurrentScore('')
    setEditGoalScore('')

    localStorage.removeItem('currentCreditScore')
    localStorage.removeItem('goalCreditScore')
  }

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : 'U'

  const progress =
    currentScore && goalScore
      ? Math.min((Number(currentScore) / Number(goalScore)) * 100, 100)
      : 0

  return (
    <main className={styles['p-page']}>
      <section className={styles['p-container']}>

        {/* HERO */}
        <div className={styles['p-heroCard']}>

          {/* AVATAR */}
          <div className={styles['p-avatarWrap']} ref={avatarMenuRef}>
            <div
              className={styles['p-avatar']}
              onClick={() => setShowAvatarMenu(prev => !prev)}
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  className={styles['p-avatarImg']}
                  alt="profile"
                />
              ) : (
                <span className={styles['p-avatarFallback']}>
                  {userInitial}
                </span>
              )}
            </div>

            {showAvatarMenu && (
              <div className={styles['p-avatarDropdown']}>
                <div className={styles['p-dropdownTitle']}>
                  Choose your Profile Picture
                </div>

                <div className={styles['p-avatarGrid']}>
                  {presetAvatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      className={styles['p-avatarOption']}
                      onClick={() => handleSelectAvatar(src)}
                      alt="preset avatar"
                    />
                  ))}
                </div>

                <label className={styles['p-uploadLabel']}>
                  + Upload Your Own
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleUploadAvatar}
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

              <div ref={menuRef}>
                <button
                  className={styles['p-menuButton']}
                  onClick={() => setShowMenu(!showMenu)}
                >
                  ⋮
                </button>

                {showMenu && (
                  <div className={styles['p-menuDropdown']}>
                    <button onClick={handleEditClick}>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['p-infoGroup']}>
              <label>First Name</label>
              <input
                value={isEditing ? editFirstName : firstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                readOnly={!isEditing}
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label>Email</label>
              <input
                value={isEditing ? editEmail : email}
                onChange={(e) => setEditEmail(e.target.value)}
                readOnly={!isEditing}
              />
            </div>

            <div className={styles['p-infoGroup']}>
              <label>Member Since</label>
              <input value={memberSince || ''} readOnly />
            </div>

            {isEditing && (
              <div className={styles['p-editActions']}>
                <button className={styles['p-saveButton']} onClick={handleSave}>
                  Save
                </button>
                <button className={styles['p-cancelButton']} onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* PROGRESS & INSIGHTS */}
          <div className={styles['card']}>
            <h2 className={styles['p-cardTitle']}>
              Progress & Insights
            </h2>

            <div className={styles['p-statBox']}>
              <span className={styles['p-statLabel']}>
                Progress to Goal
              </span>
              <span className={styles['p-statValue']}>
                {Math.round(progress)}%
              </span>
            </div>

            <div className={styles['p-scoreBox']}>
              <div className={styles['p-scoreLabel']}>Insight</div>
              <p className={styles['p-scoreEmpty']}>
                {progress > 60
                  ? "You're making strong progress 🚀"
                  : "Keep building consistency 💡"}
              </p>
            </div>
          </div>

          {/* CREDIT HEALTH OVERVIEW */}
          <div className={styles['card']}>
            <h2 className={styles['p-cardTitle']}>
              Credit Health Overview
            </h2>

            <div className={styles['p-scoreBox']}>
              <div className={styles['p-scoreLabel']}>
                Current Score
              </div>
              <div className={styles['p-scoreValue']}>
                {currentScore || "—"}
              </div>
            </div>

            <div className={styles['p-goalBadge']}>
              Goal: {goalScore || "Not set"}
            </div>
          </div>

        </div>

      </section>
    </main>
  )
}