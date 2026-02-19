"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Build WebSocket URL for conversation from API base URL.
 * @param {string} conversationId - UUID
 * @param {string} [guestInboxToken] - For guest (no-account) auth
 * @returns {string|null} WS URL or null if base URL missing
 */
export function getConversationWebSocketUrl(conversationId, guestInboxToken) {
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";
  if (!base || !conversationId) return null;
  const url = new URL(base);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  let basePath = (url.pathname || "").replace(/\/$/, "");
  if (!basePath || basePath === "/") basePath = "/api";
  const path = `${basePath}/ws/conversations/${conversationId}/`;
  let wsUrl = `${protocol}//${url.host}${path}`;
  if (guestInboxToken) {
    wsUrl += `?guest_inbox_token=${encodeURIComponent(guestInboxToken)}`;
  }
  return wsUrl;
}

/**
 * useConversationWebSocket
 * Connects to conversation WS; provides real-time messages, typing indicator, read receipts.
 * Auth: cookie (logged-in) or guest_inbox_token in URL (guest).
 *
 * @param {object} options
 * @param {string|null} options.conversationId - Conversation UUID (connect when set)
 * @param {string|null} options.guestInboxToken - If set, use guest token auth
 * @param {Array} options.initialMessages - Messages from REST; merged with WS updates
 * @param {object} [options.initialReadStatus] - { last_read_by_booker_at, last_read_by_business_at }
 */
export function useConversationWebSocket({
  conversationId,
  guestInboxToken = null,
  initialMessages = [],
  initialReadStatus = null,
}) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [typing, setTyping] = useState({ booker: { active: false, displayName: "" }, business: { active: false, displayName: "" } });
  const [readStatus, setReadStatus] = useState(initialReadStatus || { last_read_by_booker_at: null, last_read_by_business_at: null });
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync from REST when conversation changes or when initial data actually changes (by value).
  // Don't depend on initialMessages/initialReadStatus directly — parent often passes new []/{} refs each render and causes an infinite loop.
  const prevConvIdRef = useRef(null);
  useEffect(() => {
    const nextMessages = Array.isArray(initialMessages) ? initialMessages : [];
    const nextRead = initialReadStatus || { last_read_by_booker_at: null, last_read_by_business_at: null };

    setMessages((prev) => {
      if (prevConvIdRef.current !== conversationId) return nextMessages;
      if (prev.length !== nextMessages.length) return nextMessages;
      if (nextMessages.length && prev[0]?.id !== nextMessages[0]?.id) return nextMessages;
      return prev;
    });
    setReadStatus((prev) => {
      if (prevConvIdRef.current !== conversationId) return nextRead;
      if (prev.last_read_by_booker_at !== nextRead.last_read_by_booker_at || prev.last_read_by_business_at !== nextRead.last_read_by_business_at) return nextRead;
      return prev;
    });
    prevConvIdRef.current = conversationId;
  }, [conversationId, initialMessages, initialReadStatus]);

  const clearTypingAfterDelay = useCallback((side, delay = 3000) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping((prev) => ({
        ...prev,
        [side]: { ...prev[side], active: false },
      }));
      typingTimeoutRef.current = null;
    }, delay);
  }, []);

  const send = useCallback((action, payload = {}) => {
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action, ...payload }));
    }
  }, []);

  const sendTypingStart = useCallback(() => send("typing_start"), [send]);
  const sendTypingStop = useCallback(() => send("typing_stop"), [send]);
  const sendMarkRead = useCallback(() => send("mark_read"), [send]);
  const sendMessage = useCallback((text) => send("send_message", { text }), [send]);

  useEffect(() => {
    if (!conversationId) {
      setConnected(false);
      setError(null);
      return;
    }

    const url = getConversationWebSocketUrl(conversationId, guestInboxToken || undefined);
    if (!url) {
      setError("Missing API URL or conversation ID");
      return;
    }

    setError(null);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Optional: reconnect after delay (e.g. 3s) if still on same conversation
      reconnectTimeoutRef.current = setTimeout(() => {
        if (wsRef.current === null && conversationId) {
          // Trigger re-run of this effect by toggling a dummy state if needed; for simplicity we don't auto-reconnect here.
        }
        reconnectTimeoutRef.current = null;
      }, 3000);
    };

    ws.onerror = () => setError("WebSocket error");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "joined":
            break;
          case "new_message":
            setMessages((prev) => {
              const msg = data.message;
              if (!msg?.id) return prev;
              const exists = prev.some((m) => String(m.id) === String(msg.id));
              if (exists) return prev;
              const normalized = {
                id: msg.id,
                conversation: msg.conversation,
                sender_type: msg.sender_type,
                sender_user: msg.sender_user,
                sender_contact: msg.sender_contact,
                sender_display: msg.sender_display,
                text: msg.text,
                created_at: msg.created_at,
              };
              return [...prev, normalized];
            });
            break;
          case "typing":
            {
              const side = data.side === "booker" ? "booker" : "business";
              setTyping((prev) => ({
                ...prev,
                [side]: { active: !!data.active, displayName: data.display_name || "" },
              }));
              if (data.active) clearTypingAfterDelay(side);
            }
            break;
          case "read_receipt":
            {
              const at = data.read_at;
              if (!at) break;
              if (data.side === "booker") {
                setReadStatus((prev) => ({ ...prev, last_read_by_booker_at: at }));
              } else {
                setReadStatus((prev) => ({ ...prev, last_read_by_business_at: at }));
              }
            }
            break;
          default:
            break;
        }
      } catch (e) {
        console.warn("WS message parse error", e);
      }
    };

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
      setConnected(false);
    };
  }, [conversationId, guestInboxToken, clearTypingAfterDelay]);

  return {
    connected,
    messages,
    typing,
    readStatus,
    error,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    sendMarkRead,
  };
}
