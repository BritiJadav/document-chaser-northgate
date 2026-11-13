/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-canvas": "#0B0E14",
        "surface": "#10131a",
        "surface-dim": "#10131a",
        "surface-elevated": "#141824",
        "surface-overlay": "#1E2435",
        "surface-container-highest": "#32353c",
        "surface-container-high": "#272a31",
        "surface-container": "#1d2026",
        "surface-container-low": "#191c22",
        "surface-bright": "#363940",
        "accent-electric": "#02F576",
        "accent-violet": "#5F2CFF",
        "secondary": "#c9beff",
        "secondary-fixed": "#e6deff",
        "tertiary": "#ffefdc",
        "tertiary-fixed": "#ffddae",
        "tertiary-fixed-dim": "#efbf73",
        "tertiary-container": "#ffcd80",
        "border-subtle": "rgba(255, 255, 255, 0.08)",
        "border-prominent": "rgba(255, 255, 255, 0.16)",
        "text-primary": "#FFFFFF",
        "text-secondary": "#9CA3AF",
        "text-muted": "#64748B",
        "error": "#ffb4ab",
        "error-container": "#93000a",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
      }
    },
  },
  plugins: [],
}
