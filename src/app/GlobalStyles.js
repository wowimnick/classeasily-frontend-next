// src/app/GlobalStyles.js

'use client';

import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* CSS Reset and Base Styles */
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: var(--font-proxima-soft), -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    line-height: 1.5;
    min-height: 100vh;
    background-color: #ffffff;
  }
  
  input, button, textarea, select {
    font-family: inherit;
  }

  img, picture, video, canvas, svg {
    max-width: 100%;
    height: auto;
  }

  ul, ol {
    list-style: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  /* ============================================== */
  /*      GLOBAL ANT DESIGN & VAUL FIXES            */
  /* ============================================== */

  /* 
     1. Z-INDEX FIX: 
     Vaul drawers usually sit around z-index 1000-1050. 
     AntD dropdowns (attached to body) default to 1050 but conflict due to stacking contexts.
     We force them higher globally.
  */
  .ant-select-dropdown,
  .ant-picker-dropdown,
  .ant-dropdown,
  .ant-cascader-menus,
  .ant-tooltip,
  .ant-popover,
  .ant-notification,
  .ant-message {
    z-index: 99999 !important;
  }

  /* 2. MOBILE DATEPICKER UX:
     Make date pickers center-screen on mobile automatically, 
     so they don't get cut off by screen edges in drawers.
  */
  @media (max-width: 768px) {
    .ant-picker-dropdown {
      position: fixed !important;
      top: auto !important; /* Override AntD top calculation */
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      transform: none !important; /* Remove center transforms */
      inset: auto !important; /* Reset inset if AntD sets it */
      pointer-events: none; /* Allow clicks to pass through wrapper */
      padding: 0 !important;
    }

    .ant-picker-panel-container {
      width: 100% !important;
      border-radius: 20px 20px 0 0 !important;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15) !important;
      padding-bottom: max(16px, env(safe-area-inset-bottom)) !important;
      pointer-events: auto; /* Re-enable clicks on the actual picker */
      display: flex;
      justify-content: center;
      background: white;
    }
    
    /* Ensure the inner calendar fits the screen width */
    .ant-picker-panel {
      width: 100% !important;
      max-width: 100% !important;
    }
    
    .ant-picker-date-panel,
    .ant-picker-content {
      width: 100% !important;
    }
    
    /* Make time picker columns wider and touch-friendly */
    .ant-picker-time-panel-column {
      width: 100% !important;
      flex: 1;
    }
  }

  /* 3. VAUL TOUCH FIXES: */
  [vaul-drawer] {
    touch-action: none;
  }

  [vaul-drawer] > * {
    touch-action: auto;
  }

  /* ============================================== */
  /*            EXISTING STYLES BELOW               */
  /* ============================================== */

  .classpage-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-bottom: 100px;
  }

  @media (min-width: 769px) {
    .classpage-wrapper {
      padding-bottom: 0;
    }
  }

  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    width: 100%;
  }

  @media (max-width: 768px) {
    .content-wrapper {
      padding: 0;
    }
  }

  .main-content-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
    gap: 5rem;
    padding: 0 0 4rem 0;
    position: relative;
    z-index: 5;
    margin: 0;
  }

  @media (max-width: 1024px) {
    .main-content-layout {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      padding-bottom: 3rem;
      padding-top: 0;
      align-items: stretch;
      margin-top: -3rem;
    }
  }

  .primary-content-area {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-width: 0;
    padding: 0;
  }

  @media (max-width: 768px) {
    .primary-content-area {
      gap: 0.5rem;
      padding: 0;
    }
  }

  .sticky-sidebar {
    position: sticky;
    top: 1rem;
    align-self: start;
    height: fit-content;
    max-height: calc(100vh - 8rem);
  }

  @media (max-width: 768px) {
    .sticky-sidebar {
      position: relative;
      top: auto;
      order: -1;
      max-height: none;
      overflow-y: visible;
      align-self: stretch;
      width: 100%;
      margin-bottom: 2rem;
    }
  }

  @media (max-width: 1024px) {
    .sticky-sidebar {
      display: none;
    }
  }

  .map-section-wrapper {
    margin-top: 2.5rem;
    margin-bottom: 2.5rem;
    padding: 0;
  }

  @media (max-width: 768px) {
    .map-section-wrapper {
      padding: 2rem 0.75rem;
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  .map-inner-container {
    height: 400px;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e8e8e8;
  }

  @media (max-width: 768px) {
    .map-inner-container {
      height: 300px;
    }
  }

  .address-display {
    text-align: center;
    font-size: 0.875rem;
    color: #717171;
    margin-top: 1rem;
    padding: 0 1rem;
  }

  .breadcrumb-container {
    max-width: 1200px;
    padding: 24px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .breadcrumb-container {
      padding: 0 16px 0.75rem 16px;
    }
  }

  /* Tooltip Customization */
  .ant-tooltip {
    font-size: 12px !important;
  }

  .ant-tooltip-inner {
    background-color: #333 !important;
    color: white !important;
    border-radius: 6px !important;
    padding: 12px !important;
    margin: 0 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    line-height: 1.4 !important;
    min-height: auto !important;
  }

  .ant-tooltip-content {
    margin: 0 !important;
    padding: 0 !important;
    min-height: auto !important;
  }

  .ant-tooltip-arrow::before,
  .ant-tooltip-arrow::after {
    background: #333 !important;
    border-color: #333 !important;
  }

  /* Scrollbar Customization */
  * {
    scrollbar-width: thin !important;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }

  *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }

  /* Interaction Fixes */
  .ant-select-dropdown,
  .ant-dropdown,
  .ant-picker-dropdown,
  .ant-tooltip,
  .ant-popover {
    pointer-events: auto !important;
    touch-action: auto !important;
  }

  /* Allow scrolling in time picker columns and other scrollable dropdown content */
  .ant-picker-time-panel-column,
  .ant-select-dropdown .rc-virtual-list,
  .ant-picker-content,
  .ant-picker-time-panel,
  .ant-select-item-option-content {
    touch-action: pan-y !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .ant-picker-time-panel-column {
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }
`;

export default GlobalStyles;