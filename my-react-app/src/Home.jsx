import React from 'react'
import Logo from './assets/1.png'   // Your main Home page logo
import './App.css'

export default function Home() {
  return (
    <div className="page home-container">
      <div className="site-name">CreditMaxxing</div>
      <p classname="p">------------------------------------------------------------</p>
      <div className="site-tagline">Maximize your rewards. Manage your budget.</div>

      <img src={Logo} alt="Team 4 Logo" className="home-logo" />

      <h1 className="home-heading">Welcome to Team 4</h1>
      <p className="home-subheading">Your dashboard overview</p>
    </div>
  )
}
