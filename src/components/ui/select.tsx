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
          className={`h-11 w-full px-4 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 appearance-none ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-300 focus:border-blue-500'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
