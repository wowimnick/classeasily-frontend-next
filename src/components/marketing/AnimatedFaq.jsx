"use client";

import { useId, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const Item = styled.div`
  border-bottom: 1px solid #e2e8f0;
  &:first-of-type {
    border-top: 1px solid #e2e8f0;
  }
`;

const Trigger = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 1.02rem;
  font-weight: 700;
  color: #000;
  font-family: inherit;
  &:focus-visible {
    outline: 2px solid #fc4056;
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const Panel = styled(motion.div)`
  overflow: hidden;
`;

const PanelInner = styled.div`
  padding: 0 0.25rem 1.15rem 0;
  font-size: 0.98rem;
  line-height: 1.65;
  color: #000;
  max-width: 40rem;
`;

export default function AnimatedFaq({ items, boxed = false }) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const [openKey, setOpenKey] = useState(boxed ? "0" : null);

  return (
    <div
      style={
        boxed
          ? {
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              overflow: "hidden",
              background: "#fff",
              padding: "0 20px",
            }
          : undefined
      }
    >
      {items.map((item, i) => {
        const key = String(i);
        const isOpen = openKey === key;
        return (
          <Item
            key={item.q}
            style={
              boxed && i === 0 ? { borderTop: "none" } : undefined
            }
          >
            <Trigger
              id={`${baseId}-header-${i}`}
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${baseId}-panel-${i}`}
              onClick={() => setOpenKey(isOpen ? null : key)}
            >
              <span>{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25 }}
                style={{ display: "flex", color: "#000" }}
                aria-hidden
              >
                <ChevronDown size={22} />
              </motion.span>
            </Trigger>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <Panel
                  key={key}
                  id={`${baseId}-panel-${i}`}
                  role="region"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PanelInner>{item.a}</PanelInner>
                </Panel>
              ) : null}
            </AnimatePresence>
          </Item>
        );
      })}
    </div>
  );
}
