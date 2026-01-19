
import React, { useState } from 'react';
import { User } from '../types';

interface EditProfileProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [address, setAddress] = useState(user.address);
  const [pincode, setPincode] = useState(user.pincode);
  const [mobile, setMobile] = useState(user.mobile || '');
  const [email, setEmail] = useState(user.email || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict mobile validation
    if (!mobile || mobile.replace(/\D/g, '').length < 10) {
      setError('Mobile number is mandatory and must be 10 digits.');
      return;
    }

    onSave({
      ...user,
      name,
      address,
      pincode,
      mobile: mobile.replace(/\D/g, '').slice(0, 10),
      email: email.trim() || undefined
    });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Profile</h2>
        <button 
          onClick={onCancel}
          className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 transition-transform active:scale-90"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 ml-1 uppercase tracking-widest">Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Your Name" 
            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
            required 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 ml-1 uppercase tracking-widest">Mobile (Mandatory)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+91</span>
            <input 
              type="tel" 
              value={mobile} 
              onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
              placeholder="00000 00000" 
              className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-12 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
              required 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 ml-1 uppercase tracking-widest">Email (Optional)</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="example@email.com" 
            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 ml-1 uppercase tracking-widest">Delivery Address</label>
          <textarea 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="Full Address" 
            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm h-24 resize-none"
            required 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 ml-1 uppercase tracking-widest">Pincode</label>
          <input 
            type="tel" 
            value={pincode} 
            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
            placeholder="000000" 
            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
            required 
          />
        </div>

        {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all px-8"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
