import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderDown,
  Inbox,
  Video,
  BellRing,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Wifi,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { settings, wsConnected } = useData();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Overview & Reports', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Student Enrollment Management', to: '/admin/students', icon: Users },
    { label: 'Course Management', to: '/admin/courses', icon: BookOpen },
    { label: 'Learning Resources', to: '/admin/resources', icon: FolderDown },
    { label: 'Applications & Inquiries', to: '/admin/applications', icon: Inbox },
    { label: 'Live Meetings', to: '/admin/meetings', icon: Video },
    { label: 'Announcements', to: '/admin/announcements', icon: BellRing },
    { label: 'Institute Settings & CMS', to: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar (Hidden in print) */}
      <div className="no-print md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <img
            src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
            alt="AITM Logo"
            className="w-9 h-9 object-contain bg-white rounded p-0.5"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">{settings.shortName} Thane</span>
            <span className="text-[10px] text-cyan-400 font-semibold uppercase">Admin Panel</span>
          </div>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation (Hidden in print) */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transform md:relative md:translate-x-0 transition-transform duration-200 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Area */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
              alt="AITM Logo"
              className="w-11 h-11 object-contain bg-white/95 rounded-lg p-0.5 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight block">
                {settings.shortName} Thane
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block">
                Management Portal
              </span>
            </div>
          </Link>
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Admin Tag */}
        <div className="px-5 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser?.fullName.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">
              {currentUser?.fullName || 'Administrator'}
            </div>
            <div className="text-[10px] text-cyan-300 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Authorized Administrator</span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Live</span>
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
        {/* Top Header (Hidden in print) */}
        <header className="no-print bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
              alt="AITM Emblem"
              className="w-8 h-8 object-contain md:hidden"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wider">
                {settings.instituteName} · Thane
              </span>
              <h1 className="text-lg font-bold font-display text-slate-900">
                Institutional Administration & Enrollment Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded border ${
                wsConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>{wsConnected ? 'Real-Time Sync Active' : 'Reconnecting...'}</span>
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Session: 2026-27
            </span>
          </div>
        </header>

        {/* Child views */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
