'use client';

import React, { useEffect, useRef } from 'react';
import { getCountryFormat, formatPhoneDigits } from '@/lib/countryFormats';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  countryCode = 'AU',
  label,
  required,
  disabled,
  className,
  id,
}: PhoneInputProps) {
  const fmt = getCountryFormat(countryCode);
  const normalizedRef = useRef(false);

  useEffect(() => {
    if (!normalizedRef.current && value) {
      normalizedRef.current = true;
      const digits = value.replace(/\D/g, '');
      const formatted = formatPhoneDigits(digits, countryCode);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  }, [value, countryCode, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow user to type freely; format digits on the fly
    const digits = raw.replace(/\D/g, '');
    const formatted = formatPhoneDigits(digits, countryCode);
    onChange(formatted);
  };

  return (
    <div className={`w-full ${className || ''}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={`flex h-11 w-full rounded-xl border border-[#E5DEEC] bg-white overflow-hidden
          focus-within:ring-2 focus-within:ring-[#5D4AA8] focus-within:border-[#5D4AA8] focus-within:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {fmt.phonePrefix && (
          <span className="flex items-center px-3 text-sm font-medium text-gray-500 bg-gray-50 border-r border-[#E5DEEC] select-none whitespace-nowrap">
            {fmt.phonePrefix}
          </span>
        )}
        <input
          id={id}
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder={fmt.phonePlaceholder}
          disabled={disabled}
          required={required}
          className="flex-1 px-3 py-2 text-base outline-none bg-transparent placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
