
import React, { useState, useEffect } from 'react';
import { User, Product, CartItem, View, Order, StatusHistory, AppNotification } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, TOWN_NAME, DELIVERY_FEE as DEFAULT_DELIVERY_FEE } from './constants';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Login from './components/Login';
import Orders from './components/Orders';
import Admin from './components/Admin';
import Notifications from './components/Notifications';
import Assistant from './components/Assistant';
import Toast from './components/Toast';

const App: React.FC = () => {
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

  useEffect(() => {
    if (user) {
      localStorage.setItem('pureflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pureflow_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pureflow_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('pureflow_all_orders', JSON.stringify(allOrders));
  }, [allOrders]);

  useEffect(() => {
    localStorage.setItem('pureflow_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pureflow_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('pureflow_delivery_fee', deliveryFee.toString());
  }, [deliveryFee]);

  const addNotification = (title: string, message: string, type: AppNotification['type'], forAdmin: boolean, userMobile?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      isRead: false,
      forAdmin,
      userMobile
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    if (user) {
      if ((forAdmin && user.isAdmin) || (!forAdmin && user.mobile === userMobile)) {
        setActiveToast({ title, message });
      }
    }
  };

  const handleLogin = (mobile: string, name: string, address: string, pincode: string, avatar?: string) => {
    const ADMIN_MOBILE = '9999999999';
    const isAdmin = mobile === ADMIN_MOBILE; 
    const newUser: User = { mobile, name, address, pincode, avatar, isLoggedIn: true, isAdmin };
    setUser(newUser);
    setRegisteredUsers(prev => {
      const existing = prev.find(u => u.mobile === mobile);
      if (existing) {
        return prev.map(u => u.mobile === mobile ? newUser : u);
      }
      return [...prev, newUser];
    });
    setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    setCart([]);
  };

  const handleImportData = (data: any) => {
    if (!data.registeredUsers || !data.allOrders || !data.products) {
      alert("Invalid backup file format!");
      return;
    }

    if (window.confirm("This will overwrite all current data with the backup. Continue?")) {
      localStorage.setItem('pureflow_registered_users', JSON.stringify(data.registeredUsers));
      localStorage.setItem('pureflow_all_orders', JSON.stringify(data.allOrders));
      localStorage.setItem('pureflow_products', JSON.stringify(data.products));
      localStorage.setItem('pureflow_notifications', JSON.stringify(data.notifications || []));
      localStorage.setItem('pureflow_delivery_fee', (data.deliveryFee || DEFAULT_DELIVERY_FEE).toString());
      
      // Force reload to apply all restored states
      window.location.reload();
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const placeOrder = (paymentMethod: 'COD' | 'UPI/Online') => {
    if (!user || cart.length === 0) return;
    
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userMobile: user.mobile,
      userName: user.name,
      userAddress: `${user.address}, ${user.pincode}`,
      date: now.toLocaleDateString(),
      createdAt: now.toISOString(),
      total: subtotal + deliveryFee,
      items: [...cart],
      status: 'Pending',
      paymentMethod,
      history: [{ status: 'Pending', timestamp: `${now.toLocaleDateString()} ${timestamp}`, note: 'Order placed by customer' }]
    };

    setAllOrders([newOrder, ...allOrders]);
    setCart([]);
    setCurrentView('orders');
    
    addNotification(
      'New Order Received!',
      `${user.name} placed a new order for ₹${newOrder.total}.`,
      'order',
      true
    );
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setAllOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const historyEntry: StatusHistory = {
          status,
          timestamp: `${now.toLocaleDateString()} ${timestamp}`,
          note: `Order marked as ${status.toLowerCase()} by admin`
        };

        addNotification(
          `Order ${status}!`,
          `Your order ${orderId} has been ${status.toLowerCase()}.`,
          status === 'Delivered' ? 'delivery' : 'system',
          false,
          o.userMobile
        );

        return { 
          ...o, 
          status, 
          history: [...o.history, historyEntry] 
        };
      }
      return o;
    }));
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  if (!user) {
    return <Login onLogin={handleLogin} registeredUsers={registeredUsers} />;
  }

  const userOrders = allOrders.filter(o => o.userMobile === user.mobile);
  const relevantNotifications = notifications.filter(n => (n.forAdmin && user.isAdmin) || (!n.forAdmin && n.userMobile === user.mobile));
  const unreadCount = relevantNotifications.filter(n => !n.isRead).length;

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Home products={products} onAddToCart={addToCart} />;
      case 'cart': return <Cart items={cart} onUpdate={updateQuantity} onRemove={removeFromCart} onPlaceOrder={placeOrder} deliveryFee={deliveryFee} />;
      case 'profile': return <Profile user={user} onLogout={handleLogout} onAdminClick={() => setCurrentView('admin')} onNotificationsClick={() => setCurrentView('notifications')} unreadNotifCount={unreadCount} />;
      case 'orders': return <Orders orders={userOrders} />;
      case 'assistant': return <Assistant onBack={() => setCurrentView('home')} />;
      case 'admin': return (
        <Admin 
          products={products} 
          onUpdateProduct={updateProduct} 
          onAddProduct={addProduct} 
          orders={allOrders} 
          onUpdateStatus={updateOrderStatus} 
          onBack={() => setCurrentView('profile')}
          deliveryFee={deliveryFee}
          onUpdateDeliveryFee={setDeliveryFee}
          registeredUsers={registeredUsers}
          notifications={notifications}
          onImportData={handleImportData}
        />
      );
      case 'notifications': return <Notifications notifications={relevantNotifications} onMarkRead={markNotificationsAsRead} onClear={clearNotifications} onBack={() => setCurrentView('profile')} />;
      default: return <Home products={products} onAddToCart={addToCart} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {activeToast && <Toast title={activeToast.title} message={activeToast.message} onClose={() => setActiveToast(null)} />}
      
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <i className="fas fa-droplet text-blue-200"></i>
            {TOWN_NAME}
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('notifications')}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-blue-600"></span>
              )}
            </button>
            <div className="h-8 w-8 rounded-full border border-white/20 bg-blue-500 overflow-hidden cursor-pointer shadow-inner" onClick={() => setCurrentView('profile')}>
              {user.avatar ? (
                <img src={user.avatar} className="h-full w-full object-cover" alt="User" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold uppercase">{user.name.charAt(0)}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6">
        {renderView()}
      </main>

      {currentView !== 'assistant' && (
        <button 
          onClick={() => setCurrentView('assistant')}
          className="fixed bottom-24 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
          <i className="fas fa-robot text-xl"></i>
          <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
        </button>
      )}

      <Navbar 
        currentView={currentView === 'admin' || currentView === 'notifications' || currentView === 'assistant' ? 'profile' : currentView} 
        onViewChange={setCurrentView} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
      />
    </div>
  );
};

export default App;
