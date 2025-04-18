/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{html,ts,tsx}',
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#3B82F6',
                'secondary': '#94A3B8',
                'success': '#10B981',
                'danger': '#EF4444',
                'warning': '#F59E0B',
                'info': '#3B82F6',
                'background': '#F8FAFC',
                'card': '#FFFFFF',
                'border': '#E2E8F0',
                'text': '#1E293B',
                'text-light': '#64748B',
            },
            boxShadow: {
                'card': '0 2px 4px rgba(0, 0, 0, 0.05)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'neumorphic-inset': 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
                'neumorphic-inset-dark': 'inset 5px 5px 10px #1a202c, inset -5px -5px 10px #2d3748',


            }
        },
    },
    plugins: [],
}