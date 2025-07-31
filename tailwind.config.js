/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  plugins: [require("@tailwindcss/container-queries")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      screens: {
        "spec-xs": "480px",
        "spec-md" : "950px",
        "spec-lg": "1120px",
        "spec-xl": "1450px",
        "spec-2xl": "1620px",
      },
    },
    container: {
      center: false,
      padding: "0px",
    },
  },
};
