/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main background colors
        bg: {
          primary: '#0A0E17',    // Darkest background
          card: '#111827',       // Card background
          hover: '#1a2236',      // Hover state
        },
        // Border colors
        border: {
          subtle: '#1E293B',
          hover: '#334155',
        },
        // Accent colors
        accent: {
          green: '#00E5A0',
          red: '#FF4D6A',
          amber: '#FFB547',
          blue: '#4DA3FF',
        },
        // Text colors
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          dim: '#64748B',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
