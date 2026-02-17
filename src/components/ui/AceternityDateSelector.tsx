import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AceternityDateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function AceternityDateSelector({ value, onChange, placeholder = '날짜 선택' }: AceternityDateSelectorProps) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // value prop에서 년/월/일 추출
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m || '');
      setDay(d || '');
    }
  }, [value]);

  // 년/월/일이 모두 선택되면 onChange 호출
  useEffect(() => {
    if (year && month && day) {
      const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      onChange(dateString);
      setIsOpen(false);
    }
  }, [year, month, day, onChange]);

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const displayValue = value
    ? `${year}년 ${month}월 ${day}일`
    : placeholder;

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-cosmic-800/50 border border-cosmic-700',
          'text-starlight-200 text-left',
          'focus:outline-none focus:ring-2 focus:ring-nebula-500/50 focus:border-nebula-500',
          'transition-all duration-300',
          'backdrop-blur-sm',
          'flex items-center justify-between gap-2'
        )}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-nebula-400" />
          <span className={cn(value ? 'text-starlight-200' : 'text-starlight-400/40')}>
            {displayValue}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-nebula-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 p-4 rounded-xl bg-cosmic-900/95 backdrop-blur-xl border border-cosmic-700 shadow-2xl"
          >
            <div className="grid grid-cols-3 gap-3">
              {/* Year */}
              <div className="space-y-2">
                <label className="text-xs text-starlight-300 font-medium">년</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg bg-cosmic-800/80 border border-cosmic-700',
                    'text-sm text-starlight-200',
                    'focus:outline-none focus:ring-2 focus:ring-nebula-500/50',
                    'transition-all'
                  )}
                >
                  <option value="">선택</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div className="space-y-2">
                <label className="text-xs text-starlight-300 font-medium">월</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg bg-cosmic-800/80 border border-cosmic-700',
                    'text-sm text-starlight-200',
                    'focus:outline-none focus:ring-2 focus:ring-nebula-500/50',
                    'transition-all'
                  )}
                >
                  <option value="">선택</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div className="space-y-2">
                <label className="text-xs text-starlight-300 font-medium">일</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg bg-cosmic-800/80 border border-cosmic-700',
                    'text-sm text-starlight-200',
                    'focus:outline-none focus:ring-2 focus:ring-nebula-500/50',
                    'transition-all'
                  )}
                >
                  <option value="">선택</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Close Button */}
            <motion.button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full mt-3 px-4 py-2 rounded-lg bg-nebula-500/20 hover:bg-nebula-500/30 text-nebula-300 text-sm font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              닫기
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
