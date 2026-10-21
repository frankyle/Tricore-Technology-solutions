/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1524",
        forest: "#1d3a63",
        forestDark: "#122744",
        signal: "#2f6fed",
        signalDark: "#2456bf",
        brass: "#b08d3e",
        brassLight: "#d9bd76",
        paper: "#eef1f6",
        card: "#fbfcfd",
        slate: "#2b3646",
        slateSoft: "#5b6779",
        line: "#d7dde6",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
