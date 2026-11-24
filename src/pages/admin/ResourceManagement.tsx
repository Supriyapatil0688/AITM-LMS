import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { LearningResource, ResourceType } from '../../types';
import {
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  Trash2,
  UploadCloud,
  X,
  ExternalLink,
  Edit3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const ResourceManagement: React.FC = () => {
  const { courses, resources, refreshAll } = useData();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null);
  const [resourceType, setResourceType] = useState<ResourceType>('pdf');

  const [form, setForm] = useState({
    title: '',
    description: '',
    urlOrPath: '',
    fileName: '',
    fileSizeBytes: 0,
    durationMinutes: 30,
    isPrivate: true,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const currentCourseResources = resources.filter((r) => r.courseId === selectedCourseId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleOpenAdd = () => {
    setEditingResource(null);
    setResourceType('pdf');
    setErrorMsg(null);
    setForm({
      title: '',
      description: '',
      urlOrPath: '',
      fileName: '',
      fileSizeBytes: 0,
      durationMinutes: 30,
      isPrivate: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: LearningResource) => {
    setEditingResource(res);
    setResourceType(res.resourceType);
    setErrorMsg(null);
    setForm({
      title: res.title,
      description: res.description || '',
      urlOrPath: res.urlOrPath,
      fileName: res.fileName || '',
      fileSizeBytes: res.fileSizeBytes || 0,
      durationMinutes: res.durationMinutes || 30,
      isPrivate: res.isPrivate,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const uploaded = await api.uploadFile(file);
      setForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        fileName: uploaded.fileName,
        fileSizeBytes: uploaded.sizeBytes,
        urlOrPath: uploaded.url,
      }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!form.title.trim()) {
      setErrorMsg('Please enter a resource title.');
      return;
    }
    if (!form.urlOrPath.trim()) {
      setErrorMsg(resourceType === 'pdf' ? 'Please upload a PDF file or paste a valid URL.' : 'Please provide a valid URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingResource) {
        await api.updateResource(editingResource.id, {
          courseId: selectedCourseId,
          title: form.title,
          description: form.description,
          resourceType,
          urlOrPath: form.urlOrPath,
          fileName: form.fileName || undefined,
          fileSizeBytes: form.fileSizeBytes || undefined,
          durationMinutes: resourceType === 'youtube_video' ? form.durationMinutes : undefined,
          isPrivate: form.isPrivate,
        });
        setSuccessMsg(`Updated resource "${form.title}".`);
      } else {
        await api.addResource({
          courseId: selectedCourseId,
          title: form.title,
          description: form.description,
          resourceType,
          urlOrPath: form.urlOrPath,
          fileName: form.fileName || undefined,
          fileSizeBytes: form.fileSizeBytes || undefined,
          durationMinutes: resourceType === 'youtube_video' ? form.durationMinutes : undefined,
          isPrivate: form.isPrivate,
          orderIndex: currentCourseResources.length + 1,
        });
        setSuccessMsg(`Published resource "${form.title}" to enrolled students.`);
      }
      setIsModalOpen(false);
      await refreshAll();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save learning resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string, title: string) => {
    if (!window.confirm(`Delete resource "${title}"?`)) return;
    try {
      await api.deleteResource(id);
      await refreshAll();
      setSuccessMsg(`Deleted resource "${title}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete resource.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Learning Resources & Study Material Vault
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload real PDF guides, attach YouTube video lectures, and publish course notes in real time.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={!selectedCourseId}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload / Add Resource</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Course Selector Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 w-full sm:w-auto">
          <span>Active Course Vault:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">{currentCourseResources.length} asset(s) linked to this course</div>
      </div>

      {/* Resources List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            {selectedCourse?.title} — Materials & Files
          </div>
          <span className="text-[11px] text-blue-900 font-medium">Protected Course Access Enabled</span>
        </div>

        <div className="divide-y divide-slate-100">
          {currentCourseResources.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No learning resources uploaded for this course yet. Click "Upload / Add Resource" above.
            </div>
          ) : (
            currentCourseResources.map((res) => (
              <div key={res.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      res.resourceType === 'pdf'
                        ? 'bg-rose-100 text-rose-700'
                        : res.resourceType === 'youtube_video' || res.resourceType === 'lecture_recording'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {res.resourceType === 'pdf' && <FileText className="w-5 h-5" />}
                    {(res.resourceType === 'youtube_video' || res.resourceType === 'lecture_recording') && (
                      <Video className="w-5 h-5" />
                    )}
                    {res.resourceType === 'external_link' && <LinkIcon className="w-5 h-5" />}
                    {res.resourceType === 'document' && <FileText className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">{res.title}</div>
                    {res.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{res.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="font-mono uppercase font-semibold text-slate-600">{res.resourceType}</span>
                      {res.fileName && <span className="font-mono text-slate-500">· {res.fileName}</span>}
                      {res.fileSizeBytes ? <span>· {(res.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span> : null}
                      {res.durationMinutes ? <span>· {res.durationMinutes} minutes</span> : null}
                      <span>· Added: {new Date(res.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={res.urlOrPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span>Open / Test</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleOpenEdit(res)}
                    className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Resource"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(res.id, res.title)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD / EDIT RESOURCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display">
                  {editingResource ? 'Edit Learning Asset' : 'Add Learning Asset'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">Course: {selectedCourse?.title}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Resource Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResourceType('pdf')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      resourceType === 'pdf'
                        ? 'bg-blue-50 border-blue-600 text-blue-950'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>PDF / Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResourceType('youtube_video')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      resourceType === 'youtube_video'
                        ? 'bg-blue-50 border-blue-600 text-blue-950'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Video className="w-4 h-4 text-red-600" />
                    <span>YouTube Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResourceType('external_link')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      resourceType === 'external_link'
                        ? 'bg-blue-50 border-blue-600 text-blue-950'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-blue-600" />
                    <span>External Link</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / Topic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Haas CNC G-Code Reference Manual 2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief synopsis for students..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
                />
              </div>

              {resourceType === 'pdf' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Upload PDF / Document File</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <label className="cursor-pointer text-xs font-semibold text-blue-900 hover:underline">
                      <span>{isUploading ? 'Uploading to server...' : 'Click to select PDF or Document'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Supported: .pdf, .doc, .docx (Max 25 MB)</p>
                  </div>

                  {form.urlOrPath && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
                      <span className="truncate font-mono">{form.fileName || form.urlOrPath}</span>
                      <span className="font-bold shrink-0 ml-2">Ready</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Or direct PDF URL:</label>
                    <input
                      type="text"
                      value={form.urlOrPath}
                      onChange={(e) => setForm({ ...form, urlOrPath: e.target.value })}
                      placeholder="/uploads/... or https://..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {resourceType === 'youtube_video' ? 'YouTube Video URL' : 'Resource Web Link'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={form.urlOrPath}
                      onChange={(e) => setForm({ ...form, urlOrPath: e.target.value })}
                      placeholder={resourceType === 'youtube_video' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                    />
                  </div>
                  {resourceType === 'youtube_video' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

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
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingResource ? 'Update Resource' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
