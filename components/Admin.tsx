
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const importFileRef = useRef<HTMLInputElement>(null);

  const [upiId, setUpiId] = useState(DEFAULT_UPI_ID);
  const [localDeliveryFee, setLocalDeliveryFee] = useState(deliveryFee.toString());

  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    unit: 'Can',
    image: '',
    category: 'can'
  });

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Date', 'Customer Name', 'Mobile', 'Total Amount', 'Status'];
    const rows = orders.map(o => [o.id, o.date, `"${o.userName}"`, o.userMobile, o.total, o.status]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportFullBackup = () => {
    const backupData = {
      version: "1.5.0",
      type: "PUREFLOW_BUSINESS_BACKUP",
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
    link.download = `PureFlow_Business_Data_${new Date().toISOString().split('T')[0]}.json`;
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
          alert("Error parsing backup file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleHardReset = () => {
    if (window.confirm("Type 'RESET' to confirm deletion of ALL records.")) {
      const check = window.prompt("Type 'RESET':");
      if (check === 'RESET') {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...form } as Product);
      setEditingProduct(null);
    } else {
      const newProd = { ...form, id: `p-${Date.now()}` } as Product;
      onAddProduct(newProd);
      setIsAddingNew(false);
    }
    setForm({ category: 'can', unit: 'Can', name: '', description: '', price: 0, image: '' });
  };

  const openEdit = (p: Product) => {
    setForm(p);
    setEditingProduct(p);
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (selectedOrder) {
    return (
      <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {selectedOrder.status}
            </span>
            <p className="text-lg font-black text-blue-600">₹{selectedOrder.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-800">{selectedOrder.userName}</p>
            <p className="text-xs text-gray-500">{selectedOrder.userMobile}</p>
            <p className="text-xs text-gray-400">{selectedOrder.userAddress}</p>
          </div>
          <div className="border-t pt-4">
             {selectedOrder.items.map((item, idx) => (
               <div key={idx} className="flex justify-between text-xs py-1">
                 <span>{item.quantity}x {item.product.name}</span>
                 <span className="font-bold">₹{item.product.price * item.quantity}</span>
               </div>
             ))}
          </div>
        </div>

        {selectedOrder.status === 'Pending' && (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { onUpdateStatus(selectedOrder.id, 'Delivered'); setSelectedOrderId(null); }} className="bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg">Mark Delivered</button>
            <button onClick={() => { onUpdateStatus(selectedOrder.id, 'Cancelled'); setSelectedOrderId(null); }} className="bg-red-50 text-red-600 font-bold py-4 rounded-2xl">Cancel</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 relative">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-gray-800">Business Hub</h2>
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
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-gray-800">Recent Orders ({orders.length})</h3>
             <button onClick={handleExportCSV} className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">Export CSV</button>
          </div>
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">{o.userName.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-sm">{o.userName}</p>
                    <p className="text-[10px] text-gray-400">{o.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">₹{o.total}</p>
                  <span className="text-[8px] font-bold uppercase">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Products ({products.length})</h3>
            <button onClick={() => setIsAddingNew(true)} className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg"><i className="fas fa-plus"></i></button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <img src={p.image} className="h-12 w-12 rounded-xl object-cover" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  <p className="text-[10px] text-blue-600 font-bold">₹{p.price} / {p.unit}</p>
                </div>
                <button onClick={() => openEdit(p)} className="h-8 w-8 text-gray-400 hover:text-blue-600"><i className="fas fa-pen-to-square"></i></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase opacity-80">Local Database Health</h3>
                <span className="h-2 w-2 bg-green-400 rounded-full"></span>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 p-3 rounded-2xl text-center">
                   <p className="text-[8px] opacity-60">Orders</p>
                   <p className="text-lg font-black">{orders.length}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl text-center">
                   <p className="text-[8px] opacity-60">Clients</p>
                   <p className="text-lg font-black">{registeredUsers.length}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl text-center">
                   <p className="text-[8px] opacity-60">Status</p>
                   <p className="text-lg font-black">OK</p>
                </div>
             </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4">
             <button onClick={handleExportFullBackup} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold">Download Business Backup</button>
             <button onClick={() => importFileRef.current?.click()} className="w-full bg-white border border-gray-200 text-gray-600 py-4 rounded-2xl font-bold">Import Backup</button>
             <input type="file" ref={importFileRef} accept=".json" onChange={handleImportFile} className="hidden" />
             <button onClick={handleHardReset} className="w-full text-red-500 font-bold text-xs py-2">Factory Reset</button>
          </div>
        </div>
      )}

      {/* Product Form Overlay */}
      {(isAddingNew || editingProduct) && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end animate-in fade-in duration-300">
           <form onSubmit={handleSaveProduct} className="bg-white w-full rounded-t-[2.5rem] p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-gray-400 text-xl"><i className="fas fa-times"></i></button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm h-20" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Price (₹)" value={form.price || ''} onChange={e => setForm({...form, price: parseInt(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
                  <input type="text" placeholder="Unit (e.g. Can)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
                </div>
                <input type="text" placeholder="Image URL (Unsplash or direct)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full bg-gray-50 p-4 rounded-xl text-sm">
                   <option value="can">Water Can</option>
                   <option value="subscription">Subscription Plan</option>
                   <option value="accessory">Accessory</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">Save Product</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
