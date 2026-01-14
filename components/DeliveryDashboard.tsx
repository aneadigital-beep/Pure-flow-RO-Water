
import React, { useState } from 'react';
import { Order, User } from '../types';

interface DeliveryDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  user: User;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders, onUpdateStatus, user }) => {
  const [activeTab, setActiveTab] = useState<'Pending' | 'History'>('Pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  
  const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const historyOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

  const handleNavigate = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const handleStatusUpdate = (orderId: string, status: Order['status']) => {
    const note = orderNotes[orderId]?.trim();
    if (status === 'Delivered' && !note) {
      alert("Please add a short delivery note/comment before marking as Delivered.");
      return;
    }

    setProcessingId(orderId);
    // Simulation of network delay
    setTimeout(() => {
      onUpdateStatus(orderId, status, note);
      setProcessingId(null);
      setOrderNotes(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 600);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-green-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">Hello, {user.name.split(' ')[0]}!</h2>
            <p className="text-green-100 text-xs font-medium">Manage your {pendingOrders.length} active delivery tasks.</p>
          </div>
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <i className="fas fa-truck-ramp-box text-xl"></i>
          </div>
        </div>
      </div>

      <div className="flex p-1 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => setActiveTab('Pending')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'Pending' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
        >
          Active Tasks ({pendingOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('History')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'History' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
        >
          History ({historyOrders.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'Pending' ? (
          pendingOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-circle-check text-2xl opacity-20"></i>
              </div>
              <p className="text-sm font-medium">No active tasks assigned.</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-mono text-gray-400">#{order.id}</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800">{order.userName}</h4>
                    <button 
                      onClick={() => handleCall(order.userMobile)}
                      className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-0.5"
                    >
                      <i className="fas fa-phone-alt text-[9px]"></i>
                      {order.userMobile}
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-600">₹{order.total}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-3 flex items-start gap-3">
                  <i className="fas fa-location-dot text-gray-400 mt-1"></i>
                  <p className="text-xs text-gray-600 leading-relaxed flex-1">{order.userAddress}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Comments / Notes</label>
                    <textarea 
                      value={orderNotes[order.id] || ''}
                      onChange={(e) => setOrderNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder="Add a delivery comment (e.g., Left at gate, Collected cash)..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs h-16 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleNavigate(order.userAddress)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-transform"
                    >
                      <i className="fas fa-map-location-dot"></i> Map
                    </button>
                    <button 
                      onClick={() => handleCall(order.userMobile)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-transform"
                    >
                      <i className="fas fa-phone"></i> Call
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                    <button 
                      onClick={() => handleStatusUpdate(order.id, 'Processing')}
                      disabled={processingId === order.id || order.status === 'Processing'}
                      className={`p-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 ${
                        order.status === 'Processing' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      In Progress
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(order.id, 'Out for Delivery')}
                      disabled={processingId === order.id || order.status === 'Out for Delivery'}
                      className={`p-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 ${
                        order.status === 'Out for Delivery' ? 'bg-blue-500 text-white shadow-lg' : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      Out for Delivery
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                      disabled={processingId === order.id}
                      className="p-2 rounded-xl bg-green-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-40"
                    >
                      {processingId === order.id ? <i className="fas fa-circle-notch animate-spin"></i> : 'Delivered'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          historyOrders.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm italic">No history yet.</div>
          ) : (
            historyOrders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center opacity-80 mb-3 last:mb-0">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-800">{order.userName}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-1 italic">
                    {order.history[order.history.length - 1]?.note || 'No comment'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">₹{order.total}</p>
                  <p className="text-[9px] text-gray-400 uppercase">{order.date}</p>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
