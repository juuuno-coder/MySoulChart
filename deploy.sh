#!/bin/bash

# 바이브 철학관 - 빠른 배포 스크립트

set -e

echo "🚀 바이브 철학관 배포 시작..."

# 1. 타입 체크
echo "📝 타입 체크 중..."
npx tsc --noEmit

# 2. 프로덕션 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

# 3. Git 저장소 확인
if [ ! -d .git ]; then
  echo "📦 Git 저장소 초기화..."
  git init
  git branch -M main
fi

# 4. 변경사항 커밋
echo "💾 변경사항 커밋 중..."
git add .
git commit -m "deploy: $(date +'%Y-%m-%d %H:%M:%S') 배포" || echo "변경사항 없음"

# 5. Vercel 배포
echo "🌐 Vercel에 배포 중..."
vercel --prod

echo "✅ 배포 완료!"
