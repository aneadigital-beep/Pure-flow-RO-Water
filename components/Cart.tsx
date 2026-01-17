
import React, { useState } from 'react';
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
  
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  // Simple QR generation using a public API (for UI demonstration)
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `upi://pay?pa=${DEFAULT_UPI_ID}&pn=${TOWN_NAME}&am=${total}&cu=INR`
  )}`;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
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
      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Review Items</h2>
      
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.product.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4">
            <img src={item.product.image} className="h-20 w-20 rounded-lg object-cover" alt="" />
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">{item.product.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">₹{item.product.price} / {item.product.unit}</p>
                </div>
                <button onClick={() => onRemove(item.product.id)} className="text-red-400 hover:text-red-600 p-2">
                  <i className="fas fa-trash-can"></i>
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg px-2 py-1">
                  <button 
                    onClick={() => onUpdate(item.product.id, -1)}
                    className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 active:bg-gray-100 dark:active:bg-slate-700"
                  >
                    <i className="fas fa-minus text-xs"></i>
                  </button>
                  <span className="font-semibold text-sm w-4 text-center dark:text-slate-200">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdate(item.product.id, 1)}
                    className="h-6 w-6 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 active:bg-gray-100 dark:active:bg-slate-700"
                  >
                    <i className="fas fa-plus text-xs"></i>
                  </button>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">₹{item.product.price * item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <i className="fas fa-wallet text-blue-500"></i>
            Choose Payment Method
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('COD')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'COD' 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                  : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600'
              }`}
            >
              <i className="fas fa-truck-fast mb-2 text-xl"></i>
              <span className="text-[11px] font-bold uppercase tracking-wider">Cash / At Door</span>
            </button>
            <button
              onClick={() => setPaymentMethod('UPI/Online')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'UPI/Online' 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                  : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-400 dark:text-slate-600'
              }`}
            >
              <i className="fas fa-qrcode mb-2 text-xl"></i>
              <span className="text-[11px] font-bold uppercase tracking-wider">UPI Online</span>
            </button>
          </div>
        </div>

        {paymentMethod === 'UPI/Online' && (
          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase tracking-widest">Scan & Pay Now</h4>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-md border border-white mx-auto">
                <img src={upiQrUrl} alt="UPI QR" className="h-40 w-40" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">UPI ID: {DEFAULT_UPI_ID}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">Please share a screenshot of the payment on WhatsApp after ordering.</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="dark:text-slate-200">₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
            <span>Delivery Fee</span>
            <span className="dark:text-slate-200">₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between font-black text-xl text-gray-800 dark:text-slate-100 pt-3 border-t border-gray-100 dark:border-slate-700">
            <span>Total Payable</span>
            <span className="text-blue-600 dark:text-blue-400">₹{total}</span>
          </div>
        </div>
        
        <button
          onClick={() => onPlaceOrder(paymentMethod)}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-5 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {paymentMethod === 'COD' ? <i className="fas fa-check-circle"></i> : <i className="fas fa-paper-plane"></i>}
          Place Order
        </button>
      </div>
    </div>
  );
};

export default Cart;
