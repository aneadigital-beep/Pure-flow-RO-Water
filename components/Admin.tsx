
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
      return u.name.toLowerCase().includes(search) || u.mobile?.includes(search) || u.email?.toLowerCase().includes(search);
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
    } else alert("Valid 10-digit mobile required.");
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-10 text-left">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Order Detail</h2>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-6">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Customer</p>
                <h3 className="font-black text-gray-800 dark:text-white text-lg">{selectedOrder.userName}</h3>
                <p className="text-sm text-gray-500">{selectedOrder.userMobile}</p>
             </div>
             <div className="text-right">
                <p className="text-xl font-black text-blue-600">₹{selectedOrder.total}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase">{selectedOrder.paymentMethod}</p>
             </div>
           </div>

           <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Address</p>
              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">{selectedOrder.userAddress}</p>
           </div>

           <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block ml-1">Status</label>
                  <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value as Order['status'])} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold dark:text-slate-200 outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-blue-600 font-black uppercase mb-1.5 block ml-1">Assign Partner</label>
                  <select value={tempStaff || ''} onChange={(e) => setTempStaff(e.target.value || undefined)} className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold dark:text-slate-200 outline-none">
                    <option value="">-- No Staff --</option>
                    {deliveryBoys.map(db => (
                      <option key={db.mobile} value={db.mobile}>{db.name}</option>
                    ))}
                  </select>
                </div>
           </div>
        </div>

        <button onClick={handleUpdateTask} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Update Task</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Business Control</h2>
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300"><i className="fas fa-arrow-left"></i></button>
      </div>

      <div className="flex p-1 bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Staff', 'Settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>{tab}</button>
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
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          {orders.map(o => (
            <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border flex flex-col cursor-pointer transition-colors shadow-sm border-gray-100 dark:border-slate-700`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 dark:text-slate-100 text-sm">{o.userName}</p>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400">{o.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600">₹{o.total}</p>
                  <span className="text-[8px] font-black uppercase text-gray-400">{o.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
