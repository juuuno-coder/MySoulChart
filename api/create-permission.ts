// 권한 토큰 생성 API (Phase 2J-1)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase-admin';
import { randomBytes } from 'crypto';

interface CreatePermissionRequest {
  ownerId: string;
  ownerName: string;
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
    const { ownerId, ownerName } = req.body as CreatePermissionRequest;

    // 입력 검증
    if (!ownerId || !ownerName) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다' });
    }

    // 권한 토큰 생성 (32자 hex)
    const permissionId = randomBytes(16).toString('hex');

    // 7일 후 만료
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const permission = {
      permissionId,
      ownerId,
      ownerName,
      expiresAt,
      usageLimit: 3,          // 3회 조회 제한
      usageCount: 0,
      createdAt: new Date(),
      status: 'active',
    };

    // Firestore에 저장
    const permissionsRef = db.collection('permissions');
    await permissionsRef.doc(permissionId).set(permission);

    console.log(`권한 생성: ${permissionId} (owner: ${ownerName})`);

    return res.status(200).json({
      permissionId,
      expiresAt: expiresAt.toISOString(),
      usageLimit: 3,
    });
  } catch (error) {
    console.error('권한 생성 에러:', error);
    return res.status(500).json({
      error: '권한 생성 중 오류가 발생했습니다',
    });
  }
}
