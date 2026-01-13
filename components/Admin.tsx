
import React, { useState, useRef } from 'react';
import { Order, Product, User, AppNotification } from '../types';
import { DEFAULT_UPI_ID, BUSINESS_PHONE } from '../constants';

interface AdminProps {
  orders: Order[];
  products: Product[];
  registeredUsers: User[];
  notifications: AppNotification[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onBack: () => void;
  deliveryFee: number;
  onUpdateDeliveryFee: (fee: number) => void;
  onImportData: (data: any) => void;
}

const Admin: React.FC<AdminProps> = ({ 
  orders, 
  products, 
  registeredUsers,
  notifications,
  onUpdateStatus, 
  onUpdateProduct, 
  onAddProduct, 
  onBack,
  deliveryFee,
  onUpdateDeliveryFee,
  onImportData
}) => {
  const [activeTab, setActiveTab] = useState<'Orders' | 'Inventory' | 'Settings'>('Orders');
  const [statusFilter, setStatusFilter] = useState<'All' | Order['status']>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Business settings state
  const [upiId, setUpiId] = useState(DEFAULT_UPI_ID);
  const [phone, setPhone] = useState(BUSINESS_PHONE);
  const [localDeliveryFee, setLocalDeliveryFee] = useState(deliveryFee.toString());

  // Form state for Add/Edit
  const [form, setForm] = useState<Partial<Product>>({
    category: 'can',
    unit: 'Can'
  });

  // Added clearDateFilter function to fix "Cannot find name 'clearDateFilter'" error
  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    let matchesDate = true;
    const orderTime = o.createdAt ? new Date(o.createdAt).getTime() : new Date(o.date).getTime();
    
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      if (orderTime < start) matchesDate = false;
    }
    
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      if (orderTime > end) matchesDate = false;
    }

    return matchesStatus && matchesDate;
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['Order ID', 'Date', 'Customer Name', 'Mobile', 'Address', 'Items', 'Total Amount', 'Status', 'Payment Method'];
    const rows = filteredOrders.map(o => [
      o.id, o.date, `"${o.userName}"`, o.userMobile, `"${o.userAddress}"`, 
      `"${o.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}"`,
      o.total, o.status, o.paymentMethod
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportFullBackup = () => {
    const backupData = {
      version: "1.2.0",
      type: "PUREFLOW_PROJECT_BACKUP",
      registeredUsers,
      allOrders: orders,
      products,
      notifications,
      deliveryFee,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PureFlow_Bundle_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          onImportData(json);
        } catch (err) {
          alert("Error parsing backup file. Please ensure it is a valid PureFlow JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleHardReset = () => {
    if (window.confirm("CRITICAL: This will delete ALL users, orders, and custom products. This cannot be undone. Are you sure?")) {
      if (window.confirm("FINAL WARNING: Type 'RESET' in the next prompt if you are sure.")) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const openEdit = (p: Product) => {
    setForm({ ...p });
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const openAdd = () => {
    setForm({
      id: `p-${Math.random().toString(36).substr(2, 5)}`,
      name: '',
      description: '',
      price: 0,
      unit: 'Can',
      category: 'can',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=400'
    });
    setIsAddingNew(true);
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const trimmedName = form.name?.trim();
    const priceValue = form.price || 0;

    if (!trimmedName || priceValue === undefined || !form.image) {
      alert("Please fill in name, price and upload an image.");
      return;
    }

    if (priceValue <= 0) {
      alert("Please enter a valid price greater than ₹0.");
      return;
    }

    const isDuplicate = products.some(p => 
      p.name.toLowerCase() === trimmedName.toLowerCase() && 
      (isAddingNew || p.id !== form.id)
    );

    if (isDuplicate) {
      alert("A product with this name already exists. Please use a unique name.");
      return;
    }

    const finalProduct = { ...form, name: trimmedName } as Product;

    if (isAddingNew) {
      onAddProduct(finalProduct);
    } else {
      onUpdateProduct(finalProduct);
    }
    
    setIsEditing(false);
    setIsAddingNew(false);
    setForm({});
  };

  const handleSaveSettings = () => {
    const feeValue = parseInt(localDeliveryFee);
    if (isNaN(feeValue) || feeValue < 0) {
      alert("Please enter a valid non-negative number for the delivery fee.");
      return;
    }
    onUpdateDeliveryFee(feeValue);
    alert("Settings updated successfully!");
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
            <p className="text-xs text-gray-400 font-mono">ID: {selectedOrder.id}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {selectedOrder.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Placed On</p>
              <p className="text-sm font-bold text-gray-800">{selectedOrder.date}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-id-card text-blue-500"></i>
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 gap-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <i className="fas fa-user"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Full Name</p>
                  <p className="text-base font-bold text-gray-800">{selectedOrder.userName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                  <i className="fas fa-phone"></i>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Mobile Number</p>
                    <p className="text-base font-bold text-gray-800">+91 {selectedOrder.userMobile}</p>
                  </div>
                  <a 
                    href={`tel:${selectedOrder.userMobile}`} 
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <i className="fas fa-phone-alt"></i> Call
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Delivery Address</p>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl mt-1 border border-gray-100">
                    {selectedOrder.userAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-shopping-basket text-blue-500"></i>
              Order Items
            </h3>
            <div className="space-y-3">
              {selectedOrder.items.map(item => (
                <div key={item.product.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={item.product.image} className="h-10 w-10 rounded-lg object-cover" alt="" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400">{item.quantity} x ₹{item.product.price}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">Total Bill</span>
                <span className="text-lg font-black text-blue-600">₹{selectedOrder.total}</span>
              </div>
            </div>
          </div>
        </div>

        {selectedOrder.status === 'Pending' && (
          <div className="grid grid-cols-2 gap-4 sticky bottom-4">
            <button 
              onClick={() => { onUpdateStatus(selectedOrder.id, 'Delivered'); setSelectedOrderId(null); }} 
              className="bg-green-600 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              <i className="fas fa-check-circle mr-2"></i> Deliver
            </button>
            <button 
              onClick={() => { onUpdateStatus(selectedOrder.id, 'Cancelled'); setSelectedOrderId(null); }} 
              className="bg-red-50 text-red-600 border border-red-100 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isEditing || isAddingNew) {
    return (
      <div className="space-y-6 pb-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => { setIsEditing(false); setIsAddingNew(false); }} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800">{isAddingNew ? 'Add New Product' : 'Edit Product'}</h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group w-full max-w-[300px]"
              >
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-blue-400 transition-colors flex items-center justify-center">
                  {form.image ? (
                    <img src={form.image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-center p-4">
                      <i className="fas fa-cloud-arrow-up text-3xl text-gray-300 mb-2"></i>
                      <p className="text-xs text-gray-400 font-bold uppercase">Upload Image</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-white text-blue-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg">Change Image</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Product Name</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Can">Can</option>
                    <option value="Month">Month</option>
                    <option value="Piece">Piece</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Description</label>
                <textarea
                  value={form.description}
                  placeholder="Briefly describe the product..."
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
          >
            {isAddingNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        </div>
      </div>

      <div className="flex p-1.5 bg-gray-100 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Orders', 'Inventory', 'Settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
            }`}
          >
            {tab === 'Orders' ? <i className="fas fa-list-check mr-2"></i> : tab === 'Inventory' ? <i className="fas fa-boxes-stacked mr-2"></i> : <i className="fas fa-gears mr-2"></i>}
            {tab === 'Settings' ? 'Settings & Dev' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-gray-800">Recent Orders</h3>
             <div className="flex gap-2">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)} 
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${showDatePicker || startDate || endDate ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-100'}`}
                >
                  <i className="fas fa-calendar-alt"></i>
                  {startDate || endDate ? 'Filtered' : 'Date Range'}
                </button>
                <button onClick={handleExportCSV} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"><i className="fas fa-file-csv mr-1"></i> Export</button>
             </div>
          </div>
          
          {showDatePicker && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Date Range</h4>
                {(startDate || endDate) && (
                  <button onClick={clearDateFilter} className="text-[10px] text-red-500 font-bold hover:underline">Clear</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">From</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">To</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Pending', 'Delivered', 'Cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f as any)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all ${
                  statusFilter === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400 italic bg-white rounded-3xl border border-dashed border-gray-200">
                <i className="fas fa-folder-open text-3xl mb-2 opacity-20"></i>
                <p>No orders found for this selection.</p>
              </div>
            ) : (
              filteredOrders.map(o => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOrderId(o.id)} 
                  className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-md active:scale-[0.98] transition-all relative"
                >
                  {o.status === 'Pending' && (
                    <span className="absolute top-2 left-2 h-2 w-2 bg-red-500 rounded-full shadow-sm"></span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {o.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{o.userName}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <i className="fas fa-clock"></i> {o.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">₹{o.total}</p>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      o.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                      o.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>{o.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-warehouse text-blue-600"></i>
              Manage Stock
            </h3>
            <button 
              onClick={openAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg active:scale-95 transition-transform"
            >
              <i className="fas fa-plus mr-1"></i> Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 shadow-sm">
                <img src={p.image} className="h-24 w-24 rounded-2xl object-cover border border-gray-50" alt="" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-1 mb-1">{p.description}</p>
                    <p className="text-blue-600 font-black text-sm">₹{p.price} <span className="text-[9px] text-gray-400 font-normal">/ {p.unit}</span></p>
                  </div>
                  <button 
                    onClick={() => openEdit(p)}
                    className="self-end px-4 py-2 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-100 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all"
                  >
                    <i className="fas fa-pen-to-square mr-1"></i> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
          {/* Status Bar */}
          <div className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-3">
               <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold uppercase tracking-widest">Local Database Healthy</span>
             </div>
             <span className="text-[10px] opacity-70">v1.2.0-STABLE</span>
          </div>

          <h3 className="font-bold text-gray-800 flex items-center gap-2 pt-4">
            <i className="fas fa-sliders text-blue-600"></i>
            Business Settings
          </h3>
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Payment UPI ID</label>
                <div className="relative">
                  <i className="fas fa-qrcode absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"></i>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Business Contact</label>
                <div className="relative">
                  <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-green-500"></i>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="99999 00000"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Delivery Fee (₹)</label>
                <div className="relative">
                  <i className="fas fa-truck absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"></i>
                  <input
                    type="number"
                    value={localDeliveryFee}
                    onChange={(e) => setLocalDeliveryFee(e.target.value)}
                    placeholder="10"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              Update Business Info
            </button>
          </div>

          <h3 className="font-bold text-gray-800 flex items-center gap-2 pt-4">
            <i className="fas fa-code text-blue-600"></i>
            Developer & Git Fail-safe
          </h3>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-2">
              <p className="text-[10px] text-red-600 font-bold flex items-center gap-2">
                <i className="fas fa-triangle-exclamation"></i>
                Sync Errors Detected?
              </p>
              <p className="text-[9px] text-red-400 mt-1 leading-relaxed">
                If the automatic GitHub sync button is failing with an authentication error, please use the <b>Manual Bundle Export</b> below to save your work. You can restore this bundle in any session.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleExportFullBackup}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <i className="fas fa-file-export"></i>
                Manual Bundle Export
              </button>

              <button
                onClick={() => importFileRef.current?.click()}
                className="w-full bg-white border-2 border-dashed border-gray-200 text-gray-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-blue-400 hover:text-blue-600 active:scale-95 transition-transform"
              >
                <i className="fas fa-file-import"></i>
                Restore from Bundle
              </button>
              <input 
                type="file" 
                ref={importFileRef} 
                accept=".json" 
                onChange={handleImportFile} 
                className="hidden" 
              />
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex flex-col gap-3">
               <button 
                 onClick={handleHardReset}
                 className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-2 self-start"
               >
                 <i className="fas fa-broom"></i>
                 Clear Local Storage (Hard Reset)
               </button>
               
               <a 
                 href="https://ai.google.dev/gemini-api/docs/billing" 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-blue-500 transition-colors"
               >
                 <i className="fas fa-circle-info"></i> API Billing & Auth Docs
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
