
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
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
        <div>
          <h2 className="text-blue-800 font-semibold">Stay Hydrated!</h2>
          <p className="text-blue-600 text-sm">Need a quick refill or monthly plan?</p>
        </div>
        <i className="fas fa-water text-4xl text-blue-200"></i>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'can', 'subscription', 'accessory'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              category === cat 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            <img src={product.image} alt={product.name} className="h-40 w-full object-cover" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-800">{product.name}</h3>
                <span className="text-blue-600 font-bold">₹{product.price}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{product.description}</p>
              <button
                onClick={() => onAddToCart(product)}
                className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus"></i> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
