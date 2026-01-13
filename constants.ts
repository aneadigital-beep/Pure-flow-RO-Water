
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '20L RO Water Can',
    description: 'Freshly purified RO water in a premium sealed 20-liter can.',
    price: 35,
    unit: 'Can',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=400',
    category: 'can'
  },
  {
    id: 'p2',
    name: 'Weekly Subscription',
    description: 'Perfect for small families. 2 cans delivered every week.',
    price: 250,
    unit: 'Month',
    image: 'https://images.unsplash.com/photo-1560067174-c5a3a8f37060?auto=format&fit=crop&q=80&w=400',
    category: 'subscription'
  },
  {
    id: 'p3',
    name: 'Daily Family Plan',
    description: 'Never run out. One 20L can delivered daily to your home.',
    price: 900,
    unit: 'Month',
    image: 'https://images.unsplash.com/photo-1516733968668-dbdce39c46ef?auto=format&fit=crop&q=80&w=400',
    category: 'subscription'
  },
  {
    id: 'p4',
    name: 'Manual Hand Pump',
    description: 'Food-grade manual pump for easy water dispensing.',
    price: 150,
    unit: 'Piece',
    image: 'https://images.unsplash.com/photo-1615461066841-6116ecaabb04?auto=format&fit=crop&q=80&w=400',
    category: 'accessory'
  },
  {
    id: 'p5',
    name: 'Automatic Dispenser',
    description: 'Quiet, USB-rechargeable electric water pump.',
    price: 450,
    unit: 'Piece',
    image: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&q=80&w=400',
    category: 'accessory'
  }
];

export const TOWN_NAME = "Township RO";
export const DELIVERY_FEE = 10;
export const DEFAULT_UPI_ID = "townshipro@upi";
export const BUSINESS_PHONE = "9999999999";
