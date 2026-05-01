import { create } from "zustand";
import type { ChatMessage, Persona } from "../types";

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  persona: Persona;
  sessionId: string;
  pendingQuery: string | null;
  addMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
  openChat: () => void;
  setStreaming: (streaming: boolean) => void;
  setPersona: (persona: Persona) => void;
  clearMessages: () => void;
  setPendingQuery: (q: string | null) => void;
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  isStreaming: false,
  persona: "developer",
  sessionId: generateSessionId(),
  pendingQuery: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  openChat: () => set({ isOpen: true }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setPersona: (persona) => set({ persona }),

  clearMessages: () =>
    set({ messages: [], sessionId: generateSessionId() }),

  setPendingQuery: (q) => set({ pendingQuery: q }),
}));
