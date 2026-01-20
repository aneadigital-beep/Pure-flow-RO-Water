
import React, { useState } from 'react';
import { Order } from '../types';
import { TOWN_NAME } from '../constants';

interface OrdersProps {
  orders: Order[];
  upiId: string;
}

const Orders: React.FC<OrdersProps> = ({ orders, upiId }) => {
  const [showQrFor, setShowQrFor] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-gray-100 dark:bg-slate-800 h-24 w-24 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-clock-rotate-left text-4xl text-gray-300 dark:text-slate-600"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">No Orders Yet</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">Your order history will appear here.</p>
      </div>
    );
  }

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'Out for Delivery': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Processing': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  return (
    <div className="space-y-6 text-left">
      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 px-1">Order History</h2>
      <div className="space-y-4">
        {orders.map(order => {
          const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            `upi://pay?pa=${upiId}&pn=${TOWN_NAME}&am=${order.total}&cu=INR&tn=Order_${order.id}`
          )}`;

          return (
            <div key={order.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest block mb-1">Order #{order.id}</span>
                  <h3 className="font-black text-gray-900 dark:text-slate-100 text-lg leading-tight">{order.date}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Customer: {order.userName}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-2 mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">Items Ordered</p>
                {order.items.map(item => (
                  <div key={item.product.id} className="text-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                      <span className="font-bold text-gray-800 dark:text-slate-200">{item.product.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">x {item.quantity}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mb-0.5">Payment</p>
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                      <i className="fas fa-wallet mr-1 text-slate-400"></i> {order.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mb-0.5">Total Amount</p>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-2xl">₹{order.total}</span>
                  </div>
                </div>
                
                {order.paymentMethod === 'UPI/Online' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                  <div className="mt-5 pt-4 border-t border-dashed border-gray-100 dark:border-slate-700">
                    {showQrFor === order.id ? (
                      <div className="bg-gray-50 dark:bg-slate-900 rounded-3xl p-5 text-center space-y-3 animate-in zoom-in-95">
                        <img src={upiQrUrl} alt="UPI QR" className="h-44 w-44 mx-auto rounded-2xl shadow-lg border-4 border-white dark:border-slate-800" />
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 font-black uppercase tracking-widest">Scan & Pay ₹{order.total}</p>
                        <button onClick={() => setShowQrFor(null)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm mt-2">Close QR</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowQrFor(order.id)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <i className="fas fa-qrcode"></i> Show Payment QR
                      </button>
                    )}
                  </div>
                )}
                
                {order.history.length > 1 && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase flex items-center gap-2">
                      <i className="fas fa-clock-rotate-left"></i>
                      Latest Update: {order.history[order.history.length - 1].note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
