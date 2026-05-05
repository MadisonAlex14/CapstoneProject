"use client";

import React from "react";
import { motion } from "framer-motion";
import styles from "../styles/auth.module.css";

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
    <div className={styles.PageContainer}>
        <div className={styles.PageHero}>
          <h1 className={styles.PageTitle}>Welcome to CreditMaxxing!</h1>
            <p className={styles.PageSubtitle}>
              Track your spending, maximize rewards, and take control of your financial future in one simple dashboard.
           </p>
         </div>
         
      <motion.div
        className={styles.homeSections}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Section 1 */}
        <motion.section className={styles.Summary} variants={item}>
          <div className={styles.homeSectionImgWrap}>
            <img
              className={styles.homeSectionImg}
              src={HappyMoney.src ?? HappyMoney}
              alt="Happy Money"
            />
          </div>

          <div>
            <h2 className={styles.SummaryTitle}>
              “Finances finally feel simple.”
            </h2>

            <p className={styles.homeSectionBody}>
              “Before CreditMaxxing, I tracked rewards and spending in three different places.
              Now everything is organized, I stay on budget, and I earn more rewards without thinking about it.”
            </p>

            <p className={styles.homeSectionSubtle}>
              — Verified Customer
            </p>
          </div>
        </motion.section>







        {/* Customer Review Section */}
        <motion.section className={styles.Summary}
          variants={item}
        >
          <div className={styles.homeSectionImgWrap}>
            <img
              className={styles.homeSectionImg}
              src={Saving.src ?? Saving}
              alt="Saving"
            />
          </div>

          <div className={styles.homeSectionText}>
            <h2 className={styles.SummaryTitle}>Customer Reviews</h2>

            <ul className={styles.homeReviewList}>
              <li>⭐⭐⭐⭐⭐ “My rewards actually add up now.”</li>
              <li>⭐⭐⭐⭐⭐ “The budgeting view helped me stop overspending.”</li>
              <li>⭐⭐⭐⭐⭐ “Clean, simple, and I understand my spending habits.”</li>
            </ul>
          </div>
        </motion.section>







        {/* Creditmaxxing Section */}
        <motion.section className={styles.Summary} variants={item}>
          <div className={`${styles.homeSectionImgWrap} ${styles.homeImageContrast}`}>
            <img
              className={`${styles.homeSectionImg} ${styles.homeLogoFix}`}
              src={CreditMaxxing.src ?? CreditMaxxing}
              alt="CreditMaxxing"
            />
          </div>

          <div>
            <h2 className={styles.SummaryTitle}>
              Track Rewards, Benefits & Promotions
            </h2>
            <p className={styles.SummaryLabel}>
              CreditMaxxing helps you stay on top of everything you earn—without the clutter.
              See reward activity, benefits you can use, and promotions worth claiming.
            </p>
            <div className={styles.homeCardGrid}>
              <div className={styles.Card}>
                <h3 className={styles.CardHeader}>Rewards Tracking</h3>
                <p className={styles.CardDescription}>Track points/cashback earned by card and category in one dashboard.</p>
              </div>
              <div className={styles.Card}>
                <h3 className={styles.CardHeader}>Benefits Reminder</h3>
                <p className={styles.CardDescription}>Keep up with perks like travel credits, warranties, and statement credits.</p>
              </div>
              <div className={styles.Card}>
                <h3 className={styles.CardHeader}>Promotions Hub</h3>
                <p className={styles.CardDescription}>Spot limited-time offers and bonus categories so you don’t miss out.</p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}