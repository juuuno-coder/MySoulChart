import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AceternityInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;  // 에러 메시지
}

export const AceternityInput = React.forwardRef<HTMLInputElement, AceternityInputProps>(
  ({ className, label, icon, error, type = 'text', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="relative w-full">
        {label && (
          <motion.label
            initial={false}
            animate={{
              top: isFocused || props.value ? '-0.5rem' : '0.75rem',
              fontSize: isFocused || props.value ? '0.75rem' : '0.875rem',
              color: isFocused ? 'rgb(139, 92, 246)' : 'rgb(148, 163, 184)',
            }}
            className="absolute left-3 pointer-events-none transition-all bg-cosmic-900 px-1 z-10"
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-nebula-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-cosmic-800/50 border',
              error ? 'border-red-500' : 'border-cosmic-700',
              'text-starlight-200 placeholder-starlight-400/60',
              'focus:outline-none focus:ring-2',
              error ? 'focus:ring-red-500/50 focus:border-red-500' : 'focus:ring-nebula-500/50 focus:border-nebula-500',
              'transition-all duration-300',
              'backdrop-blur-sm',
              icon && 'pl-10',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Animated border */}
          <motion.div
            initial={false}
            animate={{
              scaleX: isFocused ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              'absolute bottom-0 left-0 right-0 h-0.5 origin-left',
              error ? 'bg-red-500' : 'bg-gradient-to-r from-nebula-500 to-aurora-400'
            )}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AceternityInput.displayName = 'AceternityInput';
