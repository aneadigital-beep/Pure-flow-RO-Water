
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Product, CartItem, View, Order, StatusHistory, AppNotification, DeliverySlot, Promotion } from './types';
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
  deleteUserFromSupabase,
  fetchPromotionsFromSupabase,
  syncPromotionToSupabase,
  deletePromotionFromSupabase,
  cleanId,
  mapFromDB
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
  // 1. Hook Definitions (Must be at the top level)
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
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

  const normalizeId = useCallback((id: any) => cleanId(id), []);

  // Compute IDs and task counts before early returns to avoid Rule of Hooks violation
  const myNormalizedId = useMemo(() => normalizeId(user?.mobile || user?.id), [user, normalizeId]);

  const pendingTasksCount = useMemo(() => {
    if (!myNormalizedId) return 0;
    return allOrders.filter(o => 
      normalizeId(o.assignedToMobile) === myNormalizedId && 
      o.status !== 'Delivered' && 
      o.status !== 'Cancelled'
    ).length;
  }, [allOrders, myNormalizedId, normalizeId]);

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

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'], forAdmin: boolean, userMobile?: string | null) => {
    if (!userMobile && !forAdmin) return;
    const targetId = normalizeId(userMobile);
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title, message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type, isRead: false, forAdmin,
      userMobile: targetId || undefined
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    const myId = normalizeId(user?.mobile || user?.id);
    const isRelevantUser = !forAdmin && user && myId === targetId;
    const isRelevantAdmin = forAdmin && user?.isAdmin;
    
    if (isRelevantUser || isRelevantAdmin) {
      setActiveToast({ title, message });
    }
  }, [user, normalizeId]);

  useEffect(() => {
    const splashTimer = setTimeout(() => setAppLoading(false), 2500);

    const loadCloudData = async () => {
      try {
        const [cloudOrders, cloudUsers, cloudProducts, cloudSettings, cloudPromotions] = await Promise.all([
          fetchOrdersFromSupabase(),
          fetchUsersFromSupabase(),
          fetchProductsFromSupabase(),
          fetchSettingsFromSupabase(),
          fetchPromotionsFromSupabase()
        ]);

        if (cloudOrders) {
          setIsCloudSynced(true);
          setAllOrders(cloudOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          cloudOrders.forEach(o => upsertDocument(COLLECTIONS.ORDERS, o.id, o));
        }

        if (cloudUsers) {
          setRegisteredUsers(cloudUsers);
          cloudUsers.forEach((u: User) => {
            const id = normalizeId(u.mobile || u.email || u.id);
            if (id) upsertDocument(COLLECTIONS.USERS, id, u);
          });
        }

        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          cloudProducts.forEach(p => upsertDocument(COLLECTIONS.PRODUCTS, p.id, p));
        }

        if (cloudPromotions && cloudPromotions.length > 0) {
          setPromotions(cloudPromotions);
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

    const orderChannel = subscribeToTable('orders', (payload) => {
      if (payload.new) {
        const newOrder = payload.new as Order;
        upsertDocument(COLLECTIONS.ORDERS, newOrder.id, newOrder);
        setAllOrders(prev => {
          const idx = prev.findIndex(o => o.id === newOrder.id);
          let next;
          if (idx === -1) {
            next = [newOrder, ...prev];
          } else {
            next = [...prev];
            next[idx] = newOrder;
          }
          return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      }
    });

    const userChannel = subscribeToTable('users', (payload) => {
      if (payload.new) {
        const newUser = payload.new as User;
        const id = normalizeId(newUser.mobile || newUser.email || newUser.id);
        if (id) {
          upsertDocument(COLLECTIONS.USERS, id, newUser);
          setRegisteredUsers(prev => {
             const idx = prev.findIndex(u => normalizeId(u.mobile || u.email || u.id) === id);
             if (idx === -1) return [newUser, ...prev];
             const next = [...prev];
             next[idx] = newUser;
             return next;
          });
        }
      }
    });

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(userChannel);
    };
  }, [normalizeId]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>, note?: string) => {
    let finalUpdatedOrder: Order | null = null;
    
    setAllOrders(prev => {
      const orderToUpdate = prev.find(o => o.id === orderId);
      if (!orderToUpdate) return prev;

      const now = new Date();
      const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      finalUpdatedOrder = {
        ...orderToUpdate,
        ...updates,
        history: [
          ...(orderToUpdate.history || []),
          { 
            status: updates.status || orderToUpdate.status, 
            timestamp, 
            note: note || `Updated: ${Object.keys(updates).join(', ')}` 
          }
        ]
      };

      return prev.map(o => o.id === orderId ? finalUpdatedOrder! : o);
    });

    if (finalUpdatedOrder) {
      await upsertDocument(COLLECTIONS.ORDERS, orderId, finalUpdatedOrder);
      await syncOrderToSupabase(finalUpdatedOrder);
      
      if (updates.assignedToMobile) {
        addNotification(
          'New Task Assigned', 
          `Order #${orderId} has been assigned to you.`, 
          'delivery', 
          false, 
          updates.assignedToMobile
        );
      }
    }
  }, [addNotification]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], note?: string) => {
    return updateOrder(orderId, { status }, note);
  }, [updateOrder]);

  const assignOrder = useCallback(async (orderId: string, staffMobile: string | undefined) => {
    const normalizedStaffId = normalizeId(staffMobile);
    const staff = registeredUsers.find(u => normalizeId(u.mobile || u.id) === normalizedStaffId);
    
    return updateOrder(orderId, {
      assignedToMobile: normalizedStaffId || undefined,
      assignedToName: staff?.name || (staffMobile ? 'Staff Partner' : undefined)
    });
  }, [updateOrder, registeredUsers, normalizeId]);

  const handleUpdateUser = async (updatedUser: User) => {
    const id = normalizeId(updatedUser.mobile || updatedUser.email || updatedUser.id);
    if (!id) return;
    setUser(updatedUser);
    await upsertDocument(COLLECTIONS.USERS, id, updatedUser);
    await syncUserToSupabase(updatedUser);
  };

  const handleLogin = async (creds: any) => {
    const ADMIN_IDS = ['9999999999', '9620674013'];
    const id = normalizeId(creds.mobile || creds.email);
    if (!id) return;
    const existingCloudUser = registeredUsers.find(u => normalizeId(u.mobile || u.id) === id);
    
    const isAdmin = ADMIN_IDS.includes(id) || existingCloudUser?.isAdmin || false; 
    const isDeliveryBoy = existingCloudUser?.isDeliveryBoy || false;

    const newUser: User = { 
      ...creds, 
      isLoggedIn: true, 
      isAdmin, 
      isDeliveryBoy,
      preferredAreas: existingCloudUser?.preferredAreas || []
    };
    
    setUser(newUser);
    await upsertDocument(COLLECTIONS.USERS, id, newUser);
    await syncUserToSupabase(newUser);
    
    if (isAdmin) setCurrentView('admin');
    else if (isDeliveryBoy) setCurrentView('delivery');
    else setCurrentView('home');
  };

  const handleLogout = () => { setUser(null); setCurrentView('home'); setCart([]); localStorage.removeItem('pureflow_user'); };

  const placeOrder = async (paymentMethod: 'COD' | 'UPI/Online', deliverySlot: DeliverySlot): Promise<Order | null> => {
    if (!user || cart.length === 0) return null;
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const productSummary = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
    const now = new Date();
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const myId = normalizeId(user.mobile || user.id);
    if (!myId) return null;
    
    const newOrder: Order = {
      id: orderId,
      userMobile: myId,
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

    await upsertDocument(COLLECTIONS.ORDERS, orderId, newOrder);
    setAllOrders(prev => [newOrder, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    await syncOrderToSupabase(newOrder);
    setCart([]);
    addNotification('Order Confirmed', `Order #${orderId} scheduled for ${deliverySlot}.`, 'order', false, newOrder.userMobile);
    return newOrder;
  };

  const handleAddProduct = useCallback(async (product: Product) => {
    await upsertDocument(COLLECTIONS.PRODUCTS, product.id, product);
    setProducts(prev => [product, ...prev]);
    await syncProductToSupabase(product);
  }, []);

  const handleUpdateProduct = useCallback(async (product: Product) => {
    await upsertDocument(COLLECTIONS.PRODUCTS, product.id, product);
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    await syncProductToSupabase(product);
  }, []);

  const handleDeleteProduct = useCallback(async (id: string) => {
    await deleteDocument(COLLECTIONS.PRODUCTS, id);
    setProducts(prev => prev.filter(p => p.id !== id));
    await deleteProductFromSupabase(id);
  }, []);

  const handleAddPromotion = useCallback(async (promo: Promotion) => {
    setPromotions(prev => [promo, ...prev]);
    await syncPromotionToSupabase(promo);
  }, []);

  const handleUpdatePromotion = useCallback(async (promo: Promotion) => {
    setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p));
    await syncPromotionToSupabase(promo);
  }, []);

  const handleDeletePromotion = useCallback(async (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    await deletePromotionFromSupabase(id);
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
    if (!id) return;
    const existing = registeredUsers.find(u => normalizeId(u.mobile || u.id) === id);
    const newStaff: User = { 
      mobile, name, address: '', pincode: '', selectedZone: primaryStreet, 
      isLoggedIn: false, isDeliveryBoy: true, preferredAreas: [primaryStreet],
      ...(existing || {})
    };
    
    await upsertDocument(COLLECTIONS.USERS, id, newStaff);
    setRegisteredUsers(prev => {
      const idx = prev.findIndex(u => normalizeId(u.mobile || u.id) === id);
      if (idx === -1) return [newStaff, ...prev];
      const next = [...prev];
      next[idx] = newStaff;
      return next;
    });
    await syncUserToSupabase(newStaff);
  }, [registeredUsers, normalizeId]);

  const handleUpdateStaffRole = useCallback(async (mobile: string, isDelivery: boolean) => {
    const id = normalizeId(mobile);
    if (!id) return;
    const existing = registeredUsers.find(u => normalizeId(u.mobile || u.id) === id);
    if (!existing) return;
    const updated = { ...existing, isDeliveryBoy: isDelivery };
    setRegisteredUsers(prev => prev.map(u => normalizeId(u.mobile || u.id) === id ? updated : u));
    await upsertDocument(COLLECTIONS.USERS, id, updated);
    await syncUserToSupabase(updated);
  }, [registeredUsers, normalizeId]);

  const handleUpdateAdminRole = useCallback(async (mobile: string, isAdmin: boolean) => {
    const id = normalizeId(mobile);
    if (!id) return;
    const existing = registeredUsers.find(u => normalizeId(u.mobile || u.id) === id);
    if (!existing) return;
    const updated = { ...existing, isAdmin };
    setRegisteredUsers(prev => prev.map(u => normalizeId(u.mobile || u.id) === id ? updated : u));
    await upsertDocument(COLLECTIONS.USERS, id, updated);
    await syncUserToSupabase(updated);
  }, [registeredUsers, normalizeId]);

  const handleUpdateStaffAreas = useCallback(async (mobile: string, areas: string[]) => {
    const id = normalizeId(mobile);
    if (!id) return;
    const existing = registeredUsers.find(u => normalizeId(u.mobile || u.id) === id);
    if (!existing) return;
    const updated = { ...existing, preferredAreas: areas };
    setRegisteredUsers(prev => prev.map(u => normalizeId(u.mobile || u.id) === id ? updated : u));
    await upsertDocument(COLLECTIONS.USERS, id, updated);
    await syncUserToSupabase(updated);
  }, [registeredUsers, normalizeId]);

  const handleDeleteStaff = useCallback(async (mobile: string) => {
    const id = normalizeId(mobile);
    if (!id) return;
    setRegisteredUsers(prev => prev.filter(u => normalizeId(u.mobile || u.id) !== id));
    await deleteDocument(COLLECTIONS.USERS, id);
    await deleteUserFromSupabase(id);
  }, [normalizeId]);

  // 2. Conditional Returns (Must be after all hook definitions)
  if (appLoading) return <SplashScreen />;
  if (!user) return <Login onLogin={handleLogin} registeredUsers={registeredUsers} townZones={townZones} />;

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-50 dark:bg-slate-900 overflow-hidden text-left relative">
      {activeToast && <Toast title={activeToast.title} message={activeToast.message} onClose={() => setActiveToast(null)} />}
      <Navbar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
        user={user}
        taskCount={pendingTasksCount}
      />
      
      <div className="flex-1 flex flex-col relative h-full md:pl-20 pb-20 md:pb-0 transition-all duration-300 overflow-hidden text-left">
        <header className="flex-none z-40 backdrop-blur-md border-b shadow-lg bg-blue-600 border-blue-500/30 dark:bg-slate-900/95 dark:border-slate-800 pt-safe">
          <div className="w-full flex justify-between items-center py-4 px-6 text-white max-w-4xl mx-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
                <div className="h-9 w-9 bg-white/10 rounded-xl flex items-center justify-center shadow-inner"><i className="fas fa-droplet text-blue-200"></i></div>
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
                {notifications.filter(n => !n.isRead && normalizeId(n.userMobile) === myNormalizedId).length > 0 && <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-slate-900 shadow-sm"></span>}
              </button>
              <div className="h-9 w-9 rounded-xl border-2 border-white/20 overflow-hidden cursor-pointer active:scale-95 transition-transform" onClick={() => setCurrentView('profile')}>
                {user.avatar ? <img src={user.avatar} className="h-full w-full object-cover" alt="User" /> : <div className="h-full w-full flex items-center justify-center text-xs font-black uppercase bg-white/10">{user.name.charAt(0)}</div>}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-hide relative bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-6 pb-24 min-h-full flex flex-col">
            {currentView === 'home' && <Home products={products} promotions={promotions} onAddToCart={(p) => setCart(prev => [...prev, { product: p, quantity: 1 }])} />}
            {currentView === 'cart' && <Cart items={cart} upiId={upiId} onUpdate={(id, d) => setCart(prev => prev.map(i => i.product.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onRemove={(id) => setCart(prev => prev.filter(i => i.product.id !== id))} onPlaceOrder={placeOrder} deliveryFee={deliveryFee} onViewChange={setCurrentView} />}
            {currentView === 'profile' && <Profile user={user} onLogout={handleLogout} onAdminClick={() => setCurrentView('admin')} onDeliveryClick={() => setCurrentView('delivery')} onNotificationsClick={() => setCurrentView('notifications')} onSupportClick={() => setCurrentView('support')} onUpdateUser={handleUpdateUser} unreadNotifCount={notifications.filter(n => !n.isRead && normalizeId(n.userMobile) === myNormalizedId).length} />}
            {currentView === 'orders' && <Orders orders={allOrders.filter(o => normalizeId(o.userMobile) === myNormalizedId)} upiId={upiId} onCancelOrder={(id) => updateOrderStatus(id, 'Cancelled', 'Cancelled by User')} onHelpClick={() => setCurrentView('support')} />}
            {currentView === 'support' && <Support onBack={() => setCurrentView('profile')} />}
            {currentView === 'delivery' && <DeliveryDashboard orders={allOrders.filter(o => normalizeId(o.assignedToMobile) === myNormalizedId)} onUpdateStatus={updateOrderStatus} user={user} isLive={isCloudSynced} />}
            {currentView === 'admin' && (
              <Admin 
                products={products} 
                orders={allOrders} 
                promotions={promotions}
                onUpdateOrder={updateOrder} 
                onUpdateStatus={updateOrderStatus}
                registeredUsers={registeredUsers} 
                upiId={upiId} 
                deliveryFee={deliveryFee} 
                townZones={townZones} 
                onUpdateDeliveryFee={updateDeliveryFee} 
                onUpdateUpiId={updateUpiId} 
                onUpdateTownZones={updateTownZones} 
                onAssignOrder={assignOrder} 
                onAddProduct={handleAddProduct} 
                onUpdateProduct={handleUpdateProduct} 
                onDeleteProduct={handleDeleteProduct} 
                onAddPromotion={handleAddPromotion}
                onUpdatePromotion={handleUpdatePromotion}
                onDeletePromotion={handleDeletePromotion}
                onAddStaff={handleAddStaff} 
                onUpdateStaffRole={handleUpdateStaffRole} 
                onUpdateAdminRole={handleUpdateAdminRole} 
                onUpdateStaffAreas={handleUpdateStaffAreas} 
                onDeleteStaff={handleDeleteStaff} 
                onBack={() => setCurrentView('profile')} 
                isCloudSynced={isCloudSynced} 
              />
            )}
            {currentView === 'notifications' && <Notifications notifications={notifications.filter(n => (n.forAdmin && user.isAdmin) || (!n.forAdmin && normalizeId(n.userMobile) === myNormalizedId))} onMarkRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} onClear={() => setNotifications([])} onBack={() => setCurrentView('profile')} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
