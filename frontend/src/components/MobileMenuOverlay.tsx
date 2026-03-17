import React from 'react';

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({ 
  isOpen, 
  onClose, 
  children,
  className = ''
}) => {
  return (
    <div
      className={`fixed inset-0 z-[110] md:hidden transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      } ${className}`}
    >
      {/* Overlay Background */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Menu Panel (Bottom Sheet style on mobile) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl transform transition-transform duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle for Bottom Sheet */}
        <div 
          className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 cursor-pointer" 
          onClick={onClose}
        />
        
        <div className="p-8 space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
