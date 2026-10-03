/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}'],

  // The app is embedded inside a WordPress page that has its own stylesheet.
  // Preflight is disabled so Tailwind's global reset cannot restyle the host
  // theme, and every utility is scoped to `.napnox-app` so theme CSS cannot
  // out-specify it. A scoped reset lives in styles.css instead.
  // `container` is disabled because Tailwind emits it unscoped, where it
  // would collide with the `.container` class used by most WP themes.
  corePlugins: { preflight: false, container: false },
  important: '.napnox-app',

  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'napnoxFadeIn 0.2s ease-out forwards',
        'fade-in-up': 'napnoxFadeInUp 0.4s ease-out forwards',
      },
      keyframes: {
        napnoxFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        napnoxFadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(0.75rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
