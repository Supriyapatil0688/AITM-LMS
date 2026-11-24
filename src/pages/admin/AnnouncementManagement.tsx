import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import type { Announcement } from '../../types';
import { Plus, Trash2, Edit3, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AnnouncementManagement: React.FC = () => {
  const { announcements, courses, refreshAll } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    courseId: '',
    priority: 'normal' as Announcement['priority'],
    isPublished: true,
    targetRole: 'students' as Announcement['targetRole'],
    targetBatch: 'All',
  });

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setErrorMsg(null);
    setForm({
      title: '',
      content: '',
      courseId: '',
      priority: 'normal',
      isPublished: true,
      targetRole: 'students',
      targetBatch: 'All',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setErrorMsg(null);
    setForm({
      title: ann.title,
      content: ann.content,
      courseId: ann.courseId || '',
      priority: ann.priority,
      isPublished: ann.isPublished,
      targetRole: ann.targetRole,
      targetBatch: ann.targetBatch || 'All',
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
        content: form.content.trim(),
        courseId: form.courseId || null,
        priority: form.priority,
        isPublished: form.isPublished,
        targetRole: form.courseId ? ('course_enrolled' as const) : form.targetRole,
        targetBatch: form.targetBatch,
      };

      if (editingAnnouncement) {
        await api.updateAnnouncement(editingAnnouncement.id, payload);
        setSuccessMsg(`Updated announcement "${payload.title}".`);
      } else {
        await api.createAnnouncement(payload);
        setSuccessMsg(`Published announcement "${payload.title}".`);
      }

      setIsModalOpen(false);
      await refreshAll();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (ann: Announcement) => {
    try {
      await api.updateAnnouncement(ann.id, { isPublished: !ann.isPublished });
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update announcement status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      await refreshAll();
      setSuccessMsg('Announcement deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete announcement.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Announcements & Student Circulars</h2>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast institute circulars or target urgent updates to specific course batches in real time.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
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

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    ann.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-800'
                      : ann.priority === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ann.priority}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    ann.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {ann.isPublished ? 'Published' : 'Hidden'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {ann.courseTitle ? `Course: ${ann.courseTitle}` : 'Institute-Wide Broadcast'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono mr-1">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleTogglePublish(ann)}
                  className="p-1 text-slate-400 hover:text-blue-900 rounded"
                  title={ann.isPublished ? 'Hide Announcement' : 'Publish Announcement'}
                >
                  {ann.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleOpenEdit(ann)}
                  className="p-1 text-slate-400 hover:text-blue-900 rounded"
                  title="Edit Announcement"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 font-display">{ann.title}</h3>

            <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {editingAnnouncement ? 'Edit Announcement' : 'Publish Announcement'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Workshop Practical Exam Dates"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="">All Institute Students</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content Details</label>
                <textarea
                  rows={4}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Type circular announcement text..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <span>Visible to students immediately</span>
              </label>

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
                  {isSubmitting ? 'Saving...' : editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
