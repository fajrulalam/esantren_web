/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#0D6EFD',
        'secondary': '#6C757D',
        'success': '#198754',
        'danger': '#DC3545',
        'warning': '#FFC107',
        'info': '#0DCAF0',
        'background': '#F8FAFC',
        'card': '#FFFFFF',
        'border': '#E2E8F0',
        'text': '#1E293B',
        'text-light': '#64748B',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'neumorphic': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
        'neumorphic-inset': 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
        'neumorphic-dark': '5px 5px 10px #151922, -5px -5px 10px #414a5e',
        'neumorphic-inset-dark': 'inset 3px 3px 6px #151922, inset -3px -3px 6px #414a5e',
        'neumorphic-pressed': 'inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff',
        'neumorphic-pressed-dark': 'inset 2px 2px 5px #151922, inset -2px -2px 5px #414a5e',
        'neumorphic-delete': '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
        'neumorphic-delete-dark': '4px 4px 8px #151922, -4px -4px 8px #414a5e',
        'neumorphic-delete-pressed': 'inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff',
        'neumorphic-delete-pressed-dark': 'inset 2px 2px 5px #151922, inset -2px -2px 5px #414a5e',
        'neumorphic-button': '3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff',
        'neumorphic-button-dark': '3px 3px 6px #151922, -3px -3px 6px #414a5e',
        'neumorphic-button-pressed': 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
        'neumorphic-button-pressed-dark': 'inset 2px 2px 4px #151922, inset -2px -2px 4px #414a5e',
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}