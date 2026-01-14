
import React, { useState, useRef } from 'react';
import { Order, Product, User, AppNotification } from '../types';

interface AdminProps {
  orders: Order[];
  products: Product[];
  registeredUsers: User[];
  notifications: AppNotification[];
  onUpdateStatus: (id: string, status: Order['status'], note?: string) => void;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onBack: () => void;
  deliveryFee: number;
  onUpdateDeliveryFee: (fee: number) => void;
  onImportData: (data: any) => void;
  onAssignOrder: (orderId: string, staffMobile: string | undefined) => void;
  onAddStaff: (mobile: string, name: string) => void;
  onUpdateStaffRole: (mobile: string, isDelivery: boolean) => void;
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
  onImportData,
  onAssignOrder,
  onAddStaff,
  onUpdateStaffRole
}) => {
  const [activeTab, setActiveTab] = useState<'Orders' | 'Inventory' | 'Staff' | 'Settings'>('Orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  
  const importFileRef = useRef<HTMLInputElement>(null);

  const [staffForm, setStaffForm] = useState({ name: '', mobile: '' });
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, unit: 'Can', image: '', category: 'can'
  });

  const deliveryBoys = registeredUsers.filter(u => u.isDeliveryBoy);
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
    // Only export staff members, products, and fees.
    // We filter out regular customers for privacy.
    const setupData = {
      registeredUsers: registeredUsers.filter(u => u.isDeliveryBoy || u.isAdmin),
      products: products,
      deliveryFee: deliveryFee,
      allOrders: [], // Orders are local to device
      notifications: []
    };
    
    const blob = new Blob([JSON.stringify(setupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `town-staff-setup.json`;
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
          <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {selectedOrder.status}
            </span>
            <div className="text-right">
              <p className="text-lg font-black text-blue-600">₹{selectedOrder.total}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedOrder.paymentMethod}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-800">{selectedOrder.userName}</p>
            <p className="text-xs text-gray-500">{selectedOrder.userMobile}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{selectedOrder.userAddress}</p>
          </div>

          <div className="pt-4 border-t border-gray-50">
             <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Delivery Assignment</p>
             <div className="relative">
                <select 
                  value={selectedOrder.assignedToMobile || ''}
                  onChange={(e) => onAssignOrder(selectedOrder.id, e.target.value || undefined)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold appearance-none text-gray-700"
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
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                <i className="fas fa-truck-fast"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800">Out for Delivery</p>
                <p className="text-[10px] text-blue-600">Assigned to: {selectedOrder.assignedToName}</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Items</p>
            {selectedOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs py-1">
                <span>{item.quantity}x {item.product.name}</span>
                <span className="font-bold">₹{item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
          <div className="grid grid-cols-1 gap-3">
             <button 
              onClick={() => { if(window.confirm("Cancel this order?")) { onUpdateStatus(selectedOrder.id, 'Cancelled'); setSelectedOrderId(null); } }} 
              className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl"
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
        <button onClick={onBack} className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-bold text-gray-800">Business Hub</h2>
      </div>

      <div className="flex p-1.5 bg-gray-100 rounded-2xl overflow-x-auto scrollbar-hide">
        {(['Orders', 'Inventory', 'Staff', 'Settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Orders' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="font-bold text-gray-800">Order Logs</h3>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm italic">No orders logged.</div>
            ) : (
              orders.map(o => (
                <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold ${o.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {o.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{o.userName}</p>
                      <p className="text-[10px] text-gray-400">Assigned: <span className="text-blue-500 font-bold">{o.assignedToName || 'None'}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">₹{o.total}</p>
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
             <h3 className="font-bold text-gray-800">Products</h3>
             <button onClick={() => setIsAddingNew(true)} className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center"><i className="fas fa-plus"></i></button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <img src={p.image} className="h-12 w-12 rounded-xl object-cover" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  <p className="text-[10px] text-blue-600 font-bold">₹{p.price} / {p.unit}</p>
                </div>
                <button onClick={() => { setProdForm(p); setEditingProduct(p); }} className="h-8 w-8 text-gray-400 hover:text-blue-600"><i className="fas fa-pen"></i></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-gray-800">Delivery Team</h3>
             <button onClick={() => setIsAddingStaff(true)} className="h-8 w-8 bg-green-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-100"><i className="fas fa-user-plus"></i></button>
          </div>
          <div className="space-y-3">
            {deliveryBoys.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm italic">No staff added yet.</div>
            ) : (
              deliveryBoys.map(db => (
                <div key={db.mobile} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">{db.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold">{db.name}</p>
                      <p className="text-[10px] text-gray-400">{db.mobile}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${db.mobile}`} className="h-8 w-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center"><i className="fas fa-phone"></i></a>
                    <button onClick={() => onUpdateStaffRole(db.mobile, false)} className="h-8 w-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><i className="fas fa-user-minus"></i></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="font-bold text-gray-800">Business Controls</h3>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
             <div>
               <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Delivery Fee (₹)</label>
               <input type="number" value={deliveryFee} onChange={(e) => onUpdateDeliveryFee(parseInt(e.target.value) || 0)} className="w-full bg-gray-50 p-4 rounded-xl text-sm font-bold" />
             </div>
             
             <div className="space-y-3 pt-4 border-t border-gray-50">
               <div className="bg-blue-50 p-4 rounded-2xl mb-2">
                 <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">How to set up staff:</p>
                 <p className="text-[10px] text-blue-600 leading-relaxed">
                   1. Add staff members in the "Staff" tab.<br/>
                   2. Click "Export Town Setup" below.<br/>
                   3. Send the downloaded file to your staff via WhatsApp.<br/>
                   4. They should upload it on their Login screen.
                 </p>
               </div>
               <button onClick={handleExportData} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-transform">
                 <i className="fas fa-file-export"></i>
                 Export Town Setup (JSON)
               </button>
               <button onClick={() => importFileRef.current?.click()} className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold border border-gray-200 active:scale-95 transition-transform">
                 <i className="fas fa-file-import"></i>
                 Import Data
               </button>
             </div>
             
             <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   try {
                     const data = JSON.parse(ev.target?.result as string);
                     onImportData(data);
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in">
           <form onSubmit={handleSaveProduct} className="bg-white w-full rounded-t-[2.5rem] p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-gray-400"><i className="fas fa-times"></i></button>
              </div>
              <input type="text" placeholder="Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
              <textarea placeholder="Description" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm h-20" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Price (₹)" value={prodForm.price || ''} onChange={e => setProdForm({...prodForm, price: parseInt(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
                <input type="text" placeholder="Unit (Can/Month)" value={prodForm.unit} onChange={e => setProdForm({...prodForm, unit: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
              </div>
              <input type="text" placeholder="Image URL" value={prodForm.image} onChange={e => setProdForm({...prodForm, image: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">Save Product</button>
           </form>
        </div>
      )}

      {isAddingStaff && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end animate-in fade-in">
           <form onSubmit={handleAddStaffSubmit} className="bg-white w-full rounded-t-[2.5rem] p-8 space-y-4 animate-in slide-in-from-bottom-20">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add Delivery Boy</h3>
                <button type="button" onClick={() => setIsAddingStaff(false)} className="text-gray-400"><i className="fas fa-times"></i></button>
              </div>
              <input type="text" placeholder="Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
              <input type="tel" placeholder="Mobile Number (10 digits)" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-gray-50 p-4 rounded-xl text-sm" required />
              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100">Register Staff</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
