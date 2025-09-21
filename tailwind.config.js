export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bull: "#F04452",       // 상승 (보통 빨강, 한국식)
        bear: "#3182F7",       // 하락 (파랑)
        background: "#F6F6F6", // 배경
      },
    },
  },
  plugins: [],
};