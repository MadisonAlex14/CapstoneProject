import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NavBar from './NavBar'
import Home from './Home'
import Rewards from './Rewards'
import Transactions from './Transactions'
import Help from './Help'
import './App.css'

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  )
}

export default App
