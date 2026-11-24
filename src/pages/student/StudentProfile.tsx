import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { CheckCircle2, Save, UploadCloud, AlertCircle } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { currentUser, updateCurrentProfile } = useAuth();
  const { studentCourses: enrolledCourses } = useData();

  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setMobileNumber(currentUser.mobileNumber || '');
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const uploaded = await api.uploadFile(file);
      setAvatarUrl(uploaded.url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload avatar photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await updateCurrentProfile({
        mobileNumber,
        avatarUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile updates.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold font-display text-slate-900">Student Trainee Profile</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review your institutional enrollment records and update your contact telephone and profile photo.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile changes saved to database!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Avatar & Core Badges */}
        <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={currentUser.fullName}
              className="w-16 h-16 rounded-2xl object-cover shadow-md border border-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-2xl font-display shadow-md">
              {currentUser.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">{currentUser.fullName}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                {currentUser.studentId}
              </span>
              <span>·</span>
              <span>{currentUser.batch || 'Batch 2026'}</span>
              <span>·</span>
              <span className="text-emerald-600 font-semibold uppercase">{currentUser.status}</span>
            </div>
          </div>
        </div>

        {/* Read-Only Institutional Fields */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Institutional Verification Data (Locked by Admin)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name</label>
              <input
                type="text"
                disabled
                value={currentUser.fullName}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Student Email</label>
              <input
                type="text"
                disabled
                value={currentUser.email}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Student Enrollment ID</label>
              <input
                type="text"
                disabled
                value={currentUser.studentId || ''}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Batch</label>
              <input
                type="text"
                disabled
                value={currentUser.batch || 'Batch 2026'}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Authorized Course List */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Active Course Permissions ({enrolledCourses.length})
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            {enrolledCourses.length === 0 ? (
              <div className="text-xs text-slate-500">No active course permissions assigned.</div>
            ) : (
              enrolledCourses.map((c) => (
                <div key={c.id} className="text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">✓ {c.title}</span>
                  <span className="font-mono text-[11px] text-slate-500">{c.courseType}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Permitted Editable Student Fields */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
            Permitted Student Contact Updates
          </span>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact Number</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+91 98200..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Profile Photo (Upload or URL)</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/uploads/... or https://..."
                className="flex-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer shrink-0">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Updates'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
