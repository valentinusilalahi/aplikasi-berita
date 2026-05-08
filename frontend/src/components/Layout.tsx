import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  FileText,
  BarChart3,
  CheckCircle,
  Settings,
  Home,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      roles: ['EDITOR', 'REVIEWER', 'ADMIN'],
    },
    {
      label: 'Create News',
      icon: FileText,
      path: '/news/create',
      roles: ['EDITOR', 'ADMIN'],
    },
    {
      label: 'My News',
      icon: FileText,
      path: '/news',
      roles: ['EDITOR', 'ADMIN'],
    },
    {
      label: 'Approval Queue',
      icon: CheckCircle,
      path: '/approval',
      roles: ['REVIEWER', 'ADMIN'],
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      roles: ['REVIEWER', 'ADMIN'],
    },
    {
      label: 'User Management',
      icon: Users,
      path: '/users',
      roles: ['ADMIN'],
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['ADMIN'],
    },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    try {
      if (token) {
        // Optional: Call logout endpoint
        // await authService.logout(token);
      }
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 bg-gray-900 text-white transition-transform duration-300 z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } h-screen flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">NewsHub</h1>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between md:hidden">
          <h1 className="text-lg font-bold text-gray-900">NewsHub</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
