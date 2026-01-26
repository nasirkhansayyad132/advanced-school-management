import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  School,
  GraduationCap,
  UserCog,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import clsx from 'clsx';

const teacherNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/my-classes', icon: GraduationCap, label: 'My Classes' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/teachers', icon: UserCog, label: 'Teachers' },
  { to: '/admin/classes', icon: GraduationCap, label: 'Classes' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL' 
    ? adminNavItems 
    : teacherNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={clsx(
        'fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <School className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight">School</h1>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-700">
        <div className={clsx(
          'flex items-center gap-3 p-3 rounded-lg bg-slate-700/50',
          collapsed && 'justify-center'
        )}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 w-full mt-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
