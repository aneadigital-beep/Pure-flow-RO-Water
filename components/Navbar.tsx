
import React from 'react';
import { View, User } from '../types';

interface NavbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  cartCount: number;
  user: User | null;
  taskCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, cartCount, user, taskCount = 0 }) => {
  const tabs: { id: View; icon: string; label: string; condition?: boolean; badge?: number }[] = [
    { id: 'home', icon: 'fa-house', label: 'Home' },
    { id: 'cart', icon: 'fa-cart-shopping', label: 'Cart', badge: cartCount },
    { id: 'delivery', icon: 'fa-truck-ramp-box', label: 'Tasks', condition: user?.isDeliveryBoy, badge: taskCount },
    { id: 'admin', icon: 'fa-user-shield', label: 'Admin', condition: user?.isAdmin },
    { id: 'orders', icon: 'fa-clipboard-list', label: 'Orders' },
    { id: 'profile', icon: 'fa-user', label: 'Profile' },
  ];

  const visibleTabs = tabs.filter(tab => tab.condition !== false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-20 h-20 md:h-full bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 shadow-2xl flex md:flex-col items-center justify-around md:justify-start md:py-10 gap-2 md:gap-4 z-50 transition-all duration-300 safe-bottom">
      
      {/* Navigation Links */}
      <div className="flex md:flex-col gap-1 md:gap-3 w-full md:px-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 md:flex-none md:w-full h-16 rounded-2xl relative transition-all duration-300 group ${
              currentView === tab.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-[1.02]' 
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="relative">
              <i className={`fas ${tab.icon} text-lg md:text-xl mb-1 transition-transform group-hover:scale-110 ${currentView === tab.id ? 'text-blue-600 dark:text-blue-400' : ''}`}></i>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`absolute -top-2 -right-2 ${tab.id === 'delivery' ? 'bg-green-500' : 'bg-red-500'} text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in`}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-tighter ${currentView === tab.id ? 'text-blue-600 dark:text-blue-400' : 'opacity-60'}`}>
              {tab.label}
            </span>
            
            {/* Minimalist Active Indicators */}
            {currentView === tab.id && (
              <>
                {/* Desktop Side Bar indicator rail */}
                <div className="hidden md:block absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                {/* Mobile Bottom Bar indicator rail */}
                <div className="md:hidden absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="md:mt-auto hidden md:flex md:flex-col items-center gap-4 px-4 md:px-0 md:pb-4">
        <div className="h-px w-8 bg-slate-100 dark:bg-slate-800"></div>
      </div>
    </nav>
  );
};

export default Navbar;
