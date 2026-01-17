
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
        <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden mb-4 relative">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-blue-600 dark:text-blue-400 text-4xl font-bold">{user.name.charAt(0)}</span>
          )}
          {(user.isAdmin || user.isDeliveryBoy) && (
            <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm ${user.isAdmin ? 'bg-yellow-400' : 'bg-green-500'}`}>
              <i className={`fas ${user.isAdmin ? 'fa-crown' : 'fa-truck-fast'} text-white text-xs`}></i>
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{user.name}</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">{user.mobile}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mt-1">
          {user.isAdmin ? 'Administrator' : user.isDeliveryBoy ? 'Delivery Partner' : 'Customer'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700 overflow-hidden transition-colors">
        {user.isAdmin && (
          <button 
            onClick={onAdminClick}
            className="w-full p-4 flex items-center justify-between text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="text-sm font-bold">Manage Business (Admin)</span>
            </div>
            <i className="fas fa-chevron-right text-blue-300 dark:text-blue-800 text-sm"></i>
          </button>
        )}

        {user.isDeliveryBoy && (
          <button 
            onClick={onDeliveryClick}
            className="w-full p-4 flex items-center justify-between text-green-700 dark:text-green-300 bg-green-50/50 dark:bg-green-900/20 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-600 dark:bg-green-500 flex items-center justify-center text-white">
                <i className="fas fa-truck-fast"></i>
              </div>
              <span className="text-sm font-bold">Delivery Dashboard</span>
            </div>
            <i className="fas fa-chevron-right text-green-300 dark:text-green-800 text-sm"></i>
          </button>
        )}

        <button 
          onClick={onNotificationsClick}
          className="w-full p-4 flex items-center justify-between text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 relative">
              <i className="fas fa-bell"></i>
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-slate-800">
                  {unreadNotifCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <i className="fas fa-chevron-right text-gray-300 dark:text-slate-600 text-sm"></i>
        </button>

        <div className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-slate-600">
            <i className="fas fa-location-dot"></i>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Address</p>
            <p className="text-sm text-gray-700 dark:text-slate-300">{user.address}, {user.pincode}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/30 mt-4 shadow-sm active:scale-95 transition-transform"
      >
        <i className="fas fa-right-from-bracket"></i> Logout
      </button>
    </div>
  );
};

export default Profile;
