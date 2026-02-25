import React from 'react'
import './App.css'
import { Link } from "react-router-dom";
import logo from "./assets/creditmaxing.png";

export default function NavBar() {
  return (
    <header className="nav-bar">
      <div className="nav-left">
        <img src={logo} alt="CreditMaxing logo" className="nav-logo" />
        <div className="nav-links-container">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/rewards" className="nav-link">Rewards</Link>
          <Link to="/transactions" className="nav-link">Transactions</Link>
          <Link to="/help" className="nav-link">Help</Link>
        </div>
      </div>

        <button className="nav-button" onClick={() => window.location.href = "http://localhost:3000/"}>
            Sign In</button>       
    </header>
  );
}
