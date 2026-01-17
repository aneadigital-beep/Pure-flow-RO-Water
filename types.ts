
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  category: 'can' | 'subscription' | 'accessory';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  mobile?: string;
  email?: string;
  pin?: string;
  name: string;
  address: string;
  pincode: string;
  avatar?: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isDeliveryBoy?: boolean;
}

export interface StatusHistory {
  status: 'Pending' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  userMobile: string;
  userName: string;
  userAddress: string;
  date: string;
  createdAt: string;
  total: number;
  items: CartItem[];
  status: 'Pending' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  paymentMethod: 'COD' | 'UPI/Online';
  history: StatusHistory[];
  assignedToMobile?: string;
  assignedToName?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'delivery' | 'system';
  isRead: boolean;
  forAdmin: boolean;
  userMobile?: string;
}

export type View = 'home' | 'cart' | 'profile' | 'orders' | 'admin' | 'delivery' | 'notifications' | 'assistant';
