
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
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processImage = (dataUrl: string) => {
    setIsProcessingImg(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const size = Math.min(img.width, img.height);
        const sourceX = (img.width - size) / 2;
        const sourceY = (img.height - size) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 800, 800);
        ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, 800, 800);
        // Reduced to 60% quality to ensure it fits in LocalStorage
        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setProdForm(prev => ({ ...prev, image: processedDataUrl }));
      }
      setIsProcessingImg(false);
    };
    img.onerror = () => {
      setIsProcessingImg(false);
      alert("Failed to process image.");
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

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.mobile.length === 10 && staffForm.name) {
      onAddStaff(staffForm.mobile, staffForm.name);
      setIsAddingStaff(false);
      setStaffForm({ name: '', mobile: '' });
    }
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 pb-10 text-left px-1">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300"><i className="fas fa-arrow-left"></i></button>
          <h2 className="text-xl font-bold">Order Detail</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
           <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Customer</p>
              <h3 className="font-black text-slate-800 dark:text-white text-lg">{selectedOrder.userName}</h3>
              <p className="text-sm text-slate-500">{selectedOrder.userMobile}</p>
           </div>
           <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block">Status</label>
                  <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value as Order['status'])} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold">
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block">Assign Partner</label>
                  <select value={tempStaff || ''} onChange={(e) => setTempStaff(e.target.value || undefined)} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold">
                    <option value="">-- No Staff --</option>
                    {deliveryBoys.map(db => (
                      <option key={db.mobile} value={db.mobile}>{db.name}</option>
                    ))}
                  </select>
                </div>
           </div>
        </div>
        <button onClick={handleUpdateTask} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl">Update Task</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative text-left px-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Business Control</h2>
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
      </div>
      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-wider ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{stats.revenue}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Revenue</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.pending}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border flex flex-col cursor-pointer border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{o.userName}</p>
                  <p className="text-[10px] text-slate-400">{o.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600">₹{o.total}</p>
                  <span className="text-[8px] font-black uppercase text-slate-400">{o.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4">
          {isAddingNew || editingProduct ? (
            <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-800 p-6 rounded-3xl space-y-4">
               <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">{editingProduct ? 'Edit Product' : 'Add New Item'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-slate-400"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex gap-4">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0">
                  {prodForm.image ? (
                    <img src={prodForm.image} className={`h-full w-full object-cover ${isProcessingImg ? 'opacity-30' : ''}`} alt="" />
                  ) : <i className="fas fa-image text-slate-300 text-xl"></i>}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><i className="fas fa-camera"></i></button>
                </div>
                <div className="flex-1 space-y-2">
                  <input type="text" placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 rounded-xl px-4 py-3 text-sm font-bold" required />
                  <input type="number" placeholder="Price" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 rounded-xl px-4 py-3 text-sm font-bold" required />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button type="submit" disabled={isProcessingImg} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50">
                {isProcessingImg ? 'Processing...' : 'Save Product'}
              </button>
            </form>
          ) : (
            <>
              {products.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4">
                  <img src={p.image} className="h-16 w-16 rounded-xl object-cover shrink-0" alt="" />
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                       <div>
                         <h4 className="font-bold text-sm">{p.name}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">₹{p.price}/{p.unit}</p>
                       </div>
                       <div className="flex gap-1">
                          <button onClick={() => setEditingProduct(p)} className="h-8 w-8 text-blue-500"><i className="fas fa-edit text-xs"></i></button>
                          <button onClick={() => { if(confirm('Delete?')) onDeleteProduct(p.id) }} className="h-8 w-8 text-red-500"><i className="fas fa-trash-can text-xs"></i></button>
                       </div>
                     </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setIsAddingNew(true)} className="fixed bottom-24 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50"><i className="fas fa-plus text-lg"></i></button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
