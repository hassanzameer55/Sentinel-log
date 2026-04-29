import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Terminal, 
  Activity, 
  Bell, 
  Key, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Terminal, label: 'Live Logs', path: '/logs' },
    { icon: Activity, label: 'Tracing', path: '/tracing' },
    { icon: Bell, label: 'Alerts', path: '/alerts' },
    { icon: Key, label: 'API Keys', path: '/keys' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#020617] border-r border-slate-800 flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Sentinel</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
