/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary:'#E8DFD0',
        secondary: '#764534',
        accent: '#EEE8DA',
      }
    },
  },
  plugins: [],
}

