
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
      return u.name.toLowerCase().includes(search) || (u.mobile && u.mobile.includes(search)) || (u.email && u.email.toLowerCase().includes(search));
    });
  }, [registeredUsers, staffSearch]);

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
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 800, 800);
        const sourceX = (img.width - size) / 2;
        const sourceY = (img.height - size) / 2;
        ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, 800, 800);
        setProdForm(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.85) }));
      }
    };
    img.src = dataUrl;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => processImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTask = () => {
    if (!selectedOrder) return;
    if (tempStaff !== selectedOrder.assignedToMobile) onAssignOrder(selectedOrder.id, tempStaff);
    if (tempStatus !== selectedOrder.status || adminNote) onUpdateStatus(selectedOrder.id, tempStatus, adminNote || `Updated by Admin`);
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
    } else {
      alert("Valid 10-digit mobile required.");
    }
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDeliveryFee(settingsForm.fee);
    onUpdateUpiId(settingsForm.upi);
    alert("Settings Updated!");
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-10 text-left">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300 transition-transform active:scale-90">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Order Detail</h2>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Customer</p>
                <h3 className="font-black text-slate-800 dark:text-white text-lg">{selectedOrder.userName}</h3>
                <p className="text-sm text-slate-500">{selectedOrder.userMobile}</p>
             </div>
             <div className="text-right">
                <p className="text-xl font-black text-blue-600">₹{selectedOrder.total}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedOrder.paymentMethod}</p>
             </div>
           </div>

           <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Address</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{selectedOrder.userAddress}</p>
           </div>

           <div className="space-y-4 px-0.5">
                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block ml-1">Status</label>
                  <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value as Order['status'])} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block ml-1">Assign Partner</label>
                  <select value={tempStaff || ''} onChange={(e) => setTempStaff(e.target.value || undefined)} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all outline-none">
                    <option value="">-- No Staff --</option>
                    {deliveryBoys.map(db => (
                      <option key={db.mobile} value={db.mobile}>{db.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase mb-1.5 block ml-1">Admin Note</label>
                  <textarea 
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Internal comments..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-20 resize-none transition-all shadow-sm"
                  />
                </div>
           </div>
        </div>

        <button onClick={handleUpdateTask} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Update Task</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative text-left px-0.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Business Control</h2>
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 transition-transform active:scale-90"><i className="fas fa-arrow-left"></i></button>
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-sack-dollar text-green-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-slate-900 dark:text-white">₹{stats.revenue}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-clock text-orange-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.pending}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
            </div>
          </div>
          
          <div className="bg-blue-600 dark:bg-blue-800 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
             <div className="space-y-1">
               <h3 className="text-lg font-black">Quick Action</h3>
               <p className="text-xs text-blue-100 font-medium">Add staff or manage catalog</p>
             </div>
             <div className="flex gap-2">
                <button onClick={() => { setActiveTab('Staff'); setIsAddingStaff(true); }} className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"><i className="fas fa-user-plus"></i></button>
                <button onClick={() => { setActiveTab('Inventory'); setIsAddingNew(true); }} className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"><i className="fas fa-plus"></i></button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          {orders.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <i className="fas fa-box-open text-4xl text-slate-200 dark:text-slate-800 mb-4 block"></i>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No orders found yet</p>
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border flex flex-col cursor-pointer transition-colors shadow-sm border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900/50`}>
                <div className="flex justify-between items-center text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{o.userName}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${o.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{o.status}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">{o.date} • {o.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">₹{o.total}</p>
                    <span className="text-[8px] font-black uppercase text-slate-400">{o.paymentMethod}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4 animate-in fade-in">
          {isAddingNew || editingProduct ? (
            <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4 text-left px-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">{editingProduct ? 'Edit Product' : 'Add New Item'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
              </div>

              <div className="space-y-4 px-0.5">
                <div className="flex gap-4">
                  <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0">
                    {prodForm.image ? (
                      <img src={prodForm.image} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <i className="fas fa-image text-slate-300 text-xl"></i>
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input type="text" placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" required />
                    <div className="flex gap-2">
                      <input type="number" placeholder="Price" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: Number(e.target.value)})} className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" required />
                      <input type="text" placeholder="Unit" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-20 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" required />
                    </div>
                  </div>
                </div>
                
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                <textarea placeholder="Product Description..." value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 h-24 resize-none focus:border-blue-500 transition-all shadow-sm" />

                <div className="grid grid-cols-3 gap-2">
                   {(['can', 'subscription', 'accessory'] as const).map(cat => (
                     <button key={cat} type="button" onClick={() => setProdForm({...prodForm, category: cat})} className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${prodForm.category === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'}`}>
                        {cat}
                     </button>
                   ))}
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Product</button>
              </div>
            </form>
          ) : (
            <>
              {products.length === 0 ? (
                 <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <i className="fas fa-layer-group text-4xl text-slate-200 dark:text-slate-800 mb-4 block"></i>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Your catalog is empty</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4 text-left">
                      <img src={p.image} className="h-16 w-16 rounded-xl object-cover shrink-0" alt="" />
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                           <div>
                             <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</h4>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{p.category} • ₹{p.price}/{p.unit}</p>
                           </div>
                           <div className="flex gap-1">
                              <button onClick={() => setEditingProduct(p)} className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900 text-blue-500 hover:bg-blue-50 transition-colors"><i className="fas fa-edit text-xs"></i></button>
                              <button onClick={() => { if(confirm('Delete?')) onDeleteProduct(p.id) }} className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900 text-red-500 hover:bg-red-50 transition-colors"><i className="fas fa-trash-can text-xs"></i></button>
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setIsAddingNew(true)} className="fixed bottom-24 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-in zoom-in-50 z-[60] active:scale-90 transition-transform"><i className="fas fa-plus text-lg"></i></button>
            </>
          )}
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="space-y-4 animate-in fade-in">
          {isAddingStaff ? (
             <form onSubmit={handleAddStaffSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4 text-left px-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">Add New Staff</h3>
                  <button type="button" onClick={() => setIsAddingStaff(false)} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
                </div>
                <div className="space-y-3 px-0.5">
                  <input type="text" placeholder="Staff Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" required />
                  <input type="tel" placeholder="Mobile Number (10 digits)" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" required />
                  <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Register Staff</button>
                </div>
             </form>
          ) : (
            <div className="space-y-4 text-left px-1">
              <div className="relative px-0.5">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text" placeholder="Search team by name or mobile..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>

              <div className="space-y-3 px-0.5">
                {filteredStaff.length === 0 ? (
                  <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <i className="fas fa-users-slash text-4xl text-slate-200 dark:text-slate-800 mb-4 block"></i>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No staff found matching search</p>
                  </div>
                ) : (
                  filteredStaff.map(s => (
                    <div key={s.mobile || s.email} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center font-black text-blue-600">{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{s.mobile || s.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                         <button onClick={() => onUpdateStaffRole(s.mobile || s.email || '', !s.isDeliveryBoy)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all ${s.isDeliveryBoy ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-50 border-slate-300 text-slate-400'}`}>
                           <i className="fas fa-truck-fast mr-2"></i> {s.isDeliveryBoy ? 'Staff Active' : 'Make Staff'}
                         </button>
                         <button onClick={() => onUpdateAdminRole(s.mobile || s.email || '', !s.isAdmin)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all ${s.isAdmin ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-slate-50 border-slate-300 text-slate-400'}`}>
                           <i className="fas fa-crown mr-2"></i> {s.isAdmin ? 'Admin' : 'Make Admin'}
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setIsAddingStaff(true)} className="w-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-dashed border-blue-200 dark:border-blue-900/50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors active:scale-95">
                <i className="fas fa-user-plus"></i> Add New Team Member
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Settings' && (
        <form onSubmit={handleUpdateSettings} className="space-y-6 animate-in fade-in text-left px-1">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6 px-1">
              <div className="px-0.5">
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block">Global Delivery Fee</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input type="number" value={settingsForm.fee} onChange={e => setSettingsForm({...settingsForm, fee: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl py-4 pl-10 pr-4 font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" />
                 </div>
              </div>

              <div className="px-0.5">
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block">Business UPI ID</label>
                 <div className="relative">
                    <i className="fas fa-qrcode absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" value={settingsForm.upi} onChange={e => setSettingsForm({...settingsForm, upi: e.target.value})} placeholder="example@upi" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-slate-200 focus:border-blue-500 transition-all shadow-sm" />
                 </div>
                 <p className="text-[9px] text-slate-400 font-medium mt-2 italic px-1">This ID will be used to generate dynamic QR codes for customers.</p>
              </div>
           </div>

           <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Update Settings</button>
        </form>
      )}
    </div>
  );
};

export default Admin;
