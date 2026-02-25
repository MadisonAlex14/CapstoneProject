import React from 'react'
import './App.css'
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <div className='help-page'>
      <h1>Help & Support</h1>

      <p>
        Need assistance? We're here to help.
      </p>

      <div className="card">
        <p>📧 Email: support@creditmaxing.com</p>
        <p>📞 Phone: (555) 123-4567</p>
        <p>💬 Live Chat: Coming Soon</p>
      </div>
    </div>
  );
}
