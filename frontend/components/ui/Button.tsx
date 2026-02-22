import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

const variantStyles = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primaryDark',
  secondary: 'bg-brand-primaryLight text-brand-primaryDark hover:bg-green-100',
  ghost: 'bg-transparent text-brand-text border border-brand-border hover:bg-slate-50',
  danger: 'bg-brand-danger text-white hover:bg-red-700'
};

const sizeStyles = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base'
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none',
        'hover:scale-[1.02]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
