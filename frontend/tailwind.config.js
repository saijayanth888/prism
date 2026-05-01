/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        prism: {
          dark: "#0B1222",
          mid: "#151D2E",
          slate: "#1E293B",
        },
        accent: "#22D3EE",
        graph: {
          api: "#3B82F6",
          service: "#10B981",
          database: "#8B5CF6",
          queue: "#F59E0B",
          cache: "#EF6C00",
          repo: "#64748B",
          secret: "#EC4899",
          monitor: "#6366F1",
          deploy: "#22C55E",
        },
      },
      fontFamily: {
        sans: ["Instrument Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
        elevated: "0 4px 12px rgba(0, 0, 0, 0.12)",
        "glow-accent": "0 0 20px rgba(34, 211, 238, 0.15)",
      },
    },
  },
  plugins: [],
};
