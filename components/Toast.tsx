
import React, { useEffect } from 'react';

interface ToastProps {
  title: string;
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[100] animate-in slide-in-from-top-4 duration-500">
      <div 
        onClick={onClose}
        className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <i className="fas fa-bell text-xs"></i>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-[11px] uppercase tracking-wider leading-none mb-0.5">{title}</h4>
          <p className="text-[10px] text-slate-300 line-clamp-1 font-medium">{message}</p>
        </div>
        <button className="text-slate-500 hover:text-white p-1 transition-colors">
          <i className="fas fa-xmark text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
