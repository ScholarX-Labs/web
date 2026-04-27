/**
 * ImpactSection Component
 * Displays impact statistics with animated counters
 */

import React, { memo } from "react";
import PropTypes from "prop-types";
import { StatCard } from "../shared";
import {
  IMPACT_SECTION,
  IMPACT_STATS,
  ANIMATION_TIMINGS,
} from "../../constants";
import styles from "./ImpactSection.module.css";

const ImpactSection = memo(function ImpactSection({ watermarkImage }) {
  return (
    <section className={styles.section}>
      {/* Watermark */}
      {watermarkImage && (
        <img
          src={watermarkImage}
          alt=""
          className={styles.watermark}
          aria-hidden="true"
        />
      )}

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {IMPACT_SECTION.title}{" "}
            <span className={styles.highlight}>{IMPACT_SECTION.highlight}</span>
          </h2>
          <p className={styles.description}>{IMPACT_SECTION.description}</p>
        </div>

        {/* Stats Grid */}
        <div className={styles.grid}>
          {IMPACT_STATS.map((stat, index) => (
            <StatCard
              key={stat.id}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              animationDuration={stat.animationDuration}
              delay={index * ANIMATION_TIMINGS.stagger}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

ImpactSection.propTypes = {
  watermarkImage: PropTypes.string,
};

export default ImpactSection;
