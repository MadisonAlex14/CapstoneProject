import React from 'react'
import './App.css'
import logo from "./assets/creditmaxing.png";
import oneImage from "./assets/1.png";



export default function Home() {
  return (
    <div className="home-page">

      <div className="site-name">CreditMaxing</div>
      <div className="dottedLine">
        ---------------------------------------------------------
      </div>

      <div className="site-tagline">
        Maximize your rewards. Manage your budget.
      </div>

      <img 
        src={oneImage} 
        alt="CreditMaxing illustration" 
        className="home-logo"
      />



      <h1 className="home-heading">Welcome to Team 4</h1>
    </div>

  );
}
