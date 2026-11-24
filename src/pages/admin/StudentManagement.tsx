import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { MasterStudentDirectory } from '../../components/admin/MasterStudentDirectory';
import type {
  StudentEnrollmentRecord,
  StudentEnrollmentStatus,
  UserProfile,
} from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  Edit3,
  Trash2,
  X,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileText,
  Key,
  Check,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCourseParam = searchParams.get('course') || 'all';
  const initialStatusParam = searchParams.get('status') || 'all';

  const {
    courses: allCourses,
    studentEnrollmentRecords: enrollments,
    enrolledStudents,
    enrolledStudentStats,
    students,
    getStudentEnrolledCourseIds,
    refreshAll,
  } = useData();

  const [activeTab, setActiveTab] = useState<'master_directory' | 'enrollments' | 'portal_accounts'>(
    initialCourseParam !== 'all' || initialStatusParam !== 'all' ? 'enrollments' : 'master_directory'
  );

  // Search & Filter States for Enrollments
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(initialCourseParam);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(initialStatusParam);

  // Modals for Enrollments
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollmentRecord | null>(null);

  // Modals for Portal Accounts
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAssignCoursesModalOpen, setIsAssignCoursesModalOpen] = useState(false);
  const [activePortalStudent, setActivePortalStudent] = useState<UserProfile | null>(null);
  const [courseAssignmentSelection, setCourseAssignmentSelection] = useState<string[]>([]);
  const [credentialResultModal, setCredentialResultModal] = useState<{
    title: string;
    email: string;
    studentId?: string;
    tempPassword: string;
  } | null>(null);

  const [accountForm, setAccountForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    batch: 'Batch 2026-A',
    assignedCourseIds: [] as string[],
    temporaryPassword: '',
  });

  // Enrollment Form State
  const [enrollmentForm, setEnrollmentForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    courseId: '',
    batch: 'Batch 2026-A',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'Enrolled' as StudentEnrollmentStatus,
    createPortalAccount: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourseParam !== 'all') {
      setSelectedCourseFilter(initialCourseParam);
      setActiveTab('enrollments');
    }
  }, [initialCourseParam]);

  useEffect(() => {
    if (initialStatusParam !== 'all') {
      setSelectedStatusFilter(initialStatusParam);
      setActiveTab('enrollments');
    }
  }, [initialStatusParam]);

  useEffect(() => {
    if (!enrollmentForm.courseId && allCourses.length > 0) {
      setEnrollmentForm((prev) => ({ ...prev, courseId: allCourses[0].id }));
    }
  }, [allCourses, enrollmentForm.courseId]);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Unique batches from records and courses for filter dropdown
  const uniqueBatches = Array.from(
    new Set([
      ...allCourses.map((c) => c.batch).filter(Boolean),
      ...enrollments.map((e) => e.batch).filter(Boolean),
    ])
  );

  // Filtered Enrollments
  const filteredEnrollments = enrollments.filter((record) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      record.fullName.toLowerCase().includes(query) ||
      record.email.toLowerCase().includes(query) ||
      record.mobileNumber.toLowerCase().includes(query) ||
      (record.studentId && record.studentId.toLowerCase().includes(query)) ||
      record.courseName.toLowerCase().includes(query);

    const matchesCourse =
      selectedCourseFilter === 'all' ||
      record.courseId === selectedCourseFilter ||
      record.courseName.toLowerCase() === selectedCourseFilter.toLowerCase();

    const matchesBatch = selectedBatchFilter === 'all' || record.batch === selectedBatchFilter;
    const matchesStatus = selectedStatusFilter === 'all' || record.status === selectedStatusFilter;

    return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
  });

  // Dynamic statistics
  const totalRegistered = enrollments.length;
  const enrolledCount = enrollments.filter((e) => e.status === 'Enrolled').length;
  const pendingCount = enrollments.filter((e) => e.status === 'Pending').length;
  const completedCount = enrollments.filter((e) => e.status === 'Completed').length;

  // Handlers for Enrollment CRUD
  const handleOpenEnrollModal = () => {
    setEditingEnrollment(null);
    setFormError(null);
    setEnrollmentForm({
      fullName: '',
      mobileNumber: '',
      email: '',
      courseId: allCourses[0]?.id || '',
      batch: 'Batch 2026-A',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'Enrolled',
      createPortalAccount: true,
    });
    setIsEnrollModalOpen(true);
  };

  const handleOpenEditEnrollment = (record: StudentEnrollmentRecord) => {
    setEditingEnrollment(record);
    setFormError(null);
    setEnrollmentForm({
      fullName: record.fullName,
      mobileNumber: record.mobileNumber,
      email: record.email,
      courseId: record.courseId,
      batch: record.batch,
      enrollmentDate: record.enrollmentDate,
      status: record.status,
      createPortalAccount: false,
    });
    setIsEnrollModalOpen(true);
  };

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!enrollmentForm.fullName.trim()) {
      setFormError('Please enter the Student Full Name.');
      return;
    }
    if (!enrollmentForm.mobileNumber.trim()) {
      setFormError('Please enter a valid Mobile Number.');
      return;
    }
    if (!enrollmentForm.email.trim() || !enrollmentForm.email.includes('@')) {
      setFormError('Please enter a valid Email Address.');
      return;
    }
    if (!enrollmentForm.courseId) {
      setFormError('Please select a Course.');
      return;
    }
    if (!enrollmentForm.batch.trim()) {
      setFormError('Please specify the Training Batch.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCourse = allCourses.find((c) => c.id === enrollmentForm.courseId);

      if (editingEnrollment) {
        await api.updateStudentEnrollment(editingEnrollment.id, {
          fullName: enrollmentForm.fullName.trim(),
          mobileNumber: enrollmentForm.mobileNumber.trim(),
          email: enrollmentForm.email.trim().toLowerCase(),
          courseId: enrollmentForm.courseId,
          courseName: selectedCourse ? selectedCourse.title : enrollmentForm.courseId,
          batch: enrollmentForm.batch.trim(),
          enrollmentDate: enrollmentForm.enrollmentDate,
          status: enrollmentForm.status,
        });
        setIsEnrollModalOpen(false);
        await refreshAll();
        showSuccess(`Enrollment record for ${enrollmentForm.fullName} updated successfully.`);
      } else {
        const newRec = await api.addStudentEnrollment({
          fullName: enrollmentForm.fullName.trim(),
          mobileNumber: enrollmentForm.mobileNumber.trim(),
          email: enrollmentForm.email.trim().toLowerCase(),
          courseId: enrollmentForm.courseId,
          batch: enrollmentForm.batch.trim(),
          enrollmentDate: enrollmentForm.enrollmentDate,
          status: enrollmentForm.status,
        });

        let createdCreds: { student: UserProfile; tempPassword: string } | null = null;
        if (enrollmentForm.createPortalAccount) {
          try {
            createdCreds = await api.createStudent({
              fullName: newRec.fullName,
              email: newRec.email,
              mobileNumber: newRec.mobileNumber,
              studentId: newRec.studentId,
              batch: newRec.batch,
              joiningDate: newRec.enrollmentDate,
              assignedCourseIds: [newRec.courseId],
              status: 'active',
            });
          } catch {
            // Portal login already exists for this email
          }
        }

        setIsEnrollModalOpen(false);
        await refreshAll();
        showSuccess(`Student ${newRec.fullName} successfully enrolled into ${newRec.courseName} (${newRec.status}).`);
        if (createdCreds) {
          setCredentialResultModal({
            title: 'Student Portal Account Provisioned',
            email: createdCreds.student.email,
            studentId: createdCreds.student.studentId,
            tempPassword: createdCreds.tempPassword,
          });
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save enrollment record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete enrollment record for "${name}"? This will update the course-wise seat counts.`
      )
    ) {
      return;
    }
    try {
      await api.deleteStudentEnrollment(id);
      await refreshAll();
      showSuccess(`Enrollment record deleted for ${name}.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete enrollment.');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: StudentEnrollmentStatus) => {
    try {
      await api.updateStudentEnrollment(id, { status: newStatus });
      await refreshAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  // LMS Account handlers
  const handleToggleAccountStatus = async (studentId: string) => {
    try {
      await api.toggleStudentStatus(studentId);
      await refreshAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to toggle account status.');
    }
  };

  const openCourseAssignment = (student: UserProfile) => {
    setActivePortalStudent(student);
    const currentEnrolled = getStudentEnrolledCourseIds(student.id);
    setCourseAssignmentSelection(currentEnrolled);
    setIsAssignCoursesModalOpen(true);
  };

  const handleSaveCourseAssignments = async () => {
    if (!activePortalStudent) return;
    setIsSubmitting(true);
    try {
      await api.assignStudentCourses(activePortalStudent.id, courseAssignmentSelection);
      setIsAssignCoursesModalOpen(false);
      await refreshAll();
      showSuccess(`Updated LMS course access for ${activePortalStudent.fullName}.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update course assignments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateAccount = () => {
    setFormError(null);
    setAccountForm({
      fullName: '',
      email: '',
      mobileNumber: '',
      batch: 'Batch 2026-A',
      assignedCourseIds: allCourses[0] ? [allCourses[0].id] : [],
      temporaryPassword: '',
    });
    setIsAddAccountModalOpen(true);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await api.createStudent({
        fullName: accountForm.fullName.trim(),
        email: accountForm.email.trim().toLowerCase(),
        mobileNumber: accountForm.mobileNumber.trim() || undefined,
        batch: accountForm.batch.trim() || 'Batch 2026-A',
        assignedCourseIds: accountForm.assignedCourseIds,
        temporaryPassword: accountForm.temporaryPassword.trim() || undefined,
      });
      setIsAddAccountModalOpen(false);
      await refreshAll();
      setCredentialResultModal({
        title: 'New Student LMS Account Created',
        email: result.student.email,
        studentId: result.student.studentId,
        tempPassword: result.tempPassword,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create portal student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetStudentPassword = async (student: UserProfile) => {
    if (!window.confirm(`Generate a new temporary password for ${student.fullName}?`)) return;
    try {
      const res = await api.resetStudentPassword(student.id);
      setCredentialResultModal({
        title: `Password Reset for ${student.fullName}`,
        email: student.email,
        studentId: student.studentId,
        tempPassword: res.temporaryPassword,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to reset student password.');
    }
  };

  const handleDeletePortalAccount = async (student: UserProfile) => {
    if (!window.confirm(`Permanently delete student portal account for "${student.fullName}" (${student.email})?`)) {
      return;
    }
    try {
      await api.deleteStudent(student.id);
      await refreshAll();
      showSuccess(`Deleted portal account for ${student.fullName}.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete student account.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              AITM Thane · Admissions & Enrollment Engine
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SQLite Synced</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mt-1">
            Student Enrollment Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register students, allocate batches, update enrollment statuses, and manage LMS portal access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-900" />
            <span>View Course-Wise Report</span>
          </Link>

          <button
            onClick={handleOpenEnrollModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {formError && !isEnrollModalOpen && !isAddAccountModalOpen && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Primary Tab Switcher */}
      <div className="flex flex-wrap border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('master_directory')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'master_directory'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Enrollment Directory</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
            {enrolledStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('enrollments')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'enrollments'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course-Wise Admissions</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {totalRegistered}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('portal_accounts')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'portal_accounts'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Portal LMS Accounts</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {students.length}
          </span>
        </button>
      </div>

      {/* TAB 1: 17-FIELD STUDENT ENROLLMENT MANAGEMENT DIRECTORY */}
      {activeTab === 'master_directory' && (
        <MasterStudentDirectory
          students={enrolledStudents}
          stats={enrolledStudentStats}
          onRefresh={refreshAll}
          onNotifySuccess={showSuccess}
          onNotifyError={(msg) => setFormError(msg)}
        />
      )}

      {/* TAB 2: COURSE-WISE ADMISSIONS */}
      {activeTab === 'enrollments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Registered</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalRegistered}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">All admission records</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Enrolled</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{enrolledCount}</div>
              <p className="text-[10px] text-emerald-600 mt-0.5">Active trainees</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-700 uppercase">Pending</span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{pendingCount}</div>
              <p className="text-[10px] text-amber-600 mt-0.5">Awaiting verification</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-xs">
              <span className="text-[11px] font-semibold text-cyan-800 uppercase">Completed</span>
              <div className="text-2xl font-bold font-mono text-cyan-800 mt-1">{completedCount}</div>
              <p className="text-[10px] text-cyan-600 mt-0.5">Graduated alumni</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-cyan-600" />
                <span>Filter Enrollments by Course, Batch & Status</span>
              </div>
              {(selectedCourseFilter !== 'all' ||
                selectedBatchFilter !== 'all' ||
                selectedStatusFilter !== 'all' ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCourseFilter('all');
                    setSelectedBatchFilter('all');
                    setSelectedStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-semibold text-blue-900 hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, email, ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                >
                  <option value="all">Filter by Course: All ({allCourses.length})</option>
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                >
                  <option value="all">Filter by Batch: All ({uniqueBatches.length})</option>
                  {uniqueBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                >
                  <option value="all">Enrollment Status: All</option>
                  <option value="Enrolled">Enrolled Only ({enrolledCount})</option>
                  <option value="Pending">Pending Only ({pendingCount})</option>
                  <option value="Completed">Completed Only ({completedCount})</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Sr. / ID</th>
                    <th className="py-3.5 px-6">Student Information</th>
                    <th className="py-3.5 px-6">Course Name</th>
                    <th className="py-3.5 px-6">Batch</th>
                    <th className="py-3.5 px-6">Enrollment Date</th>
                    <th className="py-3.5 px-6">Enrollment Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">
                          No enrollment records found matching your filters.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting the course, batch, or status criteria, or click "Enroll New Student".
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map((record, index) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-slate-400 text-[11px] block">#{index + 1}</span>
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            {record.studentId || 'N/A'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{record.fullName}</div>
                          <div className="text-slate-500 flex items-center gap-1.5 mt-0.5 text-xs">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{record.email}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1.5 mt-0.5 text-[11px]">
                            <Phone className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span className="font-mono">{record.mobileNumber}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 max-w-xs">
                          <div className="font-semibold text-slate-800 leading-snug">{record.courseName}</div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {record.batch}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{record.enrollmentDate}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                                record.status === 'Enrolled'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : record.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                              }`}
                            >
                              {record.status === 'Enrolled' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {record.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                              {record.status === 'Completed' && <Check className="w-3 h-3 text-cyan-700" />}
                              <span>{record.status}</span>
                            </span>

                            <select
                              value={record.status}
                              onChange={(e) =>
                                handleQuickStatusChange(record.id, e.target.value as StudentEnrollmentStatus)
                              }
                              className="text-[10px] text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-1 outline-none hover:border-slate-400 cursor-pointer"
                              title="Change status"
                            >
                              <option value="Enrolled">Set: Enrolled</option>
                              <option value="Pending">Set: Pending</option>
                              <option value="Completed">Set: Completed</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditEnrollment(record)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                              title="Edit Enrollment Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEnrollment(record.id, record.fullName)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Enrollment Record"
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Showing <strong>{filteredEnrollments.length}</strong> of <strong>{totalRegistered}</strong> student
                enrollment records.
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-mono text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {enrolledCount} Enrolled
                </span>
                <span className="flex items-center gap-1 font-mono text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {pendingCount} Pending
                </span>
                <span className="flex items-center gap-1 font-mono text-cyan-700">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  {completedCount} Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT PORTAL LMS ACCOUNTS */}
      {activeTab === 'portal_accounts' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">
                Student Portal Credentials & Course Permissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create, update, reset passwords, or delete login accounts and control authorized LMS courses.
              </p>
            </div>

            <button
              onClick={handleOpenCreateAccount}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Portal Account</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Student Info</th>
                    <th className="py-3.5 px-6">Student ID & Batch</th>
                    <th className="py-3.5 px-6">Assigned Portal Courses</th>
                    <th className="py-3.5 px-6">Login Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students.map((student) => {
                    const assignedIds = getStudentEnrolledCourseIds(student.id);
                    const assignedCourseList = allCourses.filter((c) => assignedIds.includes(c.id));

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{student.fullName}</div>
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{student.email}</span>
                          </div>
                          {student.mobileNumber && (
                            <div className="text-slate-500 flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{student.mobileNumber}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {student.studentId || 'N/A'}
                          </span>
                          <div className="text-slate-500 mt-1 text-[11px]">{student.batch || 'Batch 2026'}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {assignedCourseList.length === 0 ? (
                              <span className="text-rose-500 font-semibold text-[11px]">No LMS courses assigned</span>
                            ) : (
                              assignedCourseList.map((c) => (
                                <div key={c.id} className="text-xs text-slate-700 flex items-center gap-1.5">
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span className="font-medium truncate max-w-xs">{c.title}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <button
                            onClick={() => openCourseAssignment(student)}
                            className="mt-2 text-[11px] font-semibold text-blue-900 hover:underline flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Assign / Modify Courses ({assignedCourseList.length})</span>
                          </button>
                        </td>

                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleAccountStatus(student.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-colors ${
                              student.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {student.status === 'active' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ACTIVE</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>INACTIVE</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openCourseAssignment(student)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            >
                              Manage Access
                            </button>
                            <button
                              onClick={() => handleResetStudentPassword(student)}
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                              title="Reset Student Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePortalAccount(student)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Student Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT ENROLLMENT FORM MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                  Official Admission Record
                </span>
                <h3 className="text-lg font-bold font-display text-slate-900">
                  {editingEnrollment ? 'Edit Student Enrollment' : 'Enroll New Student'}
                </h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEnrollment} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={enrollmentForm.fullName}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, fullName: e.target.value })}
                  placeholder="e.g. Rahul Shinde"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={enrollmentForm.mobileNumber}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, mobileNumber: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={enrollmentForm.email}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Course Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={enrollmentForm.courseId}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white"
                >
                  {allCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.courseType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Batch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={enrollmentForm.batch}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, batch: e.target.value })}
                  placeholder="e.g. Batch 2026-A (CNC)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enrollment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={enrollmentForm.enrollmentDate}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, enrollmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enrollment Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={enrollmentForm.status}
                    onChange={(e) =>
                      setEnrollmentForm({ ...enrollmentForm, status: e.target.value as StudentEnrollmentStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white"
                  >
                    <option value="Enrolled">Enrolled (Counts toward active seats)</option>
                    <option value="Pending">Pending (Awaiting document clearance)</option>
                    <option value="Completed">Completed (Graduated / Certified)</option>
                  </select>
                </div>
              </div>

              {!editingEnrollment && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={enrollmentForm.createPortalAccount}
                      onChange={(e) =>
                        setEnrollmentForm({ ...enrollmentForm, createPortalAccount: e.target.checked })
                      }
                      className="rounded text-blue-900 focus:ring-blue-600 w-4 h-4"
                    />
                    <span className="font-semibold">
                      Automatically provision Student Portal LMS Login for this student
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingEnrollment ? 'Save Changes' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PORTAL STUDENT ACCOUNT MODAL */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">LMS Portal Access</span>
                <h3 className="text-lg font-bold font-display text-slate-900">Create Student LMS Account</h3>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={accountForm.fullName}
                  onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                  placeholder="Student full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="student@student.aitm"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={accountForm.mobileNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, mobileNumber: e.target.value })}
                    placeholder="+91 98200..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch</label>
                  <input
                    type="text"
                    value={accountForm.batch}
                    onChange={(e) => setAccountForm({ ...accountForm, batch: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password (Optional)</label>
                  <input
                    type="text"
                    value={accountForm.temporaryPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, temporaryPassword: e.target.value })}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign LMS Courses</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {allCourses.map((course) => {
                    const checked = accountForm.assignedCourseIds.includes(course.id);
                    return (
                      <label key={course.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAccountForm({
                                ...accountForm,
                                assignedCourseIds: [...accountForm.assignedCourseIds, course.id],
                              });
                            } else {
                              setAccountForm({
                                ...accountForm,
                                assignedCourseIds: accountForm.assignedCourseIds.filter((id) => id !== course.id),
                              });
                            }
                          }}
                          className="rounded text-blue-900"
                        />
                        <span className="font-medium text-slate-800">{course.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE ASSIGNMENT MODAL (LMS Portal) */}
      {isAssignCoursesModalOpen && activePortalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">LMS Access</span>
                <h3 className="text-lg font-bold font-display text-slate-900">
                  Assign Courses to {activePortalStudent.fullName}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignCoursesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
              {allCourses.map((course) => {
                const isChecked = courseAssignmentSelection.includes(course.id);
                return (
                  <label
                    key={course.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isChecked ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCourseAssignmentSelection([...courseAssignmentSelection, course.id]);
                        } else {
                          setCourseAssignmentSelection(courseAssignmentSelection.filter((id) => id !== course.id));
                        }
                      }}
                      className="mt-0.5 rounded text-blue-900 focus:ring-blue-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{course.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {course.courseType} · {course.category}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setIsAssignCoursesModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourseAssignments}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATED CREDENTIALS DISPLAY MODAL */}
      {credentialResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-slate-900">{credentialResultModal.title}</h3>
              <button
                onClick={() => setCredentialResultModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Share these active credentials with the student so they can sign in immediately:
            </p>
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono space-y-1.5">
              {credentialResultModal.studentId && (
                <div>
                  <strong>Student ID:</strong> {credentialResultModal.studentId}
                </div>
              )}
              <div>
                <strong>Email:</strong> {credentialResultModal.email}
              </div>
              <div>
                <strong>Temporary Password:</strong>{' '}
                <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-blue-900">
                  {credentialResultModal.tempPassword}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setCredentialResultModal(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
