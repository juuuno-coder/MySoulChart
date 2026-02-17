import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AceternityButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const AceternityButton = React.forwardRef<HTMLButtonElement, AceternityButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    // Variant 스타일
    const variantClasses = {
      primary: 'nebula-gradient text-white border-transparent shadow-[0_0_20px_rgba(139,92,246,0.3)]',
      secondary: 'bg-cosmic-800 text-starlight-200 border-cosmic-700 hover:bg-cosmic-700',
      outline: 'bg-transparent text-nebula-300 border-nebula-500/50 hover:bg-nebula-500/10',
      ghost: 'bg-transparent text-starlight-300 border-transparent hover:bg-cosmic-800/50',
    };

    // Size 스타일
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          // Base styles
          'relative rounded-xl font-medium transition-all duration-200',
          'border focus:outline-none focus:ring-2 focus:ring-nebula-500/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Variant
          variantClasses[variant],

          // Size
          sizeClasses[size],

          // Custom className
          className
        )}
        disabled={disabled}
        {...props}
      >
        {/* Shimmer effect (primary variant only) */}
        {variant === 'primary' && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['200% 0%', '-200% 0%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Content */}
        <span className="relative z-10">{children as React.ReactNode}</span>
      </motion.button>
    );
  }
);

AceternityButton.displayName = 'AceternityButton';
