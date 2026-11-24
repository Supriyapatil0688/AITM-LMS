import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Menu, X, ArrowRight, UserCheck, Shield, GraduationCap, Megaphone } from 'lucide-react';

interface NavbarProps {
  onOpenApplyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenApplyModal }) => {
  const { currentUser, role, logout } = useAuth();
  const { settings } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-cyan-500 shadow-xs">
      {/* Dynamic Portal Notice Bar (if configured by Admin) */}
      {settings.portalNotice && settings.portalNotice.trim() !== '' && (
        <div className="bg-amber-400 text-blue-950 text-[11px] font-bold py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span>{settings.portalNotice}</span>
          </div>
        </div>
      )}

      {/* Top micro bar with branding colors: Blue, Cyan, Yellow */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-600 to-cyan-500 text-white text-[11px] py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide text-yellow-300">॥ तमसो मां ज्योतिर्गमय ॥</span>
            <span className="text-white/60">·</span>
            <span className="hidden sm:inline text-white/90">{settings.isoCertification}</span>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <span className="hidden md:inline">Thane West, Maharashtra</span>
            <span className="font-mono">Tel: {settings.phone}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-20">
          {/* Logo on the left and Institute Name beside it */}
          <Link to="/" className="flex items-center gap-3.5 shrink-0 group">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
              <img
                src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
                alt="AITM Institute Logo"
                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold text-blue-950 font-display tracking-tight leading-tight group-hover:text-sky-700 transition-colors">
                {settings.instituteName}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="text-cyan-700 font-semibold uppercase tracking-wider">Thane</span>
                <span>·</span>
                <span className="text-slate-600 hidden sm:inline">{settings.nsdcAffiliation}</span>
              </div>
            </div>
          </Link>

          {/* Navigation Links: Home, About Us, Courses, Admissions, Contact Us */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-blue-900 transition-colors whitespace-nowrap">
              Home
            </Link>
            <a href="/#about" className="hover:text-blue-900 transition-colors whitespace-nowrap">
              About Us
            </a>
            <a href="/#courses" className="hover:text-blue-900 transition-colors whitespace-nowrap">
              Courses
            </a>
            <button
              onClick={onOpenApplyModal}
              className="text-slate-700 hover:text-blue-900 transition-colors whitespace-nowrap font-semibold cursor-pointer"
            >
              Admissions
            </button>
            <a href="/#contact" className="hover:text-blue-900 transition-colors whitespace-nowrap">
              Contact Us
            </a>
          </nav>

          {/* Right Action Zone: Student Login & Admin Login */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to={role === 'admin' ? '/admin' : '/student'}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-950 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-700" />
                  <span>{role === 'admin' ? 'Admin Panel' : 'Student Portal'}</span>
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login?tab=student"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-800" />
                  <span>Student Login</span>
                </Link>
                <Link
                  to="/login?tab=admin"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  <span>Admin Login</span>
                </Link>
                <button
                  onClick={onOpenApplyModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg shadow-xs transition-all whitespace-nowrap ml-1"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-blue-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100">
              Home
            </Link>
            <a href="/#about" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100">
              About Us
            </a>
            <a href="/#courses" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100">
              Courses
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenApplyModal();
              }}
              className="text-left px-3 py-2 rounded-md hover:bg-slate-100 font-semibold"
            >
              Admissions
            </button>
            <a href="/#contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100">
              Contact Us
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  to={role === 'admin' ? '/admin' : '/student'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-xs font-bold text-white bg-blue-900 rounded-lg"
                >
                  Go to {role === 'admin' ? 'Admin Panel' : 'Student Portal'}
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-center px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login?tab=student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  Student Login
                </Link>
                <Link
                  to="/login?tab=admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg"
                >
                  Admin Login
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenApplyModal();
                  }}
                  className="col-span-2 text-center px-4 py-2.5 text-xs font-bold text-blue-950 bg-yellow-400 rounded-lg"
                >
                  Apply Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
