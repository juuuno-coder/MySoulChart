import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Tailwind v4에서는 globals.css의 @theme 블록 사용
  // 색상, 폰트, 애니메이션 등은 src/styles/globals.css에 정의됨
};

export default config;
