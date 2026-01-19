
import React from 'react';
import { View } from '../types';

interface NavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, cartCount }) => {
  const tabs: { id: View; icon: string; label: string }[] = [
    { id: 'home', icon: 'fa-house', label: 'Home' },
    { id: 'cart', icon: 'fa-cart-shopping', label: 'Cart' },
    { id: 'orders', icon: 'fa-clipboard-list', label: 'Orders' },
    { id: 'profile', icon: 'fa-user', label: 'Profile' },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center py-10 gap-4 z-50 transition-colors duration-300">
      
      <div className="flex flex-col gap-3 w-full px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-16 rounded-2xl relative transition-all duration-300 group ${
              currentView === tab.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-[1.02]' 
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="relative">
              <i className={`fas ${tab.icon} text-lg mb-1 transition-transform group-hover:scale-110 ${currentView === tab.id ? 'text-blue-600 dark:text-blue-400' : ''}`}></i>
              {tab.id === 'cart' && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tighter ${currentView === tab.id ? 'text-blue-600 dark:text-blue-400' : 'opacity-60'}`}>
              {tab.label}
            </span>
            
            {/* Active Indicator Rail */}
            {currentView === tab.id && (
              <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 pb-4">
        <div className="h-px w-8 bg-slate-100 dark:bg-slate-800"></div>
        <button 
           onClick={() => onViewChange('assistant')}
           className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
             currentView === 'assistant' 
               ? 'bg-blue-600 text-white scale-110 shadow-blue-200 dark:shadow-none' 
               : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
           }`}
        >
          <i className="fas fa-wand-magic-sparkles"></i>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
