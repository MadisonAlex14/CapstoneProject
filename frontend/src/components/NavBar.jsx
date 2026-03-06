"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "../App.css";
import logo from "../assets/creditmaxing.png";

export default function NavBar() {
  const router = useRouter();
  const dropdownRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("accessToken");
      const savedFirstName = localStorage.getItem("firstName");

      setIsLoggedIn(!!token);
      setFirstName(savedFirstName || "");
    };

    syncAuthState();

    const handleAuthChange = () => {
      syncAuthState();
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
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
    localStorage.removeItem("firstName");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setFirstName("");
    setShowDropdown(false);
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
              Home
            </Link>
            <Link href="/rewards" className="nav-link">
              Rewards
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
          <div className="profile-menu" ref={dropdownRef}>
            <button
              className="profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
              type="button"
            >
              <div className="profile-avatar">{userInitial}</div>
              <span className="profile-name">
                {firstName ? `Hi, ${firstName}` : "My Account"}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showDropdown && (
              <div className="profile-dropdown">
                <Link
                  href="/profile"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
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