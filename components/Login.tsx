
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (credentials: { mobile?: string; email?: string; name: string; address: string; pincode: string; avatar?: string; pin?: string }) => void;
  registeredUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, registeredUsers }) => {
  const [step, setStep] = useState<1 | 3 | 4>(1); // 1: Entry, 3: Registration, 4: Returning User Auth
  const [loginType, setLoginType] = useState<'mobile' | 'email'>('mobile');
  const [entryValue, setEntryValue] = useState('');
  const [pin, setPin] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const ADMIN_ID = '9999999999';

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryValue) return;

    setIsLoading(true);
    const searchTerm = entryValue.trim();

    setTimeout(() => {
      // Robust lookup: check both mobile and email fields across all users
      const user = registeredUsers.find(u => 
        (u.mobile && u.mobile === searchTerm) || 
        (u.email && u.email.toLowerCase() === searchTerm.toLowerCase())
      );

      setIsLoading(false);
      if (user) {
        setExistingUser(user);
        setStep(4); // Found user! Go to PIN step
      } else {
        // If it's the admin ID and not registered yet, pre-fill and go to registration
        if (searchTerm === ADMIN_ID) {
          setName('Main Administrator');
          setStep(3);
        } else {
          setStep(3); // New user! Start Registration directly
        }
      }
    }, 800);
  };

  const handleReturningAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingUser) return;

    if (pin === existingUser.pin) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin({
          mobile: existingUser.mobile,
          email: existingUser.email,
          name: existingUser.name,
          address: existingUser.address,
          pincode: existingUser.pincode,
          avatar: existingUser.avatar,
          pin: existingUser.pin
        });
      }, 500);
    } else {
      alert("Incorrect PIN. Please try again.");
      setPin('');
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && address && pincode && pin.length === 4) {
      if (pin !== confirmValue) {
        alert("PINs do not match!");
        return;
      }
      onLogin({
        mobile: loginType === 'mobile' ? entryValue : undefined,
        email: loginType === 'email' ? entryValue : undefined,
        name,
        address,
        pincode,
        avatar: undefined,
        pin
      });
    }
  };

  const useAdminShortcut = () => {
    setLoginType('mobile');
    setEntryValue(ADMIN_ID);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 dark:bg-slate-950 px-6 py-12 transition-colors duration-500">
      <div className="mb-8 text-center text-white">
        <div className="h-20 w-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <i className="fas fa-droplet text-4xl text-blue-600 dark:text-blue-400"></i>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">PureFlow</h1>
        <p className="opacity-80 text-sm mt-1">Township's Premium Water Supply</p>
      </div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-colors">
        
        <div className="flex justify-center gap-1.5 mb-8">
          {[1, 2].map((s) => (
            <div 
              key={s} 
              className={`h-1 rounded-full transition-all duration-300 ${
                (step === 1 ? 1 : 2) === s ? 'w-8 bg-blue-600 dark:bg-blue-400' : 'w-2 bg-gray-100 dark:bg-slate-800'
              }`} 
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <form onSubmit={handleEntrySubmit} className="space-y-6">
              <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6">
                <button 
                  type="button"
                  onClick={() => { setLoginType('mobile'); setEntryValue(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                >
                  Mobile
                </button>
                <button 
                  type="button"
                  onClick={() => { setLoginType('email'); setEntryValue(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'email' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                >
                  Email
                </button>
              </div>

              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">Welcome!</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Enter your {loginType} to continue.</p>
                
                <div className="relative">
                  {loginType === 'mobile' && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                  )}
                  <input
                    type={loginType === 'mobile' ? 'tel' : 'email'}
                    value={entryValue}
                    onChange={(e) => setEntryValue(loginType === 'mobile' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)}
                    placeholder={loginType === 'mobile' ? '00000 00000' : 'name@email.com'}
                    className={`w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl py-5 ${loginType === 'mobile' ? 'pl-14' : 'px-5'} pr-4 text-gray-800 dark:text-slate-200 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold`}
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!entryValue || isLoading}
                className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Continue'}
              </button>
            </form>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
              <button 
                onClick={useAdminShortcut}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
              >
                <i className="fas fa-shield-halved mr-2"></i>
                Admin Access
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleReturningAuthSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">Enter PIN</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Welcome back, <span className="font-bold text-blue-600">{existingUser?.name}</span>!
              </p>
            </div>

            <div className="flex justify-center py-2">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                className="w-48 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl py-4 text-center text-3xl tracking-[0.75rem] font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={pin.length < 4 || isLoading}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-5 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              Unlock Account
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-blue-500 mt-2">Try different account</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegistrationSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide text-left">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-1">Create Profile</h2>
              <p className="text-xs text-gray-500">Fill in your details for easy deliveries.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200" required />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Delivery Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street name, Landmark, Building..." className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-slate-200" required />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Pincode</label>
                <input type="tel" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="600001" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200" required />
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 border-b border-blue-50 dark:border-blue-900/30 pb-1">
                  Security Setup (4-Digit PIN)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Set PIN</label>
                    <input 
                      type="password" 
                      value={pin} 
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                      placeholder="• • • •" 
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest dark:text-slate-200 font-bold" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Confirm PIN</label>
                    <input 
                      type="password" 
                      value={confirmValue} 
                      onChange={(e) => setConfirmValue(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                      placeholder="• • • •" 
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest dark:text-slate-200 font-bold" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-6 active:scale-95"
            >
              Complete Registration
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-blue-500 py-2">Back</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
