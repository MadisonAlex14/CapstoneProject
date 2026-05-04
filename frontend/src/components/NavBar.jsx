"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "../App.css";
import logo from "../assets/creditmaxing.png";

export default function NavBar() {
  const router = useRouter();
  const profileRef = useRef(null);
  const dashboardRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("accessToken");
      const savedFirstName = localStorage.getItem("firstName");

      setIsLoggedIn(!!token);
      setFirstName(savedFirstName || "");
    };

    syncAuthState();

    const handleAuthChange = () => syncAuthState();

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (dashboardRef.current && !dashboardRef.current.contains(event.target)) {
        setShowDashboardDropdown(false);
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

    setIsLoggedIn(false);
    setFirstName("");
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
            {/* My Dashboard Dropdown */}
            <div className="NavDropdown" ref={dashboardRef}>
              <button
                className="NavDropdown-button"
                onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                type="button"
              >
                My Account ▼
              </button>
              {showDashboardDropdown && (
                <div className="NavDropdown-menu">
                  <Link
                    href="/dashboard"
                    className="NavDropdown-item"
                    onClick={() => setShowDashboardDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/promotions"
                    className="NavDropdown-item"
                    onClick={() => setShowDashboardDropdown(false)}
                  >
                    Promotions
                  </Link>
                  <Link
                    href="/benefits"
                    className="NavDropdown-item"
                    onClick={() => setShowDashboardDropdown(false)}
                  >
                    Benefits
                  </Link>
                  <Link
                    href="/rewards"
                    className="NavDropdown-item"
                    onClick={() => setShowDashboardDropdown(false)}
                  >
                    Rewards
                  </Link>
                </div>
              )}
            </div>

            {/* Other nav links */}
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
              <div className="profile-avatar">{userInitial}</div>
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