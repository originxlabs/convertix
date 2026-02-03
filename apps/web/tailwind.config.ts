import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: {
          950: "#0b0d12",
          900: "#151a24",
          800: "#202737",
          700: "#2d364a"
        },
        obsidian: {
          50: "#f7f8fb",
          100: "#eef1f7",
          200: "#dbe1ee",
          300: "#c1cbdf",
          500: "#7b8aab"
        },
        glass: {
          50: "#fdfdff",
          100: "#f7f8fc"
        },
        accent: {
          500: "#1f6feb",
          600: "#1957cc",
          700: "#153f99"
        },
        aurora: {
          400: "#5be7c4",
          500: "#2bd3b0"
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
