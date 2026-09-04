/** @type {import('tailwindcss').Config} */

// Every colour resolves through a CSS variable holding a space-separated RGB
// triple, so a single variable swap in index.css re-themes the whole app and
// utilities keep their opacity modifiers (bg-brand-500/10 still works).
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: token('--brand-50'),
          100: token('--brand-100'),
          200: token('--brand-200'),
          300: token('--brand-300'),
          400: token('--brand-400'),
          500: token('--brand-500'),
          600: token('--brand-600'),
          700: token('--brand-700'),
        },
        accent: {
          50: token('--accent-50'),
          100: token('--accent-100'),
          400: token('--accent-400'),
          500: token('--accent-500'),
          600: token('--accent-600'),
        },
        ink: {
          DEFAULT: token('--ink'),
          soft: token('--ink-soft'),
          muted: token('--ink-muted'),
          faint: token('--ink-faint'),
        },
        surface: {
          DEFAULT: token('--surface'),
          sunken: token('--surface-sunken'),
          raised: token('--surface-raised'),
        },
        line: token('--line'),

        // Semantic tints. `soft` is the wash behind an icon or notice, the base
        // is the text or solid fill that sits on it.
        positive: {
          DEFAULT: token('--positive'),
          soft: token('--positive-soft'),
          solid: token('--positive-solid'),
        },
        warning: {
          DEFAULT: token('--warning'),
          soft: token('--warning-soft'),
          solid: token('--warning-solid'),
        },
        danger: {
          DEFAULT: token('--danger'),
          soft: token('--danger-soft'),
          softer: token('--danger-softer'),
          solid: token('--danger-solid'),
        },
      },
      borderRadius: {
        card: '16px',
        field: '12px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      maxWidth: {
        phone: '430px',
        shell: '1360px',
      },
    },
  },
  plugins: [],
}
