// components/ui/FormElements.tsx
import React from 'react';
import { ChevronDown } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export const ResponsiveInput: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-slate-700">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        className={`w-full px-3 py-2.5 text-sm border ${error ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export const ResponsiveSelect: React.FC<SelectProps> = ({ 
  label, 
  options, 
  error, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-slate-700">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          {...props}
          className={`w-full px-3 py-2.5 text-sm border ${error ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${className}`}
        >
          <option value="">Pilih {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};