import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MobileNavItem {
  label: string;
  icon: string;
  onClick?: (e?: any) => void;
  href?: string;
  to?: string;
}

interface MobileBottomNavProps {
  items: MobileNavItem[];
  className?: string;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items, className = '' }) => {
  const location = useLocation();

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-[100] pb-safe ${className}`}>
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item, index) => {
          const isActive = item.to && location.pathname === item.to;
          
          const content = (
            <div className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 ${
              isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'
            }`}>
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="text-[10px] font-bold">{item.label}</span>
            </div>
          );

          if (item.to) {
            return (
              <Link key={index} to={item.to}>
                {content}
              </Link>
            );
          }

          if (item.href) {
            return (
              <a key={index} href={item.href} onClick={item.onClick}>
                {content}
              </a>
            );
          }

          return (
            <button key={index} onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
