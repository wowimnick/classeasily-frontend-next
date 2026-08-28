"use client";

import styled from "styled-components";
import MarketingHeader, { MarketingSheet } from "./MarketingHeader";
import MarketingFooter from "./MarketingFooter";
import { marketingTheme as t } from "./tokens";

const Wrap = styled.div`
  color: #000;
  background: #f2f2f4;
  font-family: ${t.fonts.body};
  min-height: 100vh;
`;

export default function MarketingChrome({ children }) {
  return (
    <Wrap>
      <MarketingHeader />
      <MarketingSheet>
        {children}
        <MarketingFooter />
      </MarketingSheet>
    </Wrap>
  );
}
