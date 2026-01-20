
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<'idle' | 'saved'>('idle');
  const [staffSearch, setStaffSearch] = useState('');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can'
  });

  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropState, setCropState] = useState({ zoom: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', mobile: '' });
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<HTMLDivElement>(null);

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
      return u.name?.toLowerCase().includes(search) || u.mobile?.includes(search);
    });
  }, [registeredUsers, staffSearch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImage(reader.result as string);
        setCropState({ zoom: 1, x: 0, y: 0 });
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const finalizeCrop = () => {
    if (!rawImage) return;
    setIsProcessingImg(true);
    setShowCropper(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Enforce solid white background for consistency
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 800, 800);

        // Container is 288px (w-72)
        const containerSize = 288;
        
        // Math matches the visual translate/scale:
        // Source image is scaled to container height (100% height)
        const displayedHeight = containerSize;
        const displayedWidth = (img.width / img.height) * containerSize;
        
        // Scale of real pixels to displayed pixels
        const scale = img.height / containerSize;
        
        // Final crop size in source image pixels
        const sourceCropSize = img.height / cropState.zoom;
        
        // Center offsets in source pixels
        const sx = (img.width / 2) - (sourceCropSize / 2) - (cropState.x * scale / cropState.zoom);
        const sy = (img.height / 2) - (sourceCropSize / 2) - (cropState.y * scale / cropState.zoom);

        ctx.drawImage(img, sx, sy, sourceCropSize, sourceCropSize, 0, 0, 800, 800);
        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProdForm(prev => ({ ...prev, image: processedDataUrl }));
      }
      setIsProcessingImg(false);
      setRawImage(null);
    };
    img.src = rawImage;
  };

  const handleUpdateTask = () => {
    if (!selectedOrder) return;
    const currentStaffId = tempStaff || undefined;
    if (currentStaffId !== selectedOrder.assignedToMobile) {
      onAssignOrder(selectedOrder.id, currentStaffId);
    }
    onUpdateStatus(selectedOrder.id, tempStatus, adminNote || `Updated by Admin`);
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

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeletingId(id);
    await onDeleteProduct(id);
    setIsDeletingId(null);
    setDeleteConfirmId(null);
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
    if (staffForm.mobile.length === 10 && staffForm.name) {
      onAddStaff(staffForm.mobile, staffForm.name);
      setIsAddingStaff(false);
      setStaffForm({ name: '', mobile: '' });
    }
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - cropState.x, y: clientY - cropState.y });
  };

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setCropState(prev => ({ ...prev, x: clientX - dragStart.x, y: clientY - dragStart.y }));
  };

  if (showCropper && rawImage) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h3 className="text-white font-black uppercase text-sm tracking-[0.3em] mb-2">Perfect 1:1 Crop</h3>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Drag to position • Pinch/Slider to zoom</p>
        </div>
        
        <div 
          ref={cropperRef}
          className="relative w-72 h-72 bg-slate-900 overflow-hidden rounded-3xl border-4 border-white/20 cursor-move shadow-2xl"
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={startDrag}
          onTouchMove={onDrag}
          onTouchEnd={() => setIsDragging(false)}
        >
          <img 
            src={rawImage} 
            className="absolute pointer-events-none select-none max-w-none"
            style={{ 
              transform: `translate(calc(-50% + ${cropState.x}px), calc(-50% + ${cropState.y}px)) scale(${cropState.zoom})`,
              left: '50%',
              top: '50%',
              height: '100%'
            }} 
            alt="To crop" 
          />
          
          {/* Rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
            <div className="border-r border-b border-white/40"></div>
            <div className="border-r border-b border-white/40"></div>
            <div className="border-b border-white/40"></div>
            <div className="border-r border-b border-white/40"></div>
            <div className="border-r border-b border-white/40"></div>
            <div className="border-b border-white/40"></div>
            <div className="border-r border-white/40"></div>
            <div className="border-r border-white/40"></div>
            <div></div>
          </div>
          
          <div className="absolute inset-0 border-[2px] border-blue-500 rounded-2xl pointer-events-none shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"></div>
        </div>

        <div className="w-full max-w-[280px] mt-10 space-y-8">
          <div className="flex items-center gap-5">
            <i className="fas fa-minus text-white/30 text-xs"></i>
            <input 
              type="range" 
              min="1" 
              max="4" 
              step="0.01" 
              value={cropState.zoom} 
              onChange={e => setCropState(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
              className="flex-1 accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none outline-none"
            />
            <i className="fas fa-plus text-white/30 text-xs"></i>
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setShowCropper(false); setRawImage(null); }} className="flex-1 bg-white/5 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={finalizeCrop} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Apply Crop</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative text-left px-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Business Control</h2>
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 transition-transform active:scale-90"><i className="fas fa-arrow-left"></i></button>
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{stats.revenue}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.pending}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          {orders.map(o => (
            <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border flex flex-col cursor-pointer transition-colors shadow-sm border-slate-100 dark:border-slate-700 hover:border-blue-200 text-left">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{o.userName}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mb-1">{o.productSummary || 'Refill Order'}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{o.date} • {o.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 dark:text-white">₹{o.total}</p>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${o.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{o.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4 animate-in fade-in">
          {isAddingNew || editingProduct ? (
            <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6 text-left px-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">{editingProduct ? 'Edit Product' : 'Add New Item'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex gap-5">
                <div className="h-28 w-28 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center relative overflow-hidden shrink-0 group transition-all hover:border-blue-500">
                  {prodForm.image ? (
                    <img 
                      src={prodForm.image} 
                      className={`h-full w-full object-cover transition-all duration-500 ${isProcessingImg ? 'opacity-30 blur-sm scale-95' : 'opacity-100'}`} 
                      alt="" 
                    />
                  ) : (
                    <i className="fas fa-image text-slate-300 text-2xl"></i>
                  )}
                  {isProcessingImg && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fas fa-circle-notch animate-spin text-blue-600 text-xl"></i>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => !isProcessingImg && fileInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-camera text-xl"></i>
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Product Label</label>
                    <input type="text" placeholder="e.g. 20L Premium Can" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm outline-none" required />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Price (₹)</label>
                      <input type="number" placeholder="0" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm outline-none" required />
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unit</label>
                      <input type="text" placeholder="Can" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm outline-none" required />
                    </div>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button 
                type="submit" 
                disabled={isProcessingImg || !prodForm.image} 
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isProcessingImg ? 'Processing 800x800 Image...' : 'Deploy to Catalog'}
              </button>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4 text-left relative overflow-hidden transition-all shadow-sm">
                    <img src={p.image} className="h-16 w-16 rounded-xl object-cover shrink-0" alt="" />
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">₹{p.price}/{p.unit}</p>
                         </div>
                         <div className="flex items-center gap-1">
                            {deleteConfirmId === p.id ? (
                               <div className="flex gap-1 animate-in slide-in-from-right-2">
                                  <button onClick={() => handleConfirmDelete(p.id)} disabled={isDeletingId === p.id} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-90 transition-all">{isDeletingId === p.id ? <i className="fas fa-circle-notch animate-spin"></i> : 'Confirm?'}</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">No</button>
                               </div>
                            ) : (
                               <>
                                  <button onClick={() => setEditingProduct(p)} className="h-9 w-9 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors flex items-center justify-center"><i className="fas fa-edit text-xs"></i></button>
                                  <button onClick={() => handleDeleteClick(p.id)} className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center justify-center"><i className="fas fa-trash-can text-xs"></i></button>
                               </>
                            )}
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsAddingNew(true)} className="fixed bottom-24 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-in zoom-in-50 z-50 active:scale-90 transition-transform"><i className="fas fa-plus text-lg"></i></button>
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
                <div className="space-y-3">
                  <input type="text" placeholder="Staff Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm" required />
                  <input type="tel" placeholder="Mobile Number (10 digits)" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm" required />
                  <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Register Staff</button>
                </div>
             </form>
          ) : (
            <div className="space-y-4 text-left px-1">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Search team..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
              </div>
              <div className="space-y-3">
                {filteredStaff.map(s => (
                  <div key={s.mobile || s.email} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 transition-all">
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
                       <button onClick={() => onUpdateStaffRole(s.mobile || s.email || '', !s.isDeliveryBoy)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all ${s.isDeliveryBoy ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-50 border-slate-300 text-slate-400'}`}><i className="fas fa-truck-fast mr-2"></i> {s.isDeliveryBoy ? 'Staff Active' : 'Make Staff'}</button>
                       <button onClick={() => onUpdateAdminRole(s.mobile || s.email || '', !s.isAdmin)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all ${s.isAdmin ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-slate-50 border-slate-300 text-slate-400'}`}><i className="fas fa-crown mr-2"></i> {s.isAdmin ? 'Admin' : 'Make Admin'}</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsAddingStaff(true)} className="w-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-dashed border-blue-200 dark:border-blue-900/50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors active:scale-95"><i className="fas fa-user-plus"></i> Add New Team Member</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Settings' && (
        <form onSubmit={handleUpdateSettings} className="space-y-6 animate-in fade-in text-left px-1">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6 shadow-sm">
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block">Global Delivery Fee</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input type="number" value={settingsForm.fee} onChange={e => setSettingsForm({...settingsForm, fee: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-xl py-4 pl-10 pr-4 font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm" />
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 block">Business UPI ID</label>
                 <input type="text" value={settingsForm.upi} onChange={e => setSettingsForm({...settingsForm, upi: e.target.value})} placeholder="example@upi" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-xl py-4 px-4 font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-all shadow-sm" />
              </div>
           </div>
           
           <button 
             type="submit" 
             disabled={isSavingSettings}
             className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
               saveSettingsStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
             }`}
           >
             {isSavingSettings ? (
                <i className="fas fa-circle-notch animate-spin"></i>
             ) : saveSettingsStatus === 'saved' ? (
                <><i className="fas fa-check"></i> Settings Saved!</>
             ) : (
                'Update Settings'
             )}
           </button>
        </form>
      )}
    </div>
  );
};

export default Admin;
