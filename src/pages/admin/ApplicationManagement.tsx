import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import type { Application, ApplicationStatus, Inquiry, UserProfile } from '../../types';
import {
  Inbox,
  Search,
  CheckCircle2,
  UserCheck,
  X,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Trash2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export const ApplicationManagement: React.FC = () => {
  const { applications, inquiries, courses: allCourses, refreshAll } = useData();

  const [activeTab, setActiveTab] = useState<'applications' | 'inquiries'>('applications');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Convert Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [assignCourseIds, setAssignCourseIds] = useState<string[]>([]);
  const [convertResult, setConvertResult] = useState<{ student: UserProfile; tempPassword: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inquiry notes editing
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [inquiryNotes, setInquiryNotes] = useState('');

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      app.phone.includes(search) ||
      app.city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setErrorMsg(null);
    try {
      await api.updateApplicationStatus(appId, newStatus);
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update application status.');
    }
  };

  const handleDeleteApplication = async (app: Application) => {
    if (!window.confirm(`Delete application from "${app.fullName}"?`)) return;
    try {
      await api.deleteApplication(app.id);
      await refreshAll();
      setSuccessMsg(`Deleted application from ${app.fullName}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete application.');
    }
  };

  const handleOpenConvert = (app: Application) => {
    setErrorMsg(null);
    setSelectedApp(app);
    setConvertResult(null);
    setAssignCourseIds(app.interestedCourseId ? [app.interestedCourseId] : allCourses[0] ? [allCourses[0].id] : []);
  };

  const handleExecuteConvert = async () => {
    if (!selectedApp) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const result = await api.convertApplicationToStudent(selectedApp.id, assignCourseIds);
      setConvertResult(result);
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to convert applicant to student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInquiryStatusChange = async (id: string, status: Inquiry['status']) => {
    try {
      await api.updateInquiry(id, { status });
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update inquiry status.');
    }
  };

  const handleSaveInquiryNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInquiry) return;
    setIsSubmitting(true);
    try {
      await api.updateInquiry(editingInquiry.id, { adminNotes: inquiryNotes });
      setEditingInquiry(null);
      await refreshAll();
      setSuccessMsg(`Saved notes for inquiry from ${editingInquiry.name}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save inquiry notes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInquiry = async (inq: Inquiry) => {
    if (!window.confirm(`Delete inquiry from "${inq.name}"?`)) return;
    try {
      await api.deleteInquiry(inq.id);
      await refreshAll();
      setSuccessMsg(`Deleted inquiry from ${inq.name}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete inquiry.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Admissions Applications & Public Inquiries Inbox
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant qualifications submitted via "Apply Now", onboard accepted candidates, and manage contact inquiries.
          </p>
        </div>

        <div className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
          {applications.length} Applications · {inquiries.length} Inquiries
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'applications'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Admissions Applications</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'inquiries'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Visitor Inquiries</span>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              newInquiriesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {newInquiriesCount > 0 ? `${newInquiriesCount} New` : inquiries.length}
          </span>
        </button>
      </div>

      {activeTab === 'applications' && (
        <>
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by applicant name, email, phone, city..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
              >
                <option value="all">All Application Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Applicant Info</th>
                    <th className="py-3.5 px-6">Program & Course Interest</th>
                    <th className="py-3.5 px-6">Location & Education</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No applications match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{app.fullName}</div>
                          <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{app.email}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-[11px]">{app.phone}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            Ref: {app.id.toUpperCase()} · {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-semibold text-blue-900">
                            {app.interestedCourseTitle || 'General Apprenticeship'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 uppercase">
                            Scheme: {app.programType}
                          </div>
                          {app.notes && (
                            <p className="text-[11px] text-slate-600 italic mt-1 max-w-xs line-clamp-2">
                              "{app.notes}"
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                            <span>{app.educationQualification}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>
                              {app.city}, {app.state}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-md border outline-none cursor-pointer ${
                              app.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : app.status === 'reviewing'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : app.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="pending">PENDING</option>
                            <option value="reviewing">REVIEWING</option>
                            <option value="accepted">ACCEPTED</option>
                            <option value="rejected">REJECTED</option>
                          </select>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {app.status === 'accepted' && (
                              <button
                                onClick={() => handleOpenConvert(app)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Onboard Student</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteApplication(app)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* INQUIRIES TAB */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Sender Info</th>
                  <th className="py-3.5 px-6">Inquiry Message</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No visitor inquiries submitted yet.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{inq.name}</div>
                        <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{inq.email}</span>
                        </div>
                        {inq.phone && (
                          <div className="text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{inq.phone}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(inq.createdAt).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 px-6 max-w-md">
                        <p className="text-slate-700 leading-relaxed">{inq.message}</p>
                        {inq.adminNotes && (
                          <div className="mt-2 p-2 bg-slate-100 rounded text-[11px] text-slate-600">
                            <strong>Admin Note:</strong> {inq.adminNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={inq.status}
                          onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value as Inquiry['status'])}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border outline-none cursor-pointer ${
                            inq.status === 'new'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : inq.status === 'contacted'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <option value="new">NEW</option>
                          <option value="contacted">CONTACTED</option>
                          <option value="resolved">RESOLVED</option>
                        </select>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingInquiry(inq);
                              setInquiryNotes(inq.adminNotes || '');
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg"
                          >
                            {inq.adminNotes ? 'Edit Note' : 'Add Note'}
                          </button>
                          <button
                            onClick={() => handleDeleteInquiry(inq)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONVERT APPLICANT TO STUDENT MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display">Convert Applicant to Student Account</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Candidate: {selectedApp.fullName} ({selectedApp.email})
                </p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {convertResult ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 font-display">Candidate Successfully Onboarded!</h4>
                  <p className="text-xs text-slate-600">
                    Official student credentials have been provisioned and courses assigned:
                  </p>

                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-left space-y-1.5 text-xs font-mono max-w-sm mx-auto">
                    <div>
                      <strong>Student ID:</strong> {convertResult.student.studentId}
                    </div>
                    <div>
                      <strong>Login Email:</strong> {convertResult.student.email}
                    </div>
                    <div>
                      <strong>Temporary Password:</strong>{' '}
                      <span className="text-blue-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                        {convertResult.tempPassword}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
                    >
                      Done & Return to Inbox
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select the courses to assign to <strong className="text-slate-900">{selectedApp.fullName}</strong>.
                    The system will generate an enrollment number, enrollment record, and portal credentials.
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {allCourses.map((c) => {
                      const isChecked = assignCourseIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs ${
                            isChecked ? 'bg-blue-100/70 font-semibold text-blue-950' : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignCourseIds([...assignCourseIds, c.id]);
                              } else {
                                setAssignCourseIds(assignCourseIds.filter((id) => id !== c.id));
                              }
                            }}
                            className="mt-0.5 rounded text-blue-900"
                          />
                          <div>
                            <div>{c.title}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {c.category} · {c.duration}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteConvert}
                      disabled={assignCourseIds.length === 0 || isSubmitting}
                      className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Provisioning...' : 'Provision Student Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INQUIRY NOTES MODAL */}
      {editingInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">Admin Note — {editingInquiry.name}</h3>
              <button onClick={() => setEditingInquiry(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveInquiryNotes} className="p-6 space-y-4">
              <textarea
                rows={4}
                value={inquiryNotes}
                onChange={(e) => setInquiryNotes(e.target.value)}
                placeholder="Record follow-up notes, call summary, or counselor assignment..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInquiry(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
