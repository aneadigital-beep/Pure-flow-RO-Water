
import React, { useState, useRef } from 'react';
import { User } from '../types';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Set to 256x256 for optimal profile display vs storage size
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
        // Using lower quality (0.7) to keep base64 string small for local storage
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
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
            <div className="border-r border-b border-white/40"></div>
            <div className="border-r border-b border-white/40"></div>
            <div className="border-b border-white/40"></div>
            <div className="border-r border-b border-white/40"></div>
            <div className="border-r border-b border-white/40"></div>
            <div className="border-b border-white/40"></div>
            <div className="border-r border-white/40"></div>
            <div className="border-r border-white/40"></div>
            <div></div>
          </div>
          <div className="absolute inset-0 border-[2px] border-blue-500 rounded-full pointer-events-none shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"></div>
        </div>

        <div className="w-full max-w-[280px] mt-10 space-y-8">
          <input 
            type="range" 
            min="1" max="3" step="0.01" 
            value={cropState.zoom} 
            onChange={e => setCropState(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
            className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none outline-none"
          />
          <div className="flex gap-4">
            <button onClick={() => { setShowCropper(false); setRawImage(null); }} className="flex-1 bg-white/5 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
            <button onClick={finalizeCrop} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Save Photo</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <div className={`h-28 w-28 rounded-full bg-blue-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl flex items-center justify-center overflow-hidden mb-4 transition-transform duration-500 ${isProcessing ? 'animate-pulse scale-95' : 'group-hover:scale-105'}`}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-blue-600 dark:text-blue-400 text-4xl font-bold">{user.name.charAt(0)}</span>
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
            <div className={`absolute bottom-4 right-1 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm ${user.isAdmin ? 'bg-yellow-400' : 'bg-green-500'}`}>
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{user.name}</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">{user.mobile || user.email}</p>
        </div>

        <div className="flex gap-2 mt-4">
          {user.isAdmin && (
            <span className="text-[8px] font-black bg-yellow-400 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">Administrator</span>
          )}
          {user.isDeliveryBoy && (
            <span className="text-[8px] font-black bg-green-500 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">Staff Partner</span>
          )}
          {!user.isAdmin && !user.isDeliveryBoy && (
            <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase tracking-wider">Premium Customer</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {user.isAdmin && (
          <button 
            onClick={onAdminClick}
            className="w-full p-5 flex items-center justify-between text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                <i className="fas fa-grid-2 text-lg"></i>
              </div>
              <div className="text-left">
                <span className="text-sm font-black block">Admin Dashboard</span>
                <span className="text-[10px] opacity-60 font-medium">Manage orders, staff & catalog</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-blue-400 group-hover:translate-x-1 transition-transform"></i>
          </button>
        )}

        {user.isDeliveryBoy && (
          <button 
            onClick={onDeliveryClick}
            className="w-full p-5 flex items-center justify-between text-green-700 dark:text-green-200 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
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

        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700/50 overflow-hidden transition-colors">
          <button 
            onClick={onNotificationsClick}
            className="w-full p-4 flex items-center justify-between text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 relative">
                <i className="fas fa-bell"></i>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-slate-800">
                    {unreadNotifCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold">Alerts & News</span>
            </div>
            <i className="fas fa-chevron-right text-gray-300 dark:text-slate-600 text-sm"></i>
          </button>

          <button 
            onClick={onSupportClick}
            className="w-full p-4 flex items-center justify-between text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <i className="fas fa-headset"></i>
              </div>
              <span className="text-sm font-bold">Help & Support</span>
            </div>
            <i className="fas fa-chevron-right text-gray-300 dark:text-slate-600 text-sm"></i>
          </button>

          <div className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-slate-600">
              <i className="fas fa-location-dot"></i>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-black tracking-widest">Saved Address</p>
              <p className="text-sm text-gray-700 dark:text-slate-200 font-medium line-clamp-1">{user.address}, {user.pincode}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 mt-4 shadow-sm active:scale-95 transition-all"
      >
        <i className="fas fa-power-off text-sm"></i> 
        Sign Out
      </button>
    </div>
  );
};

export default Profile;
