/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#fff7ed',
          card: '#fffdf8',
          hover: '#fff3e2',
        },
        border: {
          subtle: '#dfd0bd',
          hover: '#b79a7a',
        },
        accent: {
          green: '#126b4f',
          red: '#a83232',
          amber: '#a3651b',
          blue: '#285a7f',
          burgundy: '#8f1d2c',
        },
        text: {
          primary: '#241f1a',
          secondary: '#50473d',
          dim: '#7a6d5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Source Serif 4', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
