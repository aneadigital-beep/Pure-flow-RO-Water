
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, CartItem, View, Order, StatusHistory, AppNotification } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, TOWN_NAME, DELIVERY_FEE as DEFAULT_DELIVERY_FEE } from './constants';
import { db, COLLECTIONS, syncCollection, upsertDocument, updateDocument, deleteDocument, getDocument, orderBy } from './firebase';
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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pureflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pureflow_dark_mode');
    return saved === 'true';
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);
  const [currentView, setCurrentView] = useState<View>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeToast, setActiveToast] = useState<{title: string, message: string} | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pureflow_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    // Sync collections using our new local persistence engine
    const unsubOrders = syncCollection(COLLECTIONS.ORDERS, (data) => {
      setAllOrders(data as Order[]);
      setAppLoading(false);
    }, [orderBy('createdAt', 'desc')]);

    const unsubUsers = syncCollection(COLLECTIONS.USERS, (data) => {
      setRegisteredUsers(data as User[]);
    });

    const unsubProducts = syncCollection(COLLECTIONS.PRODUCTS, (data) => {
      if (data.length > 0) setProducts(data as Product[]);
    });

    const unsubSettings = syncCollection(COLLECTIONS.SETTINGS, (data) => {
      const feeSetting = data.find(d => d.id === 'deliveryFee');
      if (feeSetting) setDeliveryFee(feeSetting.value);
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubProducts();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('pureflow_user', JSON.stringify(user));
    else localStorage.removeItem('pureflow_user');
  }, [user]);

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

  const handleLogin = async (mobile: string, name: string, address: string, pincode: string, avatar?: string) => {
    const ADMIN_MOBILE = '9999999999';
    const existingCloudUser = await getDocument(COLLECTIONS.USERS, String(mobile)) as any;
    const isAdmin = mobile === ADMIN_MOBILE || existingCloudUser?.isAdmin; 
    const isDeliveryBoy = existingCloudUser?.isDeliveryBoy;

    const newUser: User = { 
      mobile: String(mobile), 
      name: existingCloudUser?.name || name, 
      address: existingCloudUser?.address || address, 
      pincode: existingCloudUser?.pincode || pincode, 
      avatar: existingCloudUser?.avatar || avatar, 
      isLoggedIn: true, 
      isAdmin, 
      isDeliveryBoy 
    };
    
    setUser(newUser);
    await upsertDocument(COLLECTIONS.USERS, String(mobile), newUser);

    if (isDeliveryBoy) setCurrentView('delivery');
    else if (isAdmin) setCurrentView('admin');
    else setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    setCart([]);
  };

  const placeOrder = async (paymentMethod: 'COD' | 'UPI/Online') => {
    if (!user || cart.length === 0) return;
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newOrder: Order = {
      id: orderId,
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

    await upsertDocument(COLLECTIONS.ORDERS, orderId, newOrder);
    setCart([]);
    setCurrentView('orders');
    addNotification('New Order!', `${user.name} placed a new order.`, 'order', true);
  };

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], note?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const historyEntry: StatusHistory = {
      status,
      timestamp: `${now.toLocaleDateString()} ${timestamp}`,
      note: note || `Status updated to ${status}`
    };

    await updateDocument(COLLECTIONS.ORDERS, orderId, {
      status,
      history: [...orderToUpdate.history, historyEntry]
    });

    addNotification(`Order ${status}!`, `Order ${orderId} is now ${status.toLowerCase()}.`, 'system', false, orderToUpdate.userMobile);
  }, [allOrders, addNotification]);

  const assignOrder = useCallback(async (orderId: string, staffMobile: string | undefined) => {
    const staff = registeredUsers.find(u => String(u.mobile) === String(staffMobile));
    await updateDocument(COLLECTIONS.ORDERS, orderId, {
      assignedToMobile: staffMobile ? String(staffMobile) : null, 
      assignedToName: staff?.name || null
    });
    if (staffMobile) addNotification('New Task', `Order ${orderId} assigned to you.`, 'system', false, String(staffMobile));
  }, [registeredUsers, addNotification]);

  const updateStaffRole = async (mobile: string, isDelivery: boolean) => {
    await updateDocument(COLLECTIONS.USERS, String(mobile), { isDeliveryBoy: isDelivery });
  };

  const updateAdminRole = async (mobile: string, isAdmin: boolean) => {
    if (mobile === '9999999999' && !isAdmin) {
      alert("Primary admin cannot be demoted.");
      return;
    }
    await updateDocument(COLLECTIONS.USERS, String(mobile), { isAdmin });
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDocument(COLLECTIONS.PRODUCTS, id);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  if (appLoading) {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white p-6">
        <div className="h-16 w-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-lg animate-pulse">Initializing PureFlow...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} registeredUsers={registeredUsers} onImportData={(d) => {}} />;
  }

  const userOrders = allOrders.filter(o => String(o.userMobile) === String(user.mobile));
  const relevantNotifications = notifications.filter(n => (n.forAdmin && user.isAdmin) || (!n.forAdmin && String(n.userMobile) === String(user.mobile)));
  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-900 ${['admin', 'delivery', 'assistant'].includes(currentView) ? '' : 'pb-20'}`}>
      {activeToast && <Toast title={activeToast.title} message={activeToast.message} onClose={() => setActiveToast(null)} />}
      
      <header className={`text-white p-4 shadow-md sticky top-0 z-50 ${user.isDeliveryBoy ? 'bg-green-600 dark:bg-green-800' : 'bg-blue-600 dark:bg-blue-800'}`}>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
              <i className="fas fa-droplet text-blue-200"></i>
              {TOWN_NAME}
            </h1>
            <div 
              className="h-2.5 w-2.5 rounded-full border border-white/20 bg-green-400" 
              title="Local Persistence Active"
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button onClick={() => setCurrentView('notifications')} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-blue-600 dark:border-blue-800"></span>}
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
        {currentView === 'delivery' && <DeliveryDashboard orders={allOrders.filter(o => String(o.assignedToMobile) === String(user.mobile))} onUpdateStatus={updateOrderStatus} user={user} isLive={true} />}
        {currentView === 'admin' && (
          <Admin 
            products={products} 
            onUpdateProduct={(p) => updateDocument(COLLECTIONS.PRODUCTS, p.id, p)} 
            onAddProduct={(p) => upsertDocument(COLLECTIONS.PRODUCTS, p.id, p)} 
            onDeleteProduct={handleDeleteProduct}
            orders={allOrders} onUpdateStatus={updateOrderStatus} onBack={() => setCurrentView('profile')}
            deliveryFee={deliveryFee} 
            onUpdateDeliveryFee={(fee) => upsertDocument(COLLECTIONS.SETTINGS, 'deliveryFee', { value: fee })} 
            registeredUsers={registeredUsers} notifications={notifications} onImportData={(d) => {}}
            onAssignOrder={assignOrder} 
            onAddStaff={(mobile, name) => upsertDocument(COLLECTIONS.USERS, mobile, { mobile, name, isDeliveryBoy: true, address: 'Staff' })} 
            onUpdateStaffRole={updateStaffRole}
            onUpdateAdminRole={updateAdminRole}
          />
        )}
        {currentView === 'notifications' && <Notifications notifications={relevantNotifications} onMarkRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onClear={() => setNotifications([])} onBack={() => setCurrentView('profile')} />}
      </main>

      {!user.isDeliveryBoy && currentView !== 'assistant' && (
        <button onClick={() => setCurrentView('assistant')} className={`fixed ${['admin', 'delivery', 'assistant'].includes(currentView) ? 'bottom-6' : 'bottom-24'} right-6 h-14 w-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95`}>
          <i className="fas fa-robot text-xl"></i>
        </button>
      )}

      {!['admin', 'delivery', 'assistant'].includes(currentView) && (
        <Navbar currentView={currentView} onViewChange={setCurrentView} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} />
      )}
    </div>
  );
};

export default App;
