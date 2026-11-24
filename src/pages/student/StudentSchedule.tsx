import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Calendar, Clock, Video, ExternalLink } from 'lucide-react';

export const StudentSchedule: React.FC = () => {
  const { currentUser } = useAuth();
  const { studentMeetings: meetings } = useData();
  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold font-display text-slate-900">My Live Classes & Workshop Schedule</h2>
        <p className="text-xs text-slate-500 mt-1">
          Interactive Google Meet and Zoom classroom sessions scheduled for your courses.
        </p>
      </div>

      <div className="space-y-4">
        {meetings.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No upcoming live sessions currently scheduled for your courses.
          </div>
        ) : (
          meetings.map((m) => (
            <div
              key={m.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {m.platform}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 font-medium">{m.courseTitle || 'All Students'}</span>
                </div>

                <h3 className="text-base font-bold font-display text-slate-900">{m.title}</h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">{m.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    {new Date(m.scheduledAt).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-blue-900" />
                    {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                    {m.durationMinutes} mins)
                  </span>
                  <span>
                    Host: <strong className="text-slate-700">{m.hostName}</strong>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <a
                  href={m.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Classroom</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
