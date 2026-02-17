import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = '영혼의 문을 여는 중...' }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cosmic-950/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        {/* 회전하는 아이콘 - transform만 사용 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="relative"
        >
          <Sparkles className="w-12 h-12 text-nebula-400" />
        </motion.div>

        {/* 메시지 - opacity와 transform만 사용 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-lg font-serif text-starlight-200"
        >
          {message}
        </motion.p>

        {/* 펄스 효과 - transform과 opacity만 사용 */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.95, 1, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="flex gap-1"
        >
          <div className="w-2 h-2 rounded-full bg-nebula-400" />
          <div className="w-2 h-2 rounded-full bg-nebula-400" />
          <div className="w-2 h-2 rounded-full bg-nebula-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}
