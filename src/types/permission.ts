// 권한/선물 시스템 타입 (Phase 2J)

export interface Permission {
  permissionId: string;       // 고유 권한 토큰
  ownerId: string;            // 차트 소유자 UID
  ownerName: string;          // 소유자 이름
  grantedTo?: string;         // 권한 받은 사람 UID (사용 전에는 null)
  expiresAt: Date;            // 만료 시각 (7일 후)
  usageLimit: number;         // 조회 횟수 제한 (3회)
  usageCount: number;         // 현재 조회 횟수
  createdAt: Date;
  status: 'active' | 'used' | 'expired' | 'revoked';
}

export interface PermissionCheckResult {
  valid: boolean;
  error?: string;
  remainingViews?: number;
}
