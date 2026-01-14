
import React from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onAdminClick: () => void;
  onDeliveryClick: () => void;
  onNotificationsClick: () => void;
  unreadNotifCount: number;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onAdminClick, onDeliveryClick, onNotificationsClick, unreadNotifCount }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center py-6">
        <div className="h-24 w-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-4 relative">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-blue-600 text-4xl font-bold">{user.name.charAt(0)}</span>
          )}
          {(user.isAdmin || user.isDeliveryBoy) && (
            <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${user.isAdmin ? 'bg-yellow-400' : 'bg-green-500'}`}>
              <i className={`fas ${user.isAdmin ? 'fa-crown' : 'fa-truck-fast'} text-white text-xs`}></i>
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
        <p className="text-gray-500 text-sm">{user.mobile}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mt-1">
          {user.isAdmin ? 'Administrator' : user.isDeliveryBoy ? 'Delivery Partner' : 'Customer'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {user.isAdmin && (
          <button 
            onClick={onAdminClick}
            className="w-full p-4 flex items-center justify-between text-blue-700 bg-blue-50/50 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="text-sm font-bold">Manage Business (Admin)</span>
            </div>
            <i className="fas fa-chevron-right text-blue-300 text-sm"></i>
          </button>
        )}

        {user.isDeliveryBoy && (
          <button 
            onClick={onDeliveryClick}
            className="w-full p-4 flex items-center justify-between text-green-700 bg-green-50/50 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                <i className="fas fa-truck-fast"></i>
              </div>
              <span className="text-sm font-bold">Delivery Dashboard</span>
            </div>
            <i className="fas fa-chevron-right text-green-300 text-sm"></i>
          </button>
        )}

        <button 
          onClick={onNotificationsClick}
          className="w-full p-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 relative">
              <i className="fas fa-bell"></i>
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {unreadNotifCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
        </button>

        <div className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
            <i className="fas fa-location-dot"></i>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Address</p>
            <p className="text-sm text-gray-700">{user.address}, {user.pincode}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-100 mt-4 shadow-sm active:scale-95 transition-transform"
      >
        <i className="fas fa-right-from-bracket"></i> Logout
      </button>
    </div>
  );
};

export default Profile;
