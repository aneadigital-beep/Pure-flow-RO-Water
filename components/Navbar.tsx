
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
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-gray-100 dark:border-slate-800 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex items-center justify-around px-2 z-50 safe-bottom">
      
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 group ${
            currentView === tab.id 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400'
          }`}
        >
          <div className="relative">
            <i className={`fas ${tab.icon} text-xl mb-1 transition-transform ${currentView === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}></i>
            {tab.id === 'cart' && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-slate-950">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-tight ${currentView === tab.id ? 'opacity-100' : 'opacity-60'}`}>
            {tab.label}
          </span>
          
          {/* Active Indicator Bar */}
          {currentView === tab.id && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full shadow-[0_2px_10px_rgba(37,99,235,0.4)]"></div>
          )}
        </button>
      ))}

      {/* Floating Assistant Button Integration */}
      <div className="flex-1 flex justify-center h-full items-center">
        <button 
           onClick={() => onViewChange('assistant')}
           className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
             currentView === 'assistant' 
               ? 'bg-blue-600 text-white scale-110 shadow-blue-200' 
               : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
           }`}
        >
          <i className="fas fa-wand-magic-sparkles"></i>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
