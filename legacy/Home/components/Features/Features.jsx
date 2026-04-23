/**
 * Features Component
 * Welcome section showcasing ScholarX's value proposition
 */

import React, { memo } from "react";
import { Link } from "react-router-dom";
import { FEATURES_CONTENT, FEATURES_LIST } from "../../constants";
import styles from "./Features.module.css";

const Features = memo(function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.content}>
        {/* Text Content */}
        <div className={styles.textSection}>
          <h2 className={styles.title}>
            {FEATURES_CONTENT.title}{" "}
            <span className={styles.highlight}>
              {FEATURES_CONTENT.highlight}
            </span>
          </h2>
          <p className={styles.description}>{FEATURES_CONTENT.description}</p>

          <ul className={styles.featureList}>
            {FEATURES_LIST.map((item, index) => (
              <li
                key={item.id}
                className={styles.featureItem}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className={styles.checkIcon}>{item.icon}</span>
                <span className={styles.featureText}>{item.text}</span>
              </li>
            ))}
          </ul>

          <Link to={FEATURES_CONTENT.cta.link} className={styles.ctaLink}>
            <button className={styles.ctaButton}>
              {FEATURES_CONTENT.cta.text}
              <span className={styles.ctaIcon}>
                {FEATURES_CONTENT.cta.icon}
              </span>
            </button>
          </Link>
        </div>

        {/* Image Section */}
        <div className={styles.imageSection}>
          <div className={styles.imageFrame}>
            <img
              src={FEATURES_CONTENT.image}
              alt={FEATURES_CONTENT.imageAlt}
              className={styles.image}
            />
            <div className={styles.decorCircle1}></div>
            <div className={styles.decorCircle2}></div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Features;
