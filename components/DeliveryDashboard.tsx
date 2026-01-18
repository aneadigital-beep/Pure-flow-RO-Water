
import React, { useState } from 'react';
import { Order, User } from '../types';

interface DeliveryDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  user: User;
  isLive?: boolean;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders, onUpdateStatus, user, isLive }) => {
  const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const historyOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

  const handleNavigate = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const handleStatusUpdate = (orderId: string, status: Order['status']) => {
    const note = orderNotes[orderId]?.trim() || `Status updated to ${status}`;
    
    if (status === 'Delivered' && (!orderNotes[orderId] || orderNotes[orderId].trim().length < 3)) {
      alert("Please enter a clear delivery note before completing.");
      return;
    }

    setProcessingId(orderId);
    onUpdateStatus(orderId, status, note);
    
    setTimeout(() => {
      setProcessingId(null);
      if (status === 'Delivered' || status === 'Cancelled') {
        setOrderNotes(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      }
    }, 800);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
      case 'Out for Delivery': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Delivered': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'Cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
      default: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 transition-colors">
      <div className="bg-gradient-to-br from-green-600 to-emerald-500 dark:from-green-700 dark:to-emerald-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h2 className="text-2xl font-black">Staff Portal</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-green-100 text-xs font-medium">{activeOrders.length} Tasks Assigned</p>
              {isLive && (
                <span className="flex items-center gap-1.5 text-[8px] bg-white/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  <span className="h-1 w-1 bg-green-300 rounded-full animate-pulse"></span> Cloud Sync Active
                </span>
              )}
            </div>
          </div>
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <i className="fas fa-truck-pickup text-xl"></i>
          </div>
        </div>
      </div>

      <div className="flex p-1 bg-gray-100 dark:bg-slate-950 rounded-2xl">
        <button onClick={() => setActiveTab('Active')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'Active' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-600'}`}>
          <i className="fas fa-list-check"></i> Active ({activeOrders.length})
        </button>
        <button onClick={() => setActiveTab('History')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'History' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-600'}`}>
          <i className="fas fa-history"></i> History ({historyOrders.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'Active' ? (
          activeOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-bottom-4 transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-mono text-gray-400 dark:text-slate-500">#{order.id}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-slate-100 text-lg">{order.userName}</h4>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-green-600 dark:text-green-400">₹{order.total}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrows-rotate"></i>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Normal Exchange</p>
                  <p className="text-[10px] text-blue-800 dark:text-blue-200">Collect empty bottle from customer</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-start gap-3 text-left border border-gray-100 dark:border-slate-800">
                <i className="fas fa-map-pin text-red-400 dark:text-red-500 mt-1"></i>
                <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed flex-1 font-medium">{order.userAddress}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase ml-1">Comments</label>
                  <textarea 
                    value={orderNotes[order.id] || ''}
                    onChange={(e) => setOrderNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Add comments..."
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs h-16 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-slate-200 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleNavigate(order.userAddress)} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all">
                    <i className="fas fa-diamond-turn-right text-blue-500"></i> Map
                  </button>
                  <button onClick={() => handleCall(order.userMobile)} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all">
                    <i className="fas fa-phone-volume text-green-500"></i> Call
                  </button>
                </div>

                <button 
                  onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                  disabled={processingId === order.id}
                  className="w-full py-5 rounded-2xl bg-green-600 dark:bg-green-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {processingId === order.id ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fas fa-circle-check"></i> Complete Delivery</>}
                </button>
              </div>
            </div>
          ))
        ) : (
          historyOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 flex justify-between items-center mb-3 shadow-sm">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{order.userName}</p>
                </div>
                <p className="text-[10px] text-gray-400">{order.date} • {order.status}</p>
              </div>
              <p className="text-sm font-black text-gray-800 dark:text-slate-100">₹{order.total}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
