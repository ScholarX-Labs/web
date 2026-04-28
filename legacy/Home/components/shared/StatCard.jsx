/**
 * StatCard Component
 * Animated stat card with counting effect for impact metrics
 */

import React, { memo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { BsCalendar4Event } from "react-icons/bs";
import { GrGroup } from "react-icons/gr";
import { LuCircleDashed } from "react-icons/lu";
import styles from "./StatCard.module.css";

const ICON_COMPONENTS = {
  GrGroup,
  LuCircleDashed,
  BsCalendar4Event,
};

const StatCard = memo(function StatCard({
  icon,
  value,
  label,
  suffix = "",
  animationDuration = 2000,
  delay = 0,
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  const IconComponent = ICON_COMPONENTS[icon];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / animationDuration, 1);

      // Easing function for smooth counting
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, value, animationDuration, delay]);

  return (
    <div
      ref={cardRef}
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.iconValueWrapper}>
        {IconComponent && (
          <div className={styles.iconWrapper}>
            <IconComponent className={styles.icon} />
          </div>
        )}
        <span className={styles.value}>
          {count.toLocaleString()}
          {suffix}
        </span>
      </div>
      <h3 className={styles.label}>{label}</h3>
    </div>
  );
});

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  suffix: PropTypes.string,
  animationDuration: PropTypes.number,
  delay: PropTypes.number,
};

export default StatCard;
