import React, { useEffect } from 'react';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
  fullScreenOnMobile?: boolean;
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  showCloseButton = true,
  preventBackdropClose = false,
  fullScreenOnMobile = false
}) => {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventBackdropClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className={`
          relative w-full m-0 bg-white shadow-2xl
          ${fullScreenOnMobile 
            ? 'min-h-screen md:min-h-0 md:m-4 md:rounded-3xl' 
            : 'm-0 sm:m-4 md:rounded-3xl'
          }
          ${maxWidthClasses[maxWidth]}
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente en móvil */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 rounded-t-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                aria-label="Cerrar modal"
              >
                <i className="fa-solid fa-xmark text-lg sm:text-xl"></i>
              </button>
            )}
          </div>
        </div>

        {/* Content con scroll */}
        <div className="overflow-y-auto max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)] md:max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </div>

        {/* Safe area para dispositivos con notch */}
        <div className="h-safe-area-inset-bottom md:hidden"></div>
      </div>
    </div>
  );
};

export default ResponsiveModal;
