# 배포 전 체크리스트

## ✅ 코드 준비
- [x] 타입 체크 통과 (`npx tsc --noEmit`)
- [x] 프로덕션 빌드 성공 (`npm run build`)
- [x] API 키가 클라이언트 번들에 포함되지 않음
- [x] vercel.json 설정 완료
- [ ] .gitignore 확인 (.env.local, node_modules, dist)

## ✅ Git 저장소
- [ ] Git 초기화 (`git init`)
- [ ] .gitignore 생성
- [ ] 첫 커밋 생성
- [ ] GitHub 저장소 생성
- [ ] Remote 연결 + 푸시

## ✅ Vercel 배포
- [ ] Vercel 계정 생성
- [ ] Vercel CLI 설치 (`npm i -g vercel`)
- [ ] 프로젝트 배포 (`vercel --prod`)
- [ ] 환경 변수 설정 (GEMINI_API_KEY)
- [ ] 배포 URL 확인

## ✅ 배포 후 테스트
- [ ] 프로필 입력 동작 확인
- [ ] 관상 업로드 동작 확인
- [ ] 모든 모드 (7개) 동작 확인
- [ ] 세션 저장/복원 확인
- [ ] 모바일 반응형 확인

## ✅ 선택사항 (Phase 2+)
- [ ] 커스텀 도메인 연결
- [ ] Firebase Firestore 추가 (데이터 영속성)
- [ ] GA4 추적 코드 추가
- [ ] OG 메타 태그 추가 (소셜 공유)
