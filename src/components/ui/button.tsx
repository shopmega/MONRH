import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex h-11 items-center justify-center rounded-lg px-6 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50';
    
    let variantStyles = '';
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-[var(--accent)] text-[var(--juris-on-primary)] hover:bg-[var(--accent-dark)]';
        break;
      case 'outline':
        variantStyles = 'border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]';
        break;
      case 'danger':
        variantStyles = 'bg-[var(--err)] text-white hover:bg-[var(--error-ink)]';
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
