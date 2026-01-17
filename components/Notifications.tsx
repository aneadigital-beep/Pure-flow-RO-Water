
import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { getWaterAdvice } from '../services/geminiService';

interface NotificationsProps {
  notifications: AppNotification[];
  onMarkRead: () => void;
  onClear: () => void;
  onBack: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkRead, onClear, onBack }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    // We mark as read when the component mounts, but we can still show the unread
    // state for the current session or until the parent state actually updates.
    onMarkRead();
  }, []);

  const handleSummarize = async () => {
    if (notifications.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    
    const notifText = notifications.map(n => `${n.timestamp}: ${n.title} - ${n.message}`).join('\n');
    const prompt = `Please summarize these app notifications for me in 2 short, friendly sentences: \n${notifText}`;
    
    const aiSummary = await getWaterAdvice(prompt);
    setSummary(aiSummary);
    setIsSummarizing(false);
  };

  if (notifications.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Notifications</h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="bg-gray-100 dark:bg-slate-800 h-24 w-24 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-bell-slash text-4xl text-gray-300 dark:text-slate-600"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Clean Slate!</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">No new alerts for you right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Notifications</h2>
        </div>
        <button 
          onClick={onClear} 
          className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30 active:scale-95 transition-transform"
        >
          Clear All
        </button>
      </div>

      <button 
        onClick={handleSummarize}
        disabled={isSummarizing}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all disabled:opacity-70"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <i className={`fas ${isSummarizing ? 'fa-circle-notch animate-spin' : 'fa-wand-magic-sparkles'}`}></i>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">AI Insight</p>
            <p className="text-sm font-bold">Summarize Recent Activity</p>
          </div>
        </div>
        <i className="fas fa-chevron-right opacity-40 group-hover:translate-x-1 transition-transform"></i>
      </button>

      {summary && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl animate-in zoom-in-95 duration-300 relative text-left">
          <button onClick={() => setSummary(null)} className="absolute top-3 right-3 text-blue-300 dark:text-blue-700 hover:text-blue-500">
            <i className="fas fa-times-circle"></i>
          </button>
          <div className="flex gap-3">
             <i className="fas fa-robot text-blue-600 dark:text-blue-400 mt-1"></i>
             <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed font-medium italic">"{summary}"</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`p-4 rounded-2xl border transition-all flex gap-4 relative text-left ${
              n.isRead ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm'
            }`}
          >
            {!n.isRead && (
              <span className="absolute top-4 right-4 h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse"></span>
            )}
            
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
              n.type === 'order' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 
              n.type === 'delivery' ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-orange-500 dark:bg-orange-600 text-white'
            }`}>
              <i className={`fas ${
                n.type === 'order' ? 'fa-receipt' : 
                n.type === 'delivery' ? 'fa-truck-fast' : 'fa-circle-info'
              }`}></i>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm pr-6">{n.title}</h3>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{n.timestamp}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
