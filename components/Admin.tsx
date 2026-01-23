
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, Product, User } from '../types';

interface AdminProps {
  orders: Order[];
  products: Product[];
  registeredUsers: User[];
  user: User; // The logged-in admin user
  upiId: string;
  deliveryFee: number;
  townZones: string[];
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  onUpdateDeliveryFee: (fee: number) => void;
  onUpdateUpiId: (id: string) => void;
  onUpdateTownZones: (zones: string[]) => void;
  onAssignOrder: (orderId: string, staffMobile: string | undefined) => void;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddStaff: (mobile: string, name: string, primaryStreet: string) => void;
  onUpdateStaffRole: (mobile: string, isDelivery: boolean) => void;
  onUpdateAdminRole: (mobile: string, isAdmin: boolean) => void;
  onUpdateStaffAreas: (mobile: string, areas: string[]) => void;
  onDeleteStaff: (mobile: string) => void;
  onBack: () => void;
  isCloudSynced: boolean;
  onRefresh?: () => void;
}

const Admin: React.FC<AdminProps> = ({ 
  orders, 
  products,
  registeredUsers,
  user,
  upiId,
  deliveryFee,
  townZones,
  onUpdateStatus, 
  onUpdateDeliveryFee,
  onUpdateUpiId,
  onUpdateTownZones,
  onAssignOrder,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onAddStaff,
  onUpdateStaffRole,
  onUpdateAdminRole,
  onUpdateStaffAreas,
  onDeleteStaff,
  onBack,
  isCloudSynced,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Orders' | 'Inventory' | 'Staff' | 'Zones' | 'Settings' | 'Reports'>('Dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  
  const [tempStatus, setTempStatus] = useState<Order['status']>('Pending');
  const [tempStaff, setTempStaff] = useState<string | undefined>(undefined);
  const [adminNote, setAdminNote] = useState('');

  const [settingsForm, setSettingsForm] = useState({ fee: deliveryFee, upi: upiId });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<'idle' | 'saved'>('idle');
  
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDeleteConfirmId, setStaffDeleteConfirmId] = useState<string | null>(null);
  
  const [newZoneName, setNewZoneName] = useState('');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can'
  });

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', mobile: '', primaryStreet: '' });
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMaster = user.adminRole === 'master';

  // Force refresh cloud data on mount to ensure admin sees latest
  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  useEffect(() => {
    if (selectedOrder) {
      setTempStatus(selectedOrder.status);
      setTempStaff(selectedOrder.assignedToMobile || undefined);
      setAdminNote('');
    }
  }, [selectedOrder]);

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'Delivered');
    const pending = orders.filter(o => o.status === 'Pending');
    const processing = orders.filter(o => o.status === 'Processing');
    const outForDelivery = orders.filter(o => o.status === 'Out for Delivery');
    const cancelled = orders.filter(o => o.status === 'Cancelled');

    return {
      revenue: delivered.reduce((sum, o) => sum + o.total, 0),
      deliveredCount: delivered.length,
      pendingCount: pending.length,
      processingCount: processing.length,
      outForDeliveryCount: outForDelivery.length,
      cancelledCount: cancelled.length,
      totalCount: orders.length,
      recent: orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 3)
    };
  }, [orders]);

  const deliveryBoys = useMemo(() => registeredUsers.filter(u => u.isDeliveryBoy), [registeredUsers]);

  const getStaffWorkload = (mobile: string) => {
    return orders.filter(o => 
      (o.assignedToMobile === mobile || (o as any).assignedtomobile === mobile) && 
      o.status !== 'Delivered' && 
      o.status !== 'Cancelled'
    ).length;
  };

  const getOrderZone = (order: Order) => {
    const addrLower = order.userAddress.toLowerCase();
    for (const zone of townZones) {
      if (addrLower.includes(zone.toLowerCase())) return zone;
    }
    return null;
  };

  const handleSmartAssign = async () => {
    if (deliveryBoys.length === 0) {
      alert("No staff partners registered for delivery.");
      return;
    }

    setIsAutoAssigning(true);
    const unassigned = orders.filter(o => !o.assignedToMobile && o.status === 'Pending');
    
    if (unassigned.length === 0) {
      alert("No pending unassigned orders found.");
      setIsAutoAssigning(false);
      return;
    }

    const virtualLoads: Record<string, number> = {};
    deliveryBoys.forEach(b => {
      const id = b.mobile || (b as any).id;
      virtualLoads[id] = getStaffWorkload(id);
    });

    for (const order of unassigned) {
      const orderZone = getOrderZone(order);
      const candidates = deliveryBoys.map(staff => {
        const staffId = staff.mobile || (staff as any).id;
        let score = 0;
        if (orderZone && staff.preferredAreas?.includes(orderZone)) score += 100;
        score -= (virtualLoads[staffId] * 5);
        return { staffId, staffName: staff.name, score, zoneMatch: !!(orderZone && staff.preferredAreas?.includes(orderZone)) };
      });

      candidates.sort((a, b) => b.score - a.score);
      const chosen = candidates[0];
      await onAssignOrder(order.id, chosen.staffId);
      await onUpdateStatus(order.id, 'Processing', chosen.zoneMatch ? `Optimized Dispatch (Zone: ${orderZone})` : `Balanced Dispatch`);
      virtualLoads[chosen.staffId]++;
    }

    setIsAutoAssigning(false);
    alert(`Optimized! ${unassigned.length} tasks dispatched with balanced workload.`);
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (filterUnassigned) {
      result = result.filter(o => !o.assignedToMobile && o.status !== 'Delivered' && o.status !== 'Cancelled');
    }
    if (orderSearch.trim()) {
      const search = orderSearch.toLowerCase();
      result = result.filter(o => 
        o.userAddress.toLowerCase().includes(search) || 
        o.userName.toLowerCase().includes(search) ||
        o.id.toLowerCase().includes(search)
      );
    }
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return result;
  }, [orders, orderSearch, filterUnassigned]);

  const filteredStaff = useMemo(() => {
    return registeredUsers
      .filter(u => u.isAdmin || u.isDeliveryBoy)
      .filter(u => 
        u.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
        (u.mobile && u.mobile.includes(staffSearch)) ||
        (u.email && u.email.toLowerCase().includes(staffSearch.toLowerCase()))
      );
  }, [registeredUsers, staffSearch]);

  const toggleStaffArea = (mobile: string, zone: string) => {
    const staff = registeredUsers.find(u => (u.mobile || (u as any).id) === mobile);
    if (!staff) return;
    const currentAreas = staff.preferredAreas || [];
    const newAreas = currentAreas.includes(zone)
      ? currentAreas.filter(z => z !== zone)
      : [...currentAreas, zone];
    onUpdateStaffAreas(mobile, newAreas);
  };

  const handleUpdateTask = () => {
    if (!selectedOrder) return;
    onAssignOrder(selectedOrder.id, tempStaff);
    if (tempStatus !== selectedOrder.status) {
      onUpdateStatus(selectedOrder.id, tempStatus, adminNote || `Updated manually by Admin`);
    }
    setSelectedOrderId(null);
  };

  const handleConfirmStaffDelete = (mobile: string) => {
    onDeleteStaff(mobile);
    setStaffDeleteConfirmId(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...prodForm } as Product);
      setEditingProduct(null);
    } else {
      onAddProduct({ ...prodForm, id: `p-${Date.now()}` } as Product);
      setIsAddingNew(false);
    }
    setProdForm({ name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImg(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdForm(prev => ({ ...prev, image: reader.result as string }));
        setIsProcessingImg(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMaster) return;
    setIsSavingSettings(true);
    onUpdateDeliveryFee(settingsForm.fee);
    onUpdateUpiId(settingsForm.upi);
    setTimeout(() => {
      setIsSavingSettings(false);
      setSaveSettingsStatus('saved');
      setTimeout(() => setSaveSettingsStatus('idle'), 3000);
    }, 800);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.mobile.length === 10 && staffForm.name && staffForm.primaryStreet) {
      onAddStaff(staffForm.mobile, staffForm.name, staffForm.primaryStreet);
      setIsAddingStaff(false);
      setStaffForm({ name: '', mobile: '', primaryStreet: '' });
    }
  };

  return (
    <div className="space-y-6 pb-20 relative text-left px-1">
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col gap-6 relative">
             <div className="flex justify-between items-start">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Manual Dispatch</h3>
                <button onClick={() => setSelectedOrderId(null)} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
             </div>
             <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination Address</p>
                   <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedOrder.userAddress}</p>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Update Status</label>
                   <div className="grid grid-cols-2 gap-2">
                      {(['Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'] as Order['status'][]).map(status => (
                        <button key={status} onClick={() => setTempStatus(status)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${tempStatus === status ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400'}`}>{status}</button>
                      ))}
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Select Delivery Partner</label>
                   <select value={tempStaff || ''} onChange={e => setTempStaff(e.target.value || undefined)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 focus:border-blue-500 outline-none shadow-sm">
                      <option value="">-- No One Assigned --</option>
                      {deliveryBoys.map(boy => {
                        const workload = getStaffWorkload(boy.mobile || (boy as any).id);
                        return (
                          <option key={boy.mobile || (boy as any).id} value={boy.mobile || (boy as any).id}>
                            {boy.name} | Load: {workload} tasks
                          </option>
                        );
                      })}
                   </select>
                </div>
             </div>
             <button onClick={handleUpdateTask} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Update Task</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Admin Management</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isMaster ? 'bg-yellow-400 text-white shadow-sm' : 'bg-blue-100 text-blue-600'}`}>
              {isMaster ? 'Master Control' : 'Operations Manager'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={onRefresh} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"><i className="fas fa-rotate text-sm"></i></button>
           <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide border border-slate-200 dark:border-slate-800">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Zones', 'Settings', 'Reports'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <p className="text-3xl font-black text-slate-900 dark:text-white transition-colors group-hover:text-blue-600">₹{stats.revenue}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Revenue Collected</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
              <p className="text-2xl font-black text-green-600">{stats.deliveredCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Delivered Orders</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
              <p className="text-2xl font-black text-orange-500">{stats.pendingCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Dispatch</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Activity</h3>
                <button onClick={() => setActiveTab('Orders')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest">See All</button>
             </div>
             
             {stats.recent.length > 0 ? (
               <div className="space-y-2">
                 {stats.recent.map(o => (
                   <div key={o.id} onClick={() => { setSelectedOrderId(o.id); setActiveTab('Orders'); }} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm active:scale-95 transition-all">
                      <div className="text-left">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{o.userName}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">{o.productSummary}</p>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${o.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{o.status}</span>
                         <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">₹{o.total}</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recent orders received</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 p-6 rounded-[2rem] shadow-xl flex flex-col sm:flex-row items-center justify-between text-white mb-6 gap-4 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
            <div className="text-left relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-1">
                 <div className="h-2 w-2 bg-yellow-400 rounded-full animate-ping"></div>
                 <h4 className="text-sm font-black uppercase tracking-[0.2em]">Route-Smart Dispatch</h4>
              </div>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest leading-relaxed">AI assigns by street and staff workload</p>
            </div>
            <button 
                onClick={handleSmartAssign} 
                disabled={isAutoAssigning || deliveryBoys.length === 0} 
                className={`relative z-10 w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:bg-blue-50`}
            >
              {isAutoAssigning ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-microchip"></i>}
              Dispatch Optimized
            </button>
          </div>

          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" placeholder="Filter by ID, Street or Customer..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white shadow-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" />
          </div>

          <div className="space-y-3">
            {filteredOrders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border flex flex-col cursor-pointer transition-all shadow-sm border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-900 text-left relative overflow-hidden active:scale-[0.98]">
                {o.assignedToName ? (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
                    <i className="fas fa-truck-fast mr-1"></i> {o.assignedToName}
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl animate-pulse shadow-sm">
                    <i className="fas fa-user-clock mr-1"></i> Unassigned
                  </div>
                )}
                
                <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-black text-sm text-slate-900 dark:text-slate-100">{o.userName}</p>
                        <p className="text-[10px] font-mono text-slate-400">#{o.id}</p>
                    </div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mb-3">{o.productSummary}</p>
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <i className="fas fa-location-arrow text-blue-500 text-[10px] mt-1"></i>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed line-clamp-1">{o.userAddress}</p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="space-y-4 animate-in fade-in">
          {isAddingStaff ? (
             <form onSubmit={handleAddStaffSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4 text-left px-1 shadow-xl">
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest ml-1">New Staff Registration</h3>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Staff Name</label>
                   <input type="text" placeholder="Full Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Mobile Number</label>
                   <input type="tel" placeholder="10-digit number" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Assigned Street (Primary Duty)</label>
                   <select value={staffForm.primaryStreet} onChange={e => setStaffForm({...staffForm, primaryStreet: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 transition-all" required>
                     <option value="">-- Choose Street/Zone --</option>
                     {townZones.map(zone => (
                       <option key={zone} value={zone}>{zone}</option>
                     ))}
                   </select>
                </div>
                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingStaff(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Save Profile</button>
                </div>
             </form>
          ) : (
            <div className="space-y-4 text-left px-1">
              <input type="text" placeholder="Search team members..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              <div className="space-y-3">
                {filteredStaff.map(s => {
                  const workload = getStaffWorkload(s.mobile || (s as any).id);
                  const isS = (s.mobile || (s as any).id) === user.mobile;
                  return (
                    <div key={s.mobile || (s as any).id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 relative overflow-hidden transition-all hover:border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-lg">{s.name.charAt(0)}</div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.name} {isS && '(You)'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <p className="text-[10px] text-slate-400 font-bold">{s.mobile || s.email}</p>
                             {s.isDeliveryBoy && (
                               <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${workload > 3 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                 Load: {workload} tasks
                               </span>
                             )}
                          </div>
                        </div>
                        <div className="flex gap-1 items-center">
                           <button onClick={() => onUpdateStaffRole(s.mobile || (s as any).id || '', !s.isDeliveryBoy)} className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.isDeliveryBoy ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`} title="Delivery Boy"><i className="fas fa-truck-fast"></i></button>
                           {isMaster && (
                             <button onClick={() => onUpdateAdminRole(s.mobile || (s as any).id || '', !s.isAdmin)} className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.isAdmin ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`} title="Admin"><i className="fas fa-crown"></i></button>
                           )}
                           {isMaster && !isS && (
                             staffDeleteConfirmId === (s.mobile || (s as any).id) ? (
                               <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                                 <button onClick={() => handleConfirmStaffDelete(s.mobile || (s as any).id || '')} className="p-2 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase">Yes</button>
                                 <button onClick={() => setStaffDeleteConfirmId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-lg text-[8px] font-black uppercase">No</button>
                               </div>
                             ) : (
                               <button onClick={() => setStaffDeleteConfirmId(s.mobile || (s as any).id || null)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><i className="fas fa-trash-can"></i></button>
                             )
                           )}
                        </div>
                      </div>
                      
                      {s.isDeliveryBoy && (
                        <div className="space-y-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Street Coverage</p>
                          <div className="flex flex-wrap gap-1.5">
                            {townZones.map(zone => (
                              <button 
                                  key={zone}
                                  onClick={() => toggleStaffArea(s.mobile || (s as any).id || '', zone)}
                                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest transition-all border ${s.preferredAreas?.includes(zone) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                              >
                                  {zone}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setIsAddingStaff(true)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Add Staff Member</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Zones' && (
        <div className="space-y-6 animate-in fade-in text-left px-1">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest ml-1">Street Registry</h3>
              {isMaster && (
                <div className="flex gap-2">
                   <input 
                      type="text" 
                      placeholder="New Street Name..." 
                      value={newZoneName} 
                      onChange={e => setNewZoneName(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                   />
                   <button onClick={() => { if (!newZoneName.trim()) return; if (townZones.includes(newZoneName.trim())) return; onUpdateTownZones([...townZones, newZoneName.trim()]); setNewZoneName(''); }} className="px-6 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Add</button>
                </div>
              )}

              <div className="space-y-2">
                 {townZones.map(zone => (
                   <div key={zone} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{zone}</span>
                      {isMaster && (
                        <button onClick={() => onUpdateTownZones(townZones.filter(z => z !== zone))} className="text-red-400 hover:text-red-600 transition-colors"><i className="fas fa-trash-can"></i></button>
                      )}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4 animate-in fade-in">
          {isAddingNew || editingProduct ? (
            <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6 text-left px-1 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest ml-1">{editingProduct ? 'Update Product' : 'Add New Item'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex gap-5">
                <div className="h-28 w-28 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner group">
                  {prodForm.image ? <img src={prodForm.image} className="h-full w-full object-cover" alt="" /> : <i className="fas fa-image text-slate-300 text-2xl"></i>}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-camera text-xl"></i></button>
                </div>
                <div className="flex-1 space-y-4">
                  <input type="text" placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                  <div className="flex gap-2">
                    <input type="number" placeholder="Price" value={prodForm.price || ''} onChange={e => setProdForm({...prodForm, price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                    <input type="text" placeholder="Unit" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-24 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button type="submit" disabled={isProcessingImg || !prodForm.image} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Save to Catalog</button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4 text-left shadow-sm items-center hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors">
                  <img src={p.image} className="h-14 w-14 rounded-xl object-cover shadow-sm border border-slate-100 dark:border-slate-700" alt="" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">₹{p.price} per {p.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingProduct(p); setProdForm(p); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><i className="fas fa-edit text-xs"></i></button>
                    <button onClick={() => { if (window.confirm("Are you sure?")) onDeleteProduct(p.id); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><i className="fas fa-trash-can text-xs"></i></button>
                  </div>
                </div>
              ))}
              <button onClick={() => { setIsAddingNew(true); setEditingProduct(null); setProdForm({ name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can' }); }} className="fixed bottom-24 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform"><i className="fas fa-plus text-lg"></i></button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Settings' && (
        <form onSubmit={handleUpdateSettings} className="space-y-6 animate-in fade-in text-left px-1">
           <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest ml-1">Business Configuration</h3>
                {!isMaster && (
                   <span className="text-[7px] font-black uppercase tracking-widest bg-red-50 text-red-500 px-2 py-1 rounded-lg">View Only</span>
                )}
              </div>
              
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block ml-1">Flat Delivery Fee (₹)</label>
                 <input 
                    type="number" 
                    value={settingsForm.fee} 
                    readOnly={!isMaster}
                    onChange={e => setSettingsForm({...settingsForm, fee: Number(e.target.value)})} 
                    className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-4 px-4 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm ${!isMaster ? 'opacity-60 cursor-not-allowed' : ''}`} 
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block ml-1">Punganur Aquaflow UPI ID</label>
                 <input 
                    type="text" 
                    value={settingsForm.upi} 
                    readOnly={!isMaster}
                    onChange={e => setSettingsForm({...settingsForm, upi: e.target.value})} 
                    placeholder="business@upi" 
                    className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-4 px-4 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 ${!isMaster ? 'opacity-60 cursor-not-allowed' : ''}`} 
                 />
              </div>
              
              {!isMaster && (
                <p className="text-[9px] text-slate-400 italic mt-4">* Contact the Master Admin (9620674013) to change these business settings.</p>
              )}
           </div>
           
           {isMaster && (
             <button type="submit" disabled={isSavingSettings} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] ${saveSettingsStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
               {isSavingSettings ? <i className="fas fa-circle-notch animate-spin"></i> : saveSettingsStatus === 'saved' ? 'Updates Saved!' : 'Save Business Settings'}
             </button>
           )}
        </form>
      )}
    </div>
  );
};

export default Admin;
