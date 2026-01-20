
import React, { useState } from 'react';
import { BUSINESS_PHONE, TOWN_NAME } from '../constants';

interface SupportProps {
  onBack: () => void;
  onOpenAssistant: () => void;
}

const Support: React.FC<SupportProps> = ({ onBack, onOpenAssistant }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "When will my water be delivered?",
      a: "Orders placed before 10 AM are delivered on the same day. Orders after 10 AM are delivered within 24 hours."
    },
    {
      q: "How do I pay for my subscription?",
      a: "You can pay via UPI directly in the app or choose Cash on Delivery. Subscriptions are billed monthly."
    },
    {
      q: "Is the water quality tested?",
      a: "Yes! PureFlow water undergoes a 7-stage RO purification process and is tested daily for TDS and pH levels."
    },
    {
      q: "Can I cancel an order?",
      a: "You can cancel any order that hasn't been marked as 'Out for Delivery' directly from your orders tab."
    }
  ];

  const handleCall = () => {
    window.location.href = `tel:${BUSINESS_PHONE}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi ${TOWN_NAME} Support, I need help with my water delivery.`);
    window.open(`https://wa.me/${BUSINESS_PHONE}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 text-left">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Help & Support</h2>
      </div>

      <div className="bg-blue-600 dark:bg-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-black mb-1">Need Immediate Help?</h3>
          <p className="text-blue-100 text-xs mb-6 opacity-90">Our team is available from 8 AM to 8 PM daily.</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleWhatsApp}
              className="bg-white text-blue-600 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              <i className="fab fa-whatsapp text-2xl text-green-500"></i>
              WhatsApp
            </button>
            <button 
              onClick={handleCall}
              className="bg-blue-500 text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg border border-blue-400 active:scale-95 transition-all"
            >
              <i className="fas fa-phone-volume text-xl"></i>
              Call Center
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">AI Assistant</h3>
        <button 
          onClick={onOpenAssistant}
          className="w-full p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm group hover:border-blue-500 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="fas fa-wand-magic-sparkles text-xl"></i>
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Chat with PureFlow AI</p>
              <p className="text-[10px] text-slate-400">Instant answers about water safety & plans</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Common Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{faq.q}</span>
                <i className={`fas fa-chevron-down text-[10px] text-slate-300 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`}></i>
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-700 pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl text-center space-y-2 border border-slate-200/50 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Our Office</p>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">PureFlow Water Plant, Phase 2 Industrial Area</p>
        <p className="text-[10px] text-slate-400">{TOWN_NAME} Township</p>
      </div>
    </div>
  );
};

export default Support;
