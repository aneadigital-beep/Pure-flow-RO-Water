
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, Product, User } from '../types';

interface AdminProps {
  orders: Order[];
  products: Product[];
  registeredUsers: User[];
  upiId: string;
  deliveryFee: number;
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  onUpdateDeliveryFee: (fee: number) => void;
  onUpdateUpiId: (id: string) => void;
  onAssignOrder: (orderId: string, staffMobile: string | undefined) => void;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddStaff: (mobile: string, name: string) => void;
  onUpdateStaffRole: (mobile: string, isDelivery: boolean) => void;
  onUpdateAdminRole: (mobile: string, isAdmin: boolean) => void;
  onBack: () => void;
  isCloudSynced: boolean;
}

const Admin: React.FC<AdminProps> = ({ 
  orders, 
  products,
  registeredUsers,
  upiId,
  deliveryFee,
  onUpdateStatus, 
  onUpdateDeliveryFee,
  onUpdateUpiId,
  onAssignOrder,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onAddStaff,
  onUpdateStaffRole,
  onUpdateAdminRole,
  onBack,
  isCloudSynced
}) => {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Orders' | 'Inventory' | 'Staff' | 'Settings'>('Dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [tempStatus, setTempStatus] = useState<Order['status']>('Pending');
  const [tempStaff, setTempStaff] = useState<string | undefined>(undefined);
  const [adminNote, setAdminNote] = useState('');

  const [settingsForm, setSettingsForm] = useState({ fee: deliveryFee, upi: upiId });
  const [staffSearch, setStaffSearch] = useState('');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can'
  });

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', mobile: '' });
  
  // Image Fit State
  const [smartCrop, setSmartCrop] = useState(true);
  const [imgDetails, setImgDetails] = useState<{w: number, h: number} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  useEffect(() => {
    if (selectedOrder) {
      setTempStatus(selectedOrder.status);
      setTempStaff(selectedOrder.assignedToMobile);
      setAdminNote('');
    }
  }, [selectedOrder]);

  useEffect(() => {
    setSettingsForm({ fee: deliveryFee, upi: upiId });
  }, [deliveryFee, upiId]);

  useEffect(() => {
    if (editingProduct) setProdForm(editingProduct);
    else {
      setProdForm({ name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can' });
      setImgDetails(null);
    }
  }, [editingProduct, isAddingNew]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => o.status === 'Delivered' ? acc + o.total : acc, 0);
    const pending = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
    return { revenue: totalRevenue, pending };
  }, [orders]);

  const deliveryBoys = useMemo(() => registeredUsers.filter(u => u.isDeliveryBoy), [registeredUsers]);
  
  const filteredStaff = useMemo(() => {
    return registeredUsers.filter(u => {
      const isTeamMember = u.isAdmin || u.isDeliveryBoy;
      if (!isTeamMember) return false;
      const search = staffSearch.toLowerCase();
      return u.name.toLowerCase().includes(search) || u.mobile?.includes(search) || u.email?.toLowerCase().includes(search);
    });
  }, [registeredUsers, staffSearch]);

  const uniqueImages = useMemo(() => {
    const imgs = products.map(p => p.image).filter(img => !!img);
    return Array.from(new Set(imgs));
  }, [products]);

  // Canvas Image Processing for Auto-Square
  const processImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImgDetails({ w: img.width, h: img.height });
      
      if (!smartCrop) {
        setProdForm(prev => ({ ...prev, image: dataUrl }));
        return;
      }

      const size = Math.min(img.width, img.height);
      const canvas = canvasRef.current;
      canvas.width = 800; // Standardize output size
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 800, 800);
        
        // Draw centered square
        const sourceX = (img.width - size) / 2;
        const sourceY = (img.height - size) / 2;
        ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, 800, 800);
        
        const squareDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProdForm(prev => ({ ...prev, image: squareDataUrl }));
      }
    };
    img.src = dataUrl;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTask = () => {
    if (!selectedOrder) return;
    if (tempStaff !== selectedOrder.assignedToMobile) onAssignOrder(selectedOrder.id, tempStaff);
    if (tempStatus !== selectedOrder.status || adminNote) onUpdateStatus(selectedOrder.id, tempStatus, adminNote || `Updated by Admin`);
    alert("Task Updated Successfully");
    setSelectedOrderId(null);
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
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.mobile.length === 10 && staffForm.name) {
      onAddStaff(staffForm.mobile, staffForm.name);
      setIsAddingStaff(false);
      setStaffForm({ name: '', mobile: '' });
    } else alert("Please enter a valid 10-digit mobile number.");
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-10 text-left">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Manage Order #{selectedOrder.id}</h2>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Customer Details</p>
                <h3 className="font-black text-gray-800 dark:text-white text-lg">{selectedOrder.userName}</h3>
                <p className="text-sm text-gray-500">{selectedOrder.userMobile}</p>
             </div>
             <div className="text-right">
                <p className="text-xl font-black text-blue-600">₹{selectedOrder.total}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase">{selectedOrder.paymentMethod}</p>
             </div>
           </div>

           <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Delivery Address</p>
              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">{selectedOrder.userAddress}</p>
           </div>

           <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block ml-1">Current Status</label>
                  <select 
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value as Order['status'])}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block ml-1">Assign Delivery Staff</label>
                  <select 
                    value={tempStaff || ''}
                    onChange={(e) => setTempStaff(e.target.value || undefined)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">-- No Staff Assigned --</option>
                    {deliveryBoys.map(db => (
                      <option key={db.mobile} value={db.mobile}>{db.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase mb-1.5 block ml-1">Admin Note (Internal)</label>
                  <textarea 
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Optional note for status change..."
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm h-20 outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 resize-none"
                  />
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={handleUpdateTask} 
            className="bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-save"></i>
            Update Task
          </button>
          <button 
            onClick={() => setSelectedOrderId(null)} 
            className="bg-white dark:bg-slate-800 text-gray-400 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border border-gray-100 dark:border-slate-700 active:scale-95 transition-all"
          >
            Discard Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Business Control</h2>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isCloudSynced ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${isCloudSynced ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          {isCloudSynced ? 'Live Sync' : 'Offline Mode'}
        </div>
      </div>

      <div className="flex p-1 bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-sack-dollar text-green-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">₹{stats.revenue}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Revenue</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-clock text-orange-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.pending}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Pending</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setIsAddingNew(true)} className="p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-100/50 transition-all active:scale-95">
                <i className="fas fa-plus"></i> Add Product
             </button>
             <button onClick={() => setIsAddingStaff(true)} className="p-4 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-green-100/50 transition-all active:scale-95">
                <i className="fas fa-user-plus"></i> Add Staff
             </button>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-10">No orders found.</p>
          ) : (
            orders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col cursor-pointer hover:border-blue-400 transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">#{o.id}</p>
                    <p className="font-bold text-gray-800 dark:text-slate-100 text-sm">{o.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">₹{o.total}</p>
                    <span className={`text-[8px] font-black uppercase ${o.status === 'Delivered' ? 'text-green-500' : 'text-orange-500'}`}>{o.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-6 animate-in fade-in">
           {/* Image Gallery Section */}
           <div className="space-y-3">
             <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
               <i className="fas fa-images text-blue-500"></i> Media Gallery
             </h3>
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {uniqueImages.map((img, idx) => (
                  <div key={idx} className="h-16 w-16 shrink-0 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-gray-100 dark:bg-slate-900">
                    <img src={img} className="h-full w-full object-cover" alt="System asset" />
                  </div>
                ))}
                {uniqueImages.length === 0 && (
                  <div className="flex items-center gap-3 text-gray-400 italic text-xs py-4">
                    <i className="fas fa-cloud-upload-alt opacity-30"></i> No images uploaded yet.
                  </div>
                )}
             </div>
           </div>

           <div className="flex justify-between items-center px-1">
             <h3 className="font-bold dark:text-white text-sm">Product Catalog</h3>
             <button onClick={() => setIsAddingNew(true)} className="text-[10px] font-black text-blue-600 uppercase">New Entry</button>
           </div>

           <div className="grid grid-cols-1 gap-3">
             {products.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 flex items-center gap-4 shadow-sm group">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-700">
                    {p.image ? (
                      <img src={p.image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-300"><i className="fas fa-image"></i></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-0.5">{p.name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded uppercase">₹{p.price} / {p.unit}</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase">{p.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(p)} className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-400 hover:text-blue-600 transition-colors"><i className="fas fa-pencil text-[10px]"></i></button>
                    <button onClick={() => onDeleteProduct(p.id)} className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-400 hover:text-red-600 transition-colors"><i className="fas fa-trash text-[10px]"></i></button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center px-1">
             <h3 className="font-bold dark:text-white text-sm">Active Staff Members</h3>
             <button onClick={() => setIsAddingStaff(true)} className="text-[10px] font-black text-green-600 uppercase">Add Partner</button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search staff by name or mobile..." 
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 pl-12 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <i className="fas fa-users-gear absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          <div className="space-y-3">
            {filteredStaff.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-10 text-center">No staff members found matching your search.</p>
            ) : (
              filteredStaff.map(u => (
                <div key={u.mobile || u.email} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-slate-900 flex items-center justify-center font-bold text-blue-600">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{u.name}</p>
                        <p className="text-[10px] text-gray-400">{u.mobile || u.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-4 animate-in fade-in">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-widest">Setup</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">UPI ID (QR Destination)</label>
              <input type="text" value={settingsForm.upi} onChange={(e) => setSettingsForm({...settingsForm, upi: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl py-4 px-4 text-sm font-bold dark:text-white outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Delivery Fee (₹)</label>
              <input type="number" value={settingsForm.fee} onChange={(e) => setSettingsForm({...settingsForm, fee: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl py-4 px-4 text-sm font-bold dark:text-white outline-none" />
            </div>
            <button onClick={() => { onUpdateUpiId(settingsForm.upi); onUpdateDeliveryFee(settingsForm.fee); alert("Saved!"); }} className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Business Settings</button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {(isAddingNew || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in">
          <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Edit Item' : 'Add New Item'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="h-10 w-10 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full"><i className="fas fa-times"></i></button>
             </div>

             {/* Live Image Preview & Formatting Controls */}
             <div className="space-y-3">
                <div className="relative group overflow-hidden rounded-2xl">
                  <div className="h-56 w-full bg-gray-50 dark:bg-slate-950 border-2 border-dashed border-gray-100 dark:border-slate-800 flex items-center justify-center relative">
                    {/* Perspective Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-10">
                       <div className="border border-gray-400"></div><div className="border border-gray-400"></div><div className="border border-gray-400"></div>
                       <div className="border border-gray-400"></div><div className="border border-gray-400"></div><div className="border border-gray-400"></div>
                       <div className="border border-gray-400"></div><div className="border border-gray-400"></div><div className="border border-gray-400"></div>
                    </div>
                    
                    {prodForm.image ? (
                      <img 
                        key={`${prodForm.image}-${smartCrop}`} 
                        src={prodForm.image} 
                        className={`h-full w-full object-contain animate-in fade-in zoom-in-95 duration-500`} 
                        alt="Preview" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <i className="fas fa-image text-4xl"></i>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Visual Asset Preview</p>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 flex gap-2">
                       {prodForm.image && (
                         <button 
                           type="button" 
                           onClick={() => setProdForm({...prodForm, image: ''})} 
                           className="h-10 w-10 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center"
                         >
                           <i className="fas fa-trash"></i>
                         </button>
                       )}
                       <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 w-10 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <i className="fas fa-camera"></i>
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>

                {/* Guidance & Auto-Fit Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                   <div className="text-left">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Upload Guidance</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 text-gray-500">1:1 Square</span>
                         <span className="text-[9px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 text-gray-500">800 x 800px</span>
                      </div>
                      {imgDetails && (
                        <p className="text-[8px] text-gray-400 mt-1 font-bold">Source: {imgDetails.w} x {imgDetails.h}</p>
                      )}
                   </div>
                   
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Smart Crop</span>
                      <div 
                        onClick={() => setSmartCrop(!smartCrop)}
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${smartCrop ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'}`}
                      >
                         <div className={`h-3 w-3 bg-white rounded-full transition-transform ${smartCrop ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                   </label>
                </div>
             </div>

             <div className="space-y-4 mt-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-1 tracking-widest">Remote Image URL (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={prodForm.image} 
                    onChange={e => {
                      setProdForm({...prodForm, image: e.target.value});
                      setImgDetails(null);
                    }} 
                    className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-xs dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div className="space-y-3">
                  <input type="text" placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none" required />
                  <textarea placeholder="Description" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm h-20 dark:text-white border border-gray-100 dark:border-slate-800 resize-none outline-none" required />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Price (₹)" value={prodForm.price || ''} onChange={e => setProdForm({...prodForm, price: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none" required />
                    <input type="text" placeholder="Unit (Can/Mo)" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none" required />
                  </div>
                  <select value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value as any})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none">
                      <option value="can">Water Can</option>
                      <option value="subscription">Subscription</option>
                      <option value="accessory">Accessory</option>
                  </select>
                </div>
             </div>
             
             <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4 uppercase tracking-[0.2em] text-[10px]">Commit Catalog Item</button>
          </form>
        </div>
      )}

      {/* Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in">
          <form onSubmit={handleAddStaffSubmit} className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-8 space-y-4 animate-in slide-in-from-bottom-20">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold dark:text-white">Register Staff Partner</h3>
                <button type="button" onClick={() => setIsAddingStaff(false)} className="h-10 w-10 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full"><i className="fas fa-times"></i></button>
             </div>
             <p className="text-xs text-gray-500 mb-2">Manually authorize a new delivery person by their 10-digit mobile number.</p>
             <input type="text" placeholder="Staff Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none" required />
             <input type="tel" placeholder="Mobile (10 digits)" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none" required />
             <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4 uppercase tracking-widest text-xs">Grant Staff Access</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
