import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { currentUser, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-rose-200 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">
            Access Restricted
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your authenticated role is <strong className="text-slate-900 uppercase">[{role}]</strong>. You do not have permissions to access <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{location.pathname}</span>.
          </p>
          <div className="pt-2">
            <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
