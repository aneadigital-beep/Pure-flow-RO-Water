
import React, { useState, useRef, useMemo } from 'react';
import { Order, Product, User, AppNotification } from '../types';

interface AdminProps {
  orders: Order[];
  products: Product[];
  registeredUsers: User[];
  notifications: AppNotification[];
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBack: () => void;
  deliveryFee: number;
  onUpdateDeliveryFee: (fee: number) => void;
  onImportData: (data: any) => void;
  onAssignOrder: (orderId: string, staffMobile: string | undefined) => void;
  onAddStaff: (mobile: string, name: string) => void;
  onUpdateStaffRole: (mobile: string, isDelivery: boolean) => void;
  onUpdateAdminRole: (mobile: string, isAdmin: boolean) => void;
}

const Admin: React.FC<AdminProps> = ({ 
  orders, 
  products, 
  registeredUsers,
  notifications,
  onUpdateStatus, 
  onUpdateProduct, 
  onAddProduct,
  onDeleteProduct,
  onBack,
  deliveryFee,
  onUpdateDeliveryFee,
  onImportData,
  onAssignOrder,
  onAddStaff,
  onUpdateStaffRole,
  onUpdateAdminRole
}) => {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Orders' | 'Inventory' | 'Users' | 'Settings'>('Dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const importFileRef = useRef<HTMLInputElement>(null);

  const [staffForm, setStaffForm] = useState({ name: '', mobile: '' });
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can'
  });

  // Business Analytics
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => o.status === 'Delivered' ? acc + o.total : acc, 0);
    const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
    const todayStr = new Date().toLocaleDateString();
    const todayOrders = orders.filter(o => o.date === todayStr).length;
    
    return {
      revenue: totalRevenue,
      pending: pendingOrders,
      today: todayOrders,
      total: orders.length
    };
  }, [orders]);

  const deliveryBoys = registeredUsers.filter(u => u.isDeliveryBoy);
  const filteredUsers = registeredUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.mobile.includes(userSearch)
  );

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...prodForm } as Product);
      setEditingProduct(null);
    } else {
      onAddProduct({ ...prodForm, id: `p-${Date.now()}` } as Product);
      setIsAddingNew(false);
    }
    setProdForm({ category: 'can', unit: 'Can', name: '', description: '', price: 0, image: '' });
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.name && staffForm.mobile.length === 10) {
      onAddStaff(staffForm.mobile, staffForm.name);
      setIsAddingStaff(false);
      setStaffForm({ name: '', mobile: '' });
    }
  };

  const handleExportData = () => {
    const setupData = {
      registeredUsers,
      products,
      deliveryFee,
      allOrders: orders,
      notifications: []
    };
    
    const blob = new Blob([JSON.stringify(setupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pureflow-business-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedOrder) {
    const isAssigned = !!selectedOrder.assignedToMobile;

    return (
      <div className="space-y-6 pb-6 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300 transition-colors">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Order Details</h2>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-start">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              selectedOrder.status === 'Delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
            }`}>
              {selectedOrder.status}
            </span>
            <div className="text-right">
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">₹{selectedOrder.total}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{selectedOrder.paymentMethod}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{selectedOrder.userName}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{selectedOrder.userMobile}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">{selectedOrder.userAddress}</p>
          </div>

          <div className="pt-4 border-t border-gray-50 dark:border-slate-700">
             <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mb-2">Delivery Assignment</p>
             <div className="relative">
                <select 
                  value={selectedOrder.assignedToMobile || ''}
                  onChange={(e) => onAssignOrder(selectedOrder.id, e.target.value || undefined)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold appearance-none text-gray-700 dark:text-slate-300"
                >
                  <option value="">-- Click to Assign Staff --</option>
                  {deliveryBoys.map(db => (
                    <option key={db.mobile} value={db.mobile}>{db.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <i className="fas fa-chevron-down"></i>
                </div>
             </div>
          </div>

          {isAssigned && selectedOrder.status === 'Pending' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0">
                <i className="fas fa-truck-fast"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800 dark:text-blue-200">Pending Staff Action</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">Assigned to: {selectedOrder.assignedToName}</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mb-1">Items</p>
            {selectedOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs py-1">
                <span className="dark:text-slate-400">{item.quantity}x {item.product.name}</span>
                <span className="font-bold dark:text-slate-200">₹{item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
          <div className="grid grid-cols-1 gap-3">
             <button 
              onClick={() => { if(window.confirm("Cancel this order?")) { onUpdateStatus(selectedOrder.id, 'Cancelled'); setSelectedOrderId(null); } }} 
              className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl border border-red-100 dark:border-red-900/20 transition-colors"
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 relative">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Business Control Center</h2>
      </div>

      <div className="flex p-1.5 bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Users', 'Settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[85px] py-3 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500'
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
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Total Revenue</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-clock text-orange-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.pending}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Active Orders</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-calendar-day text-blue-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.today}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">New Today</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <i className="fas fa-users text-purple-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{registeredUsers.length}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Customers</p>
            </div>
          </div>
          
          <div className="bg-blue-600 dark:bg-blue-800 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-bold">Staff Performance</h3>
              <p className="text-xs opacity-70">Review active delivery partners</p>
            </div>
            <button onClick={() => setActiveTab('Users')} className="bg-white/20 px-4 py-2 rounded-xl font-bold text-sm">Review Team</button>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="font-bold text-gray-800 dark:text-slate-200">Full Order History</h3>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm italic">No orders logged.</div>
            ) : (
              orders.map(o => (
                <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex justify-between items-center cursor-pointer shadow-sm hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-3 text-left">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold ${o.status === 'Delivered' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                      {o.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-slate-200">{o.userName}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">Staff: <span className="text-blue-500 dark:text-blue-400 font-bold">{o.assignedToName || 'None'}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">₹{o.total}</p>
                    <span className={`text-[8px] font-bold uppercase ${o.status === 'Delivered' ? 'text-green-500' : 'text-orange-500'}`}>{o.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-gray-800 dark:text-slate-200">Products & Catalog</h3>
             <button onClick={() => setIsAddingNew(true)} className="h-10 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-xl flex items-center gap-2 shadow-lg active:scale-95 text-xs font-bold">
               <i className="fas fa-plus"></i> Add New
             </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <img src={p.image} className="h-14 w-14 rounded-xl object-cover shadow-sm" alt="" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider">₹{p.price} / {p.unit}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setProdForm(p); setEditingProduct(p); }} className="h-9 w-9 bg-gray-50 dark:bg-slate-900 rounded-lg text-gray-400 hover:text-blue-500 flex items-center justify-center transition-colors">
                    <i className="fas fa-pen text-sm"></i>
                  </button>
                  <button onClick={() => onDeleteProduct(p.id)} className="h-9 w-9 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-400 hover:text-red-600 flex items-center justify-center transition-colors">
                    <i className="fas fa-trash-can text-sm"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-gray-800 dark:text-slate-200">User Management</h3>
             <button onClick={() => setIsAddingStaff(true)} className="h-10 px-4 bg-green-600 dark:bg-green-500 text-white rounded-xl flex items-center gap-2 shadow-lg active:scale-95 text-xs font-bold">
               <i className="fas fa-user-plus"></i> Invite Staff
             </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name or mobile..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 pl-12 text-sm text-gray-700 dark:text-slate-200 shadow-sm"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm italic">No users matching search.</div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.mobile} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                        {u.avatar ? <img src={u.avatar} className="h-full w-full object-cover" alt="" /> : u.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold dark:text-slate-100">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{u.mobile}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {u.isAdmin && <span className="bg-yellow-400 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Admin</span>}
                      {u.isDeliveryBoy && <span className="bg-green-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Staff</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 dark:border-slate-700">
                    <button 
                      onClick={() => onUpdateStaffRole(u.mobile, !u.isDeliveryBoy)}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        u.isDeliveryBoy ? 'bg-red-50 dark:bg-red-900/10 text-red-500' : 'bg-green-50 dark:bg-green-900/10 text-green-600'
                      }`}
                    >
                      {u.isDeliveryBoy ? 'Revoke Staff' : 'Make Staff'}
                    </button>
                    <button 
                      onClick={() => onUpdateAdminRole(u.mobile, !u.isAdmin)}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        u.isAdmin ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-500' : 'bg-blue-50 dark:bg-blue-900/10 text-blue-600'
                      }`}
                    >
                      {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="font-bold text-gray-800 dark:text-slate-200">Business Controls</h3>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 space-y-6 transition-colors shadow-sm">
             <div className="text-left">
               <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase ml-1 flex items-center gap-2">
                 <i className="fas fa-truck text-blue-500"></i>
                 Delivery Fee (₹)
               </label>
               <input 
                 type="number" 
                 value={deliveryFee} 
                 onChange={(e) => onUpdateDeliveryFee(parseInt(e.target.value) || 0)} 
                 className="w-full mt-1 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-sm font-bold dark:text-slate-200 border border-transparent focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             
             <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-slate-700">
               <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl mb-2 text-left">
                 <p className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase mb-2">Sync Protocol:</p>
                 <ul className="text-[10px] text-blue-600 dark:text-blue-400 space-y-1 list-disc pl-4">
                   <li>Assign orders to staff in the "Orders" tab.</li>
                   <li>Export the database update below.</li>
                   <li>Send JSON to staff via WhatsApp.</li>
                   <li>Staff uses "Setup from JSON" at login to sync tasks.</li>
                 </ul>
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                 <button onClick={handleExportData} className="w-full bg-blue-600 dark:bg-blue-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 dark:hover:shadow-none active:scale-95 transition-all">
                   <i className="fas fa-download"></i>
                   Full Database Backup
                 </button>
                 <button onClick={() => importFileRef.current?.click()} className="w-full bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-slate-300 py-5 rounded-2xl font-bold border border-gray-200 dark:border-slate-700 active:scale-95 transition-transform">
                   <i className="fas fa-upload"></i>
                   Import Business Data
                 </button>
               </div>
             </div>
             
             <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   try {
                     const data = JSON.parse(ev.target?.result as string);
                     onImportData(data);
                     alert("Data imported successfully!");
                   } catch(e) { alert("Error reading file. Ensure it is a valid JSON."); }
                 };
                 reader.readAsText(file);
               }
             }} />
          </div>
        </div>
      )}

      {/* Overlays for Add Product / Add Staff */}
      {(isAddingNew || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[100] flex items-end animate-in fade-in">
           <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold dark:text-slate-100">{editingProduct ? 'Update Product' : 'New Product'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="h-10 w-10 flex items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-full"><i className="fas fa-times"></i></button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
                <textarea placeholder="Product Description" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm h-24 dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Price (₹)" value={prodForm.price || ''} onChange={e => setProdForm({...prodForm, price: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
                  <input type="text" placeholder="Unit (e.g. Can)" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <input type="text" placeholder="Image URL" value={prodForm.image} onChange={e => setProdForm({...prodForm, image: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 dark:bg-blue-500 text-white py-5 rounded-2xl font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-transform active:scale-95 mt-4 uppercase tracking-widest text-xs">Save Catalog Entry</button>
           </form>
        </div>
      )}

      {isAddingStaff && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[100] flex items-end animate-in fade-in">
           <form onSubmit={handleAddStaffSubmit} className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-8 space-y-4 animate-in slide-in-from-bottom-20 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold dark:text-slate-100">Add Staff Member</h3>
                <button type="button" onClick={() => setIsAddingStaff(false)} className="h-10 w-10 flex items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-full"><i className="fas fa-times"></i></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Full Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500" required />
                <input type="tel" placeholder="Mobile (10 digits)" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-slate-200 border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500" required />
              </div>
              <button type="submit" className="w-full bg-green-600 dark:bg-green-500 text-white py-5 rounded-2xl font-bold shadow-lg shadow-green-100 dark:shadow-none transition-transform active:scale-95 mt-4 uppercase tracking-widest text-xs">Authorize Partner</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
