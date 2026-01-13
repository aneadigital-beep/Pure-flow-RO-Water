
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
    <div className="fixed top-20 left-4 right-4 z-[100] animate-in slide-in-from-top-10 duration-500">
      <div 
        onClick={onClose}
        className="bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <i className="fas fa-bell"></i>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">{title}</h4>
          <p className="text-xs text-gray-300 line-clamp-2">{message}</p>
        </div>
        <button className="text-gray-400 hover:text-white">
          <i className="fas fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
