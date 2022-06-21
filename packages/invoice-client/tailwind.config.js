/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
    },
    animation: {
      enter: 'enter 200ms ease-out',
      'slide-in': 'slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)',
      leave: 'leave 150ms ease-in forwards',
      spin: "spin 1s linear infinite"
    },
    keyframes: {
      enter: {
        '0%': { transform: 'scale(0.9)', opacity: 0 },
        '100%': { transform: 'scale(1)', opacity: 1 },
      },
      leave: {
        '0%': { transform: 'scale(1)', opacity: 1 },
        '100%': { transform: 'scale(0.9)', opacity: 0 },
      },
      'slide-in': {
        '0%': { transform: 'translateY(-100%)' },
        '100%': { transform: 'translateY(0)' },
      },
      spin: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('flowbite/plugin')
  ],
  darkMode: 'class'
}

module.exports = config;
