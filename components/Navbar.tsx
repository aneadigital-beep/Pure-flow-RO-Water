
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 shadow-lg px-2 py-2 flex justify-between safe-bottom z-50 transition-colors">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`flex flex-col items-center justify-center w-full relative transition-colors duration-200 ${
            currentView === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <div className="relative">
            <i className={`fas ${tab.icon} text-lg mb-1`}></i>
            {tab.id === 'cart' && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium">{tab.label}</span>
          {currentView === tab.id && (
            <div className="absolute -bottom-2 w-6 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
