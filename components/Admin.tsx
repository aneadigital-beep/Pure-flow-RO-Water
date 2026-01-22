
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, Product, User } from '../types';

interface AdminProps {
  orders: Order[];
  products: Product[];
  registeredUsers: User[];
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
}

const Admin: React.FC<AdminProps> = ({ 
  orders, 
  products,
  registeredUsers,
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
  isCloudSynced
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
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

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
      totalCount: orders.length
    };
  }, [orders]);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert("No data available to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] === null || row[header] === undefined ? '' : row[header];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportOrders = () => {
    const exportData = orders.map(o => ({
      OrderID: o.id,
      Date: o.date,
      Customer: o.userName,
      Mobile: o.userMobile,
      Address: o.userAddress,
      Status: o.status,
      Total: o.total,
      Payment: o.paymentMethod,
      Slot: o.deliverySlot || 'N/A',
      Summary: o.productSummary
    }));
    exportToCSV(exportData, 'Punganur_Aquaflow_Orders');
  };

  const handleExportUsers = () => {
    const exportData = registeredUsers.map(u => ({
      Name: u.name,
      Mobile: u.mobile || u.email,
      Zone: u.selectedZone,
      Address: u.address,
      Pincode: u.pincode,
      IsAdmin: u.isAdmin ? 'Yes' : 'No',
      IsStaff: u.isDeliveryBoy ? 'Yes' : 'No'
    }));
    exportToCSV(exportData, 'Punganur_Aquaflow_Customers');
  };

  const handleExportProducts = () => {
    const exportData = products.map(p => ({
      Name: p.name,
      Price: p.price,
      Unit: p.unit,
      Category: p.category,
      Description: p.description
    }));
    exportToCSV(exportData, 'Punganur_Aquaflow_Inventory');
  };

  // High precision street detection logic
  const getOrderZone = (address: string) => {
    const addrLower = address.toLowerCase();
    for (const zone of townZones) {
      if (addrLower.includes(zone.toLowerCase())) return zone;
    }
    return null;
  };

  const deliveryBoys = useMemo(() => registeredUsers.filter(u => u.isDeliveryBoy), [registeredUsers]);

  const filteredStaff = useMemo(() => {
    return registeredUsers
      .filter(u => u.isAdmin || u.isDeliveryBoy) // Only show staff members, not regular customers
      .filter(u => 
        u.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
        (u.mobile && u.mobile.includes(staffSearch)) ||
        (u.email && u.email.toLowerCase().includes(staffSearch.toLowerCase()))
      );
  }, [registeredUsers, staffSearch]);

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

    let matchCount = 0;

    for (const order of unassigned) {
      const orderZone = getOrderZone(order.userAddress);
      
      if (orderZone) {
        const matchedStaff = deliveryBoys.find(b => b.preferredAreas?.includes(orderZone));
        
        if (matchedStaff) {
          await onAssignOrder(order.id, matchedStaff.mobile);
          await onUpdateStatus(order.id, 'Processing', `Smart-assigned via Street: ${orderZone}`);
          matchCount++;
          continue;
        }
      }

      const staffWorkload = deliveryBoys.map(boy => ({
        boy,
        count: orders.filter(o => o.assignedToMobile === boy.mobile && o.status !== 'Delivered' && o.status !== 'Cancelled').length
      })).sort((a, b) => a.count - b.count);
      
      const assignedStaff = staffWorkload[0].boy;
      await onAssignOrder(order.id, assignedStaff.mobile);
      await onUpdateStatus(order.id, 'Processing', `Assigned via Load Balancing`);
    }

    setIsAutoAssigning(false);
    alert(`Success! Dispatched ${unassigned.length} orders. ${matchCount} were high-precision street matches.`);
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

    // Sorting: prioritize unassigned orders at the top
    result.sort((a, b) => {
      const aAssigned = !!a.assignedToMobile;
      const bAssigned = !!b.assignedToMobile;
      if (aAssigned !== bAssigned) {
        return aAssigned ? 1 : -1;
      }
      // If both are same status, sort by newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [orders, orderSearch, filterUnassigned]);

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;
    if (townZones.includes(newZoneName.trim())) {
      alert("Street already exists.");
      return;
    }
    onUpdateTownZones([...townZones, newZoneName.trim()]);
    setNewZoneName('');
  };

  const handleRemoveZone = (zone: string) => {
    onUpdateTownZones(townZones.filter(z => z !== zone));
  };

  const toggleStaffArea = (mobile: string, area: string) => {
    const staff = registeredUsers.find(u => u.mobile === mobile);
    if (!staff) return;
    const currentAreas = staff.preferredAreas || [];
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter(a => a !== area)
      : [...currentAreas, area];
    onUpdateStaffAreas(mobile, newAreas);
  };

  const handleUpdateTask = () => {
    if (!selectedOrder) return;
    onAssignOrder(selectedOrder.id, tempStaff);
    onUpdateStatus(selectedOrder.id, tempStatus, adminNote || `Updated by Admin`);
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
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Selected file is too large. Please use an image under 1.5MB.");
        return;
      }
      setIsProcessingImg(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdForm(prev => ({ ...prev, image: reader.result as string }));
        setIsProcessingImg(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Permanent Action: Are you sure you want to delete this product?")) {
      onDeleteProduct(id);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!staffForm.primaryStreet) {
      alert("Please assign a starting Street for this staff member.");
      return;
    }
    if (staffForm.mobile.length === 10 && staffForm.name) {
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
                   {getOrderZone(selectedOrder.userAddress) && (
                     <div className="mt-2 flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase rounded-md">
                         <i className="fas fa-road mr-1"></i> Detected Street: {getOrderZone(selectedOrder.userAddress)}
                       </span>
                     </div>
                   )}
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
                      {deliveryBoys.map(boy => (
                        <option key={boy.mobile} value={boy.mobile}>{boy.name} {boy.preferredAreas?.length ? `(${boy.preferredAreas[0]})` : ''}</option>
                      ))}
                   </select>
                </div>
             </div>
             <button onClick={handleUpdateTask} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Update Dispatch</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Admin Management</h2>
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide border border-slate-200 dark:border-slate-800">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Zones', 'Settings', 'Reports'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
              <p className="text-2xl font-black text-yellow-600">{stats.processingCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Currently Processing</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
              <p className="text-2xl font-black text-blue-500">{stats.outForDeliveryCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Out for Delivery</p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('Reports')}
            className="bg-brand-900 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-center gap-4">
               <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                 <i className="fas fa-file-export text-xl"></i>
               </div>
               <div className="text-left">
                 <h4 className="text-sm font-black uppercase">Export App Data</h4>
                 <p className="text-[10px] opacity-60">Download orders and customer lists</p>
               </div>
            </div>
            <i className="fas fa-chevron-right opacity-40 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      )}

      {activeTab === 'Reports' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left px-1">
          <div className="bg-white dark:bg-slate-800 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                 <i className="fas fa-cloud-arrow-down"></i>
               </div>
               <div>
                 <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Reports & Data Sync</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Export spreadsheets for bookkeeping</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <button 
                  onClick={handleExportOrders}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-colors group"
               >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                      <i className="fas fa-file-csv"></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Export Orders</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">Full history ({orders.length} entries)</p>
                    </div>
                  </div>
                  <i className="fas fa-download text-slate-300 group-hover:text-blue-500 transition-colors"></i>
               </button>

               <button 
                  onClick={handleExportUsers}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-colors group"
               >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Customer Directory</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">{registeredUsers.length} profiles listed</p>
                    </div>
                  </div>
                  <i className="fas fa-download text-slate-300 group-hover:text-blue-500 transition-colors"></i>
               </button>

               <button 
                  onClick={handleExportProducts}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between hover:border-blue-500 transition-colors group"
               >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
                      <i className="fas fa-boxes-stacked"></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Export Inventory</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">{products.length} catalog items</p>
                    </div>
                  </div>
                  <i className="fas fa-download text-slate-300 group-hover:text-blue-500 transition-colors"></i>
               </button>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30">
             <div className="flex gap-4">
                <i className="fas fa-circle-info text-blue-600 mt-1"></i>
                <div className="text-left">
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-200">Data Privacy Note</p>
                  <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 leading-relaxed mt-1">Exported files contain sensitive customer contact details. Ensure they are handled according to Punganur Aquaflow internal security policies.</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-blue-600 dark:bg-blue-500 p-5 rounded-3xl shadow-xl flex items-center justify-between text-white mb-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="text-left relative z-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fas fa-bolt-lightning text-yellow-300"></i> Smart Dispatch
              </h4>
              <p className="text-[9px] font-medium opacity-80 uppercase tracking-widest mt-0.5">Automated street-to-staff matching</p>
            </div>
            <button onClick={handleSmartAssign} disabled={isAutoAssigning || deliveryBoys.length === 0} className={`relative z-10 px-6 py-2.5 rounded-xl bg-white text-blue-600 text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 transition-all`}>
              {isAutoAssigning ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-play"></i>}
              Dispatch All
            </button>
          </div>

          <input type="text" placeholder="Filter by ID or Name..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white shadow-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" />

          <div className="space-y-4">
            {filteredOrders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border flex flex-col cursor-pointer transition-all shadow-sm border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900/50 text-left relative overflow-hidden active:scale-[0.98]">
                {o.assignedToName ? (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                    <i className="fas fa-truck-fast mr-1"></i> {o.assignedToName}
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl animate-pulse">
                    <i className="fas fa-hand-pointer mr-1"></i> Unassigned
                  </div>
                )}
                
                <div className="pt-2">
                    <p className="font-black text-sm text-slate-900 dark:text-slate-100">{o.userName}</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mb-2">{o.productSummary}</p>
                    <div className="flex items-start gap-2 mb-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <i className="fas fa-location-dot text-blue-500 text-[10px] mt-0.5"></i>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest leading-relaxed line-clamp-2">{o.userAddress}</p>
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
                   <select 
                     value={staffForm.primaryStreet} 
                     onChange={e => setStaffForm({...staffForm, primaryStreet: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 transition-all"
                     required
                   >
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
                {filteredStaff.map(s => (
                  <div key={s.mobile || s.email} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center font-black text-blue-600 dark:text-blue-400">{s.name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{s.mobile || s.email}</p>
                      </div>
                      <div className="flex gap-1 items-center">
                         <button onClick={() => onUpdateStaffRole(s.mobile || '', !s.isDeliveryBoy)} className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.isDeliveryBoy ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`} title="Delivery Boy"><i className="fas fa-truck"></i></button>
                         <button onClick={() => onUpdateAdminRole(s.mobile || '', !s.isAdmin)} className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.isAdmin ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`} title="Admin"><i className="fas fa-crown"></i></button>
                         {staffDeleteConfirmId === s.mobile ? (
                           <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                             <button onClick={() => handleConfirmStaffDelete(s.mobile || '')} className="p-2 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase">Yes</button>
                             <button onClick={() => setStaffDeleteConfirmId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-lg text-[8px] font-black uppercase">No</button>
                           </div>
                         ) : (
                           <button onClick={() => setStaffDeleteConfirmId(s.mobile || null)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><i className="fas fa-trash-can"></i></button>
                         )}
                      </div>
                    </div>
                    
                    {s.isDeliveryBoy && (
                      <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Street Coverage</p>
                          <span className="text-[8px] text-blue-500 font-bold uppercase tracking-wider">High-Priority Matches</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {townZones.map(zone => (
                            <button 
                                key={zone}
                                onClick={() => toggleStaffArea(s.mobile || '', zone)}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all border ${s.preferredAreas?.includes(zone) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                            >
                                {zone}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setIsAddingStaff(true)} className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Add Staff Member</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Zones' && (
        <div className="space-y-6 animate-in fade-in text-left px-1">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest ml-1">Street Registry</h3>
              <div className="flex gap-2">
                 <input 
                    type="text" 
                    placeholder="New Street Name..." 
                    value={newZoneName} 
                    onChange={e => setNewZoneName(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                 />
                 <button onClick={handleAddZone} className="px-6 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Add</button>
              </div>

              <div className="space-y-2">
                 {townZones.map(zone => (
                   <div key={zone} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-road text-slate-300"></i>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{zone}</span>
                      </div>
                      <button onClick={() => handleRemoveZone(zone)} className="text-red-400 hover:text-red-600 transition-colors"><i className="fas fa-trash-can"></i></button>
                   </div>
                 ))}
                 {townZones.length === 0 && (
                   <div className="text-center py-10 opacity-30">
                      <i className="fas fa-map-location-dot text-4xl mb-3 block"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">No streets registered yet</p>
                   </div>
                 )}
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
                    <button onClick={() => handleDeleteClick(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><i className="fas fa-trash-can text-xs"></i></button>
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
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest ml-1">Business Configuration</h3>
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block ml-1">Flat Delivery Fee (₹)</label>
                 <input type="number" value={settingsForm.fee} onChange={e => setSettingsForm({...settingsForm, fee: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-4 px-4 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm" />
              </div>
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block ml-1">Punganur Aquaflow UPI ID</label>
                 <input type="text" value={settingsForm.upi} onChange={e => setSettingsForm({...settingsForm, upi: e.target.value})} placeholder="business@upi" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-4 px-4 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" />
              </div>
           </div>
           <button type="submit" disabled={isSavingSettings} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] ${saveSettingsStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
             {isSavingSettings ? <i className="fas fa-circle-notch animate-spin"></i> : saveSettingsStatus === 'saved' ? 'Updates Saved!' : 'Save Business Settings'}
           </button>
        </form>
      )}
    </div>
  );
};

export default Admin;
