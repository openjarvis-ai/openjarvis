import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#dfeeff",
          200: "#b8dbff",
          300: "#78bfff",
          400: "#3aa0ff",
          500: "#0a7cff",
          600: "#005edb",
          700: "#004ab1",
          800: "#004092",
          900: "#003678",
          950: "#002250",
        },
        surface: {
          0: "#ffffff",
          50: "#f8f9fb",
          100: "#f1f3f6",
          200: "#e4e7ec",
          300: "#cdd2db",
          400: "#98a2b3",
          500: "#667085",
          600: "#475467",
          700: "#344054",
          800: "#1d2939",
          900: "#101828",
          950: "#0a0f1a",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(10, 124, 255, 0.15)",
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        medium:
          "0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)",
        heavy:
          "0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "pulse-recording": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-recording": "pulse-recording 1.5s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
