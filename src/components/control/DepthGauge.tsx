import React from 'react';
import { Sparkles } from 'lucide-react';

interface DepthGaugeProps {
  depthScore: number;
}

const DepthGauge: React.FC<DepthGaugeProps> = ({ depthScore }) => {
  return (
    <div className="glass-panel rounded-xl p-4 border border-void-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className={depthScore >= 90 ? "text-emerald-400 animate-pulse" : "text-gold-400"} />
        <span className="text-sm font-medium text-gray-300">심층 분석도</span>
      </div>
      <div className="relative h-3 bg-void-900 rounded-full overflow-hidden border border-void-700/30">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            depthScore >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
            depthScore >= 60 ? 'bg-gradient-to-r from-gold-500 to-gold-400' :
            'bg-gradient-to-r from-gray-600 to-gray-500'
          }`}
          style={{ width: `${depthScore}%` }}
        />
      </div>
      <div className="mt-2 text-right">
        <span className={`text-xl font-bold ${
          depthScore >= 90 ? 'text-emerald-400' :
          depthScore >= 60 ? 'text-gold-200' :
          'text-gray-400'
        }`}>
          {depthScore}%
        </span>
      </div>
    </div>
  );
};

export default DepthGauge;
