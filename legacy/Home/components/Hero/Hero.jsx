/**
 * Hero Component
 * Landing section with CTA buttons and social proof
 */

import React, { memo } from "react";
import { Link } from "react-router-dom";
import { HERO_CONTENT, HERO_BUTTONS } from "../../constants";
import styles from "./Hero.module.css";

const Hero = memo(function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        {/* Text Content */}
        <div className={styles.textSection}>
          <h1 className={styles.mainTitle}>
            {HERO_CONTENT.title}
            <br />
            {HERO_CONTENT.subtitle}{" "}
            <span className={styles.highlight}>{HERO_CONTENT.highlight}</span>
          </h1>
          <p className={styles.description}>{HERO_CONTENT.description}</p>

          {/* CTA Buttons */}
          <div className={styles.buttonGroup}>
            {HERO_BUTTONS.map((button, index) => (
              <Link
                key={button.id}
                to={button.link}
                className={`${styles.buttonLink} ${
                  button.type === "primary"
                    ? styles.btnPrimary
                    : styles.btnSecondary
                }`}
                style={{ animationDelay: `${400 + index * 100}ms` }}
                role="button"
                tabIndex={0}
              >
                {button.text}
                <span className={styles.btnIcon}>{button.icon}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Image & Social Proof */}
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {/* Decorative Elements */}
            <div className={styles.floatingShape1}></div>
            <div className={styles.floatingShape2}></div>
            <div className={styles.floatingShape3}></div>

            {/* Social Proof Badge */}
            <div className={styles.socialProof}>
              <div className={styles.avatarGroup}>
                <div className={`${styles.avatar} ${styles.avatar1}`}></div>
                <div className={`${styles.avatar} ${styles.avatar2}`}></div>
                <div className={`${styles.avatar} ${styles.avatar3}`}></div>
                <div className={styles.avatarCount}>10k+</div>
              </div>
              <span className={styles.proofText}>
                Join {HERO_CONTENT.stats.count}+ {HERO_CONTENT.stats.text}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;
