
import React, { useState, useMemo } from 'react';
import { CartItem } from '../types';
import { TOWN_NAME } from '../constants';

interface CartProps {
  items: CartItem[];
  upiId: string;
  onUpdate: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (method: 'COD' | 'UPI/Online') => void;
  deliveryFee: number;
}

const Cart: React.FC<CartProps> = ({ items, upiId, onUpdate, onRemove, onPlaceOrder, deliveryFee }) => {
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI/Online'>('COD');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [items]);
  
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${TOWN_NAME}&am=${total}&cu=INR&tn=PureFlow_Order`
  )}`;

  const handleUpdate = (id: string, delta: number) => {
    setIsUpdating(id);
    onUpdate(id, delta);
    setTimeout(() => setIsUpdating(null), 300);
  };

  const handleRemove = (id: string) => {
    setIsUpdating(id);
    setTimeout(() => onRemove(id), 200);
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
      <div className="flex justify-between items-center px-1 text-left">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Review Items</h2>
        <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg uppercase tracking-wider">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.product.id} 
            style={{ animationDelay: `${index * 50}ms` }}
            className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300 fill-mode-both transition-all ${isUpdating === item.product.id ? 'scale-[0.98] opacity-50' : ''}`}
          >
            <div className="relative overflow-hidden rounded-xl shrink-0">
               <img src={item.product.image} className="h-20 w-20 object-cover" alt="" />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">{item.product.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">₹{item.product.price} / {item.product.unit}</p>
                </div>
                <button 
                  onClick={() => handleRemove(item.product.id)} 
                  className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors active:scale-125"
                >
                  <i className="fas fa-trash-can text-sm"></i>
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg px-2 py-1 border border-gray-100 dark:border-slate-800">
                  <button 
                    onClick={() => handleUpdate(item.product.id, -1)}
                    className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 active:bg-gray-100 dark:active:bg-slate-700 transition-all shadow-sm"
                  >
                    <i className="fas fa-minus text-[10px]"></i>
                  </button>
                  <span className={`font-bold text-sm w-4 text-center dark:text-slate-200 transition-all ${isUpdating === item.product.id ? 'scale-125 text-blue-600' : ''}`}>
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => handleUpdate(item.product.id, 1)}
                    className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 active:bg-gray-100 dark:active:bg-slate-700 transition-all shadow-sm"
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

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700 space-y-6 relative overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/5 pointer-events-none"></div>

        <div className="relative z-10 text-left">
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
            <i className="fas fa-credit-card text-blue-500"></i>
            Payment Method
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('COD')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                paymentMethod === 'COD' 
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]' 
                  : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600'
              }`}
            >
              <i className="fas fa-truck-fast mb-2 text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash on Delivery</span>
            </button>
            <button
              onClick={() => setPaymentMethod('UPI/Online')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                paymentMethod === 'UPI/Online' 
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-[1.02]' 
                  : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600'
              }`}
            >
              <i className="fas fa-qrcode mb-2 text-xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">UPI / Online</span>
            </button>
          </div>
        </div>

        {paymentMethod === 'UPI/Online' && (
          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 animate-in zoom-in-95 duration-300 relative z-10">
            <div className="text-center space-y-4">
              <h4 className="text-[10px] font-bold text-blue-800 dark:text-blue-200 uppercase tracking-widest">Scan QR to Complete Payment</h4>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-lg border border-white mx-auto transition-transform hover:scale-105 cursor-pointer">
                <img src={upiQrUrl} alt="UPI QR" className="h-40 w-40" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Total: ₹{total}</p>
                <p className="text-[9px] text-gray-400 dark:text-slate-500 italic">UPI ID: {upiId}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-700 relative z-10 text-left">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
              <span>Water Refills</span>
              <span className="dark:text-slate-200 font-bold">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
              <span>Delivery Fee</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">₹{deliveryFee}</span>
            </div>
          </div>
          
          <div className="relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
             
             <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 dark:from-slate-900 dark:to-slate-950 p-5 rounded-[1.5rem] flex justify-between items-center transition-all shadow-xl overflow-hidden border border-white/10 dark:border-blue-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                
                <div className="z-10">
                  <span className="font-bold text-blue-100 dark:text-blue-400 text-xs uppercase tracking-widest">Grand Total</span>
                  <p className="text-[8px] text-blue-200/60 dark:text-slate-500 font-bold uppercase mt-1">Ready for delivery</p>
                </div>
                
                <div className="text-right z-10">
                  <div key={total} className="animate-in zoom-in-95 duration-200 flex items-center justify-end gap-1">
                    <span className="text-sm font-bold text-white/70">₹</span>
                    <span className="text-3xl font-black text-white dark:text-blue-300">{total}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
        
        <button
          onClick={() => onPlaceOrder(paymentMethod)}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 dark:shadow-none transition-all active:scale-[0.97] flex items-center justify-center gap-3 relative z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
          <i className={paymentMethod === 'COD' ? "fas fa-check-circle" : "fas fa-shield-check"}></i>
          {paymentMethod === 'COD' ? 'Confirm Order' : 'Pay & Order'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
