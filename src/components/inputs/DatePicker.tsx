import React, { useState, useEffect } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  // value가 변경되면 년/월/일 분리
  useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [value]);

  // 년/월/일 변경 시 전체 날짜 업데이트
  useEffect(() => {
    if (year && month && day) {
      const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      onChange(dateString);
    }
  }, [year, month, day, onChange]);

  // 년도 목록 (현재 년도부터 100년 전까지)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // 월 목록
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 일 목록 (선택된 월에 따라)
  const getDaysInMonth = () => {
    if (!year || !month) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* 년도 */}
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="glass-input px-3 py-3 rounded-xl text-center"
      >
        <option value="">년</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>

      {/* 월 */}
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="glass-input px-3 py-3 rounded-xl text-center"
      >
        <option value="">월</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>

      {/* 일 */}
      <select
        value={day}
        onChange={(e) => setDay(e.target.value)}
        className="glass-input px-3 py-3 rounded-xl text-center"
      >
        <option value="">일</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}일
          </option>
        ))}
      </select>
    </div>
  );
}
