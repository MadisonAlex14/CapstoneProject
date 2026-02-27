"use client";

import Link from "next/link";
import "../App.css";
import logo from "../assets/creditmaxing.png";

export default function NavBar() {
  return (
    <header className="nav-bar">
      <div className="nav-left">
        <img
          src={logo.src ?? logo}
          alt="CreditMaxing logo"
          className="nav-logo"
        />

        <div className="nav-links-container">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/rewards" className="nav-link">Rewards</Link>
          <Link href="/transactions" className="nav-link">Transactions</Link>
          <Link href="/help" className="nav-link">Help</Link>
        </div>
      </div>

      {/* Right Side Auth Buttons */}
      <div className="nav-auth-buttons">
        <Link href="/signup" className="nav-button signup-btn">
          Sign Up
        </Link>

        <Link href="/login" className="nav-button login-btn">
          Log In
        </Link>
      </div>
    </header>
  );
}
