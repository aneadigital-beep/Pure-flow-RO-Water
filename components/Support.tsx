
import React, { useState } from 'react';
import { BUSINESS_PHONE, TOWN_NAME } from '../constants';

interface SupportProps {
  onBack: () => void;
}

const Support: React.FC<SupportProps> = ({ onBack }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "When will my water be delivered?",
      a: "Punganur Aquaflow operates in three windows: Morning (8-11 AM), Afternoon (12-3 PM), and Evening (4-7 PM). If you order before 10 AM, you'll receive your water the same day!"
    },
    {
      q: "Why is my order still 'Processing'?",
      a: "This means our Punganur plant has verified your order and is currently loading it onto a delivery van. You will receive an alert once it's 'Out for Delivery' in your street."
    },
    {
      q: "How do I pay for my subscription?",
      a: "You can pay via UPI directly within the App or pay Cash to the delivery partner when they arrive at your home."
    },
    {
      q: "Is the water truly RO purified?",
      a: "Yes! We use a 7-stage RO filtration system located right here in Punganur. We test TDS levels daily to ensure you get the purest water."
    }
  ];

  const handleCall = () => {
    window.location.href = `tel:${BUSINESS_PHONE}`;
  };

  const handleWhatsApp = (context?: string) => {
    const text = context ? `Issue with Punganur Aquaflow Order: ${context}` : `Hi Punganur Aquaflow Team, I need assistance with a water delivery.`;
    const message = encodeURIComponent(text);
    window.open(`https://wa.me/${BUSINESS_PHONE}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 text-left">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Help Center</h2>
      </div>

      <div className="bg-blue-600 dark:bg-blue-700 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-1">Contact Team</h3>
          <p className="text-blue-100 text-[10px] mb-6 opacity-80 uppercase tracking-widest font-bold">Live Support: 8 AM - 8 PM</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleWhatsApp()}
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
              Call Now
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Frequency Asked</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all shadow-sm">
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

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl text-center space-y-1.5 border border-slate-200/50 dark:border-slate-800 shadow-inner">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Main Plant Address</p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Punganur RO-Tech Industrial Park, Sector 4</p>
        <p className="text-[10px] text-slate-400 font-medium">Punganur, Andhra Pradesh - 517247</p>
      </div>
    </div>
  );
};

export default Support;
