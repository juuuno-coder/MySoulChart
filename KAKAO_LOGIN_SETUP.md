# 카카오 로그인 설정 가이드

MySoulChart에 카카오 로그인을 추가하기 위한 단계별 가이드입니다.

---

## 📋 Step 1: 카카오 개발자 콘솔 설정

### 1.1 애플리케이션 생성
1. https://developers.kakao.com 접속 후 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기** 클릭
3. 앱 이름: **MySoulChart** 입력
4. 사업자명: 본인 이름 또는 상호 입력

### 1.2 앱 키 확인
**앱 설정 → 요약 정보**에서 다음 키들을 복사해두세요:
- ✅ **JavaScript 키**: `abcd1234efgh5678...` (클라이언트 사용)
- ✅ **REST API 키**: `wxyz9876stuv5432...` (서버 사용 - 현재 미사용)

### 1.3 플랫폼 등록
**앱 설정 → 플랫폼**에서 Web 플랫폼 추가:

**개발 환경:**
```
http://localhost:3300
```

**프로덕션 환경:**
```
https://your-domain.vercel.app
```

### 1.4 Redirect URI 설정
**제품 설정 → 카카오 로그인 → Redirect URI**:

✅ **활성화 설정** ON으로 변경

**Redirect URI 등록:**
```
http://localhost:3300
https://your-domain.vercel.app
```

### 1.5 동의항목 설정
**제품 설정 → 카카오 로그인 → 동의항목**:

| 항목 | 설정 | 사유 |
|------|------|------|
| 닉네임 | 필수 동의 | 사용자 이름 표시 |
| 프로필 사진 | 선택 동의 | 프로필 이미지 표시 (선택) |
| 카카오계정(이메일) | 선택 동의 | 선택사항 |

---

## 🔐 Step 2: Firebase Admin SDK 설정

카카오 로그인은 Firebase Custom Token 방식으로 작동하므로 **Firebase Admin SDK**가 필요합니다.

### 2.1 Firebase 서비스 계정 키 생성

1. **Firebase Console** 접속: https://console.firebase.google.com
2. 프로젝트 선택: **MySoulChart**
3. **프로젝트 설정** (⚙️ 아이콘) → **서비스 계정** 탭
4. **새 비공개 키 생성** 클릭
5. JSON 파일 다운로드 (예: `mysoulchart-firebase-adminsdk-xxxxx.json`)

**⚠️ 중요:** 이 파일은 절대 Git에 커밋하지 마세요!

### 2.2 서비스 계정 정보 추출

다운로드한 JSON 파일을 열면 다음과 같은 형식입니다:

```json
{
  "type": "service_account",
  "project_id": "mysoulchart",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@mysoulchart.iam.gserviceaccount.com",
  "client_id": "123456789...",
  ...
}
```

다음 3가지 값을 복사해두세요:
- ✅ `project_id`: `mysoulchart`
- ✅ `client_email`: `firebase-adminsdk-xxxxx@mysoulchart.iam.gserviceaccount.com`
- ✅ `private_key`: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`

---

## 🔧 Step 3: 환경 변수 설정

### 3.1 로컬 개발 환경 (`.env.local`)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Gemini API (기존)
GEMINI_API_KEY=your_existing_gemini_key

# Firebase Admin SDK (카카오 로그인용 - 서버 측)
FIREBASE_PROJECT_ID=mysoulchart
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mysoulchart.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQE...
-----END PRIVATE KEY-----
"

# 카카오 JavaScript 키 (클라이언트 측)
VITE_KAKAO_JS_KEY=abcd1234efgh5678ijklmnop
```

**⚠️ 주의사항:**
- `FIREBASE_PRIVATE_KEY`는 따옴표로 감싸고, `\n`을 실제 줄바꿈으로 변환하지 마세요
- `VITE_` 접두사가 붙은 변수만 클라이언트에서 접근 가능합니다

### 3.2 Vercel 프로덕션 환경

Vercel Dashboard → 프로젝트 선택 → **Settings** → **Environment Variables**:

