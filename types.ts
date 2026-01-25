
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  category: 'can' | 'subscription' | 'accessory';
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  tag: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id?: string;
  mobile?: string;
  email?: string;
  pin?: string;
  name: string;
  address: string;
  pincode: string;
  selectedZone: string; // Mandatory delivery zone
  avatar?: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isDeliveryBoy?: boolean;
  preferredAreas?: string[]; // Array of zone/street names for staff
}

export interface StatusHistory {
  status: 'Pending' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  timestamp: string;
  note?: string;
}

export type DeliverySlot = 'Morning (8AM-11AM)' | 'Afternoon (12PM-3PM)' | 'Evening (4PM-7PM)';

export interface Order {
  id: string;
  userMobile: string;
  userName: string;
  userAddress: string;
  userZipcode: string;
  productSummary: string;
  date: string;
  createdAt: string;
  total: number;
  items: CartItem[];
  status: 'Pending' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  paymentMethod: 'COD' | 'UPI/Online';
  deliverySlot?: DeliverySlot;
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

export type View = 'home' | 'cart' | 'profile' | 'orders' | 'admin' | 'delivery' | 'notifications' | 'support';
