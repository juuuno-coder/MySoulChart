# 바이브 철학관 (Vibe Philosophy Agent 3.0)

> 사주, 관상, MBTI, 혈액형, 별자리를 통합한 AI 철학 상담 서비스

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/vibe-philosophy)

## ✨ 주요 기능

- 🔮 **7가지 상담 모드**: 통합 점사, 별자리, 혈액형, MBTI, 사주, 관상, 궁합
- 🤖 **Gemini 2.0 Flash 기반**: 실시간 대화형 AI 상담
- 📸 **관상 분석**: 얼굴 사진 업로드로 자동 분석
- 💾 **세션 영속성**: LocalStorage 기반 24시간 세션 복원
- 🔒 **보안**: API 키 서버 측 관리, Rate Limiting
- 📱 **반응형**: 데스크톱/모바일 최적화

## 🛠️ 기술 스택

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (npm)
- lucide-react

### Backend/API
- Vercel Serverless Functions
- Google Generative AI

## 🚀 빠른 시작

### 로컬 개발

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.example 참고)
cp .env.example .env.local
# .env.local 파일을 열어 실제 API 키 입력

# 개발 서버 실행
npm run dev
```

개발 서버: http://localhost:3300

**필수 환경 변수**:
- `GEMINI_API_KEY`: Google Gemini API 키 ([발급받기](https://aistudio.google.com/app/apikey))
- Firebase, Kakao 설정은 `.env.example` 참고

### 프로덕션 빌드

```bash
# 타입 체크
npx tsc --noEmit

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📦 배포

### Vercel (권장)

1. **GitHub 저장소 연결**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/vibe-philosophy.git
   git push -u origin main
   ```

2. **Vercel 배포**
   ```bash
   # Vercel CLI 설치 (최초 1회)
   npm install -g vercel

   # 로그인
   vercel login

   # 배포
   vercel --prod
   ```

3. **환경 변수 설정** (Vercel Dashboard)
   - `GEMINI_API_KEY`: Google Gemini API 키
   - Firebase, Kakao 설정 (`.env.example` 참고)

4. **GA4 설정** (선택사항)
   - [Google Analytics](https://analytics.google.com/)에서 Measurement ID 발급
   - `index.html`의 `G-YOUR_MEASUREMENT_ID` 교체 (2곳)

## 📂 프로젝트 구조

```
lightstar/
├── api/                        # Vercel Serverless Functions
│   ├── chat.ts                # 채팅 API
│   ├── analyze-face.ts        # 관상 분석 API
│   └── generate-card.ts       # 결과 카드 생성 API
├── src/
│   ├── app/App.tsx            # 메인 앱
│   ├── components/            # React 컴포넌트
│   │   ├── chat/              # 채팅 인터페이스
│   │   ├── card/              # 결과 카드 (ResultCard, ShareButtons)
│   │   ├── control/           # 제어판
│   │   ├── forms/             # 입력 폼
│   │   ├── modals/            # 모달 (Onboarding, SessionRestore)
│   │   ├── pages/             # 페이지 (Landing, ViewChart)
│   │   ├── sidebars/          # 사이드바
│   │   └── ui/                # UI 컴포넌트 (Toast, MobileDrawer, LoadingOverlay)
│   ├── hooks/                 # 커스텀 훅 (useChat, useSession, useProfile, useAnalytics)
│   ├── services/              # API 클라이언트
│   ├── utils/                 # 유틸리티 (analytics, share, validation, storage)
│   ├── constants/             # 상수 (프롬프트, 별자리 데이터, 모드별 설정)
│   ├── types/                 # TypeScript 타입
│   └── styles/                # 글로벌 CSS (Tailwind v4)
├── public/                    # 정적 파일
│   ├── favicon.svg            # 파비콘
│   ├── site.webmanifest       # PWA manifest
│   ├── robots.txt             # SEO
│   └── sitemap.xml            # SEO
├── vercel.json                # Vercel 배포 설정
├── .env.example               # 환경 변수 템플릿
└── vite.config.ts             # Vite 설정
```

## 🎨 개발 가이드

### 커스텀 훅

- `useChat`: 채팅 상태 및 메시지 관리
- `useSession`: 세션 저장/복원
- `useProfile`: 프로필 관리

### 스타일링

- Tailwind CSS v4 (`src/styles/globals.css`)
- 커스텀 색상: `void-*`, `gold-*`, `mystic-*`
- Glassmorphism: `.glass-panel`, `.glass-input`

### API 엔드포인트

- `POST /api/chat`: 채팅 메시지 전송 (Gemini 2.0 Flash)
- `POST /api/analyze-face`: 관상 분석 (Gemini Vision)
- `POST /api/generate-card`: 결과 카드 데이터 생성

### 성능

- **번들 크기**: CSS 61KB, JS 1.1MB (gzipped)
- **Lighthouse 점수**: 성능 90+, 접근성 95+, SEO 100
- **코드 스플리팅**: 무거운 컴포넌트 Lazy Loading
- **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

## 📊 로드맵

### Phase 1: 핵심 안정화 ✅
- Toast 시스템
- 파일 검증
- 세션 영속성
- 모바일 드로어

### Phase 2A: 인프라 기반 ✅
- Vercel Serverless Functions
- Tailwind v4 npm 마이그레이션
- API 보안 강화

### Phase 2B: 코드 리팩토링 ✅
- 커스텀 훅 분리
- 컴포넌트 모듈화
- App.tsx 경량화 (370줄 → 203줄)

### Phase 2C: 새 기능 구현 ✅
- [x] 별자리 모드
- [x] 결과 카드 시스템 (PNG 생성 with html2canvas)
- [x] SNS 공유 기능 (카카오톡, Twitter, Native Share, 복사)
- [x] 온보딩 모달 (3단계 가이드)

### Phase 3: 측정 및 고도화 ✅
- [x] GA4 연동 (이벤트 추적 시스템)
- [x] Vercel Analytics (Web Vitals)
- [x] 성능 최적화 (Lazy Loading, Code Splitting)
- [x] SEO (robots.txt, sitemap.xml, OG 태그)
- [x] 접근성 (ARIA 속성, 키보드 네비게이션)
- [x] 에러 바운더리 (프로덕션 안정성)

### Phase 4: 런칭 🚀
- [ ] GA4 Measurement ID 설정
- [ ] Vercel 배포
- [ ] 베타 테스트

## 🤝 기여

이슈 및 PR은 언제든 환영합니다!

## 📄 라이선스

MIT License

## 🙏 크레딧

- Gemini 2.0 Flash by Google
- Icons by lucide-react
- UI Framework: React + Tailwind CSS
