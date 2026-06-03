'use client';

import React from 'react';
import { getCountryFormat } from '@/lib/countryFormats';

interface PostcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PostcodeInput({
  value,
  onChange,
  countryCode = 'AU',
  label,
  required,
  disabled,
  className,
  id,
}: PostcodeInputProps) {
  const fmt = getCountryFormat(countryCode);
  const displayLabel = label ?? fmt.postcodeLabel;

  return (
    <div className={`w-full ${className || ''}`}>
      {displayLabel && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-2"
        >
          {displayLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={fmt.postcodePlaceholder}
        disabled={disabled}
        required={required}
        className={`flex h-11 w-full rounded-xl border border-[#E5DEEC] bg-white px-4 py-2 text-base
          placeholder:text-gray-400
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D4AA8]
          focus-visible:border-[#5D4AA8] focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${className || ''}`}
      />
    </div>
  );
}
