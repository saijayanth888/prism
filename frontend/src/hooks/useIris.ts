import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "../stores/chat";
import type { ChatMessage } from "../types";

function uuid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000/api/v1/copilot/stream`;

export function useIris() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const streamingMsgId = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);

  const { addMessage, setStreaming, persona, sessionId, messages } = useChatStore();

  const appendToStreaming = useCallback(
    (token: string) => {
      if (!streamingMsgId.current) return;
      const id = streamingMsgId.current;
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, text: m.text + token } : m
        ),
      }));
    },
    []
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "token") {
            appendToStreaming(data.content);
          } else if (data.type === "done") {
            // Finalize streaming message
            if (streamingMsgId.current) {
              const id = streamingMsgId.current;
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === id
                    ? {
                        ...m,
                        toolsUsed: data.tools_used || [],
                        citations: data.citations || [],
                        confidence: data.confidence,
                      }
                    : m
                ),
              }));
              streamingMsgId.current = null;
            }
            setStreaming(false);
          }
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [appendToStreaming, setStreaming]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: uuid(),
        role: "user",
        text,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);

      // Try WebSocket first, fall back to REST
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const irisMsg: ChatMessage = {
          id: uuid(),
          role: "iris",
          text: "",
          timestamp: new Date().toISOString(),
        };
        streamingMsgId.current = irisMsg.id;
        addMessage(irisMsg);
        setStreaming(true);

        wsRef.current.send(
          JSON.stringify({ message: text, persona, session_id: sessionId })
        );
      } else {
        // REST fallback
        setStreaming(true);
        try {
          const resp = await fetch(`http://${window.location.hostname}:8000/api/v1/copilot/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, persona, session_id: sessionId }),
          });
          const data = await resp.json();
          const irisMsg: ChatMessage = {
            id: uuid(),
            role: "iris",
            text: data.answer || "No response",
            toolsUsed: data.tools_used,
            citations: data.citations,
            confidence: data.confidence,
            timestamp: new Date().toISOString(),
          };
          addMessage(irisMsg);
        } catch {
          addMessage({
            id: uuid(),
            role: "iris",
            text: "Connection error. Make sure the API is running (`make dev`).",
            timestamp: new Date().toISOString(),
          });
        } finally {
          setStreaming(false);
        }
      }
    },
    [addMessage, setStreaming, persona, sessionId]
  );

  return { sendMessage, connected, messages };
}
