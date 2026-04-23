/**
 * ServicesSection Component
 * Reusable section for displaying service cards (Why Choose & Who We Help)
 */

import React, { memo } from "react";
import PropTypes from "prop-types";
import { ServiceCard } from "../shared";
import { ANIMATION_TIMINGS } from "../../constants";
import styles from "./ServicesSection.module.css";

const ServicesSection = memo(function ServicesSection({
  title,
  highlight,
  description,
  services,
  theme = "light",
  watermarkImage,
}) {
  return (
    <section className={`${styles.section} ${styles[theme]}`}>
      {/* Watermark/Background Image */}
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
            {title} <span className={styles.highlight}>{highlight}</span>
          </h2>
          <p className={styles.description}>{description}</p>
        </div>

        {/* Services Grid */}
        <div className={styles.grid}>
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              icon={service.icon}
              title={service.title}
              description={service.description}
              color={service.color}
              delay={index * ANIMATION_TIMINGS.stagger}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

ServicesSection.propTypes = {
  title: PropTypes.string.isRequired,
  highlight: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  theme: PropTypes.oneOf(["light", "white"]),
  watermarkImage: PropTypes.string,
};

export default ServicesSection;
