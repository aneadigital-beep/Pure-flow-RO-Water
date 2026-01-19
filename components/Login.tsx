
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (credentials: { mobile?: string; email?: string; name: string; address: string; pincode: string; avatar?: string; pin?: string }) => void;
  registeredUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, registeredUsers }) => {
  const [step, setStep] = useState<1 | 3 | 4 | 5>(1); // 1: Entry, 3: Reg, 4: PIN, 5: Forgot PIN
  const [loginType, setLoginType] = useState<'mobile' | 'email'>('mobile');
  const [entryValue, setEntryValue] = useState('');
  const [pin, setPin] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const ADMIN_ID = '9999999999';

  useEffect(() => {
    if (pinError) setPinError(false);
    if (errorMessage) setErrorMessage('');
  }, [pin, entryValue]);

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryValue) return;

    setIsLoading(true);
    const searchTerm = entryValue.trim();

    setTimeout(() => {
      const user = registeredUsers.find(u => 
        (u.mobile && u.mobile === searchTerm) || 
        (u.email && u.email.toLowerCase() === searchTerm.toLowerCase())
      );

      setIsLoading(false);
      if (user) {
        setExistingUser(user);
        setStep(4);
      } else {
        if (searchTerm === ADMIN_ID) {
          setName('Main Administrator');
          setStep(3);
        } else {
          setStep(3);
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
      setPinError(true);
      setErrorMessage("Incorrect PIN. Please try again.");
      setPin('');
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && address && pincode && pin.length === 4) {
      if (pin !== confirmValue) {
        setErrorMessage("PINs do not match!");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-slate-950 px-6 py-12 transition-colors duration-500">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all flex flex-col items-center border border-slate-100 dark:border-slate-800">
        
        {/* Logo Section inside the card */}
        <div className="mb-10 flex flex-col items-center">
          <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200 dark:shadow-none transition-transform hover:scale-110 duration-500">
            <i className="fas fa-droplet text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">PUREFLOW</h1>
          <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase mt-4">SMART SUPPLY CHAIN</p>
        </div>

        {step === 1 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleEntrySubmit} className="space-y-6 text-left">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Mobile Number
                  </label>
                  <span className="text-[9px] font-bold text-slate-300 uppercase mr-1">{entryValue.length}/10</span>
                </div>
                
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white font-black text-xl">+91</span>
                  <input
                    type="tel"
                    value={entryValue}
                    onChange={(e) => setEntryValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder=""
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-6 pl-16 pr-4 text-slate-900 dark:text-white text-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all font-bold shadow-sm"
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!entryValue || entryValue.length < 10 || isLoading}
                className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Login'}
              </button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => setStep(3)}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:opacity-70 transition-opacity"
              >
                New User? Create Account
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleReturningAuthSubmit} className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Welcome, <span className="font-bold text-blue-600">{existingUser?.name}</span>
              </p>
            </div>

            <div className={`flex flex-col items-center ${pinError ? 'animate-shake' : ''}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enter Security PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={`w-full bg-slate-50 dark:bg-slate-950 border-2 ${pinError ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl py-6 text-center text-3xl tracking-[0.8rem] font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-600 transition-colors shadow-sm`}
                required
                autoFocus
              />
              {errorMessage && <p className="text-red-500 text-[10px] font-bold mt-3 animate-in fade-in">{errorMessage}</p>}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={pin.length < 4 || isLoading}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Unlock'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-blue-500"
              >
                Back to Entry
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegistrationSubmit} className="w-full animate-in fade-in slide-in-from-right-4 max-h-[55vh] overflow-y-auto scrollbar-hide text-left px-1">
            <div className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Registration</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-blue-600 text-slate-900 dark:text-white font-bold transition-all" required />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block">Address</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full address" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm h-24 focus:border-blue-600 resize-none text-slate-900 dark:text-white font-bold transition-all" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block">Security PIN</label>
                      <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 Digits" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-4 text-center tracking-widest text-slate-900 dark:text-white font-black text-sm" required />
                   </div>
                   <div className="col-span-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block">Confirm PIN</label>
                      <input type="password" value={confirmValue} onChange={(e) => setConfirmValue(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Repeat" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-4 text-center tracking-widest text-slate-900 dark:text-white font-black text-sm" required />
                   </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-6 active:scale-95 transition-all">Create Account</button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest py-2">Cancel</button>
            </div>
          </form>
        )}
      </div>

      <button onClick={() => { setLoginType('mobile'); setEntryValue(ADMIN_ID); }} className="mt-8 text-[9px] font-black uppercase tracking-[0.4em] text-blue-300 hover:text-blue-500 transition-colors">
        <i className="fas fa-shield-halved mr-2"></i> Admin Gateway
      </button>
    </div>
  );
};

export default Login;
