
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (mobile: string, name: string, address: string, pincode: string, avatar?: string) => void;
  registeredUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, registeredUsers }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Mobile, 2: OTP, 3: Profile Details
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length === 10) {
      setIsLoading(true);
      // Simulate sending OTP
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
        setTimer(30);
      }, 800);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      setIsLoading(true);
      // Simulate verification
      setTimeout(() => {
        const existingUser = registeredUsers.find(u => u.mobile === mobile);
        if (existingUser) {
          onLogin(
            existingUser.mobile, 
            existingUser.name, 
            existingUser.address, 
            existingUser.pincode, 
            existingUser.avatar
          );
        } else {
          setStep(3);
        }
        setIsLoading(false);
      }, 800);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && address && pincode) {
      onLogin(mobile, name, address, pincode, avatar);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 px-6 py-12">
      {/* Brand Logo Section */}
      <div className="mb-10 text-center text-white">
        <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <i className="fas fa-droplet text-4xl text-blue-600"></i>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">PureFlow</h1>
        <p className="opacity-80 text-sm mt-1">Township's Premium Water Supply</p>
      </div>

      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Step Progress Indicator */}
        <div className="flex justify-center gap-1.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1 rounded-full transition-all duration-300 ${
                step === s ? 'w-8 bg-blue-600' : 'w-2 bg-gray-100'
              }`} 
            />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleMobileSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your mobile number to receive a verification code.</p>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="00000 00000"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-14 pr-4 text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                  required
                  autoFocus
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={mobile.length < 10 || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Mobile</h2>
              <p className="text-sm text-gray-500">
                OTP sent to <span className="font-bold text-gray-700">+91 {mobile}</span>
              </p>
            </div>

            <div className="flex justify-center py-2">
              <input
                type="tel"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0 0 0 0"
                className="w-48 bg-gray-50 border border-gray-200 rounded-2xl py-4 text-center text-3xl tracking-[0.75rem] font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                autoFocus
              />
            </div>

            <div className="text-center space-y-4">
              <button
                type="submit"
                disabled={otp.length < 4 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Verify & Continue'}
              </button>
              
              <div className="flex flex-col items-center gap-2">
                {timer > 0 ? (
                  <p className="text-xs text-gray-400 font-medium">Resend OTP in {timer}s</p>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setTimer(30)}
                    className="text-blue-600 text-xs font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="text-gray-400 text-xs font-medium hover:text-gray-600"
                >
                  Change Number
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Final Step</h2>
              <p className="text-xs text-gray-500">Create your profile for easy delivery.</p>
            </div>
            
            <div className="flex flex-col items-center mb-4">
              <label className="relative cursor-pointer group">
                <div className="h-24 w-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-colors group-hover:border-blue-200">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <i className="fas fa-user-plus text-gray-300 text-2xl"></i>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white h-8 w-8 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
                  <i className="fas fa-camera text-[12px]"></i>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-wider">Photo (Optional)</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">House/Shop Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, Landmark, Building..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="600001"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg mt-6 transition-all active:scale-95"
            >
              Complete Registration
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-white/60 text-xs text-center leading-relaxed">
        By continuing, you agree to our <br /> 
        <span className="underline cursor-pointer">Terms of Service</span> & <span className="underline cursor-pointer">Privacy Policy</span>
      </p>
    </div>
  );
};

export default Login;
