import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { notifications, settings, wsConnected } = useData();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { label: 'My Overview', to: '/student', icon: LayoutDashboard, end: true },
    { label: 'My Enrolled Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Study Resources & PDFs', to: '/student/resources', icon: FileText },
    { label: 'Live Classes & Schedule', to: '/student/schedule', icon: Calendar },
    { label: 'Notifications', to: '/student/notifications', icon: Bell, badge: unreadCount },
    { label: 'My Profile', to: '/student/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-blue-950 text-white px-4 py-3 flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold font-display text-sm">
            {settings.shortName}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Student Portal</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transform md:relative md:translate-x-0 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Area */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
              alt={settings.shortName}
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5"
            />
            <div>
              <span className="text-sm font-bold text-white tracking-tight block">Student Learning</span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block">
                {settings.shortName} Portal
              </span>
            </div>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Student Profile Box */}
        <div className="px-5 py-4 bg-slate-800/40 border-b border-slate-800 flex items-center gap-3">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-9 h-9 rounded-full object-cover border border-blue-500 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser?.fullName.charAt(0) || 'S'}
            </div>
          )}
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{currentUser?.fullName}</div>
            <div className="text-[10px] text-blue-300 font-mono truncate">{currentUser?.studentId || 'STUDENT'}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentUser?.batch || 'Batch 2026'}</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Institute Home</span>
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Student Dashboard {wsConnected ? '· Live Synced' : ''}
            </span>
            <h1 className="text-lg font-bold font-display text-slate-900">Welcome back, {currentUser?.fullName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-3 py-1 rounded-md text-xs font-mono font-semibold bg-blue-50 text-blue-900 border border-blue-200">
              ID: {currentUser?.studentId}
            </span>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
