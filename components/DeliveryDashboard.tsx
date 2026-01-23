
import React, { useState } from 'react';
import { Order, User } from '../types';

interface DeliveryDashboardProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  user: User;
  isLive?: boolean;
  onRefresh?: () => void;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders, onUpdateStatus, user, isLive, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'List' | 'Table' | 'History'>('List');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [showDebug, setShowDebug] = useState(false);

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
      alert("Please enter a short note (e.g., 'CASH COLLECTED') before completing.");
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
      case 'Processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  // Standard normalization for debug view: last 10 digits
  const normalize = (id: any) => {
    if (!id) return '';
    const digits = id.toString().replace(/\D/g, '').trim();
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };
  const myNormId = normalize(user.mobile || (user as any).id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 transition-colors">
      <div className="bg-gradient-to-br from-green-600 to-emerald-500 dark:from-green-700 dark:to-emerald-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase tracking-tight">Staff Portal</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-green-100 text-[10px] font-bold uppercase tracking-wider">
                Partner: {user.name}
              </p>
              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full">
                <div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-[8px] font-black uppercase tracking-widest">{isLive ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform">
              <i className="fas fa-rotate text-sm"></i>
            </button>
            <button onClick={() => setShowDebug(!showDebug)} className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform">
              <i className={`fas ${showDebug ? 'fa-bug-slash' : 'fa-bug'} text-sm`}></i>
            </button>
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="bg-slate-900 text-blue-400 p-4 rounded-2xl font-mono text-[10px] space-y-2 border border-blue-500/30 animate-in slide-in-from-top-2 text-left">
          <p className="font-bold border-b border-blue-500/20 pb-1 mb-2 uppercase tracking-widest text-white">Identity Matcher</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="opacity-50">Current User ID:</p>
              <p className="text-white">{user.mobile || (user as any).id || 'N/A'}</p>
            </div>
            <div>
              <p className="opacity-50">Normalized Search ID:</p>
              <p className="text-white bg-blue-500/20 px-1">{myNormId}</p>
            </div>
            <div>
              <p className="opacity-50">Task Match Count:</p>
              <p className="text-white font-black">{orders.length} items</p>
            </div>
            <div>
              <p className="opacity-50">Active Now:</p>
              <p className="text-white font-black">{activeOrders.length} items</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex p-1 bg-gray-100 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800">
        <button onClick={() => setActiveTab('List')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'List' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-600'}`}>
          <i className="fas fa-list"></i> Task Cards
        </button>
        <button onClick={() => setActiveTab('Table')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'Table' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-600'}`}>
          <i className="fas fa-table"></i> Table View
        </button>
        <button onClick={() => setActiveTab('History')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'History' ? 'bg-white dark:bg-slate-800 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-600'}`}>
          <i className="fas fa-history"></i> History
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'List' && (
          activeOrders.length > 0 ? (
            activeOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-bottom-4 text-left transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-mono text-gray-400 dark:text-slate-500">#{order.id}</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-slate-100 text-lg">{order.userName}</h4>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{order.productSummary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-green-600 dark:text-green-400">₹{order.total}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-start gap-3 border border-gray-100 dark:border-slate-800">
                  <i className="fas fa-location-dot text-red-500 mt-1"></i>
                  <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed flex-1 font-medium">{order.userAddress}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase ml-1">Delivery Feedback</label>
                    <textarea 
                      value={orderNotes[order.id] || ''}
                      onChange={(e) => setOrderNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder="e.g. Received Cash, Dropped at Neighbor..."
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs h-16 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-200 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleNavigate(order.userAddress)} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                      <i className="fas fa-diamond-turn-right text-blue-500"></i> Open Maps
                    </button>
                    <button onClick={() => handleCall(order.userMobile)} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                      <i className="fas fa-phone-volume text-green-500"></i> Call
                    </button>
                  </div>

                  <button 
                    onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                    disabled={processingId === order.id}
                    className="w-full py-5 rounded-2xl bg-green-600 dark:bg-green-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {processingId === order.id ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fas fa-circle-check"></i> Complete Job</>}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center animate-in fade-in">
              <i className="fas fa-clipboard-check text-slate-300 dark:text-slate-600 text-5xl mb-4"></i>
              <h3 className="text-slate-800 dark:text-slate-100 font-black uppercase tracking-tight">No Jobs Assigned</h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Assignments will appear here once Admin dispatches them.</p>
            </div>
          )
        )}

        {activeTab === 'Table' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Ref</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {activeOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-mono text-blue-500 mb-1 font-bold">#{order.id}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${order.status === 'Out for Delivery' ? 'text-blue-500' : 'text-yellow-600'}`}>
                          {order.status}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[150px]">{order.userName}</p>
                        <p className="text-[9px] text-slate-400 truncate max-w-[150px] uppercase tracking-widest font-bold">₹{order.total}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setActiveTab('List'); }} className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center ml-auto shadow-sm active:scale-90 transition-transform">
                          <i className="fas fa-eye text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-50 italic">
                        Empty work register
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="space-y-3">
            {historyOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{order.userName}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">{order.date} • {order.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-600 dark:text-green-400">₹{order.total}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">{order.paymentMethod}</p>
                </div>
              </div>
            ))}
            {historyOrders.length === 0 && (
               <div className="py-20 text-center opacity-30">
                 <p className="text-[10px] font-black uppercase tracking-widest italic">No history found</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
