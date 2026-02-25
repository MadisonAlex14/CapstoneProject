import React from 'react'
import './App.css'
import { Link } from "react-router-dom";

export default function Transactions() {
  return (
    <div className="transactions-page">
      <h1>Transactions</h1>

      <p>
        View and manage all of your recent credit card transactions here.
      </p>

      <div className="card">
        <p>• Amazon - $42.17</p>
        <p>• Starbucks - $6.89</p>
        <p>• Gas Station - $55.00</p>
      </div>
    </div>
  );
}
