import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  ShieldCheck,
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, claimAdmin, activateStudent, bootstrapStatus, currentUser } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'admin' ? 'admin' : 'student';

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupMode, setSetupMode] = useState<'none' | 'admin_claim' | 'student_activate'>('none');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (queryParams.get('tab') === 'admin') setActiveTab('admin');
    else if (queryParams.get('tab') === 'student') setActiveTab('student');
  }, [location.search]);

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : '/student', { replace: true });
    }
  }, [currentUser, navigate]);

  // Automatically offer first-run admin setup when Admin tab is active & admin password hasn't been claimed yet
  const showAdminFirstRun =
    activeTab === 'admin' && bootstrapStatus && !bootstrapStatus.adminPasswordClaimed;

  const unclaimedStudents = bootstrapStatus?.unclaimedStudents || [];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        // Redirect handled by useEffect on currentUser update
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
        if (res.needsSetup === 'student_activate') {
          setSetupMode('student_activate');
          setPassword('');
          setConfirmPassword('');
        } else if (res.needsSetup === 'admin_claim') {
          setSetupMode('admin_claim');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Administrator password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await claimAdmin(password);
      if (!res.success) {
        setError(res.error || 'Failed to set up administrator password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your registered student email.');
      return;
    }
    if (password.length < 6) {
      setError('Student password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await activateStudent(email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Failed to activate student account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex flex-col items-center gap-2 group">
          <img
            src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
            alt="AITM Institute Logo"
            className="w-20 h-20 object-contain mx-auto filter drop-shadow-sm group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-extrabold text-blue-950 font-display">
            {settings.instituteName}
          </span>
          <span className="text-xs text-cyan-700 font-semibold uppercase tracking-wider">
            Thane, Maharashtra
          </span>
        </Link>
        <h2 className="mt-2 text-2xl font-bold font-display text-slate-900 tracking-tight">
          Institute Portal Sign In
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          ॥ तमसो मां ज्योतिर्गमय ॥ · {settings.isoCertification}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
          {/* Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setSetupMode('none');
                setError(null);
              }}
              className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-800" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setSetupMode('none');
                setError(null);
              }}
              className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-800" />
              <span>Faculty & Admin</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* CASE 1: FIRST-RUN ADMIN PASSWORD SETUP */}
          {(showAdminFirstRun || setupMode === 'admin_claim') ? (
            <form onSubmit={handleClaimAdmin} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>First-Run Administrator Setup</span>
                </div>
                <p className="text-blue-800">
                  Set the master password for <strong>{bootstrapStatus?.adminEmail || 'admin@abhinavinst.com'}</strong> to lock and secure your Admin Panel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Account Email</label>
                <input
                  type="email"
                  disabled
                  value={bootstrapStatus?.adminEmail || 'admin@abhinavinst.com'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Administrator Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create strong admin password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                <span>{isSubmitting ? 'Saving & Signing In...' : 'Claim Admin & Enter Panel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : setupMode === 'student_activate' ? (
            /* CASE 2: PRE-REGISTERED STUDENT PASSWORD ACTIVATION */
            <form onSubmit={handleActivateStudent} className="space-y-4">
              <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-cyan-700" />
                  <span>Activate Pre-Registered Student Account</span>
                </div>
                <p className="text-cyan-800">
                  Set your personal password once to activate your AITM Student Portal access.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Student Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@student.aitm"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create your portal password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                <span>{isSubmitting ? 'Activating Account...' : 'Activate & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSetupMode('none');
                  setError(null);
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1"
              >
                Back to standard login
              </button>
            </form>
          ) : (
            /* CASE 3: STANDARD LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'student' ? 'Registered Student Email' : 'Admin Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'student' ? 'rahul.shinde@student.aitm' : 'admin@abhinavinst.com'}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <Link to="/reset-password" className="text-xs text-blue-900 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Unclaimed Pre-Registered Student Activation Helpers */}
          {activeTab === 'student' && unclaimedStudents.length > 0 && setupMode === 'none' && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-blue-900" />
                <span>First-Time Student Activation (Set Your Password):</span>
              </div>
              <div className="space-y-1.5">
                {unclaimedStudents.map((stu) => (
                  <button
                    key={stu.email}
                    type="button"
                    onClick={() => {
                      setEmail(stu.email);
                      setPassword('');
                      setConfirmPassword('');
                      setError(null);
                      setSetupMode('student_activate');
                    }}
                    className="w-full text-left px-3 py-2 text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-700 transition-colors"
                  >
                    <div>
                      <strong className="text-slate-900">{stu.fullName}</strong>{' '}
                      {stu.studentId && <span className="font-mono text-[10px] text-slate-500">({stu.studentId})</span>}
                      <span className="block text-[11px] text-slate-500">{stu.email}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-900">Activate →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have a student account yet?{' '}
            <Link to="/#courses" className="text-blue-900 font-semibold hover:underline">
              Submit an Application
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
