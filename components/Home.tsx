
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';

interface HomeProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
}

interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  tag: string;
}

const Home: React.FC<HomeProps> = ({ products, onAddToCart }) => {
  const [category, setCategory] = useState<'all' | 'can' | 'subscription' | 'accessory'>('all');
  const [promoIndex, setPromoIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const promotions: Promotion[] = [
    {
      id: 'p1',
      title: 'Summer Refill Special',
      subtitle: 'Flat ₹50 OFF on your first 20L Can subscription this month!',
      icon: 'fa-sun',
      color: 'from-orange-500 to-red-500',
      tag: 'Limited Offer'
    },
    {
      id: 'p2',
      title: 'Refer & Earn Water',
      subtitle: 'Get 2 FREE cans for every neighbor you refer in Punganur.',
      icon: 'fa-people-group',
      color: 'from-blue-600 to-indigo-700',
      tag: 'Community'
    },
    {
      id: 'p3',
      title: 'Monsoon Protection',
      subtitle: 'Free TDS check and dispenser sanitization with monthly plans.',
      icon: 'fa-shield-virus',
      color: 'from-emerald-500 to-teal-600',
      tag: 'Health First'
    },
    {
      id: 'p4',
      title: 'Punganur Events',
      subtitle: 'Planning a wedding? Special bulk RO rates for 50+ cans.',
      icon: 'fa-cake-candles',
      color: 'from-purple-600 to-pink-600',
      tag: 'Bulk Deal'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = category === 'all' || p.category === category;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, category, searchQuery]);

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Promotion Banner */}
      <div className="relative h-44 w-full overflow-hidden rounded-[2.5rem] shadow-xl">
        {promotions.map((promo, idx) => (
          <div
            key={promo.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
              idx === promoIndex 
                ? 'opacity-100 translate-x-0' 
                : idx < promoIndex 
                  ? 'opacity-0 -translate-x-full' 
                  : 'opacity-0 translate-x-full'
            }`}
          >
            <div className={`h-full w-full bg-gradient-to-br ${promo.color} p-7 flex flex-col justify-center text-left relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1 max-w-[70%]">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-white mb-2">
                    {promo.tag}
                  </span>
                  <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">{promo.title}</h3>
                  <p className="text-white/80 text-[10px] font-medium leading-relaxed mt-1">{promo.subtitle}</p>
                </div>
                <div className="h-16 w-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center text-white shadow-2xl">
                  <i className={`fas ${promo.icon} text-2xl`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="absolute bottom-4 left-7 flex gap-1.5">
          {promotions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPromoIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === promoIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="relative group animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <i className="fas fa-search text-blue-500 dark:text-blue-400 group-focus-within:scale-110 transition-transform"></i>
        </div>
        <input
          type="text"
          placeholder="Search water cans, subscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] py-5 pl-14 pr-12 text-sm font-bold text-slate-900 dark:text-white shadow-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-5 flex items-center text-slate-300 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-circle-xmark text-lg"></i>
          </button>
        )}
      </div>

      {/* Category Selection with Professional Heading */}
      <div className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div className="text-left">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Premium Selection</h2>
            <div className="h-1 w-10 bg-blue-600 rounded-full mt-1"></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Items</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'can', 'subscription', 'accessory'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                category === cat 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
              }`}
            >
              {cat === 'all' ? 'All Products' : cat + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Refined Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map(product => (
          <div key={product.id} className="bg-gradient-to-b from-white to-blue-50/40 dark:from-slate-800 dark:to-slate-900/50 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-blue-100/50 dark:border-slate-700 flex flex-col group animate-in fade-in zoom-in-95 duration-500">
            {/* Professional Image Container */}
            <div className="relative h-52 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src={product.image} 
                alt={product.name} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              {/* Product Type Badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 shadow-sm border border-white/20">
                  {product.category}
                </span>
              </div>
              {/* Price Label */}
              <div className="absolute bottom-4 right-4 z-20">
                 <div className="bg-blue-600 text-white px-4 py-1.5 rounded-xl shadow-xl font-black text-sm">
                   ₹{product.price}
                 </div>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase tracking-tight">{product.name}</h3>
              </div>
              
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 leading-relaxed font-medium">
                {product.description}
              </p>
              
              <div className="mt-auto space-y-3">
                <div className="flex justify-between items-center text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                  <span>Unit: {product.unit}</span>
                  <span>Pure RO Standard</span>
                </div>
                
                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-white dark:bg-slate-950 hover:bg-blue-600 dark:hover:bg-blue-500 text-blue-600 dark:text-slate-200 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 border border-blue-100 dark:border-slate-800 hover:border-blue-600 group/btn shadow-sm"
                >
                  <i className="fas fa-plus-circle group-hover/btn:rotate-90 transition-transform"></i> 
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center animate-in fade-in duration-700">
            <div className="h-24 w-24 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-200 dark:text-slate-700 border border-blue-100 dark:border-slate-700">
              <i className="fas fa-faucet-drip text-4xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Catalogue Empty</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">We couldn't find any water solutions matching your search.</p>
            <button 
              onClick={() => { setSearchQuery(''); setCategory('all'); }}
              className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Reset Catalogue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
