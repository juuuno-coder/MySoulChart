/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 기존 웹 테마 색상 이전
        cosmic: {
          900: '#0a0a1a',
          800: '#12122e',
          700: '#1a1a42',
          600: '#222256',
        },
        nebula: {
          300: '#c084fc',
          400: '#a855f7',
          500: '#9333ea',
          600: '#7e22ce',
        },
        starlight: {
          100: '#f8f9ff',
          200: '#e8eaff',
          300: '#c8ccff',
          400: '#9da3ff',
        },
        gold: {
          100: '#fef9e7',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Pretendard'],
        serif: ['NotoSerifKR'],
        gowun: ['GowunBatang'],
      },
    },
  },
  plugins: [],
};
