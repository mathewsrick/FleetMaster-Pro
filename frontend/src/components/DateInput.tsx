import React, { useRef } from 'react';
import { formatDateToISO, formatDateToDisplay } from '@/services/db';

interface DateInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  disabled = false
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    if (isoDate) {
      onChange(isoDate);
    }
  };

  const handleClick = () => {
    if (dateInputRef.current && !disabled) {
      dateInputRef.current.showPicker?.();
    }
  };

  const displayValue = value ? formatDateToDisplay(value) : '';

  return (
    <div className="relative cursor-pointer" onClick={handleClick}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${className} cursor-pointer pr-10`} // padding right for icon
          readOnly
          tabIndex={-1}
        />
        <div className="absolute -right-12 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <i className="fa-solid fa-calendar text-sm"></i>
        </div>
      </div>
      <input
        ref={dateInputRef}
        type="date"
        value={value || ''}
        onChange={handleDatePickerChange}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

export default DateInput;
