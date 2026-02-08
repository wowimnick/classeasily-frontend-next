"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import styles from "./HowItWorks.module.css";

const HowItWorks = () => {
  const [selectedButton, setSelectedButton] = useState("forExplorers");

  const getStepTitle = (stepNumber) => {
    if (selectedButton === "forHosts") {
      switch (stepNumber) {
        case 1:
          return "Share your passion";
        case 2:
          return "Fill your spots";
        case 3:
          return "Get paid to host";
        default:
          return "";
      }
    } else {
      switch (stepNumber) {
        case 1:
          return "Find your thing";
        case 2:
          return "Grab a spot";
        case 3:
          return "Have a blast";
        default:
          return "";
      }
    }
  };

  const getStepDescription = (stepNumber) => {
    if (selectedButton === "forHosts") {
      switch (stepNumber) {
        case 1:
          return "Create a listing for your class or experience with detailed information about what you're offering.";
        case 2:
          return "You will recieve a notification instantly when a student books your class. You can also communicate with them directly for any clarifications.";
        case 3:
          return "Conduct your session as scheduled. Once completed, receive payment directly to your bank account.";
        default:
          return "";
      }
    } else {
      switch (stepNumber) {
        case 1:
          return "Search for fun nearby experiences and classes, read reviews, and find the best match for you.";
        case 2:
          return "Once you've found what you like, book your spot by selecting a date and time that works for you, and you're good to go.";
        case 3:
          return "You will receive the precise address, entry instructions, and everything you need for your booking.";
        default:
          return "";
      }
    }
  };

  const getStepIcon = (step) => {
    // Note: lord-icon is a custom element.
    // We add suppressHydrationWarning to avoid React complaining about custom attributes.
    if (selectedButton === "forHosts") {
      switch (step) {
        case 1:
          return (
            <lord-icon
              src="https://cdn.lordicon.com/yraqammt.json"
              trigger="in"
              state="in-newspaper"
              colors="primary:#fff"
              style={{ width: "40px", height: "40px" }}
            ></lord-icon>
          );
        case 2:
          return (
            <lord-icon
              src="https://cdn.lordicon.com/mudwpdhy.json"
              trigger="in"
              state="in-build"
              colors="primary:#fff"
              style={{ width: "40px", height: "40px" }}
            ></lord-icon>
          );
        case 3:
          return (
            <lord-icon
              src="https://cdn.lordicon.com/yycecovd.json"
              trigger="in"
              state="in-wallet"
              colors="primary:#fff"
              style={{ width: "40px", height: "40px" }}
            ></lord-icon>
          );
        default:
          return <Search />;
      }
    } else {
      switch (step) {
        case 1:
          return (
            <lord-icon
              src="https://cdn.lordicon.com/xaekjsls.json"
              trigger="in"
              state="in-reveal"
              colors="primary:#fff"
              style={{ width: "40px", height: "40px" }}
            ></lord-icon>
          );
        case 2:
          return (
            <lord-icon
              src="https://cdn.lordicon.com/uoljexdg.json"
              trigger="in"
              state="in-calendar"
              colors="primary:#fff"
              style={{ width: "40px", height: "40px" }}
            ></lord-icon>
          );
        case 3:
          return (
            <lord-icon
              src="https://cdn.lordicon.com/namwvlmv.json"
              trigger="in"
              state="in-celebration"
              colors="primary:#fff"
              style={{ width: "40px", height: "40px" }}
            ></lord-icon>
          );
        default:
          return <Search />;
      }
    }
  };

  return (
    <section className={styles.section} aria-labelledby="how-it-works-title">
      <div className={`${styles.pattern} ${styles.patternTop}`} />
      <div className={`${styles.pattern} ${styles.patternBottom}`} />

      <div className={styles.container}>
        <div className={styles.firstElement}>
          <h1 className={styles.h1} id="how-it-works-title">
            How does ClassEasily work?
          </h1>
          <div className={styles.buttonWrapper}>
            <button
              onClick={() => setSelectedButton("forExplorers")}
              className={`${styles.toggleButton} ${selectedButton === "forExplorers" ? styles.active : ""}`}
              aria-pressed={selectedButton === "forExplorers"}
            >
              for Adventurers
            </button>
            <button
              onClick={() => setSelectedButton("forHosts")}
              className={`${styles.toggleButton} ${selectedButton === "forHosts" ? styles.active : ""}`}
              aria-pressed={selectedButton === "forHosts"}
            >
              for Hosts
            </button>
          </div>
        </div>

        <div className={styles.secondElement}>
          <div className={styles.stepsGrid} role="list">
            {[1, 2, 3].map((step, index) => (
              <div
                key={`${selectedButton}-${step}`}
                className={styles.stepCard}
                role="listitem"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.stepNumber}>{step}</div>
                <div className={styles.iconWrapper} suppressHydrationWarning>
                  {getStepIcon(step)}
                </div>
                <div className={styles.stepContent}>
                  <h2 className={styles.h2}>{getStepTitle(step)}</h2>
                  <p className={styles.p}>{getStepDescription(step)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
