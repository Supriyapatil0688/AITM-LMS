import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { CheckCheck, BookOpen, Video, FileText, Bell } from 'lucide-react';

export const StudentNotifications: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifications, refreshStudentData } = useData();
  if (!currentUser) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await refreshStudentData();
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await refreshStudentData();
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Student Notifications</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding newly assigned courses, uploaded study notes, and live class schedules.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">You're all caught up! No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.isRead ? 'bg-white' : 'bg-blue-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'resource_added'
                      ? 'bg-rose-100 text-rose-700'
                      : n.type === 'meeting_scheduled'
                      ? 'bg-blue-100 text-blue-700'
                      : n.type === 'announcement'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {n.type === 'resource_added' && <FileText className="w-4 h-4" />}
                  {n.type === 'meeting_scheduled' && <Video className="w-4 h-4" />}
                  {n.type === 'course_assigned' && <BookOpen className="w-4 h-4" />}
                  {(n.type === 'announcement' || n.type === 'application_status') && <Bell className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{n.title}</span>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">NEW</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {new Date(n.createdAt).toLocaleDateString()} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-xs text-blue-900 font-semibold hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
