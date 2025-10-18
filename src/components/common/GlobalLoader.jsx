"use client";

import React from "react";
import { motion } from "framer-motion";
import styled from "styled-components";

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid #ff385c20;
  border-top: 3px solid #ff385c;
  border-radius: 50%;
`;

const GlobalLoaderWithInlineStyles = () => (
  <LoadingOverlay>
    <LoadingSpinner
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </LoadingOverlay>
);

const GlobalLoaderWithoutInlineStyles = () => (
  <div className="global-loader">
    <LoadingSpinner
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);

export {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
  LoadingSpinner,
};