| Key | Value | 설명 |
|-----|-------|------|
| `GEMINI_API_KEY` | `AIza...` | Gemini API 키 (기존) |
| `FIREBASE_PROJECT_ID` | `mysoulchart` | Firebase 프로젝트 ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@...` | Firebase 서비스 계정 이메일 |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | Firebase Private Key (따옴표 없이) |
| `VITE_KAKAO_JS_KEY` | `abcd1234...` | 카카오 JavaScript 키 |

**Environment 선택:** Production, Preview, Development 모두 체크

---

## 📦 Step 4: 필수 패키지 설치

터미널에서 다음 명령어를 실행하세요:

```bash
npm install firebase-admin
```

---

## 🧪 Step 5: 로컬 테스트

### 5.1 개발 서버 실행

```bash
npm run dev
```

### 5.2 카카오 로그인 버튼 추가

원하는 위치(예: `ControlPanel.tsx`)에 KakaoLoginButton 컴포넌트를 추가:

```tsx
import KakaoLoginButton from '../auth/KakaoLoginButton';

// ... 컴포넌트 내부
<div className="p-4">
  <KakaoLoginButton />
</div>
```

### 5.3 테스트 시나리오

1. **카카오 로그인** 버튼 클릭
2. 카카오 계정으로 로그인
3. 동의 화면에서 **동의하고 계속하기**
4. MySoulChart로 리디렉트 → 사용자 정보 표시
5. **로그아웃** 버튼으로 로그아웃 테스트

### 5.4 디버깅

**브라우저 콘솔 확인:**
```
Kakao SDK 초기화 완료
```

**로그인 성공 시:**
```
{nickname}님, 환영합니다!
```

**에러 발생 시:**
- `Kakao SDK가 로드되지 않았습니다` → `index.html`에 Kakao SDK 스크립트 확인
- `VITE_KAKAO_JS_KEY가 설정되지 않았습니다` → `.env.local` 파일 확인
- `카카오 인증 실패` → Firebase Admin SDK 환경 변수 확인

---

## 🚀 Step 6: Vercel 배포

### 6.1 환경 변수 확인

Vercel Dashboard에서 5개의 환경 변수가 모두 설정되었는지 확인:
- [x] `GEMINI_API_KEY`
- [x] `FIREBASE_PROJECT_ID`
- [x] `FIREBASE_CLIENT_EMAIL`
- [x] `FIREBASE_PRIVATE_KEY`
- [x] `VITE_KAKAO_JS_KEY`

### 6.2 재배포

```bash
git add .
git commit -m "feat: 카카오 로그인 추가"
git push origin main
```

Vercel이 자동으로 배포합니다.

### 6.3 프로덕션 도메인 등록

배포 완료 후 Vercel URL (예: `mysoulchart.vercel.app`)을:
1. 카카오 개발자 콘솔 → **플랫폼**에 추가
2. 카카오 개발자 콘솔 → **Redirect URI**에 추가

---

## 🔍 트러블슈팅

### 문제 1: "Kakao SDK가 로드되지 않았습니다"
**해결:** `index.html`에 다음 스크립트가 있는지 확인
```html
<script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
```

### 문제 2: "redirect_uri mismatch"
**해결:** 카카오 개발자 콘솔의 Redirect URI와 실제 도메인이 일치하는지 확인

### 문제 3: "Firebase Admin SDK 인증 실패"
**해결:**
- Vercel 환경 변수에서 `FIREBASE_PRIVATE_KEY`가 올바른지 확인
- Private Key에 `\n`이 포함되어 있는지 확인
- 따옴표로 감싸지 않았는지 확인

### 문제 4: "동의 항목 미동의"
**해결:** 카카오 개발자 콘솔 → **동의항목**에서 닉네임을 **필수 동의**로 설정

---

## 📝 체크리스트

배포 전 최종 확인:

- [ ] 카카오 개발자 콘솔 앱 생성 완료
- [ ] JavaScript 키 복사
- [ ] 플랫폼 등록 (localhost + 프로덕션 도메인)
- [ ] Redirect URI 등록
- [ ] 동의항목 설정 (닉네임 필수)
- [ ] Firebase Admin SDK JSON 파일 다운로드
- [ ] `.env.local` 환경 변수 설정 (5개)
- [ ] Vercel 환경 변수 설정 (5개)
- [ ] `npm install firebase-admin` 실행
- [ ] 로컬 테스트 성공
- [ ] Vercel 배포 완료
- [ ] 프로덕션 도메인 카카오에 등록

---

## 💡 향후 개선 사항

- [ ] 카카오 프로필 정보로 자동 프로필 생성
- [ ] Firestore에 사용자 세션 저장
- [ ] 카카오톡 공유하기 API 연동
- [ ] 소셜 로그인 다변화 (네이버, 구글)

---

**문의사항이 있으면 언제든 질문해주세요!** 🚀
