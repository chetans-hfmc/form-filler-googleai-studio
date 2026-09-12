import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface FormFieldProps {
  label: string;
  name?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, name, required, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor={name} 
          className={cn(
            "block text-sm font-medium transition-colors",
            error ? "text-rose-700 font-semibold" : "text-neutral-700"
          )}
        >
          {label} {required && <span className="text-rose-500 font-bold ml-0.5" title="Mandatory Field">*</span>}
        </label>
      </div>
      {children}
      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function getInputClassName(hasError?: boolean, additional = '') {
  return cn(
    "w-full px-3 py-2 border rounded-md text-sm transition-all focus:outline-none",
    hasError
      ? "border-rose-500 bg-rose-50/25 text-neutral-900 ring-1 ring-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-200"
      : "border-neutral-300 bg-white hover:border-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
    additional
  );
}
