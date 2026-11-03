/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Indian signboard palette: turmeric yellow, indigo ink, vermilion, betel-leaf green.
        haldi: { DEFAULT: '#FFC53D', soft: '#FFE9A8', deep: '#F0A500' },
        neel: {
          50: '#F5F6FB',
          100: '#E8EBF6',
          200: '#CDD3EA',
          300: '#A9B2D9',
          500: '#5A67A6',
          700: '#2F3C7E',
          DEFAULT: '#1F2A5C',
          900: '#141B3D',
        },
        sindoor: { DEFAULT: '#E5412D', deep: '#C2301C', soft: '#FDE4DF' },
        paan: { DEFAULT: '#178A55', deep: '#0F6B41', soft: '#DDF3E7' },
      },
      fontFamily: {
        sans: ['"Anek Latin"', '"Anek Devanagari"', 'system-ui', 'sans-serif'],
        sign: ['"Yatra One"', '"Anek Devanagari"', 'serif'],
      },
      boxShadow: {
        lift: '0 1px 0 rgba(31,42,92,0.06), 0 18px 40px -18px rgba(31,42,92,0.35)',
        phone: '0 0 0 1px rgba(20,27,61,0.08), 0 30px 60px -20px rgba(20,27,61,0.45)',
      },
    },
  },
  plugins: [],
}
