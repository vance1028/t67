/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#dceee3',
          200: '#bbdcc9',
          300: '#8ec3a6',
          400: '#5da37f',
          500: '#3d8661',
          600: '#2d6a4d',
          700: '#1B4332',
          800: '#163a2b',
          900: '#123024',
        },
        accent: {
          50: '#fdf6ec',
          100: '#faebd4',
          200: '#f4d3a8',
          300: '#eeb571',
          400: '#e69039',
          500: '#D68C45',
          600: '#c47231',
          700: '#a3562a',
          800: '#844629',
          900: '#6c3b25',
        },
        dark: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d6dae3',
          300: '#b1b9ca',
          400: '#8692ab',
          500: '#64718e',
          600: '#4f5a74',
          700: '#40495e',
          800: '#373f50',
          900: '#0F172A',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
