'use client';

import { useState, useEffect, useCallback } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * DateInput — text input with dd/mm/yyyy display format.
 *
 * - Accepts `value` in yyyy-mm-dd (database format)
 * - Displays in dd/mm/yyyy (Vietnamese format)
 * - Auto-inserts '/' after day and month
 * - onChange returns yyyy-mm-dd
 * - Accepts a `className` for styling (input-glass, input-ios, etc.)
 */
export function DateInput({ value, onChange, className = '', disabled, placeholder = 'dd/mm/yyyy' }: DateInputProps) {
  // ─── Convert yyyy-mm-dd → dd/mm/yyyy ───
  const toDisplay = useCallback((iso: string): string => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }, []);

  const [display, setDisplay] = useState(() => toDisplay(value));

  // Sync display when external `value` changes (e.g. after save)
  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value, toDisplay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Strip non-digits, max 8
    const digits = raw.replace(/\D/g, '').slice(0, 8);

    // Format: dd/mm/yyyy
    let formatted = '';
    if (digits.length > 0) formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4, 8);

    setDisplay(formatted);

    // Return yyyy-mm-dd only when complete
    if (formatted.length === 10) {
      const [d, m, y] = formatted.split('/');
      onChange(`${y}-${m}-${d}`);
    } else {
      // Partial or empty → clear (or pass empty to clear the db field)
      if (formatted === '') onChange('');
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoComplete="off"
    />
  );
}
