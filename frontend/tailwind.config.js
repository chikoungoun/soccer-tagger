/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soccer-green': '#2d7d32',
        'soccer-dark': '#1b5e20',
        'soccer-light': '#66bb6a',
        'pitch-green': '#4caf50',
        'warning-yellow': '#ffc107',
        'red-card': '#f44336',
      },
      fontFamily: {
        'soccer': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grass-pattern': "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%2388e5a3\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z\"/%3E%3C/g%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}