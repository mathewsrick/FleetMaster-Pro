import React from 'react';
import CurrencyInputField from 'react-currency-input-field';

interface CurrencyInputProps {
  value: string | number;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
  prefix?: string;
  decimalScale?: number;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  placeholder = "0",
  disabled = false,
  className = "",
  label,
  required = false,
  prefix = "$",
  decimalScale = 0,
}) => {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Selecciona todo el contenido cuando el campo recibe focus
    // Esto permite al usuario reemplazar el valor rápidamente
    e.target.select();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <CurrencyInputField
        value={value}
        onValueChange={onValueChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        prefix={prefix}
        decimalsLimit={decimalScale}
        decimalScale={decimalScale}
        groupSeparator=","
        decimalSeparator="."
        allowNegativeValue={false}
        className={`w-full px-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base font-bold transition-all ${
          disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'text-slate-900'
        } ${className}`}
      />
    </div>
  );
};

export default CurrencyInput;
