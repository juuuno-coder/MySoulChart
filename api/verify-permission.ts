// 권한 검증 및 차트 조회 API (Phase 2J-3)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase-admin';

interface VerifyPermissionRequest {
  permissionId: string;
  viewerId: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않은 메서드입니다' });
  }

  try {
    const { permissionId, viewerId } = req.body as VerifyPermissionRequest;

    // 입력 검증
    if (!permissionId || !viewerId) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
    }

    // 1. 권한 조회
    const permissionRef = db.collection('permissions').doc(permissionId);
    const permissionSnap = await permissionRef.get();

    if (!permissionSnap.exists) {
      return res.status(404).json({ error: '권한을 찾을 수 없습니다' });
    }

    const permission = permissionSnap.data()!;

    // 2. 상태 검증
    if (permission.status !== 'active') {
      return res.status(403).json({
        error:
          permission.status === 'expired'
            ? '권한이 만료되었습니다'
            : permission.status === 'used'
            ? '조회 횟수를 모두 소진했습니다'
            : '취소된 권한입니다',
      });
    }

    // 3. 만료 시간 검증
    const now = new Date();
    const expiresAt = permission.expiresAt.toDate();

    if (now > expiresAt) {
      await permissionRef.update({
        status: 'expired',
      });
      return res.status(403).json({ error: '권한이 만료되었습니다 (7일 경과)' });
    }

    // 4. 사용 횟수 검증
    if (permission.usageCount >= permission.usageLimit) {
      await permissionRef.update({
        status: 'used',
      });
      return res.status(403).json({ error: '조회 횟수를 초과했습니다 (3회 제한)' });
    }

    // 5. 사용 카운트 증가
    const newUsageCount = permission.usageCount + 1;
    await permissionRef.update({
      usageCount: newUsageCount,
      grantedTo: viewerId,
      lastViewedAt: new Date(),
    });

    // 6. 차트 데이터 조회
    const chartRef = db.collection('users').doc(permission.ownerId).doc('userChart');
    const chartSnap = await chartRef.get();

    if (!chartSnap.exists) {
      return res.status(404).json({ error: '차트를 찾을 수 없습니다' });
    }

    const chartData = chartSnap.data();

    // 7. 응답 반환
    return res.status(200).json({
      chart: chartData,
      remainingViews: permission.usageLimit - newUsageCount,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('권한 검증 에러:', error);
    return res.status(500).json({
      error: '권한 검증 중 오류가 발생했습니다',
    });
  }
}
