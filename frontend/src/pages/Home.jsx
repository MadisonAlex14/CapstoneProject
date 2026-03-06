"use client";

import React from 'react'
import { motion } from "framer-motion";
import "../App.css";

/* -----------Section photos-------------- */
import HappyMoney from "../assets/HappyMoney.png";
import Saving from "../assets/Saving.png";
import CreditMaxxing from "../assets/1.png";

export default function Home() {
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 35, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="home-page">
      <motion.div
        className="home-sections"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.section className="home-section" variants={item}>
          <div className="home-section-imgWrap">
            <img
              className="home-section-img"
              src={HappyMoney.src ?? HappyMoney}
              alt="Happy Money"
            />
          </div>

          <div className="home-section-text">
            <h2 className="home-section-title">“Finances finally feel simple.”</h2>
            <p className="home-section-body">
              “Before CreditMaxxing, I tracked rewards and spending in three different places.
              Now everything is organized, I stay on budget, and I earn more rewards without
              thinking about it.”
            </p>
            <p className="home-section-subtle">— Verified Customer</p>
          </div>
        </motion.section>

        <motion.section className="home-section home-section-reverse" variants={item}>
          <div className="home-section-imgWrap">
            <img
              className="home-section-img"
              src={Saving.src ?? Saving}
              alt="Saving"
            />
          </div>

          <div className="home-section-text">
            <h2 className="home-section-title">Customer Reviews</h2>
            <ul className="home-review-list">
              <li>⭐⭐⭐⭐⭐ “My rewards actually add up now.”</li>
              <li>⭐⭐⭐⭐⭐ “The budgeting view helped me stop overspending.”</li>
              <li>⭐⭐⭐⭐⭐ “Clean, simple, and I understand my spending habits.”</li>
            </ul>
          </div>
        </motion.section>

        <motion.section className="home-section" variants={item}>
          <div className="home-section-imgWrap home-image-contrast">
            <img
              className="home-section-img home-logo-fix"
              src={CreditMaxxing.src ?? CreditMaxxing}
              alt="CreditMaxxing"
            />
          </div>

          <div className="home-section-text">
            <h2 className="home-section-title">Track Rewards, Benefits & Promotions</h2>
            <p className="home-section-body">
              CreditMaxxing helps you stay on top of everything you earn—without the clutter.
              See reward activity, benefits you can use, and promotions worth claiming.
            </p>

            <div className="home-feature-grid">
              <div className="home-feature-card">
                <h3>Rewards Tracking</h3>
                <p>Track points/cashback earned by card and category in one dashboard.</p>
              </div>

              <div className="home-feature-card">
                <h3>Benefits Reminder</h3>
                <p>Keep up with perks like travel credits, warranties, and statement credits.</p>
              </div>

              <div className="home-feature-card">
                <h3>Promotions Hub</h3>
                <p>Spot limited-time offers and bonus categories so you don’t miss out.</p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
