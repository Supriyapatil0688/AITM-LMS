import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import type { Meeting } from '../../types';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  X,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MeetingManagement: React.FC = () => {
  const { meetings, courses, refreshAll } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 60,
    meetingUrl: 'https://meet.google.com/ait-mnew-sess',
    platform: 'Google Meet' as Meeting['platform'],
    targetBatch: 'All Batches',
    hostName: 'Er. Rajesh Deshpande',
  });

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setErrorMsg(null);
    setForm({
      title: '',
      description: '',
      courseId: '',
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/ait-mnew-sess',
      platform: 'Google Meet',
      targetBatch: 'All Batches',
      hostName: 'Er. Rajesh Deshpande',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Meeting) => {
    setEditingMeeting(m);
    setErrorMsg(null);
    setForm({
      title: m.title,
      description: m.description,
      courseId: m.courseId || '',
      scheduledAt: m.scheduledAt.slice(0, 16),
      durationMinutes: m.durationMinutes,
      meetingUrl: m.meetingUrl,
      platform: m.platform,
      targetBatch: m.targetBatch || 'All Batches',
      hostName: m.hostName,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        courseId: form.courseId || null,
        scheduledAt: form.scheduledAt,
        durationMinutes: form.durationMinutes,
        meetingUrl: form.meetingUrl.trim(),
        platform: form.platform,
        targetBatch: form.targetBatch.trim() || 'All Batches',
        hostName: form.hostName.trim(),
      };

      if (editingMeeting) {
        await api.updateMeeting(editingMeeting.id, payload);
        setSuccessMsg(`Updated live session "${payload.title}".`);
      } else {
        await api.createMeeting(payload);
        setSuccessMsg(`Scheduled live session "${payload.title}".`);
      }

      setIsModalOpen(false);
      await refreshAll();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save live session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete meeting "${title}"?`)) return;
    try {
      await api.deleteMeeting(id);
      await refreshAll();
      setSuccessMsg(`Deleted session "${title}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete session.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Live Technical Meetings & Virtual Classrooms
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Schedule, edit, or cancel Google Meet or Zoom sessions for specific course batches or institute-wide orientations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Session</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && !isModalOpen && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Access Rule Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
        <strong>Course Targeting Rule:</strong> If a specific course is selected, ONLY students actively enrolled in that
        course can view this session or access the join link. If "All Students" is chosen, the entire student body can attend.
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {meeting.platform}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">{meeting.durationMinutes} mins</span>
              </div>

              <h3 className="text-base font-bold font-display text-slate-900 line-clamp-1">{meeting.title}</h3>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{meeting.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-900" />
                  <span className="font-semibold text-slate-800">
                    {new Date(meeting.scheduledAt).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-900" />
                  <span>
                    {new Date(meeting.scheduledAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Target: <strong>{meeting.courseTitle || 'All Enrolled Students'}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Host: <strong className="text-slate-700">{meeting.hostName}</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span>Launch Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(meeting)}
                  className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Meeting"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(meeting.id, meeting.title)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SCHEDULE / EDIT MEETING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {editingMeeting ? 'Edit Live Technical Session' : 'Schedule Live Technical Session'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. CNC G-Code Debugging & Canned Cycles Q&A"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Course / Audience <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="">All Institute Students (Institute-wide session)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (Enrolled students only)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Outline key topics to be covered in this session..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value as Meeting['platform'] })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="MS Teams">MS Teams</option>
                    <option value="AITM Classroom">AITM Classroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session Host</label>
                  <input
                    type="text"
                    required
                    value={form.hostName}
                    onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={form.meetingUrl}
                  onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingMeeting ? 'Save Changes' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
