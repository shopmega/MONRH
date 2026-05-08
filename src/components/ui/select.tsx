import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={`h-11 w-full px-4 rounded-lg border bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors duration-200 appearance-none ${
            error
              ? 'border-[var(--error-ink)] focus:border-[var(--error-ink)]'
              : 'border-[var(--line)] focus:border-[var(--accent)]'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-[var(--error-ink)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
