
import React, { useState } from 'react';
import { Product } from '../types';

interface HomeProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
}

const Home: React.FC<HomeProps> = ({ products, onAddToCart }) => {
  const [category, setCategory] = useState<'all' | 'can' | 'subscription' | 'accessory'>('all');

  const filtered = category === 'all' 
    ? products 
    : products.filter(p => p.category === category);

  return (
    <div className="space-y-6 pb-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-center justify-between shadow-sm">
        <div className="text-left">
          <h2 className="text-blue-800 dark:text-blue-200 font-bold text-lg">Pure Township Water</h2>
          <p className="text-blue-600 dark:text-blue-400 text-sm">Subscription & Quick Supply</p>
        </div>
        <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-truck-fast"></i>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'can', 'subscription', 'accessory'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              category === cat 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(product => (
          <div key={product.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700 flex flex-col group">
            <div className="relative h-48 w-full overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                 <span className="text-blue-600 dark:text-blue-400 font-black text-xs">₹{product.price}</span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col text-left">
              <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg mb-1">{product.name}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 line-clamp-2 leading-relaxed">{product.description}</p>
              
              <button
                onClick={() => onAddToCart(product)}
                className="mt-auto w-full bg-slate-50 dark:bg-slate-900 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:text-slate-300 text-blue-600 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-blue-600 shadow-sm"
              >
                <i className="fas fa-plus"></i> Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
