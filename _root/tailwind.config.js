/** @type {import('tailwindcss').Config} */
export default {
  content: ["./docs/**/*.{md,vue}", "./docs/.vitepress/**/*.{js,ts,vue}"],
  plugins: [require("@tailwindcss/typography")],
};
