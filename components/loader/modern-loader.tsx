import React from "react";
import styles from "./modern-loader.module.css";

export const ModernLoader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles[`spinnerDiv${i + 1}`]}/>
        ))}
      </div>
    </div>
  );
};
