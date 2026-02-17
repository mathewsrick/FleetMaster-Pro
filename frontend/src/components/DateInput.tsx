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

  // Manejar el cambio desde el date picker nativo
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    if (isoDate) {
      onChange(isoDate);
    }
  };

  // Abrir el date picker nativo al hacer clic en cualquier parte
  const handleClick = () => {
    if (dateInputRef.current && !disabled) {
      dateInputRef.current.showPicker?.();
    }
  };

  // Convertir el valor ISO a display si existe
  const displayValue = value ? formatDateToDisplay(value) : '';

  return (
    <div className="relative cursor-pointer" onClick={handleClick}>
      {/* Input visible con formato dd/mm/yyyy */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${className} cursor-pointer`}
          readOnly
          tabIndex={-1}
        />
        {/* Icono de calendario */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <i className="fa-solid fa-calendar text-sm"></i>
        </div>
      </div>
      
      {/* Input nativo oculto para el date picker */}
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
