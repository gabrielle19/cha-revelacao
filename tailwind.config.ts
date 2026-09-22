import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF6F0",
          soft: "#FBF7F1",
        },
        beige: {
          DEFAULT: "#E8DCC8",
          light: "#F1E6D6",
        },
        caramel: "#C9A574",
        brownlabel: {
          DEFAULT: "#B08968",
          deep: "#8B6F52",
        },
        brownmid: "#8A6A4F",
        browndark: "#5C4433",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-quicksand)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(92,68,51,0.18)",
        card: "0 8px 24px -14px rgba(92,68,51,0.18)",
      },
      borderRadius: {
        card: "22px",
      },
      maxWidth: {
        content: "560px",
      },
    },
  },
  plugins: [],
};

export default config;
