import React, { useEffect, useRef } from 'react';
import { RotateCcw, PlayCircle, X } from 'lucide-react';
import { getSessionTimeAgo } from '../../utils/storage';

interface SessionRestoreModalProps {
  timestamp: number;
  messageCount: number;
  depthScore: number;
  onRestore: () => void;
  onNew: () => void;
}

const SessionRestoreModal: React.FC<SessionRestoreModalProps> = ({
  timestamp,
  messageCount,
  depthScore,
  onRestore,
  onNew,
}) => {
  const timeAgo = getSessionTimeAgo(timestamp);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);

  // Escape 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onNew();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onNew]);

  // 모달 열릴 때 첫 번째 버튼에 자동 포커스
  useEffect(() => {
    restoreButtonRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* 어두운 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onNew} />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-nebula-500/20 shadow-2xl p-6 space-y-5">
        {/* 닫기 버튼 (새로 시작과 동일) */}
        <button
          onClick={onNew}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="모달 닫기"
        >
          <X size={18} />
        </button>

        {/* 제목 */}
        <div className="text-center space-y-2">
          <h2 id="modal-title" className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-nebula-200 to-nebula-400">
            이전 상담 기록이 남아있구나
          </h2>
          <p className="text-sm text-gray-400">
            아직 풀리지 않은 이야기가 있는 것 같은데...
          </p>
        </div>

        {/* 세션 정보 */}
        <div className="glass-panel rounded-xl p-4 space-y-2 border border-cosmic-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">마지막 상담</span>
            <span className="text-nebula-200 font-medium">{timeAgo}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">대화 수</span>
            <span className="text-nebula-200 font-medium">{messageCount}턴</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">심층 분석도</span>
            <span className={`font-medium ${depthScore >= 60 ? 'text-emerald-400' : 'text-nebula-200'}`}>
              {depthScore}%
            </span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-3">
          {/* 이어하기 (메인 액션) */}
          <button
            ref={restoreButtonRef}
            onClick={onRestore}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-nebula-500/30 to-nebula-500/20 border border-nebula-500/30 text-starlight-200 font-medium hover:from-nebula-500/40 hover:to-nebula-500/30 transition-all duration-200"
          >
            <PlayCircle size={18} />
            이어서 상담하기
          </button>

          {/* 새로 시작 */}
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-cosmic-600 text-gray-400 hover:text-gray-200 hover:border-void-500 transition-all duration-200"
          >
            <RotateCcw size={16} />
            새로운 상담 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRestoreModal;
