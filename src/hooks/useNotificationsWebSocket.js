"use client";

import { useEffect, useRef } from "react";

/**
 * Build WebSocket URL for notifications stream (auth via cookie).
 * @returns {string|null} WS URL or null if base URL missing
 */
export function getNotificationsWebSocketUrl() {
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";
  if (!base) return null;
  const url = new URL(base);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  let basePath = (url.pathname || "").replace(/\/$/, "");
  if (!basePath || basePath === "/") basePath = "/api";
  return `${protocol}//${url.host}${basePath}/ws/notifications/`;
}

/**
 * useNotificationsWebSocket
 * Connects to notifications WS when enabled (e.g. user logged in). Auth via cookie.
 * Calls onNewNotification(notification) and onUnreadDelta(delta) when server pushes.
 *
 * @param {object} options
 * @param {boolean} options.enabled - Connect when true
 * @param {function} [options.onNewNotification] - (notification) => void
 * @param {function} [options.onUnreadDelta] - (delta: number) => void
 */
export function useNotificationsWebSocket({
  enabled,
  onNewNotification,
  onUnreadDelta,
}) {
  const wsRef = useRef(null);
  const onNewRef = useRef(onNewNotification);
  const onDeltaRef = useRef(onUnreadDelta);
  onNewRef.current = onNewNotification;
  onDeltaRef.current = onUnreadDelta;

  useEffect(() => {
    if (!enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const wsUrl = getNotificationsWebSocketUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          if (data.notification && onNewRef.current) {
            onNewRef.current(data.notification);
          }
          const delta = typeof data.unread_delta === "number" ? data.unread_delta : 1;
          if (onDeltaRef.current) onDeltaRef.current(delta);
        }
      } catch (e) {
        console.warn("Notifications WS message parse error", e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [enabled]);

  return {};
}
