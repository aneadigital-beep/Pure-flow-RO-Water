
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (credentials: { mobile?: string; email?: string; name: string; address: string; pincode: string; selectedZone: string; avatar?: string; pin?: string; isAdmin?: boolean }) => void;
  registeredUsers: User[];
  townZones: string[];
}

const Login: React.FC<LoginProps> = ({ onLogin, registeredUsers, townZones }) => {
  const [step, setStep] = useState<1 | 3 | 4 | 5 | 6>(1); // 1: Entry, 3: Reg, 4: PIN Entry, 5: Verify for Reset, 6: New PIN Entry
  const [entryValue, setEntryValue] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Reset flow specific states
  const [verifyName, setVerifyName] = useState('');
  const [verifyPincode, setVerifyPincode] = useState('');
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [isManualZone, setIsManualZone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const MASTER_ADMIN_ID = '9620674013';

  useEffect(() => {
    if (pinError) setPinError(false);
    if (errorMessage) setErrorMessage('');
  }, [pin, entryValue, verifyName, verifyPincode, selectedZone]);

  const normalizeId = useCallback((id: string | undefined | null) => (id || '').replace(/\D/g, '').trim(), []);

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryValue || entryValue.length < 10) return;

    setIsLoading(true);
    const searchTerm = normalizeId(entryValue);

    setTimeout(() => {
      const user = registeredUsers.find(u => normalizeId(u.mobile || u.email || u.id) === searchTerm);
      setIsLoading(false);
      
      if (user) {
        setExistingUser(user);
        setStep(4);
      } else {
        setStep(3);
        // If it's a new town with no zones, default to manual entry
        if (townZones.length === 0) setIsManualZone(true);
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
        onLogin({ ...existingUser });
      }, 500);
    } else {
      setPinError(true);
      setErrorMessage("Incorrect Security PIN. Please try again.");
      setPin('');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingUser) return;

    const inputName = verifyName.trim().toLowerCase();
    const registeredName = existingUser.name.trim().toLowerCase();
    const inputZip = normalizeId(verifyPincode);
    const registeredZip = normalizeId(existingUser.pincode);

    if (inputName === registeredName && inputZip === registeredZip) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setPin('');
        setConfirmPin('');
        setStep(6);
      }, 800);
    } else {
      setErrorMessage("Identity check failed. Please double-check your name and pincode.");
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingUser) return;

    if (pin.length === 4 && pin === confirmPin) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin({
          ...existingUser,
          pin: pin
        });
      }, 800);
    } else if (pin !== confirmPin) {
      setErrorMessage("The PINs you entered do not match.");
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && address && pincode && selectedZone && pin.length === 4) {
      if (pin !== confirmPin) {
        setErrorMessage("Confirmation PIN does not match.");
        return;
      }
      
      const normalizedMobile = normalizeId(entryValue);
      const isAdmin = normalizedMobile === MASTER_ADMIN_ID;

      onLogin({
        mobile: normalizedMobile,
        name, 
        address, 
        pincode,
        selectedZone,
        pin,
        isAdmin
      });
    } else {
      if (!selectedZone) setErrorMessage("Please select or enter your delivery zone.");
    }
  };

  const brandColor = 'bg-blue-600';
  const textColor = 'text-blue-600';
  const themeClass = 'blue';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-slate-950 px-6 py-12 transition-colors duration-500">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-sm:max-w-none max-w-sm rounded-[3rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all flex flex-col items-center border border-slate-100 dark:border-slate-800">
        
        {step !== 3 && step !== 5 && step !== 6 && (
          <div className="mb-10 flex flex-col items-center animate-in fade-in duration-500">
            <div className={`h-20 w-20 ${brandColor} rounded-2xl flex items-center justify-center mb-6 shadow-xl transition-transform hover:scale-110 duration-500`}>
              <i className={`fas fa-droplet text-3xl text-white`}></i>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight text-center">
              PUNGANUR AQUAFLOW
            </h1>
            <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase mt-4 text-center">
              PREMIUM LOCAL WATER SUPPLY
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleEntrySubmit} className="space-y-6 text-left">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Mobile</label>
                  <span className="text-[9px] font-bold text-slate-300 uppercase mr-1">{entryValue.length}/10</span>
                </div>
                
                <div className="relative group">
                  <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white font-black text-xl`}>+91</span>
                  <input
                    type="tel"
                    value={entryValue}
                    onChange={(e) => setEntryValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-6 pl-20 pr-4 text-slate-900 dark:text-white text-xl focus:outline-none focus:ring-4 focus:ring-${themeClass}-500/5 focus:border-${themeClass}-600 transition-all font-bold shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                    required autoFocus
                  />
                </div>
              </div>
              
              {errorMessage && <p className="text-red-500 text-[10px] font-bold text-center animate-shake">{errorMessage}</p>}
              
              <button
                type="submit"
                disabled={entryValue.length < 10 || isLoading}
                className={`w-full ${brandColor} hover:opacity-90 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Get Started'}
              </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleReturningAuthSubmit} className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Authentication Required</p>
              <p className={`text-lg font-bold ${textColor} mt-1`}>{existingUser?.name}</p>
            </div>

            <div className={`flex flex-col items-center ${pinError ? 'animate-shake' : ''}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enter 4-Digit Security PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={`w-full bg-slate-50 dark:bg-slate-950 border-2 ${pinError ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl py-6 text-center text-3xl tracking-[0.8rem] font-bold ${textColor} focus:outline-none focus:border-${themeClass}-600 transition-colors shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                required autoFocus
              />
              {errorMessage && <p className="text-red-500 text-[10px] font-bold mt-3 animate-in fade-in">{errorMessage}</p>}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={pin.length < 4 || isLoading}
                className={`w-full ${brandColor} text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50`}
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Verify PIN'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(5)} 
                className="w-full text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Forgot Security PIN?
              </button>
            </div>
            
            <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] text-slate-400 font-black uppercase tracking-widest border-t border-slate-50 dark:border-slate-800 pt-4">Back to Start</button>
          </form>
        )}

        {step === 5 && (
          <form onSubmit={handleVerifyIdentity} className="w-full space-y-6 animate-in slide-in-from-right-4 text-left">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Identity Check</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verify details to reset PIN</p>
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Full Name (as registered)</label>
              <input type="text" value={verifyName} onChange={(e) => setVerifyName(e.target.value)} placeholder="Full Name" className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-${themeClass}-600 text-slate-900 dark:text-white font-bold shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500`} required />
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Registered Pincode</label>
              <input type="tel" value={verifyPincode} onChange={(e) => setVerifyPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN" className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-${themeClass}-600 text-slate-900 dark:text-white font-bold shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500`} required />
            </div>

            {errorMessage && <p className="text-red-500 text-[10px] font-bold text-center animate-shake">{errorMessage}</p>}

            <button type="submit" disabled={isLoading} className={`w-full ${brandColor} text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all`}>
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Verify Identity'}
            </button>
            <button type="button" onClick={() => setStep(4)} className="w-full text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">Go Back</button>
          </form>
        )}

        {step === 6 && (
          <form onSubmit={handleResetPinSubmit} className="w-full space-y-6 animate-in slide-in-from-right-4 text-left">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Set New PIN</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Create a new 4-digit access code</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">New 4-Digit PIN</label>
                <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-center tracking-[0.8em] font-black text-xl text-slate-900 dark:text-white focus:border-${themeClass}-600 shadow-sm placeholder:text-slate-400`} required />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Confirm New PIN</label>
                <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-center tracking-[0.8em] font-black text-xl text-slate-900 dark:text-white focus:border-${themeClass}-600 shadow-sm placeholder:text-slate-400`} required />
              </div>
            </div>

            {errorMessage && <p className="text-red-500 text-[10px] font-bold text-center animate-shake">{errorMessage}</p>}

            <button type="submit" disabled={pin.length < 4 || isLoading} className={`w-full ${brandColor} text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all`}>
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Reset & Login'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegistrationSubmit} className="w-full animate-in fade-in slide-in-from-right-4 max-h-[75vh] overflow-y-auto scrollbar-hide text-left px-1">
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Profile Setup</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Join the Punganur Community</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-${themeClass}-600 text-slate-900 dark:text-white font-bold transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500`} required />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1.5 ml-1">
                    <label className="text-[10px] uppercase font-black text-slate-400">Delivery Zone/Street</label>
                    <button 
                      type="button" 
                      onClick={() => { setIsManualZone(!isManualZone); setSelectedZone(''); }} 
                      className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                    >
                      {isManualZone ? 'Select from list' : 'Street not listed?'}
                    </button>
                  </div>
                  
                  {isManualZone || townZones.length === 0 ? (
                    <input 
                      type="text" 
                      value={selectedZone} 
                      onChange={(e) => setSelectedZone(e.target.value)} 
                      placeholder="Type your Street/Zone name" 
                      className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-${themeClass}-600 text-slate-900 dark:text-white font-bold transition-all shadow-sm placeholder:text-slate-400`}
                      required 
                    />
                  ) : (
                    <select 
                      value={selectedZone} 
                      onChange={(e) => setSelectedZone(e.target.value)} 
                      className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm focus:border-${themeClass}-600 text-slate-900 dark:text-white font-bold transition-all shadow-sm appearance-none outline-none`}
                      required
                    >
                      <option value="">-- Choose Street/Zone --</option>
                      {townZones.map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Home Address</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Building, Door No, Street..." className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-sm h-20 focus:border-${themeClass}-600 resize-none text-slate-900 dark:text-white font-bold transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500`} required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Pincode</label>
                    <input type="tel" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digits" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-4 text-center font-bold text-sm text-slate-900 dark:text-white transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Create PIN</label>
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-4 text-center tracking-widest text-slate-900 dark:text-white font-black text-sm shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block ml-1">Confirm PIN</label>
                  <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-center tracking-widest text-slate-900 dark:text-white font-black text-sm shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                </div>
              </div>

              {errorMessage && <p className="text-red-500 text-[10px] font-black text-center animate-in fade-in uppercase tracking-wider">{errorMessage}</p>}

              <button 
                type="submit" 
                disabled={!name || !address || !selectedZone || pincode.length < 6 || pin.length < 4}
                className={`w-full ${brandColor} text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-6 active:scale-95 transition-all disabled:opacity-30`}
              >
                Complete Registration
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest py-2 transition-colors text-center">Go Back</button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 flex gap-6">
        <button onClick={() => { setEntryValue(MASTER_ADMIN_ID); setStep(1); }} className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-300 hover:text-blue-500 transition-colors">
          <i className="fas fa-shield-halved mr-2"></i> Master Admin Access
        </button>
      </div>
    </div>
  );
};

export default Login;
