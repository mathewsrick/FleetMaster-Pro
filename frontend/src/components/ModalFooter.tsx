import React from 'react';

interface ModalFooterProps {
  children?: React.ReactNode;
  primaryButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    variant?: 'primary' | 'success' | 'danger' | 'warning';
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: string;
  };
  sticky?: boolean;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  primaryButton,
  secondaryButton,
  sticky = true
}) => {
  const getVariantClasses = (variant: string = 'primary') => {
    const variants = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100',
      warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100'
    };
    return variants[variant as keyof typeof variants] || variants.primary;
  };

  return (
    <div 
      className={`
        ${sticky ? 'sticky bottom-0' : ''}
        bg-white border-t border-slate-200 
        px-4 sm:px-6 md:px-8 
        py-3 sm:py-4 md:py-5
        rounded-b-3xl
      `}
    >
      {children ? (
        children
      ) : (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          {secondaryButton && (
            <button
              type="button"
              onClick={secondaryButton.onClick}
              disabled={secondaryButton.disabled}
              className="
                w-full sm:w-auto
                px-4 sm:px-5 md:px-6 
                py-2.5 sm:py-3 
                rounded-xl 
                font-bold text-sm sm:text-base
                bg-slate-100 text-slate-700 
                hover:bg-slate-200 
                transition-all 
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {secondaryButton.icon && <i className={`fa-solid ${secondaryButton.icon}`}></i>}
              {secondaryButton.label}
            </button>
          )}

          {primaryButton && (
            <button
              type="submit"
              onClick={primaryButton.onClick}
              disabled={primaryButton.disabled || primaryButton.loading}
              className={`
                w-full sm:w-auto
                px-4 sm:px-5 md:px-6 
                py-2.5 sm:py-3 
                rounded-xl 
                font-black text-sm sm:text-base
                shadow-lg 
                transition-all 
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${getVariantClasses(primaryButton.variant)}
              `}
            >
              {primaryButton.loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : primaryButton.icon ? (
                <i className={`fa-solid ${primaryButton.icon}`}></i>
              ) : null}
              {primaryButton.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ModalFooter;
