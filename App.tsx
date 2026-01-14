
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, CartItem, View, Order, StatusHistory, AppNotification } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, TOWN_NAME, DELIVERY_FEE as DEFAULT_DELIVERY_FEE } from './constants';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Login from './components/Login';
import Orders from './components/Orders';
import Admin from './components/Admin';
import DeliveryDashboard from './components/DeliveryDashboard';
import Notifications from './components/Notifications';
import Assistant from './components/Assistant';
import Toast from './components/Toast';

const App: React.FC = () => {
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pureflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pureflow_registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pureflow_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [currentView, setCurrentView] = useState<View>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pureflow_all_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('pureflow_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [deliveryFee, setDeliveryFee] = useState<number>(() => {
    const saved = localStorage.getItem('pureflow_delivery_fee');
    return saved ? parseInt(saved) : DEFAULT_DELIVERY_FEE;
  });

  const [activeToast, setActiveToast] = useState<{title: string, message: string} | null>(null);

  // Centralized Persistence Sync
  useEffect(() => { saveToStorage('pureflow_all_orders', allOrders); }, [allOrders]);
  useEffect(() => { saveToStorage('pureflow_registered_users', registeredUsers); }, [registeredUsers]);
  useEffect(() => { saveToStorage('pureflow_products', products); }, [products]);
  useEffect(() => { saveToStorage('pureflow_notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('pureflow_delivery_fee', deliveryFee); }, [deliveryFee]);
  useEffect(() => { if (user) saveToStorage('pureflow_user', user); }, [user]);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'], forAdmin: boolean, userMobile?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      isRead: false,
      forAdmin,
      userMobile: userMobile ? String(userMobile) : undefined
    };
    
    setNotifications(prev => [newNotif, ...prev]);
    
    if (user) {
      if ((forAdmin && user.isAdmin) || (!forAdmin && String(user.mobile) === String(userMobile))) {
        setActiveToast({ title, message });
      }
    }
  }, [user]);

  const handleLogin = (mobile: string, name: string, address: string, pincode: string, avatar?: string) => {
    const ADMIN_MOBILE = '9999999999';
    const existingInDb = registeredUsers.find(u => String(u.mobile) === String(mobile));
    
    const isAdmin = mobile === ADMIN_MOBILE || existingInDb?.isAdmin; 
    const isDeliveryBoy = existingInDb?.isDeliveryBoy;

    const newUser: User = { 
      mobile: String(mobile), 
      name: existingInDb?.name || name, 
      address: existingInDb?.address || address, 
      pincode: existingInDb?.pincode || pincode, 
      avatar: existingInDb?.avatar || avatar, 
      isLoggedIn: true, 
      isAdmin, 
      isDeliveryBoy 
    };
    
    setUser(newUser);

    setRegisteredUsers(prev => {
      const existing = prev.find(u => String(u.mobile) === String(mobile));
      if (existing) {
        return prev.map(u => String(u.mobile) === String(mobile) ? { ...u, ...newUser } : u);
      }
      return [...prev, newUser];
    });

    if (isDeliveryBoy) setCurrentView('delivery');
    else if (isAdmin) setCurrentView('admin');
    else setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pureflow_user');
    setCurrentView('home');
    setCart([]);
  };

  const placeOrder = (paymentMethod: 'COD' | 'UPI/Online') => {
    if (!user || cart.length === 0) return;
    
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userMobile: String(user.mobile),
      userName: user.name,
      userAddress: `${user.address}, ${user.pincode}`,
      date: now.toLocaleDateString(),
      createdAt: now.toISOString(),
      total: subtotal + deliveryFee,
      items: [...cart],
      status: 'Pending',
      paymentMethod,
      history: [{ status: 'Pending', timestamp: `${now.toLocaleDateString()} ${timestamp}`, note: 'Order placed' }]
    };

    setAllOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setCurrentView('orders');
    addNotification('New Order Received!', `${user.name} placed a new order.`, 'order', true);
  };

  const updateOrderStatus = useCallback((orderId: string, status: Order['status'], note?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Find the order context first to avoid side-effects inside state setter
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    setAllOrders(prevOrders => {
      return prevOrders.map(o => {
        if (o.id === orderId) {
          const historyEntry: StatusHistory = {
            status,
            timestamp: `${now.toLocaleDateString()} ${timestamp}`,
            note: note || `Status updated to ${status}`
          };
          return { ...o, status, history: [...o.history, historyEntry] };
        }
        return o;
      });
    });

    // Side effects belong outside the state setter function
    addNotification(
      `Order ${status}!`,
      `Your order ${orderId} is now ${status.toLowerCase()}. ${note ? '(' + note + ')' : ''}`,
      status === 'Delivered' ? 'delivery' : 'system',
      false,
      orderToUpdate.userMobile
    );
  }, [allOrders, addNotification]);

  const assignOrder = useCallback((orderId: string, staffMobile: string | undefined) => {
    const staff = registeredUsers.find(u => String(u.mobile) === String(staffMobile));
    
    setAllOrders(prevOrders => {
      return prevOrders.map(o => {
        if (o.id === orderId) {
          if (staffMobile) {
            addNotification('New Task', `Order ${orderId} assigned to you.`, 'system', false, String(staffMobile));
          }
          return { 
            ...o, 
            assignedToMobile: staffMobile ? String(staffMobile) : undefined, 
            assignedToName: staff?.name 
          };
        }
        return o;
      });
    });
  }, [registeredUsers, addNotification]);

  const updateStaffRole = (mobile: string, isDelivery: boolean) => {
    setRegisteredUsers(prev => prev.map(u => String(u.mobile) === String(mobile) ? { ...u, isDeliveryBoy: isDelivery } : u));
  };

  const addStaffMember = (mobile: string, name: string) => {
    setRegisteredUsers(prev => {
      const existing = prev.find(u => String(u.mobile) === String(mobile));
      if (existing) {
        return prev.map(u => String(u.mobile) === String(mobile) ? { ...u, isDeliveryBoy: true, name } : u);
      }
      const newUser: User = { mobile: String(mobile), name, address: 'Staff', pincode: '000000', isLoggedIn: false, isDeliveryBoy: true };
      return [...prev, newUser];
    });
  };

  const handleImportData = (data: any) => {
    if (!data.allOrders || !data.products) {
      alert("Invalid backup file!");
      return;
    }
    if (window.confirm("Replace local data?")) {
      setRegisteredUsers(data.registeredUsers || []);
      setAllOrders(data.allOrders);
      setProducts(data.products);
      setNotifications(data.notifications || []);
      setDeliveryFee(data.deliveryFee || DEFAULT_DELIVERY_FEE);
      alert("Data imported successfully!");
      window.location.reload();
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} registeredUsers={registeredUsers} />;
  }

  const userOrders = allOrders.filter(o => String(o.userMobile) === String(user.mobile));
  const relevantNotifications = notifications.filter(n => (n.forAdmin && user.isAdmin) || (!n.forAdmin && String(n.userMobile) === String(user.mobile)));
  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  const isSpecialView = ['admin', 'delivery', 'assistant'].includes(currentView);

  return (
    <div className={`flex flex-col min-h-screen ${isSpecialView ? '' : 'pb-20'}`}>
      {activeToast && <Toast title={activeToast.title} message={activeToast.message} onClose={() => setActiveToast(null)} />}
      
      <header className={`text-white p-4 shadow-md sticky top-0 z-50 ${user.isDeliveryBoy ? 'bg-green-600' : 'bg-blue-600'}`}>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <i className="fas fa-droplet text-blue-200"></i>
            {TOWN_NAME} {user.isDeliveryBoy && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full ml-1">Staff</span>}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('notifications')} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-blue-600"></span>}
            </button>
            <div className="h-8 w-8 rounded-full border border-white/20 overflow-hidden cursor-pointer" onClick={() => setCurrentView('profile')}>
              {user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-xs font-bold uppercase bg-white/20">{user.name.charAt(0)}</div>}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6">
        {currentView === 'home' && <Home products={products} onAddToCart={(p) => setCart(prev => [...prev, { product: p, quantity: 1 }])} />}
        {currentView === 'cart' && <Cart items={cart} onUpdate={(id, delta) => setCart(prev => prev.map(i => i.product.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))} onRemove={(id) => setCart(prev => prev.filter(i => i.product.id !== id))} onPlaceOrder={placeOrder} deliveryFee={deliveryFee} />}
        {currentView === 'profile' && <Profile user={user} onLogout={handleLogout} onAdminClick={() => setCurrentView('admin')} onDeliveryClick={() => setCurrentView('delivery')} onNotificationsClick={() => setCurrentView('notifications')} unreadNotifCount={unreadCount} />}
        {currentView === 'orders' && <Orders orders={userOrders} />}
        {currentView === 'assistant' && <Assistant onBack={() => setCurrentView('home')} />}
        {currentView === 'delivery' && <DeliveryDashboard orders={allOrders.filter(o => String(o.assignedToMobile) === String(user.mobile))} onUpdateStatus={updateOrderStatus} user={user} />}
        {currentView === 'admin' && (
          <Admin 
            products={products} onUpdateProduct={(p) => setProducts(prev => prev.map(old => old.id === p.id ? p : old))} onAddProduct={(p) => setProducts(prev => [p, ...prev])} 
            orders={allOrders} onUpdateStatus={updateOrderStatus} onBack={() => setCurrentView('profile')}
            deliveryFee={deliveryFee} onUpdateDeliveryFee={setDeliveryFee} 
            registeredUsers={registeredUsers} notifications={notifications} onImportData={handleImportData}
            onAssignOrder={assignOrder} onAddStaff={addStaffMember} onUpdateStaffRole={updateStaffRole}
          />
        )}
        {currentView === 'notifications' && <Notifications notifications={relevantNotifications} onMarkRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onClear={() => setNotifications([])} onBack={() => setCurrentView('profile')} />}
      </main>

      {!user.isDeliveryBoy && currentView !== 'assistant' && (
        <button onClick={() => setCurrentView('assistant')} className={`fixed ${isSpecialView ? 'bottom-6' : 'bottom-24'} right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40`}>
          <i className="fas fa-robot text-xl"></i>
        </button>
      )}

      {!isSpecialView && (
        <Navbar currentView={currentView} onViewChange={setCurrentView} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} />
      )}
    </div>
  );
};

export default App;
