
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
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Your Orders</h2>
      <div className="space-y-4">
        {orders.map(order => {
          const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            `upi://pay?pa=${upiId}&pn=${TOWN_NAME}&am=${order.total}&cu=INR&tn=Order_${order.id}`
          )}`;

          return (
            <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">{order.id}</span>
                  <h3 className="font-bold text-gray-800 dark:text-slate-200">{order.date}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                    <i className="fas fa-wallet mr-1"></i> {order.paymentMethod}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 mb-3 text-left">
                {order.items.map(item => (
                  <div key={item.product.id} className="text-sm text-gray-600 dark:text-slate-400 flex justify-between">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="dark:text-slate-200">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-gray-50 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-slate-500">Grand Total</span>
                  <span className="font-black text-gray-800 dark:text-slate-100 text-lg">₹{order.total}</span>
                </div>
                
                {order.paymentMethod === 'UPI/Online' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-slate-700">
                    {showQrFor === order.id ? (
                      <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-4 text-center space-y-3 animate-in zoom-in-95">
                        <img src={upiQrUrl} alt="UPI QR" className="h-40 w-40 mx-auto rounded-lg shadow-md" />
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest">Scan & Pay ₹{order.total}</p>
                        <p className="text-[8px] text-gray-400 italic">UPI: {upiId}</p>
                        <button onClick={() => setShowQrFor(null)} className="text-[10px] font-bold text-blue-600 uppercase">Hide QR</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowQrFor(order.id)}
                        className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900/30"
                      >
                        <i className="fas fa-qrcode"></i> Show Payment QR
                      </button>
                    )}
                  </div>
                )}
                
                {order.history.length > 1 && (
                  <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-2 italic text-left">
                    <i className="fas fa-circle-info mr-1"></i>
                    Latest: {order.history[order.history.length - 1].note}
                  </p>
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
