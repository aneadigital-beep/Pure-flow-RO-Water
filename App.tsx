
import React, { useState, useEffect, useCallback } from 'react';
import { User, Product, CartItem, View, Order, StatusHistory, AppNotification } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, TOWN_NAME, DELIVERY_FEE as DEFAULT_DELIVERY_FEE, DEFAULT_UPI_ID } from './constants';
import { COLLECTIONS, syncCollection, upsertDocument, updateDocument, deleteDocument, getDocument, orderBy, getTownId, setTownId } from './firebase';
import { supabase, syncOrderToSupabase, fetchOrdersFromSupabase, syncUserToSupabase, fetchUsersFromSupabase, subscribeToTable } from './supabase';
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
import SplashScreen from './components/SplashScreen';

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
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('pureflow_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);
  const [upiId, setUpiId] = useState<string>(DEFAULT_UPI_ID);
  const [currentView, setCurrentView] = useState<View>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeToast, setActiveToast] = useState<{title: string, message: string} | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const normalizeId = (id: string) => id.replace(/\D/g, '').trim();

  useEffect(() => {
    localStorage.setItem('pureflow_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pureflow_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pureflow_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setAppLoading(false), 2500);

    const loadCloudData = async () => {
      try {
        const cloudOrders = await fetchOrdersFromSupabase();
        if (cloudOrders) {
          setIsCloudSynced(true);
          cloudOrders.forEach(o => upsertDocument(COLLECTIONS.ORDERS, o.id, o));
        }
        const cloudUsers = await fetchUsersFromSupabase();
        if (cloudUsers) {
          cloudUsers.forEach(u => {
            const id = normalizeId(u.mobile || u.email || '');
            if (id) upsertDocument(COLLECTIONS.USERS, id, u);
          });
        }
      } catch (e) {
        setIsCloudSynced(false);
        console.warn("Cloud sync failed.");
      }
    };
    loadCloudData();

    const unsubOrders = syncCollection(COLLECTIONS.ORDERS, (data) => {
      setAllOrders(data as Order[]);
    }, [orderBy('createdAt', 'desc')]);

    const unsubUsers = syncCollection(COLLECTIONS.USERS, (data) => {
      setRegisteredUsers(data as User[]);
    });

    const unsubProducts = syncCollection(COLLECTIONS.PRODUCTS, (data) => {
      const initialized = localStorage.getItem('pf_products_initialized');
      if (data && data.length > 0) {
        setProducts(data as Product[]);
        localStorage.setItem('pf_products_initialized', 'true');
      } else if (!initialized) {
        INITIAL_PRODUCTS.forEach(p => upsertDocument(COLLECTIONS.PRODUCTS, p.id, p));
        localStorage.setItem('pf_products_initialized', 'true');
      } else {
        setProducts([]);
      }
    });

    const unsubSettings = syncCollection(COLLECTIONS.SETTINGS, (data) => {
      const feeSetting = data.find(d => d.id === 'deliveryFee');
      if (feeSetting) setDeliveryFee(feeSetting.value);
      const upiSetting = data.find(d => d.id === 'upiId');
      if (upiSetting) setUpiId(upiSetting.value);
    });

    const orderSubscription = subscribeToTable('orders', (payload) => {
      if (payload.new) {
        upsertDocument(COLLECTIONS.ORDERS, payload.new.id, payload.new);
        if (user && payload.eventType === 'UPDATE') {
           const isMyOrder = normalizeId(payload.new.userMobile) === normalizeId(user.mobile || user.email || '');
           if (isMyOrder && payload.new.status !== payload.old?.status) {
             addNotification('Order Updated', `Your order #${payload.new.id} is now ${payload.new.status}`, 'system', false, payload.new.userMobile);
           }
        }
        if (payload.eventType === 'INSERT' && user?.isAdmin) {
          addNotification('New Order Received', `Order #${payload.new.id} just came in from ${payload.new.userName}`, 'order', true);
        }
      }
    });

    return () => {
      clearTimeout(timer);
      unsubOrders();
      unsubUsers();
      unsubProducts();
      unsubSettings();
      orderSubscription.unsubscribe();
    };
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
      userMobile: userMobile ? normalizeId(userMobile) : undefined
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (user) {
      const isRelevantUser = !forAdmin && normalizeId(user.mobile || user.email || '') === normalizeId(userMobile || '');
      const isRelevantAdmin = forAdmin && user.isAdmin;
      if (isRelevantUser || isRelevantAdmin) {
        setActiveToast({ title, message });
      }
    }
  }, [user]);

  const handleLogin = async (creds: { mobile?: string; email?: string; name: string; address: string; pincode: string; avatar?: string; pin?: string }) => {
    const ADMIN_ID = '9999999999';
    const rawId = creds.mobile || creds.email || 'guest';
    const id = normalizeId(rawId);
    
    const existingCloudUser = await getDocument(COLLECTIONS.USERS, id) as any;
    const isAdmin = id === ADMIN_ID || creds.email?.includes('admin@pureflow.com') || existingCloudUser?.isAdmin; 
    const isDeliveryBoy = existingCloudUser?.isDeliveryBoy;

    const newUser: User = { 
      mobile: creds.mobile,
      email: creds.email,
      pin: creds.pin || existingCloudUser?.pin,
      name: creds.name || existingCloudUser?.name || 'User', 
      address: creds.address || existingCloudUser?.address || '', 
      pincode: creds.pincode || existingCloudUser?.pincode || '', 
      avatar: creds.avatar || existingCloudUser?.avatar, 
      isLoggedIn: true, 
      isAdmin, 
      isDeliveryBoy 
    };
    
    setUser(newUser);
    await upsertDocument(COLLECTIONS.USERS, id, newUser);
    await syncUserToSupabase(newUser);
    
    if (isAdmin) setCurrentView('admin');
    else if (isDeliveryBoy) setCurrentView('delivery');
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
    const productSummary = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newOrder: Order = {
      id: orderId,
      userMobile: normalizeId(user.mobile || user.email || ''),
      userName: user.name,
      userAddress: user.address,
      userZipcode: user.pincode,
      productSummary: productSummary,
      date: now.toLocaleDateString(),
      createdAt: now.toISOString(),
      total: subtotal + deliveryFee,
      items: [...cart],
      status: 'Pending',
      paymentMethod,
      history: [{ status: 'Pending', timestamp: `${now.toLocaleDateString()} ${timestamp}`, note: 'Order placed' }]
    };

    await upsertDocument(COLLECTIONS.ORDERS, orderId, newOrder);
    const synced = await syncOrderToSupabase(newOrder);
    if (!synced) {
      setActiveToast({ title: "Local Saved", message: "Order placed locally. Will sync when cloud is reachable." });
    }

    setCart([]);
    setCurrentView('orders');
    addNotification('Order Confirmed', `Order #${orderId} is being prepared.`, 'order', false, newOrder.userMobile);
  };

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], note?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updatedOrder = {
      ...orderToUpdate,
      status,
      history: [...orderToUpdate.history, { status, timestamp: `${now.toLocaleDateString()} ${timestamp}`, note: note || `Status updated to ${status}` }]
    };

    await upsertDocument(COLLECTIONS.ORDERS, orderId, updatedOrder);
    await syncOrderToSupabase(updatedOrder);
    addNotification(`Order ${status}`, `Order ${orderId} is now ${status.toLowerCase()}.`, 'system', false, orderToUpdate.userMobile);
  }, [allOrders, addNotification]);

  const assignOrder = useCallback(async (orderId: string, staffMobile: string | undefined) => {
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;
    const staff = registeredUsers.find(u => normalizeId(u.mobile || u.email || '') === normalizeId(staffMobile || ''));
    const assignmentData = { ...orderToUpdate, assignedToMobile: staffMobile, assignedToName: staff?.name };
    await upsertDocument(COLLECTIONS.ORDERS, orderId, assignmentData);
    await syncOrderToSupabase(assignmentData);
    if (staffMobile) addNotification('New Task', `Order ${orderId} assigned to you.`, 'delivery', false, staffMobile);
  }, [registeredUsers, allOrders, addNotification]);

  const handleAddProduct = useCallback(async (product: Product) => {
    await upsertDocument(COLLECTIONS.PRODUCTS, product.id, product);
    setActiveToast({ title: "Product Added", message: `${product.name} is now in catalog.` });
  }, []);

  const handleUpdateProduct = useCallback(async (product: Product) => {
    await upsertDocument(COLLECTIONS.PRODUCTS, product.id, product);
    setActiveToast({ title: "Product Updated", message: `${product.name} changes saved.` });
  }, []);

  const handleDeleteProduct = useCallback(async (id: string) => {
    await deleteDocument(COLLECTIONS.PRODUCTS, id);
    setActiveToast({ title: "Product Removed", message: "Item deleted from catalog." });
  }, []);

  const handleAddStaff = useCallback(async (mobile: string, name: string) => {
    const id = normalizeId(mobile);
    const existing = await getDocument(COLLECTIONS.USERS, id);
    const newStaff: User = existing ? { ...existing as User, isDeliveryBoy: true, name } : { mobile, name, address: '', pincode: '', isLoggedIn: false, isDeliveryBoy: true };
    await upsertDocument(COLLECTIONS.USERS, id, newStaff);
    await syncUserToSupabase(newStaff);
    setActiveToast({ title: "Staff Added", message: `${name} registered as staff.` });
  }, []);

  const handleUpdateStaffRole = useCallback(async (mobile: string, isDelivery: boolean) => {
    const id = normalizeId(mobile);
    await updateDocument(COLLECTIONS.USERS, id, { isDeliveryBoy: isDelivery });
  }, []);

  const handleUpdateAdminRole = useCallback(async (mobile: string, isAdmin: boolean) => {
    const id = normalizeId(mobile);
    await updateDocument(COLLECTIONS.USERS, id, { isAdmin: isAdmin });
  }, []);

  if (appLoading) return <SplashScreen />;
  if (!user) return <Login onLogin={handleLogin} registeredUsers={registeredUsers} />;

  const userOrders = allOrders.filter(o => normalizeId(o.userMobile) === normalizeId(user.mobile || user.email || ''));
  const relevantNotifications = notifications.filter(n => (n.forAdmin && user.isAdmin) || (!n.forAdmin && normalizeId(n.userMobile || '') === normalizeId(user.mobile || user.email || '')));
  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {activeToast && <Toast title={activeToast.title} message={activeToast.message} onClose={() => setActiveToast(null)} />}
      
      {/* Auto-Fit Responsive Navigation */}
      <Navbar currentView={currentView} onViewChange={setCurrentView} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} />

      {/* Main Adaptive Shell */}
      <div className="flex-1 flex flex-col relative h-full md:pl-20 pb-20 md:pb-0 transition-all duration-300">
        <header className="flex-none z-40 transition-all duration-300 backdrop-blur-md border-b shadow-lg bg-blue-600 border-blue-500/30 dark:bg-slate-900/95 dark:border-slate-800 pt-safe">
          <div className="w-full flex justify-between items-center py-4 px-6 text-white max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center gap-2.5 cursor-pointer group" 
                onClick={() => setCurrentView('home')}
              >
                <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <i className="fas fa-droplet text-blue-200 group-hover:scale-110 transition-transform"></i>
                </div>
                <div className="flex flex-col -space-y-1 text-left">
                  <h1 className="text-lg font-black tracking-tight uppercase leading-none">{TOWN_NAME}</h1>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${isCloudSynced ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                      {isCloudSynced ? 'Cloud' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                <i className={`fas ${isDarkMode ? 'fa-sun text-yellow-300' : 'fa-moon'}`}></i>
              </button>
              <button 
                onClick={() => setCurrentView('notifications')} 
                className="h-10 w-10 relative flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Notifications"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>}
              </button>
              <div 
                className="h-9 w-9 rounded-xl border-2 border-white/20 overflow-hidden cursor-pointer hover:border-white/40 transition-colors" 
                onClick={() => setCurrentView('profile')}
              >
                {user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="User" /> : <div className="h-full w-full flex items-center justify-center text-xs font-black uppercase bg-white/10">{user.name.charAt(0)}</div>}
              </div>
            </div>
          </div>
        </header>

        {/* Content Container with Max Width Centering */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-6 pb-12 safe-bottom">
            {currentView === 'home' && <Home products={products} onAddToCart={(p) => setCart(prev => [...prev, { product: p, quantity: 1 }])} />}
            {currentView === 'cart' && <Cart items={cart} upiId={upiId} onUpdate={(id, d) => setCart(prev => prev.map(i => i.product.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onRemove={(id) => setCart(prev => prev.filter(i => i.product.id !== id))} onPlaceOrder={placeOrder} deliveryFee={deliveryFee} />}
            {currentView === 'profile' && <Profile user={user} onLogout={handleLogout} onAdminClick={() => setCurrentView('admin')} onDeliveryClick={() => setCurrentView('delivery')} onNotificationsClick={() => setCurrentView('notifications')} unreadNotifCount={unreadCount} />}
            {currentView === 'orders' && <Orders orders={userOrders} upiId={upiId} />}
            {currentView === 'assistant' && <Assistant onBack={() => setCurrentView('home')} />}
            {currentView === 'delivery' && <DeliveryDashboard orders={allOrders.filter(o => normalizeId(o.assignedToMobile || '') === normalizeId(user.mobile || user.email || ''))} onUpdateStatus={updateOrderStatus} user={user} isLive={isCloudSynced} />}
            {currentView === 'admin' && (
              <Admin 
                products={products} 
                orders={allOrders} 
                onUpdateStatus={updateOrderStatus} 
                registeredUsers={registeredUsers} 
                upiId={upiId} 
                deliveryFee={deliveryFee} 
                onUpdateDeliveryFee={(f) => upsertDocument(COLLECTIONS.SETTINGS, 'deliveryFee', { value: f })} 
                onUpdateUpiId={(id) => upsertDocument(COLLECTIONS.SETTINGS, 'upiId', { value: id })} 
                onAssignOrder={assignOrder} 
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddStaff={handleAddStaff}
                onUpdateStaffRole={handleUpdateStaffRole}
                onUpdateAdminRole={handleUpdateAdminRole}
                onBack={() => setCurrentView('profile')} 
                isCloudSynced={isCloudSynced} 
              />
            )}
            {currentView === 'notifications' && <Notifications notifications={relevantNotifications} onMarkRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onClear={() => setNotifications([])} onBack={() => setCurrentView('profile')} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
