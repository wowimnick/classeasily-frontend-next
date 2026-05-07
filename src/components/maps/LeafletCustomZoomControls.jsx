"use client";

import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import styled from "styled-components";
import { Minus, Plus } from "lucide-react";

/**
 * White rounded zoom UI — portaled to map.getContainer() so z-index wins over
 * Leaflet panes (tiles ~200–400, markers ~600, popups ~700). Must stay inside
 * MapContainer subtree for useMap().
 */
const ZoomToolbar = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  pointer-events: auto;
`;

const ZoomToolBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: none;
  background: #ffffff;
  color: #111111;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover {
    background: #f5f5f5;
  }
  &:active {
    background: #ebebeb;
  }
  &:focus-visible {
    outline: 2px solid #111111;
    outline-offset: -2px;
  }
`;

const ZoomDivider = styled.div`
  height: 1px;
  background: #ebebeb;
  flex-shrink: 0;
`;

export function LeafletCustomZoomControls() {
  const map = useMap();
  const ui = (
    <ZoomToolbar aria-label="Map zoom controls">
      <ZoomToolBtn
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
      >
        <Plus size={20} strokeWidth={2.25} aria-hidden />
      </ZoomToolBtn>
      <ZoomDivider aria-hidden />
      <ZoomToolBtn
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
      >
        <Minus size={20} strokeWidth={2.25} aria-hidden />
      </ZoomToolBtn>
    </ZoomToolbar>
  );
  if (typeof document === "undefined") return null;
  return createPortal(ui, map.getContainer());
}
