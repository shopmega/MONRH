import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-11 px-6 rounded-lg';
    
    let variantStyles = '';
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
        break;
      case 'outline':
        variantStyles = 'border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700';
        break;
      case 'danger':
        variantStyles = 'bg-red-600 text-white hover:bg-red-700';
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
