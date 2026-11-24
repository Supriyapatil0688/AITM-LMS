import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldCheck, ChevronUp, ChevronDown, Wifi, WifiOff, ArrowLeftRight } from 'lucide-react';

export const RoleSwitcherToolbar: React.FC = () => {
  const { currentUser, canReturnToAdmin, impersonateUser, returnToAdmin, logout } = useAuth();
  const { students, wsConnected } = useData();
  const [collapsed, setCollapsed] = useState(true);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminSession = currentUser?.role === 'admin' || canReturnToAdmin;

  const handleImpersonateStudent = async (userId: string) => {
    setSwitching(true);
    try {
      const res = await impersonateUser(userId);
      if (res.success) {
        navigate('/student');
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleReturnAdmin = async () => {
    setSwitching(true);
    try {
      const res = await returnToAdmin();
      if (res.success) {
        navigate('/admin');
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <aside aria-label="Portal Session Bar" className="fixed bottom-3 right-3 z-50 no-print">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden text-xs max-w-sm sm:max-w-md transition-all">
        {/* Bar Header */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="px-3.5 py-2 bg-slate-800/90 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">
              {currentUser ? `${currentUser.fullName}` : 'AITM Live Portal'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                wsConnected
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                  : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
              }`}
              title={wsConnected ? 'Real-Time WebSocket Connected' : 'Reconnecting WebSocket'}
            >
              {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{wsConnected ? 'Live' : 'Sync'}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
              {currentUser ? currentUser.role.toUpperCase() : 'VISITOR'}
            </span>
            {collapsed ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Expanded Panel */}
        {!collapsed && (
          <div className="p-3 space-y-2.5 border-t border-slate-700/60">
            {isAdminSession ? (
              <>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Admin Session Tools — Preview student course isolation or return to Admin:
                </p>

                <div className="grid grid-cols-1 gap-1.5">
                  {canReturnToAdmin && (
                    <button
                      disabled={switching}
                      onClick={handleReturnAdmin}
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-600/30 border border-blue-500 text-white hover:bg-blue-600/50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold">Return to Admin Dashboard</span>
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {currentUser?.role === 'admin' &&
                    students.slice(0, 3).map((stu) => (
                      <button
                        key={stu.id}
                        disabled={switching || stu.status !== 'active'}
                        onClick={() => handleImpersonateStudent(stu.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between disabled:opacity-50"
                      >
                        <span className="truncate font-medium">Preview Student: {stu.fullName}</span>
                        <span className="text-[10px] font-mono text-cyan-300 shrink-0 ml-2">
                          {stu.studentId}
                        </span>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                >
                  Public Website
                </button>
                {currentUser ? (
                  <>
                    <button
                      onClick={() => navigate('/student')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-semibold"
                    >
                      Student Portal
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        navigate('/');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[11px] font-semibold"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login?tab=student')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-[11px] font-semibold"
                    >
                      Student Login
                    </button>
                    <button
                      onClick={() => navigate('/login?tab=admin')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                    >
                      Admin Login
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800">
              <span className="font-mono">Route: {location.pathname}</span>
              <span>SQLite + WS Sync</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
