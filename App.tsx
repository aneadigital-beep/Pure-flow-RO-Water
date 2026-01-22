
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Product, CartItem, View, Order, StatusHistory, AppNotification, DeliverySlot } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, TOWN_NAME, DELIVERY_FEE as DEFAULT_DELIVERY_FEE, DEFAULT_UPI_ID } from './constants';
import { COLLECTIONS, syncCollection, upsertDocument, updateDocument, deleteDocument, getDocument, orderBy } from './firebase';
import { 
  supabase, 
  syncOrderToSupabase, 
  fetchOrdersFromSupabase, 
  syncUserToSupabase, 
  fetchUsersFromSupabase, 
  subscribeToTable,
  syncProductToSupabase,
  fetchProductsFromSupabase,
  deleteProductFromSupabase,
  syncSettingToSupabase,
  fetchSettingsFromSupabase,
  deleteUserFromSupabase
} from './supabase';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Login from './components/Login';
import Orders from './components/Orders';
import Admin from './components/Admin';
import DeliveryDashboard from './components/DeliveryDashboard';
import Notifications from './components/Notifications';
import Support from './components/Support';
import Toast from './components/Toast';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pureflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pureflow_dark_mode') === 'true';
    } catch (e) { return false; }
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('pureflow_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);
  const [upiId, setUpiId] = useState<string>(DEFAULT_UPI_ID);
  const [townZones, setTownZones] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeToast, setActiveToast] = useState<{title: string, message: string} | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const normalizeId = useCallback((id: string | undefined | null) => (id || '').replace(/\D/g, '').trim(), []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('pureflow_user', JSON.stringify(user));
      else localStorage.removeItem('pureflow_user');
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('pureflow_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('pureflow_dark_mode', String(isDarkMode)); } catch (e) {}
  }, [isDarkMode]);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'], forAdmin: boolean, userMobile?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title, message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type, isRead: false, forAdmin,
      userMobile: userMobile ? normalizeId(userMobile) : undefined
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    const isRelevantUser = !forAdmin && user && normalizeId(user.mobile || user.email) === normalizeId(userMobile);
    const isRelevantAdmin = forAdmin && user?.isAdmin;
    
    if (isRelevantUser || isRelevantAdmin) {
      setActiveToast({ title, message });
    }
  }, [user, normalizeId]);

  useEffect(() => {
    const splashTimer = setTimeout(() => setAppLoading(false), 2500);

    const loadCloudData = async () => {
      try {
        const [cloudOrders, cloudUsers, cloudProducts, cloudSettings] = await Promise.all([
          fetchOrdersFromSupabase(),
          fetchUsersFromSupabase(),
          fetchProductsFromSupabase(),
          fetchSettingsFromSupabase()
        ]);

        if (cloudOrders) {
          setIsCloudSynced(true);
          setAllOrders(cloudOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          cloudOrders.forEach(o => upsertDocument(COLLECTIONS.ORDERS, o.id, o));
        }

        if (cloudUsers) {
          setRegisteredUsers(cloudUsers);
          cloudUsers.forEach(u => {
            const id = normalizeId(u.mobile || u.email);
            if (id) upsertDocument(COLLECTIONS.USERS, id, u);
          });
        }

        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          cloudProducts.forEach(p => upsertDocument(COLLECTIONS.PRODUCTS, p.id, p));
          localStorage.setItem('pf_products_initialized', 'true');
        }

        if (cloudSettings) {
          cloudSettings.forEach(s => {
            upsertDocument(COLLECTIONS.SETTINGS, s.id, s);
            if (s.id === 'deliveryFee') setDeliveryFee(Number(s.value));
            if (s.id === 'upiId') setUpiId(String(s.value));
            if (s.id === 'townZones') setTownZones(Array.isArray(s.value) ? s.value : []);
          });
        }
      } catch (e) {
        setIsCloudSynced(false);
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
      } else if (!initialized) {
        INITIAL_PRODUCTS.forEach(p => upsertDocument(COLLECTIONS.PRODUCTS, p.id, p));
        localStorage.setItem('pf_products_initialized', 'true');
      }
    });

    const unsubSettings = syncCollection(COLLECTIONS.SETTINGS, (data) => {
      const feeSetting = data.find(d => d.id === 'deliveryFee');
      if (feeSetting) setDeliveryFee(feeSetting.value);
      const upiSetting = data.find(d => d.id === 'upiId');
      if (upiSetting) setUpiId(upiSetting.value);
      const zonesSetting = data.find(d => d.id === 'townZones');
      if (zonesSetting) setTownZones(zonesSetting.value);
    });

    // Real-time Order Watcher
    const orderChannel = subscribeToTable('orders', (payload) => {
      if (payload.new) {
        const newOrder = payload.new as Order;
        upsertDocument(COLLECTIONS.ORDERS, newOrder.id, newOrder);
        
        setAllOrders(prev => {
          const idx = prev.findIndex(o => o.id === newOrder.id);
          let next;
          if (idx === -1) {
            next = [newOrder, ...prev];
            addNotification('New Order', `Received a new order from ${newOrder.userName}`, 'order', true);
          } else {
            next = [...prev];
            next[idx] = newOrder;
          }
          return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });

        if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old?.status) {
           addNotification('Order Updated', `Order #${newOrder.id} is now ${newOrder.status}`, 'system', false, newOrder.userMobile);
        }
      }
    });

    // Real-time User Watcher
    const userChannel = subscribeToTable('users', (payload) => {
      if (payload.new) {
        const newUser = payload.new as User;
        const id = normalizeId(newUser.mobile || newUser.email);
        upsertDocument(COLLECTIONS.USERS, id, newUser);
        setRegisteredUsers(prev => {
           const idx = prev.findIndex(u => normalizeId(u.mobile || u.email) === id);
           if (idx === -1) return [newUser, ...prev];
           const next = [...prev];
           next[idx] = newUser;
           return next;
        });
      }
    });

    const updateOnlineStatus = () => setIsCloudSynced(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      clearTimeout(splashTimer);
      unsubOrders(); unsubUsers(); unsubProducts(); unsubSettings();
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(userChannel);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [normalizeId, addNotification]);

  const handleUpdateUser = async (updatedUser: User) => {
    const id = normalizeId(updatedUser.mobile || updatedUser.email);
    setUser(updatedUser);
    await upsertDocument(COLLECTIONS.USERS, id, updatedUser);
    const success = await syncUserToSupabase(updatedUser);
    if (success) {
      setActiveToast({ title: "Profile Updated", message: "Successfully synced to cloud." });
    } else {
      setActiveToast({ title: "Sync Failed", message: "Updating profile locally. Cloud sync pending." });
    }
  };

  const handleLogin = async (creds: { mobile?: string; email?: string; name: string; address: string; pincode: string; selectedZone: string; avatar?: string; pin?: string }) => {
    const ADMIN_IDS = ['9999999999', '9620674013'];
    const id = normalizeId(creds.mobile || creds.email);
    
    // Check locally/cloud for roles
    const existingCloudUser = await getDocument(COLLECTIONS.USERS, id) as any;
    
    const isAdmin = ADMIN_IDS.includes(id) || creds.email?.includes('admin@punganuraquaflow.com') || existingCloudUser?.isAdmin || false; 
    const isDeliveryBoy = existingCloudUser?.isDeliveryBoy || false;

    const newUser: User = { 
      mobile: creds.mobile, 
      email: creds.email,
      pin: creds.pin || existingCloudUser?.pin,
      name: creds.name || existingCloudUser?.name || 'User', 
      address: creds.address || existingCloudUser?.address || '', 
      pincode: creds.pincode || existingCloudUser?.pincode || '', 
      selectedZone: creds.selectedZone || existingCloudUser?.selectedZone || '',
      avatar: creds.avatar || existingCloudUser?.avatar, 
      isLoggedIn: true, 
      isAdmin, 
      isDeliveryBoy,
      preferredAreas: existingCloudUser?.preferredAreas || []
    };
    
    // UI immediate feedback
    setUser(newUser);
    
    // Persist Locally
    await upsertDocument(COLLECTIONS.USERS, id, newUser);
    setRegisteredUsers(prev => {
      const idx = prev.findIndex(u => normalizeId(u.mobile || u.email) === id);
      if (idx === -1) return [newUser, ...prev];
      const next = [...prev];
      next[idx] = newUser;
      return next;
    });

    // Persist Cloud (MANDATORY for capturing new users)
    const syncSuccess = await syncUserToSupabase(newUser);
    setIsCloudSynced(syncSuccess);
    
    if (isAdmin) setCurrentView('admin');
    else if (isDeliveryBoy) setCurrentView('delivery');
    else setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    setCart([]);
  };

  const placeOrder = async (paymentMethod: 'COD' | 'UPI/Online', deliverySlot: DeliverySlot): Promise<Order | null> => {
    if (!user || cart.length === 0) return null;
    
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const productSummary = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
    const now = new Date();
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const newOrder: Order = {
      id: orderId,
      userMobile: normalizeId(user.mobile || user.email),
      userName: user.name, 
      userAddress: user.address, 
      userZipcode: user.pincode,
      productSummary, 
      date: now.toLocaleDateString(), 
      createdAt: now.toISOString(),
      total: subtotal + deliveryFee, 
      items: [...cart], 
      status: 'Pending', 
      paymentMethod,
      deliverySlot,
      history: [{ status: 'Pending', timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, note: 'Order placed' }]
    };

    // Sequential Save: MUST succeed locally first
    await upsertDocument(COLLECTIONS.ORDERS, orderId, newOrder);
    
    // Local state update for immediate UI response
    setAllOrders(prev => [newOrder, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    // Cloud Sync
    const success = await syncOrderToSupabase(newOrder);
    setIsCloudSynced(success);

    if (!success) {
      setActiveToast({ title: "Order Synced Locally", message: "Cloud sync failed. Our team will verify manually." });
    }

    setCart([]);
    addNotification('Order Confirmed', `Order #${orderId} scheduled for ${deliverySlot}.`, 'order', false, newOrder.userMobile);
    return newOrder;
  };

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], note?: string) => {
    const now = new Date();
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const updatedOrder = {
      ...orderToUpdate, status,
      history: [...orderToUpdate.history, { status, timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, note: note || `Status updated to ${status}` }]
    };

    // UI Update
    setAllOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    
    // Local Storage
    await upsertDocument(COLLECTIONS.ORDERS, orderId, updatedOrder);
    
    // Cloud Sync
    const success = await syncOrderToSupabase(updatedOrder);
    if (!success) {
      setActiveToast({ title: "Sync Error", message: "Cloud update failed. Status saved locally." });
    }
    
    addNotification(`Order ${status}`, `Order ${orderId} is now ${status.toLowerCase()}.`, 'system', false, orderToUpdate.userMobile);
  }, [allOrders, addNotification]);

  const assignOrder = useCallback(async (orderId: string, staffMobile: string | undefined) => {
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    if (!orderToUpdate) return;
    const staff = registeredUsers.find(u => normalizeId(u.mobile || u.email) === normalizeId(staffMobile));
    const assignmentData = { ...orderToUpdate, assignedToMobile: staffMobile, assignedToName: staff?.name };
    
    setAllOrders(prev => prev.map(o => o.id === orderId ? assignmentData : o));
    await upsertDocument(COLLECTIONS.ORDERS, orderId, assignmentData);
    await syncOrderToSupabase(assignmentData);
    if (staffMobile) addNotification('New Task', `Order ${orderId} assigned to you.`, 'delivery', false, staffMobile);
  }, [registeredUsers, allOrders, addNotification, normalizeId]);

  const handleAddProduct = useCallback(async (product: Product) => {
    await upsertDocument(COLLECTIONS.PRODUCTS, product.id, product);
    setProducts(prev => [product, ...prev]);
    await syncProductToSupabase(product);
    setActiveToast({ title: "Product Added", message: `${product.name} added to catalog.` });
  }, []);

  const handleUpdateProduct = useCallback(async (product: Product) => {
    await upsertDocument(COLLECTIONS.PRODUCTS, product.id, product);
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    await syncProductToSupabase(product);
    setActiveToast({ title: "Product Updated", message: `${product.name} details saved.` });
  }, []);

  const handleDeleteProduct = useCallback(async (id: string) => {
    await deleteDocument(COLLECTIONS.PRODUCTS, id);
    setProducts(prev => prev.filter(p => p.id !== id));
    await deleteProductFromSupabase(id);
    setActiveToast({ title: "Product Removed", message: "Item deleted successfully." });
  }, []);

  const updateDeliveryFee = useCallback(async (f: number) => {
    setDeliveryFee(f);
    await upsertDocument(COLLECTIONS.SETTINGS, 'deliveryFee', { value: f });
    await syncSettingToSupabase('deliveryFee', f);
  }, []);

  const updateUpiId = useCallback(async (id: string) => {
    setUpiId(id);
    await upsertDocument(COLLECTIONS.SETTINGS, 'upiId', { value: id });
    await syncSettingToSupabase('upiId', id);
  }, []);

  const updateTownZones = useCallback(async (zones: string[]) => {
    setTownZones(zones);
    await upsertDocument(COLLECTIONS.SETTINGS, 'townZones', { value: zones });
    await syncSettingToSupabase('townZones', zones);
  }, []);

  const handleAddStaff = useCallback(async (mobile: string, name: string, primaryStreet: string) => {
    const id = normalizeId(mobile);
    const existing = await getDocument(COLLECTIONS.USERS, id);
    const newStaff: User = existing 
      ? { ...existing as User, isDeliveryBoy: true, name, preferredAreas: [primaryStreet] } 
      : { mobile, name, address: '', pincode: '', selectedZone: primaryStreet, isLoggedIn: false, isDeliveryBoy: true, preferredAreas: [primaryStreet] };
    
    await upsertDocument(COLLECTIONS.USERS, id, newStaff);
    setRegisteredUsers(prev => {
      const idx = prev.findIndex(u => normalizeId(u.mobile || u.email) === id);
      if (idx === -1) return [newStaff, ...prev];
      const next = [...prev];
      next[idx] = newStaff;
      return next;
    });

    await syncUserToSupabase(newStaff);
    setActiveToast({ title: "Staff Partner Added", message: `${name} is now registered for ${primaryStreet}.` });
  }, [normalizeId]);

  const handleUpdateStaffRole = useCallback(async (mobile: string, isDelivery: boolean) => {
    const id = normalizeId(mobile);
    await updateDocument(COLLECTIONS.USERS, id, { isDeliveryBoy: isDelivery });
    const updated = await getDocument(COLLECTIONS.USERS, id) as User;
    setRegisteredUsers(prev => prev.map(u => normalizeId(u.mobile || u.email) === id ? updated : u));
    await syncUserToSupabase(updated);
  }, [normalizeId]);

  const handleUpdateAdminRole = useCallback(async (mobile: string, isAdmin: boolean) => {
    const id = normalizeId(mobile);
    await updateDocument(COLLECTIONS.USERS, id, { isAdmin: isAdmin });
    const updated = await getDocument(COLLECTIONS.USERS, id) as User;
    setRegisteredUsers(prev => prev.map(u => normalizeId(u.mobile || u.email) === id ? updated : u));
    await syncUserToSupabase(updated);
  }, [normalizeId]);

  const handleUpdateStaffAreas = useCallback(async (mobile: string, areas: string[]) => {
    const id = normalizeId(mobile);
    await updateDocument(COLLECTIONS.USERS, id, { preferredAreas: areas });
    const updated = await getDocument(COLLECTIONS.USERS, id) as User;
    setRegisteredUsers(prev => prev.map(u => normalizeId(u.mobile || u.email) === id ? updated : u));
    await syncUserToSupabase(updated);
    setActiveToast({ title: "Areas Updated", message: "Staff coverage zones saved." });
  }, [normalizeId]);

  const handleDeleteStaff = useCallback(async (mobile: string) => {
    const id = normalizeId(mobile);
    await deleteDocument(COLLECTIONS.USERS, id);
    setRegisteredUsers(prev => prev.filter(u => normalizeId(u.mobile || u.email) !== id));
    await deleteUserFromSupabase(id);
    setActiveToast({ title: "Staff Removed", message: "Account deleted from system." });
  }, [normalizeId]);

  const userOrders = useMemo(() => allOrders.filter(o => normalizeId(o.userMobile) === normalizeId(user?.mobile || user?.email)), [allOrders, user, normalizeId]);
  const relevantNotifications = useMemo(() => notifications.filter(n => (n.forAdmin && user?.isAdmin) || (!n.forAdmin && normalizeId(n.userMobile) === normalizeId(user?.mobile || user?.email))), [notifications, user, normalizeId]);
  const unreadCount = useMemo(() => relevantNotifications.filter(n => !n.isRead).length, [relevantNotifications]);

  if (appLoading) return <SplashScreen />;
  if (!user) return <Login onLogin={handleLogin} registeredUsers={registeredUsers} townZones={townZones} />;

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden text-left">
      {activeToast && <Toast title={activeToast.title} message={activeToast.message} onClose={() => setActiveToast(null)} />}
      <Navbar currentView={currentView} onViewChange={setCurrentView} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} />
      <div className="flex-1 flex flex-col relative h-full md:pl-20 pb-20 md:pb-0 transition-all duration-300">
        <header className="flex-none z-40 backdrop-blur-md border-b shadow-lg bg-blue-600 border-blue-500/30 dark:bg-slate-900/95 dark:border-slate-800 pt-safe">
          <div className="w-full flex justify-between items-center py-4 px-6 text-white max-w-4xl mx-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
                <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center"><i className="fas fa-droplet text-blue-200"></i></div>
                <div className="flex flex-col -space-y-1 text-left">
                  <h1 className="text-lg font-black tracking-tight uppercase leading-none">{TOWN_NAME}</h1>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${isCloudSynced ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{isCloudSynced ? 'Cloud' : 'Offline'}</span>
                  </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"><i className={`fas ${isDarkMode ? 'fa-sun text-yellow-300' : 'fa-moon'}`}></i></button>
              <button onClick={() => setCurrentView('notifications')} className="h-10 w-10 relative flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full"></span>}
              </button>
              <div className="h-9 w-9 rounded-xl border-2 border-white/20 overflow-hidden cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentView('profile')}>
                {user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="User" /> : <div className="h-full w-full flex items-center justify-center text-xs font-black uppercase bg-white/10">{user.name.charAt(0)}</div>}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-6 pb-12 safe-bottom">
            {currentView === 'home' && <Home products={products} onAddToCart={(p) => setCart(prev => [...prev, { product: p, quantity: 1 }])} />}
            {currentView === 'cart' && <Cart items={cart} upiId={upiId} onUpdate={(id, d) => setCart(prev => prev.map(i => i.product.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onRemove={(id) => setCart(prev => prev.filter(i => i.product.id !== id))} onPlaceOrder={placeOrder} deliveryFee={deliveryFee} onViewChange={setCurrentView} />}
            {currentView === 'profile' && <Profile user={user} onLogout={handleLogout} onAdminClick={() => setCurrentView('admin')} onDeliveryClick={() => setCurrentView('delivery')} onNotificationsClick={() => setCurrentView('notifications')} onSupportClick={() => setCurrentView('support')} onUpdateUser={handleUpdateUser} unreadNotifCount={unreadCount} />}
            {currentView === 'orders' && <Orders orders={userOrders} upiId={upiId} onCancelOrder={(id) => updateOrderStatus(id, 'Cancelled', 'Cancelled by User')} onHelpClick={() => setCurrentView('support')} />}
            {currentView === 'support' && <Support onBack={() => setCurrentView('profile')} />}
            {currentView === 'delivery' && <DeliveryDashboard orders={allOrders.filter(o => normalizeId(o.assignedToMobile) === normalizeId(user.mobile || user.email))} onUpdateStatus={updateOrderStatus} user={user} isLive={isCloudSynced} />}
            {currentView === 'admin' && <Admin products={products} orders={allOrders} onUpdateStatus={updateOrderStatus} registeredUsers={registeredUsers} upiId={upiId} deliveryFee={deliveryFee} townZones={townZones} onUpdateDeliveryFee={updateDeliveryFee} onUpdateUpiId={updateUpiId} onUpdateTownZones={updateTownZones} onAssignOrder={assignOrder} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} onAddStaff={handleAddStaff} onUpdateStaffRole={handleUpdateStaffRole} onUpdateAdminRole={handleUpdateAdminRole} onUpdateStaffAreas={handleUpdateStaffAreas} onDeleteStaff={handleDeleteStaff} onBack={() => setCurrentView('profile')} isCloudSynced={isCloudSynced} />}
            {currentView === 'notifications' && <Notifications notifications={relevantNotifications} onMarkRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onClear={() => setNotifications([])} onBack={() => setCurrentView('profile')} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
