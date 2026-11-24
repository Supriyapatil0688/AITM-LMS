import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { Course, CourseType, CourseStatus } from '../../types';
import {
  BookOpen,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Users,
  Armchair,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const CourseManagement: React.FC = () => {
  const { courses, studentEnrollmentRecords, refreshAll } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Trainee Filter State for Course Section
  const [rosterCourseFilter, setRosterCourseFilter] = useState('all');
  const [rosterBatchFilter, setRosterBatchFilter] = useState('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState('all');
  const [showRoster, setShowRoster] = useState(true);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'Manufacturing & Automation',
    thumbnailUrl: '/src/assets/images/aitm_industrial_training_1792739247502.jpg',
    duration: '12 Months (Dual Work-Study)',
    courseType: 'Apprenticeship (NAPS)' as CourseType,
    batch: 'Batch 2026-A',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2027-01-31',
    instructorName: 'Er. Rajesh Deshpande',
    instructorRole: 'Senior Technical Trainer',
    fees: '₹ 45,000 (Stipend Eligible)',
    totalSeats: 40,
    status: 'published' as CourseStatus,
    syllabusText: 'Workshop Safety & 5S\nTool Engineering\nPart Programming\nController Setup\nQuality Inspection',
  });

  const totalEnrollmentsAcrossAllCourses = studentEnrollmentRecords.filter((r) => r.status === 'Enrolled').length;

  const uniqueBatches = Array.from(
    new Set([
      ...courses.map((c) => c.batch).filter(Boolean),
      ...studentEnrollmentRecords.map((r) => r.batch).filter(Boolean),
    ])
  );

  const filteredRosterStudents = studentEnrollmentRecords.filter((r) => {
    const matchesCourse = rosterCourseFilter === 'all' || r.courseId === rosterCourseFilter;
    const matchesBatch = rosterBatchFilter === 'all' || r.batch === rosterBatchFilter;
    const matchesStatus = rosterStatusFilter === 'all' || r.status === rosterStatusFilter;
    return matchesCourse && matchesBatch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setActionError(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      category: 'Manufacturing & Automation',
      thumbnailUrl: '/src/assets/images/aitm_industrial_training_1792739247502.jpg',
      duration: '12 Months (Dual Work-Study)',
      courseType: 'Apprenticeship (NAPS)',
      batch: 'Batch 2026-D',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-01-31',
      instructorName: 'Er. Rajesh Deshpande',
      instructorRole: 'Senior Technical Trainer',
      fees: '₹ 45,000 (Govt Stipend Supported)',
      totalSeats: 40,
      status: 'published',
      syllabusText:
        'Industrial Safety & 5S\nBlueprint Interpretation\nCNC Programming (G & M Code)\nController Operation\nQuality Metrology',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setActionError(null);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl,
      duration: course.duration,
      courseType: course.courseType,
      batch: course.batch,
      startDate: course.startDate,
      endDate: course.endDate || '',
      instructorName: course.instructorName,
      instructorRole: course.instructorRole || '',
      fees: course.fees || course.feeInfo || '₹ 40,000',
      totalSeats: course.totalSeats || 40,
      status: course.status,
      syllabusText: course.syllabus ? course.syllabus.join('\n') : '',
    });
    setIsModalOpen(true);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionError(null);
    setIsUploadingImage(true);
    try {
      const uploaded = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, thumbnailUrl: uploaded.url }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload course thumbnail.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    const syllabusArray = form.syllabusText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedSlug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const payload = {
      title: form.title,
      slug: generatedSlug,
      description: form.description,
      category: form.category,
      thumbnailUrl: form.thumbnailUrl,
      duration: form.duration,
      courseType: form.courseType,
      batch: form.batch,
      startDate: form.startDate,
      endDate: form.endDate,
      instructorName: form.instructorName,
      instructorRole: form.instructorRole,
      fees: form.fees,
      feeInfo: form.fees,
      totalSeats: form.totalSeats,
      status: form.status,
      syllabus: syllabusArray,
    };

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, payload);
        setSuccessBanner(`Updated course "${form.title}" and synchronized across all portals.`);
      } else {
        await api.createCourse(payload);
        setSuccessBanner(`Created course "${form.title}" and published to live catalog.`);
      }
      setIsModalOpen(false);
      await refreshAll();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const nextStatus: CourseStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateCourse(course.id, { status: nextStatus });
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update course status.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This action is permanent and will delete linked course materials and student enrollments.`
      )
    ) {
      return;
    }
    try {
      await api.deleteCourse(id);
      await refreshAll();
      setSuccessBanner(`Deleted course "${title}".`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete course.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              AITM Thane · Academic Management
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-blue-900 font-semibold font-mono">
              Total Enrolled Students: {totalEnrollmentsAcrossAllCourses}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mt-1">
            Course Management & Seat Allocation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, upload course thumbnails, and configure seat limits with real-time database sync.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-900 rounded-xl hover:bg-blue-800 transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {actionError && !isModalOpen && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Courses</span>
            <div className="text-2xl font-bold font-mono text-slate-900">{courses.length} Programs</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Enrolled Trainees</span>
            <div className="text-2xl font-bold font-mono text-emerald-700">{totalEnrollmentsAcrossAllCourses} Students</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Available Seats</span>
            <div className="text-2xl font-bold font-mono text-cyan-800">
              {courses.reduce((acc, c) => {
                const enrolled = studentEnrollmentRecords.filter((r) => r.courseId === c.id && r.status === 'Enrolled').length;
                return acc + Math.max(0, (c.totalSeats || 40) - enrolled);
              }, 0)}{' '}
              Seats
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-800 flex items-center justify-center font-bold">
            <Armchair className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const enrolledCount = studentEnrollmentRecords.filter(
            (r) => r.courseId === course.id && r.status === 'Enrolled'
          ).length;

          const pendingCount = studentEnrollmentRecords.filter(
            (r) => r.courseId === course.id && r.status === 'Pending'
          ).length;

          const totalSeats = course.totalSeats || 40;
          const availableSeats = Math.max(0, totalSeats - enrolledCount);

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={course.thumbnailUrl || '/src/assets/images/aitm_industrial_training_1792739247502.jpg'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-blue-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    {course.courseType}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
                        course.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {course.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="font-semibold text-blue-900">{course.category}</span>
                    <span className="font-mono">{course.duration}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-display line-clamp-1">{course.title}</h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{course.description}</p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Enrolled Students:</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {enrolledCount} Students
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Pending Approvals:</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {pendingCount} Pending
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-1">
                      <span className="text-slate-600 font-medium">Available Seats:</span>
                      <span className="font-mono font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {availableSeats} / {totalSeats}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>
                      Fees: <strong className="text-slate-900">{course.fees || course.feeInfo || 'Govt Stipend'}</strong>
                    </div>
                    <div>
                      Batch: <span className="font-mono text-slate-700">{course.batch}</span>
                    </div>
                    <div>
                      Instructor: <strong className="text-slate-800">{course.instructorName}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                <Link
                  to={`/admin/students?course=${course.id}`}
                  className="text-blue-900 hover:underline font-bold flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Students ({enrolledCount + pendingCount})</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100"
                    title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {course.status === 'published' ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(course)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, course.title)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER STUDENTS BY COURSE, BATCH & ENROLLMENT STATUS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-base font-bold font-display text-slate-900">
                Filter Students by Course, Batch & Enrollment Status
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect active, pending, and completed trainees enrolled in each training program.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/students" className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>Open Full Enrollment System</span>
            </Link>
            <button
              onClick={() => setShowRoster(!showRoster)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
              title={showRoster ? 'Collapse roster' : 'Expand roster'}
            >
              {showRoster ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showRoster && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-100/70 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Course</label>
                <select
                  value={rosterCourseFilter}
                  onChange={(e) => setRosterCourseFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                >
                  <option value="all">All Courses ({courses.length})</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Batch</label>
                <select
                  value={rosterBatchFilter}
                  onChange={(e) => setRosterBatchFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                >
                  <option value="all">All Batches ({uniqueBatches.length})</option>
                  {uniqueBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Enrollment Status</label>
                <select
                  value={rosterStatusFilter}
                  onChange={(e) => setRosterStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="Enrolled">Enrolled Only</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Completed">Completed Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Enrolled Course</th>
                    <th className="py-2.5 px-4">Batch</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRosterStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No students match the selected course, batch, or status criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRosterStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {st.fullName}
                          {st.studentId && (
                            <span className="ml-2 font-mono text-[10px] text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {st.studentId}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{st.mobileNumber}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-medium">{st.courseName}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{st.batch}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{st.enrollmentDate}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              st.status === 'Enrolled'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : st.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Showing {filteredRosterStudents.length} students matching current filters.</span>
              <Link
                to={`/admin/students?course=${rosterCourseFilter}&status=${rosterStatusFilter}`}
                className="text-blue-900 font-bold hover:underline"
              >
                Manage or Edit in Student Management →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT COURSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {editingCourse ? 'Edit Course & Available Seats' : 'Add New Course to Institute Catalog'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Industrial Automation & CNC Precision Machining"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Overview of syllabus, machine skills, industry relevance..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                />
              </div>

              {/* Thumbnail Image Upload / URL */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Course Cover Thumbnail</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <img
                    src={form.thumbnailUrl}
                    alt="Course Thumbnail Preview"
                    className="w-24 h-16 object-cover rounded-lg border border-slate-300 bg-white shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={form.thumbnailUrl}
                      onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                      placeholder="/uploads/... or https://..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono outline-none"
                    />
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Uploading Image...' : 'Upload New Image File'}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Manufacturing & Automation">Manufacturing & Automation</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Work-Integrated Education">Work-Integrated Education</option>
                    <option value="Quality Assurance & Management">Quality Assurance & Management</option>
                    <option value="Automotive & EV">Automotive & EV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Type</label>
                  <select
                    value={form.courseType}
                    onChange={(e) => setForm({ ...form, courseType: e.target.value as CourseType })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Apprenticeship (NAPS)">Apprenticeship (NAPS)</option>
                    <option value="Apprenticeship (NATS)">Apprenticeship (NATS)</option>
                    <option value="Learn & Earn">Learn & Earn</option>
                    <option value="Work-Integrated Degree">Work-Integrated Degree</option>
                    <option value="Certification">Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 12 Months"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Fees / Stipend <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fees}
                    onChange={(e) => setForm({ ...form, fees: e.target.value })}
                    placeholder="e.g. ₹ 45,000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-semibold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Available Seats <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={form.totalSeats}
                    onChange={(e) => setForm({ ...form, totalSeats: parseInt(e.target.value) || 40 })}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code</label>
                  <input
                    type="text"
                    required
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                    placeholder="Batch 2026-A"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    required
                    value={form.instructorName}
                    onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                    placeholder="Er. Rajesh Deshpande"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catalog Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="published">Published (Visible in Catalog)</option>
                    <option value="draft">Draft (Admin Only)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Syllabus (One module per line)
                </label>
                <textarea
                  rows={3}
                  value={form.syllabusText}
                  onChange={(e) => setForm({ ...form, syllabusText: e.target.value })}
                  placeholder="Module 1: Safety&#10;Module 2: Machine Setup"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
