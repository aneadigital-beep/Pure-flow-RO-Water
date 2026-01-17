
import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { DEFAULT_UPI_ID, TOWN_NAME } from '../constants';

interface CartProps {
  items: CartItem[];
  onUpdate: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (method: 'COD' | 'UPI/Online') => void;
  deliveryFee: number;
}

const Cart: React.FC<CartProps> = ({ items, onUpdate, onRemove, onPlaceOrder, deliveryFee }) => {
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI/Online'>('COD');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  // Simple QR generation using a public API (for UI demonstration)
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `upi://pay?pa=${DEFAULT_UPI_ID}&pn=${TOWN_NAME}&am=${total}&cu=INR`
  )}`;

  const handleUpdate = (id: string, delta: number) => {
    setIsUpdating(id);
    onUpdate(id, delta);
    setTimeout(() => setIsUpdating(null), 300);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in duration-500">
        <div className="bg-gray-100 dark:bg-slate-800 h-24 w-24 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-shopping-basket text-4xl text-gray-300 dark:text-slate-600"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">Looks like you haven't added any water cans or plans yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 px-1">Review Items</h2>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.product.id} 
            style={{ animationDelay: `${index * 50}ms` }}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300 fill-mode-both"
          >
            <div className="relative overflow-hidden rounded-lg shrink-0">
               <img src={item.product.image} className="h-20 w-20 object-cover" alt="" />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">{item.product.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">₹{item.product.price} / {item.product.unit}</p>
                </div>
                <button 
                  onClick={() => onRemove(item.product.id)} 
                  className="text-red-400 hover:text-red-600 p-2 transition-transform active:scale-125"
                >
                  <i className="fas fa-trash-can text-sm"></i>
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg px-2 py-1 border border-gray-100 dark:border-slate-800">
                  <button 
                    onClick={() => handleUpdate(item.product.id, -1)}
                    className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 active:bg-gray-100 dark:active:bg-slate-700 transition-all"
                  >
                    <i className="fas fa-minus text-[10px]"></i>
                  </button>
                  <span className={`font-bold text-sm w-4 text-center dark:text-slate-200 transition-all ${isUpdating === item.product.id ? 'scale-125 text-blue-600' : ''}`}>
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => handleUpdate(item.product.id, 1)}
                    className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 active:bg-gray-100 dark:active:bg-slate-700 transition-all"
                  >
                    <i className="fas fa-plus text-[10px]"></i>
                  </button>
                </div>
                <span className={`font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 ${isUpdating === item.product.id ? 'scale-110' : ''}`}>
                  ₹{item.product.price * item.quantity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border-2 border-blue-50 dark:border-blue-900/30 space-y-6 relative overflow-hidden transition-all">
        {/* Subtle Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/5 pointer-events-none"></div>

        <div className="relative z-10">
          <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <i className="fas fa-credit-card text-blue-500"></i>
            Payment Mode
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('COD')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'COD' 
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]' 
                  : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600'
              }`}
            >
              <i className="fas fa-truck-fast mb-2 text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">COD</span>
            </button>
            <button
              onClick={() => setPaymentMethod('UPI/Online')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'UPI/Online' 
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]' 
                  : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600'
              }`}
            >
              <i className="fas fa-qrcode mb-2 text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
            </button>
          </div>
        </div>

        {paymentMethod === 'UPI/Online' && (
          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 animate-in zoom-in-95 duration-300 relative z-10">
            <div className="text-center space-y-4">
              <h4 className="text-[10px] font-bold text-blue-800 dark:text-blue-200 uppercase tracking-widest">Scan to Pay</h4>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-lg border border-white mx-auto transition-transform hover:scale-105 cursor-pointer">
                <img src={upiQrUrl} alt="UPI QR" className="h-40 w-40" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">ID: {DEFAULT_UPI_ID}</p>
                <p className="text-[9px] text-gray-400 dark:text-slate-500 italic">Share screenshot on WhatsApp</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-700 relative z-10">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
              <span>Subtotal</span>
              <span className="dark:text-slate-200">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
              <span>Delivery Fee</span>
              <span className="dark:text-slate-200">₹{deliveryFee}</span>
            </div>
          </div>
          
          <div className="bg-blue-600 dark:bg-blue-500/10 p-5 rounded-2xl flex justify-between items-center transition-all shadow-inner">
            <span className="font-bold text-white dark:text-blue-400 text-sm">Total Payable</span>
            <div className="text-right">
              <span className="text-2xl font-black text-white dark:text-blue-300 block">₹{total}</span>
              <span className="text-[8px] text-blue-100 dark:text-blue-500 font-bold uppercase tracking-widest">All taxes included</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onPlaceOrder(paymentMethod)}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-5 rounded-2xl font-bold shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
          {paymentMethod === 'COD' ? <i className="fas fa-check-circle"></i> : <i className="fas fa-paper-plane"></i>}
          Place Order
        </button>
      </div>
    </div>
  );
};

export default Cart;
