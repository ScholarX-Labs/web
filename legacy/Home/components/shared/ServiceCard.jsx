/**
 * ServiceCard Component
 * Reusable card for displaying services with icon, title, and description
 */

import React, { memo } from "react";
import PropTypes from "prop-types";
import { TfiWorld } from "react-icons/tfi";
import { GrGroup } from "react-icons/gr";
import { PiBookOpenTextThin } from "react-icons/pi";
import { VscBriefcase } from "react-icons/vsc";
import { FiTarget } from "react-icons/fi";
import styles from "./ServiceCard.module.css";

const ICON_COMPONENTS = {
  TfiWorld,
  GrGroup,
  PiBookOpenTextThin,
  VscBriefcase,
  FiTarget,
};

const ServiceCard = memo(function ServiceCard({
  icon,
  title,
  description,
  color = "orange",
  delay = 0,
}) {
  const IconComponent = ICON_COMPONENTS[icon];

  return (
    <div className={styles.card} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.iconWrapper}>
        {IconComponent && <IconComponent className={styles.icon} />}
      </div>
      <div className={styles.content}>
        <h3 className={`${styles.title} ${styles[color]}`}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
});

ServiceCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.oneOf(["orange", "black"]),
  delay: PropTypes.number,
};

export default ServiceCard;
