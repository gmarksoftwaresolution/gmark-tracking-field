import React from 'react';

const Input = React.forwardRef(({ label, error, className = "", ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <input 
        ref={ref}
        className={`px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-shadow ${
          error 
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/50' 
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
        }`}
        {...props} 
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
