// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f9ff',
          100: '#e8eaff',
          200: '#d1d4ff',
          300: '#a7aeff',
          400: '#7b83ff',
          500: '#4f58ff',
          600: '#2832ff',
          700: '#0008ff',
          800: '#0006cc',
          900: '#000599',
        },
        secondary: {
          50: '#fff8f9',
          100: '#ffe8ea',
          200: '#ffd1d4',
          300: '#ffa7ae',
          400: '#ff7b83',
          500: '#ff4f58',
          600: '#ff2832',
          700: '#ff0008',
          800: '#cc0006',
          900: '#990005',
        }
      }
    }
  },
  plugins: [],
}