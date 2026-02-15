# 바이브 철학관 배포 가이드

## 📋 현재 스택

### Frontend
- React 19 + TypeScript + Vite 6
- Tailwind CSS v4 (npm)
- Google Generative AI (Gemini 2.0 Flash)

### Backend/API
- Vercel Serverless Functions (Node.js)
- API 엔드포인트: `/api/chat`, `/api/analyze-face`

### 배포 플랫폼
- **권장**: Vercel (프론트엔드 + API 함수 통합)
- **선택**: Firebase Hosting (정적 사이트만)

---

## 🚀 Vercel 배포 (권장)

### 1단계: Git 저장소 생성

```bash
# Git 초기화
git init
git add .
git commit -m "feat: 바이브 철학관 초기 버전

- Phase 2A: 인프라 기반 (Vercel Serverless Functions, Tailwind v4)
- Phase 2B: 코드 리팩토링 (커스텀 훅, 컴포넌트 분리)
- Phase 2C: 별자리 모드 추가 (7개 상담 모드)
- 보안: API 키 서버 측 관리, Rate Limiting
"
```

### 2단계: GitHub 저장소 연결

```bash
# GitHub에서 새 저장소 생성 후
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/vibe-philosophy.git
git push -u origin main
```

### 3단계: Vercel 배포

**옵션 A: Vercel CLI (빠른 배포)**
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포 (대화형 설정)
vercel

# 프로덕션 배포
vercel --prod
```

**옵션 B: Vercel 웹 대시보드**
1. https://vercel.com 접속
2. "New Project" 클릭
3. GitHub 저장소 연결
4. Framework Preset: **Vite** (자동 감지)
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. **Environment Variables** 추가:
   - Key: `GEMINI_API_KEY`
   - Value: `YOUR_GEMINI_API_KEY`
8. Deploy 클릭

### 4단계: 배포 확인

배포 URL: `https://your-project-name.vercel.app`

**테스트 체크리스트**:
- [ ] 메인 페이지 로드
- [ ] 프로필 입력
- [ ] 관상 사진 업로드
- [ ] 7가지 모드 전환
- [ ] 채팅 동작
- [ ] 세션 복원 (새로고침 후)

---

## 🔧 환경 변수 설정

### 로컬 개발 (`.env.local`)
```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

### Vercel 프로덕션
Vercel Dashboard → Project Settings → Environment Variables:
- `GEMINI_API_KEY`: Production API Key

---

## 🌐 커스텀 도메인 연결 (선택사항)

### Vercel에서 도메인 추가
1. Vercel Dashboard → Project → Settings → Domains
2. Add Domain 클릭
3. 도메인 입력 (예: `vibe-philosophy.com`)
4. DNS 설정:
   ```
   A Record: 76.76.21.21
   CNAME: cname.vercel-dns.com
   ```

---

## 📊 Firebase 추가 (선택사항)

### Firebase Firestore (데이터 영속성)

```bash
npm install firebase
```

**Firebase 설정** (`src/services/firebase.ts`):
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

**환경 변수 추가**:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- 등등...

**용도**:
- LocalStorage → Firestore 마이그레이션
- 결과 카드 저장
- 사용자 히스토리 (로그인 시)

---

## 🔍 배포 후 모니터링

### Vercel Analytics
- Dashboard → Analytics에서 자동 수집
- 페이지뷰, 성능 지표

### Google Analytics 4 (선택사항)
```typescript
// src/utils/analytics.ts
export const trackEvent = (name: string, params?: any) => {
  if (window.gtag) {
    window.gtag('event', name, params);
  }
};
```

---

## 🐛 트러블슈팅

### API 함수가 404 에러
- `vercel.json`의 `functions` 설정 확인
- `api/` 디렉토리 위치 확인 (루트에 있어야 함)

### 환경 변수가 작동하지 않음
- Vercel Dashboard에서 환경 변수 재확인
- Redeploy 실행 (환경 변수 변경 후 재배포 필요)

### CORS 에러
- `api/chat.ts`, `api/analyze-face.ts`에 이미 CORS 헤더 설정됨
- `Access-Control-Allow-Origin: *`

### Rate Limiting 초과
- API 함수의 메모리 기반 Rate Limit (분당 20회)
- 프로덕션에서는 Upstash Redis로 업그레이드 권장

---

## 📈 다음 단계

### Phase 3: 측정 및 고도화
- [ ] GA4 연동
- [ ] Upstash Redis (Rate Limiting 고도화)
- [ ] 성능 최적화 (React.memo, useMemo)
- [ ] SEO (OG 메타 태그, sitemap.xml)

### Phase 4: 새 기능
- [ ] 결과 카드 생성 (html2canvas)
- [ ] SNS 공유 (Kakao, Twitter)
- [ ] 온보딩 모달
- [ ] 굿즈 쇼핑몰 연동

---

## 💡 참고 링크

- Vercel 문서: https://vercel.com/docs
- Gemini API: https://ai.google.dev/gemini-api/docs
- Tailwind v4: https://tailwindcss.com/docs
- React 19: https://react.dev
