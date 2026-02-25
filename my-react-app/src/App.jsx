import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NavBar from "./NavBar";
import Home from "./Home";
import Rewards from "./Rewards"; 
import Transactions from "./Transactions";
import Help from "./Help";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />

       <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
