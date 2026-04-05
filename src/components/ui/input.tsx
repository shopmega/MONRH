import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`h-11 w-full rounded-lg border bg-[var(--surface)] px-4 text-[var(--foreground)] shadow-sm placeholder:text-[var(--ink-soft)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] ${
            error
              ? "border-[var(--error-ink)] focus:border-[var(--error-ink)]"
              : "border-[var(--line)] focus:border-[var(--accent)]"
          } ${className}`}
          {...props}
        />
        {error ? <p className="mt-1 text-sm text-[var(--error-ink)]">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
