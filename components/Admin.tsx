
import React, { useState, useEffect, useMemo } from 'react';
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
  upiId: string;
  onUpdateDeliveryFee: (fee: number) => void;
  onUpdateUpiId: (id: string) => void;
  onImportData: (data: any) => void;
  onAssignOrder: (orderId: string, staffMobile: string | undefined) => void;
  onAddStaff: (mobile: string, name: string) => void;
  onUpdateStaffRole: (mobile: string, isDelivery: boolean) => void;
  onUpdateAdminRole: (mobile: string, isAdmin: boolean) => void;
  townId?: string;
  onSetTownId: (id: string) => void;
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
  upiId,
  onUpdateDeliveryFee,
  onUpdateUpiId,
  onAssignOrder,
  onAddStaff,
  onUpdateStaffRole,
  onUpdateAdminRole
}) => {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Orders' | 'Inventory' | 'Users'>('Dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [settingsForm, setSettingsForm] = useState({ fee: deliveryFee, upi: upiId });

  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can'
  });
  
  const [staffForm, setStaffForm] = useState({ name: '', mobile: '' });

  useEffect(() => {
    if (editingProduct) setProdForm(editingProduct);
    else setProdForm({ name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can' });
  }, [editingProduct, isAddingNew]);

  useEffect(() => {
    setSettingsForm({ fee: deliveryFee, upi: upiId });
  }, [deliveryFee, upiId]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => o.status === 'Delivered' ? acc + o.total : acc, 0);
    const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
    const todayStr = new Date().toLocaleDateString();
    const todayOrdersCount = orders.filter(o => o.date === todayStr).length;
    return { revenue: totalRevenue, pending: pendingOrders, today: todayOrdersCount, total: orders.length };
  }, [orders]);

  const deliveryBoys = useMemo(() => registeredUsers.filter(u => u.isDeliveryBoy), [registeredUsers]);
  const filteredUsers = registeredUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.mobile?.includes(userSearch));
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
  };

  const handleSaveSettings = () => {
    onUpdateDeliveryFee(Number(settingsForm.fee));
    onUpdateUpiId(settingsForm.upi);
    alert("Business settings updated successfully!");
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.mobile.length === 10 && staffForm.name) {
      onAddStaff(staffForm.mobile, staffForm.name);
      setIsAddingStaff(false);
      setStaffForm({ name: '', mobile: '' });
    } else alert("Please enter a valid 10-digit mobile number and name.");
  };

  /**
   * Generates and downloads a CSV file
   */
  const exportToExcel = (type: 'orders' | 'users') => {
    let csvRows = [];
    let filename = "";

    if (type === 'orders') {
      filename = `PureFlow_Orders_${new Date().toLocaleDateString()}.csv`;
      csvRows.push(['Order ID', 'Date', 'Customer Name', 'Mobile', 'Address', 'Items', 'Total Amount', 'Payment Method', 'Status', 'Assigned To'].join(','));
      
      orders.forEach(o => {
        const row = [
          o.id,
          o.date,
          `"${o.userName}"`,
          o.userMobile,
          `"${o.userAddress.replace(/"/g, '""')}"`,
          `"${o.productSummary}"`,
          o.total,
          o.paymentMethod,
          o.status,
          o.assignedToName || 'Unassigned'
        ];
        csvRows.push(row.join(','));
      });
    } else {
      filename = `PureFlow_Customers_${new Date().toLocaleDateString()}.csv`;
      csvRows.push(['Name', 'Mobile', 'Email', 'Pincode', 'Role', 'Address'].join(','));
      
      registeredUsers.forEach(u => {
        const role = u.isAdmin ? 'Admin' : u.isDeliveryBoy ? 'Staff' : 'Customer';
        const row = [
          `"${u.name}"`,
          u.mobile || 'N/A',
          u.email || 'N/A',
          u.pincode,
          role,
          `"${u.address.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
    }

    const csvString = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Order #{selectedOrder.id}</h2>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-4 text-left">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Customer</p>
               <h3 className="font-black text-gray-800 dark:text-white text-lg">{selectedOrder.userName}</h3>
               <p className="text-sm text-gray-500 dark:text-slate-400">{selectedOrder.userMobile}</p>
             </div>
             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
               selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
             }`}>
               {selectedOrder.status}
             </span>
           </div>

           <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mb-2">Delivery Address</p>
              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">{selectedOrder.userAddress}</p>
           </div>

           <div className="pt-4 border-t border-gray-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-2">Assign Delivery Partner</p>
              {deliveryBoys.length > 0 ? (
                <div className="relative">
                  <select 
                    value={selectedOrder.assignedToMobile || ''}
                    onChange={(e) => onAssignOrder(selectedOrder.id, e.target.value || undefined)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">-- Click to Select Staff --</option>
                    {deliveryBoys.map(db => (
                      <option key={db.mobile} value={db.mobile}>{db.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-orange-600 italic">No staff found. Register staff in Users tab first.</p>
              )}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onUpdateStatus(selectedOrder.id, 'Delivered')} className="bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all">Mark Delivered</button>
          <button onClick={() => { if(window.confirm("Cancel?")) { onUpdateStatus(selectedOrder.id, 'Cancelled'); setSelectedOrderId(null); } }} className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-sm border border-red-100 active:scale-95 transition-all">Cancel Order</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Business Control</h2>
      </div>

      <div className="flex p-1.5 bg-gray-100 dark:bg-slate-950 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Dashboard', 'Orders', 'Inventory', 'Users'] as const).map(tab => (
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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm text-left">
              <i className="fas fa-sack-dollar text-green-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">₹{stats.revenue}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Revenue (Delivered)</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm text-left">
              <i className="fas fa-clock text-orange-500 text-xl mb-2"></i>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.pending}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Active Orders</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 text-left">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => setIsAddingNew(true)} className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-xs active:scale-95 transition-all">
                <i className="fas fa-plus-circle"></i> New Product
              </button>
              <button onClick={() => setIsAddingStaff(true)} className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-2xl font-bold text-xs active:scale-95 transition-all">
                <i className="fas fa-user-plus"></i> Add Staff
              </button>
            </div>

            <div className="space-y-6 pt-2 border-t border-gray-100 dark:border-slate-700">
               <div className="flex items-center gap-2 mb-4 mt-4">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                     <i className="fas fa-gear text-sm"></i>
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-sm">Business Settings</h4>
               </div>
               
               <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 ml-1">UPI ID for QR Code</label>
                   <div className="relative">
                      <input 
                        type="text" 
                        value={settingsForm.upi}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, upi: e.target.value }))}
                        placeholder="yourname@upi"
                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <i className="fas fa-qrcode absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                   </div>
                   <p className="text-[9px] text-gray-400 italic ml-1">Customers will see this ID in the payment QR code.</p>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 ml-1">Delivery Fee (₹)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        value={settingsForm.fee}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, fee: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <i className="fas fa-truck absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                   </div>
                 </div>

                 <button 
                  onClick={handleSaveSettings}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 transition-all"
                 >
                   Save Business Settings
                 </button>
               </div>
            </div>

            <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest mb-3 mt-10">Backup & Data Management</h4>
            <div className="space-y-3">
              <button 
                onClick={() => exportToExcel('orders')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                    <i className="fas fa-file-csv text-lg"></i>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">Export Orders to Excel</p>
                    <p className="text-[9px] text-gray-400">Download complete sales history</p>
                  </div>
                </div>
                <i className="fas fa-download text-gray-300 group-hover:text-blue-500 transition-colors"></i>
              </button>

              <button 
                onClick={() => exportToExcel('users')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-green-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600">
                    <i className="fas fa-users-gear text-lg"></i>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">Export Customer List</p>
                    <p className="text-[9px] text-gray-400">Backup user contact information</p>
                  </div>
                </div>
                <i className="fas fa-download text-gray-300 group-hover:text-green-500 transition-colors"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          {orders.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <i className="fas fa-inbox text-4xl mb-4 opacity-20"></i>
              <p className="text-sm italic">No orders in database yet.</p>
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col cursor-pointer hover:border-blue-400 transition-colors shadow-sm text-left">
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
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50 dark:border-slate-700/50">
                  <i className="fas fa-truck text-[10px] text-gray-300"></i>
                  <p className="text-[10px] font-bold">{o.assignedToName || <span className="text-orange-400 italic">Unassigned</span>}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold dark:text-white">Catalog ({products.length})</h3>
            <button onClick={() => setIsAddingNew(true)} className="text-xs font-bold text-blue-600">Add New</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <img src={p.image} className="h-12 w-12 rounded-lg object-cover bg-gray-50" alt="" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{p.name}</p>
                  <p className="text-[10px] font-bold text-blue-600">₹{p.price} / {p.unit}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-400 hover:text-blue-600 transition-colors">
                    <i className="fas fa-pencil text-[10px]"></i>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }} className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-400 hover:text-red-600 transition-colors">
                    <i className="fas fa-trash text-[10px]"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search customers or staff..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 pl-12 text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          <div className="space-y-3">
            {filteredUsers.map(u => (
              <div key={u.mobile || u.email} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 text-left space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-slate-900 flex items-center justify-center font-bold text-blue-600 overflow-hidden">
                      {u.avatar ? <img src={u.avatar} className="h-full w-full object-cover" alt="" /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">{u.name}</p>
                      <p className="text-[10px] text-gray-400">{u.mobile || u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {u.isAdmin && <span className="bg-yellow-400 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Admin</span>}
                    {u.isDeliveryBoy && <span className="bg-green-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Staff</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 dark:border-slate-700/50">
                  <button 
                    onClick={() => onUpdateStaffRole(u.mobile || u.email || '', !u.isDeliveryBoy)}
                    className={`py-2 px-3 rounded-xl text-[9px] font-bold uppercase transition-all ${
                      u.isDeliveryBoy ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}
                  >
                    {u.isDeliveryBoy ? 'Revoke Staff' : 'Make Staff'}
                  </button>
                  <button 
                    onClick={() => onUpdateAdminRole(u.mobile || u.email || '', !u.isAdmin)}
                    className={`py-2 px-3 rounded-xl text-[9px] font-bold uppercase transition-all ${
                      u.isAdmin ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}
                  >
                    {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Add/Edit Overlay */}
      {(isAddingNew || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in">
          <form onSubmit={handleSaveProduct} className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20 text-left">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Update Product' : 'New Product'}</h3>
              <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="h-10 w-10 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
              <textarea placeholder="Description" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm h-24 dark:text-white border border-gray-100 dark:border-slate-800 resize-none outline-none focus:ring-2 focus:ring-blue-500" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Price (₹)" value={prodForm.price || ''} onChange={e => setProdForm({...prodForm, price: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="text" placeholder="Unit (Can/Month)" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <input type="text" placeholder="Image URL" value={prodForm.image} onChange={e => setProdForm({...prodForm, image: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500" required />
              <select value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value as any})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="can">Water Can</option>
                <option value="subscription">Subscription Plan</option>
                <option value="accessory">Accessory</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4 uppercase tracking-widest text-xs">Save Catalog Entry</button>
          </form>
        </div>
      )}

      {/* Staff Add Overlay */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in">
          <form onSubmit={handleAddStaffSubmit} className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-8 space-y-4 animate-in slide-in-from-bottom-20 text-left">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold dark:text-white">Authorize Staff Member</h3>
              <button type="button" onClick={() => setIsAddingStaff(false)} className="h-10 w-10 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full"><i className="fas fa-times"></i></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Provide the name and mobile number of the delivery person.</p>
            <div className="space-y-4">
              <input type="text" placeholder="Staff Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="tel" placeholder="Mobile (10 digits)" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-gray-50 dark:bg-slate-950 p-4 rounded-xl text-sm dark:text-white border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4 uppercase tracking-widest text-xs">Register Staff Partner</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
