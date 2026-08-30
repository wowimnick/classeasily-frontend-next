"use client";

import React from "react";
import styled from "styled-components";

const TabNavigation = styled.nav`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 65px;
  z-index: 100;
  overflow: hidden;

  @media (max-width: 768px) {
    top: 60px;
  }
`;

const TabList = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 3rem;
  display: flex;
  gap: 3rem;
  overflow: hidden;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 1024px) {
    padding: 0 2rem;
    gap: 2.5rem;
  }

  @media (max-width: 768px) {
    padding: 0 1.5rem;
    gap: 2rem;
  }
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 1.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }

  &.active {
    color: #111;

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #ff385c;
    }
  }
`;

const BusinessNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <TabNavigation>
      <TabList>
        <TabButton
          className={activeTab === "classes" ? "active" : ""}
          onClick={() => setActiveTab("classes")}
          aria-label="View classes tab"
          role="tab"
          aria-selected={activeTab === "classes"}
        >
          Classes
        </TabButton>
        <TabButton
          className={activeTab === "reviews" ? "active" : ""}
          onClick={() => setActiveTab("reviews")}
          aria-label="View reviews tab"
          role="tab"
          aria-selected={activeTab === "reviews"}
        >
          Reviews
        </TabButton>
        <TabButton
          className={activeTab === "location" ? "active" : ""}
          onClick={() => setActiveTab("location")}
          aria-label="View location tab"
          role="tab"
          aria-selected={activeTab === "location"}
        >
          Location
        </TabButton>
        <TabButton
          className={activeTab === "contact" ? "active" : ""}
          onClick={() => setActiveTab("contact")}
          aria-label="View contact tab"
          role="tab"
          aria-selected={activeTab === "contact"}
        >
          Contact
        </TabButton>
      </TabList>
    </TabNavigation>
  );
};

export default BusinessNavigation;
