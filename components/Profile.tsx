
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { TOWN_NAME } from '../constants';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onAdminClick: () => void;
  onDeliveryClick: () => void;
  onNotificationsClick: () => void;
  onSupportClick: () => void;
  onUpdateUser: (updatedUser: User) => void;
  unreadNotifCount: number;
}

const Profile: React.FC<ProfileProps> = ({ 
  user, 
  onLogout, 
  onAdminClick, 
  onDeliveryClick, 
  onNotificationsClick, 
  onSupportClick, 
  onUpdateUser,
  unreadNotifCount 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropState, setCropState] = useState({ zoom: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copiedLink, setCopiedLink] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Referral Data
  const referralCode = user.mobile || 'PUREFLOW';
  const referralLink = `https://punganur-aquaflow.app/signup?ref=${referralCode}`;
  const shareMessage = `Hi! I use ${TOWN_NAME} for my daily pure RO water. Sign up using my link to get a special discount on your first order! ${referralLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleSMSShare = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shareMessage)}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImage(reader.result as string);
        setCropState({ zoom: 1, x: 0, y: 0 });
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const finalizeCrop = () => {
    if (!rawImage) return;
    setIsProcessing(true);
    setShowCropper(false);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 256, 256);

        const containerSize = 288;
        const scale = img.height / containerSize;
        const sourceCropSize = img.height / cropState.zoom;
        
        const sx = (img.width / 2) - (sourceCropSize / 2) - (cropState.x * scale / cropState.zoom);
        const sy = (img.height / 2) - (sourceCropSize / 2) - (cropState.y * scale / cropState.zoom);

        ctx.drawImage(img, sx, sy, sourceCropSize, sourceCropSize, 0, 0, 256, 256);
        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        onUpdateUser({ ...user, avatar: processedDataUrl });
      }
      setIsProcessing(false);
      setRawImage(null);
    };
    img.onerror = () => {
      setIsProcessing(false);
      alert("Error processing image.");
    };
    img.src = rawImage;
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - cropState.x, y: clientY - cropState.y });
  };

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setCropState(prev => ({ ...prev, x: clientX - dragStart.x, y: clientY - dragStart.y }));
  };

  if (showCropper && rawImage) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h3 className="text-white font-black uppercase text-sm tracking-[0.3em] mb-2">Adjust Profile Photo</h3>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Drag to position • Slider to zoom</p>
        </div>
        
        <div 
          className="relative w-72 h-72 bg-slate-900 overflow-hidden rounded-full border-4 border-white/20 cursor-move shadow-2xl"
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={startDrag}
          onTouchMove={onDrag}
          onTouchEnd={() => setIsDragging(false)}
        >
          <img 
            src={rawImage} 
            className="absolute pointer-events-none select-none max-w-none"
            style={{ 
              transform: `translate(calc(-50% + ${cropState.x}px), calc(-50% + ${cropState.y}px)) scale(${cropState.zoom})`,
              left: '50%',
              top: '50%',
              height: '100%'
            }} 
            alt="To crop" 
          />
          <div className="absolute inset-0 border-[2px] border-brand-500 rounded-full pointer-events-none shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"></div>
        </div>

        <div className="w-full max-w-[280px] mt-10 space-y-8">
          <input 
            type="range" 
            min="1" max="3" step="0.01" 
            value={cropState.zoom} 
            onChange={e => setCropState(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
            className="w-full accent-brand-500 h-1.5 bg-white/10 rounded-full appearance-none outline-none"
          />
          <div className="flex gap-4">
            <button onClick={() => { setShowCropper(false); setRawImage(null); }} className="flex-1 bg-white/5 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
            <button onClick={finalizeCrop} className="flex-1 bg-brand-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Save Photo</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <div className={`h-28 w-28 rounded-full bg-brand-200 dark:bg-brand-900/50 border-4 border-white dark:border-brand-700 shadow-xl flex items-center justify-center overflow-hidden mb-4 transition-transform duration-500 ${isProcessing ? 'animate-pulse scale-95' : 'group-hover:scale-105'}`}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-brand-700 dark:text-brand-200 text-4xl font-bold">{user.name.charAt(0)}</span>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <i className="fas fa-circle-notch animate-spin text-white text-xl"></i>
              </div>
            )}
            
            <button 
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-0"
            >
              <i className="fas fa-camera text-white text-xl"></i>
            </button>
          </div>
          
          {(user.isAdmin || user.isDeliveryBoy) && (
            <div className={`absolute bottom-4 right-1 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-brand-700 shadow-sm ${user.isAdmin ? 'bg-yellow-400' : 'bg-green-500'}`}>
              <i className={`fas ${user.isAdmin ? 'fa-crown' : 'fa-truck-fast'} text-white text-[10px]`}></i>
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="text-center">
          <h2 className="text-xl font-black text-brand-900 dark:text-white">{user.name}</h2>
          <p className="text-brand-700 dark:text-brand-200/60 text-sm font-bold">{user.mobile || user.email}</p>
        </div>

        <div className="flex gap-2 mt-4">
          {user.isAdmin && (
            <span className="text-[8px] font-black bg-yellow-400 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">Administrator</span>
          )}
          {user.isDeliveryBoy && (
            <span className="text-[8px] font-black bg-green-500 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">Staff Partner</span>
          )}
          {!user.isAdmin && !user.isDeliveryBoy && (
            <span className="text-[8px] font-black bg-brand-200 text-brand-700 px-2 py-1 rounded uppercase tracking-wider">Premium Customer</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* REFER & EARN SECTION */}
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-[2.5rem] p-6 shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-500/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
          
          <div className="relative z-10 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <i className="fas fa-gift text-2xl animate-bounce"></i>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Refer & Earn Water</h3>
                <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest">Special Punganur Offer</p>
              </div>
            </div>
            
            <p className="text-xs font-medium text-brand-50/80 leading-relaxed">
              Refer a friend and they get <span className="text-white font-black">₹50 OFF</span> on their first order. You get <span className="text-white font-black">2 FREE CANS</span> for every successful referral!
            </p>

            <div className="pt-2 flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="flex-1 text-[10px] font-mono tracking-wider overflow-hidden truncate opacity-80">{referralLink}</span>
                <button 
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${copiedLink ? 'bg-green-500 text-white' : 'bg-white text-brand-900'}`}
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleWhatsAppShare}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  <i className="fab fa-whatsapp text-lg"></i> WhatsApp
                </button>
                <button 
                  onClick={handleSMSShare}
                  className="bg-brand-500 hover:bg-brand-400 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  <i className="fas fa-comment-sms text-lg"></i> Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>

        {user.isAdmin && (
          <button 
            onClick={onAdminClick}
            className="w-full p-5 flex items-center justify-between text-brand-700 dark:text-brand-200 bg-white dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 rounded-[2rem] shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-brand-700 dark:bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-200 dark:shadow-none">
                <i className="fas fa-grid-2 text-lg"></i>
              </div>
              <div className="text-left">
                <span className="text-sm font-black block">Admin Dashboard</span>
                <span className="text-[10px] opacity-60 font-medium">Manage orders, staff & catalog</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-brand-400 group-hover:translate-x-1 transition-transform"></i>
          </button>
        )}

        {user.isDeliveryBoy && (
          <button 
            onClick={onDeliveryClick}
            className="w-full p-5 flex items-center justify-between text-green-700 dark:text-green-200 bg-white dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-[2rem] shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-green-600 dark:bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200 dark:shadow-none">
                <i className="fas fa-truck-fast text-lg"></i>
              </div>
              <div className="text-left">
                <span className="text-sm font-black block">Delivery Tasks</span>
                <span className="text-[10px] opacity-60 font-medium">View and update pending drops</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-green-400 group-hover:translate-x-1 transition-transform"></i>
          </button>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-brand-50 dark:border-slate-700 divide-y divide-brand-50 dark:divide-slate-700/50 overflow-hidden transition-colors">
          <button 
            onClick={onNotificationsClick}
            className="w-full p-5 flex items-center justify-between text-brand-900 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 relative">
                <i className="fas fa-bell"></i>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-slate-800 font-black">
                    {unreadNotifCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold">Alerts & News</span>
            </div>
            <i className="fas fa-chevron-right text-brand-200 dark:text-slate-600 text-sm"></i>
          </button>

          <button 
            onClick={onSupportClick}
            className="w-full p-5 flex items-center justify-between text-brand-900 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-700 dark:text-brand-400">
                <i className="fas fa-headset"></i>
              </div>
              <span className="text-sm font-bold">Help & Support</span>
            </div>
            <i className="fas fa-chevron-right text-brand-200 dark:text-slate-600 text-sm"></i>
          </button>

          <div className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-brand-50 dark:bg-slate-900 flex items-center justify-center text-brand-200 dark:text-slate-600">
              <i className="fas fa-location-dot"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] text-brand-400 dark:text-slate-500 uppercase font-black tracking-widest">Saved Address</p>
              <p className="text-sm text-brand-900 dark:text-slate-200 font-bold line-clamp-1">{user.address}, {user.pincode}</p>
              {user.selectedZone && (
                <p className="text-[9px] text-brand-500 font-black uppercase mt-0.5 tracking-wider">Zone: {user.selectedZone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-brand-100 dark:border-brand-800 mt-6 shadow-sm active:scale-95 transition-all"
      >
        <i className="fas fa-power-off text-sm"></i> 
        Sign Out Account
      </button>
    </div>
  );
};

export default Profile;