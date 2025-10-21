/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}", 
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}"
  ],
  safelist: [
    // Blue theme classes
    'bg-blue-600',
    'bg-blue-700',
    'hover:bg-blue-700',
    'bg-blue-50',
    'text-blue-700',
    'text-blue-600',
    'text-blue-100',
    'hover:text-blue-700',
    'hover:border-blue-200',
    'hover:bg-blue-50',
    'bg-gradient-to-br',
    'from-blue-600',
    'via-blue-500',
    'to-cyan-500',
    'bg-cyan-400/20',
    // Orange theme classes
    'bg-orange-400',
    'bg-orange-500',
    'hover:bg-orange-500',
    'bg-orange-50',
    'text-orange-700',
    'text-orange-600',
    'text-orange-100',
    'hover:text-orange-700',
    'hover:border-orange-200',
    'hover:bg-orange-50',
    'from-orange-500',
    'via-orange-400',
    'to-amber-400',
    'bg-amber-400/20',
  ],
  theme: { extend: {} },
  plugins: []
};