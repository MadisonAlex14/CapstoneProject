"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "../App.css";
import logo from "../assets/creditmaxing.png";

export default function NavBar() {
  const router = useRouter();
  const profileRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [profilePic, setProfilePic] = useState("");

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("accessToken");
      const savedFirstName = localStorage.getItem("firstName");
      const savedProfilePic = localStorage.getItem("profilePic");

      setIsLoggedIn(!!token);
      setFirstName(savedFirstName || "");
      setProfilePic(savedProfilePic || "");
    };

    syncAuthState();

    const handleAuthChange = () => syncAuthState();

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("firstName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("memberSince");
    localStorage.removeItem("profilePic");

    setIsLoggedIn(false);
    setFirstName("");
    setProfilePic("");
    setShowProfileDropdown(false);

    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : "U";

  return (
    <header className="nav-bar">
      <div className="nav-left">
        <Link href="/">
          <img
            src={logo.src ?? logo}
            alt="CreditMaxing logo"
            className="nav-logo"
          />
        </Link>

        {isLoggedIn && (
          <div className="nav-links-container">
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link href="/promotions" className="nav-link">
              Promotions
            </Link>
            <Link href="/benefits" className="nav-link">
              Benefits
            </Link>
            <Link href="/rewards" className="nav-link">
              Rewards
            </Link>
            <Link href="/cards" className="nav-link">
              Cards
            </Link>

            <Link href="/transactions" className="nav-link">
              Transactions
            </Link>

            <Link href="/help" className="nav-link">
              Help
            </Link>
          </div>
        )}
      </div>

      <div className="nav-auth-buttons">
        {!isLoggedIn ? (
          <>
            <Link href="/signup" className="nav-button signup-btn">
              Sign Up
            </Link>
            <Link href="/login" className="nav-button login-btn">
              Log In
            </Link>
          </>
        ) : (
          <div className="profile-menu" ref={profileRef}>
            <button
              className="profile-button compact-profile-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              type="button"
            >
              <div className="profile-avatar">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  userInitial
                )}
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-user-name">
                  {firstName ? `Hi, ${firstName}` : "My Account"}
                </div>

                <Link
                  href="/profile"
                  className="dropdown-item"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="dropdown-item"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  Settings
                </Link>

                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}