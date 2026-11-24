import React, { useState, useMemo, useEffect } from 'react';
import type { EnrolledStudent, EnrolledStudentStats } from '../../types';
import { api } from '../../lib/api';
import {
  exportStudentsToExcel,
  exportStudentsToCSV,
  downloadSampleStudentTemplate,
} from '../../lib/studentSpreadsheet';
import { EnrolledStudentFormModal, EnrolledStudentProfileModal } from './EnrolledStudentModals';
import { BulkStudentImportModal } from './BulkStudentImportModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Eye,
  Edit3,
  Trash2,
  Power,
  Upload,
  FileSpreadsheet,
  FileDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface MasterStudentDirectoryProps {
  students: EnrolledStudent[];
  stats: EnrolledStudentStats | null;
  onRefresh: () => Promise<void>;
  onNotifySuccess: (msg: string) => void;
  onNotifyError: (msg: string) => void;
}

export const MasterStudentDirectory: React.FC<MasterStudentDirectoryProps> = ({
  students,
  stats,
  onRefresh,
  onNotifySuccess,
  onNotifyError,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<EnrolledStudent | null>(null);
  const [viewingStudent, setViewingStudent] = useState<EnrolledStudent | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<EnrolledStudent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const computedStats = useMemo<EnrolledStudentStats>(() => {
    if (stats) return stats;
    const active = students.filter((s) => s.status === 'Active').length;
    const locMap = new Map<string, number>();
    const staffSet = new Set<string>();
    for (const s of students) {
      const loc = s.location.trim() || 'Unspecified';
      locMap.set(loc, (locMap.get(loc) || 0) + 1);
      if (s.assignedStaffName.trim()) staffSet.add(s.assignedStaffName.trim());
    }
    return {
      totalStudents: students.length,
      activeStudents: active,
      inactiveStudents: students.length - active,
      newlyEnrolledStudents: 0,
      locationCounts: Array.from(locMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count),
      staffList: Array.from(staffSet).sort(),
    };
  }, [stats, students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.employeeCode.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.mobileNumber.toLowerCase().includes(q) ||
        s.aadhaarNumber.toLowerCase().includes(q) ||
        s.panNumber.toLowerCase().includes(q) ||
        s.abcId.toLowerCase().includes(q) ||
        s.assignedStaffName.toLowerCase().includes(q);

      const effectiveLocation = s.location.trim() || 'Unspecified';
      const matchesLocation = locationFilter === 'all' || effectiveLocation === locationFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
      const matchesStaff = staffFilter === 'all' || s.assignedStaffName.trim() === staffFilter;

      return matchesQuery && matchesLocation && matchesStatus && matchesGender && matchesStaff;
    });
  }, [students, searchQuery, locationFilter, statusFilter, genderFilter, staffFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationFilter, statusFilter, genderFilter, staffFilter, pageSize]);

  const paginatedStudents = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safePage, pageSize]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    locationFilter !== 'all' ||
    statusFilter !== 'all' ||
    genderFilter !== 'all' ||
    staffFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setStatusFilter('all');
    setGenderFilter('all');
    setStaffFilter('all');
  };

  const handleSaveStudent = async (
    payload: Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const updated = await api.updateEnrolledStudent(editingId, payload);
      await onRefresh();
      onNotifySuccess(`Updated student profile for "${updated.studentName}" (${updated.employeeCode}).`);
    } else {
      const created = await api.createEnrolledStudent(payload);
      await onRefresh();
      onNotifySuccess(`Added student "${created.studentName}" (${created.employeeCode}) to database.`);
    }
  };

  const handleToggleStatus = async (student: EnrolledStudent) => {
    try {
      const updated = await api.toggleEnrolledStudentStatus(student.id);
      if (viewingStudent?.id === updated.id) {
        setViewingStudent(updated);
      }
      await onRefresh();
      onNotifySuccess(`${updated.studentName} marked as ${updated.status}.`);
    } catch (err) {
      onNotifyError(err instanceof Error ? err.message : 'Failed to toggle student status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteEnrolledStudent(deletingTarget.id);
      const deletedName = deletingTarget.studentName;
      setDeletingTarget(null);
      await onRefresh();
      onNotifySuccess(`Permanently deleted student record for "${deletedName}".`);
    } catch (err) {
      onNotifyError(err instanceof Error ? err.message : 'Failed to delete student record.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Database-Computed Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`text-left bg-white p-4 rounded-xl border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'all' ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{computedStats.totalStudents}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Live SQLite records</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Active' ? 'all' : 'Active')}
          className={`text-left bg-white p-4 rounded-xl border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'Active'
              ? 'border-emerald-400 ring-1 ring-emerald-200'
              : 'border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Students</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{computedStats.activeStudents}</div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Click to filter Active</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Inactive' ? 'all' : 'Inactive')}
          className={`text-left bg-white p-4 rounded-xl border transition-all shadow-xs cursor-pointer ${
            statusFilter === 'Inactive'
              ? 'border-rose-400 ring-1 ring-rose-200'
              : 'border-rose-100 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Inactive Students</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{computedStats.inactiveStudents}</div>
          <p className="text-[11px] text-rose-600 mt-0.5">Click to filter Inactive</p>
        </button>

        <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">Newly Enrolled</span>
            <Sparkles className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-800 mt-1">{computedStats.newlyEnrolledStudents}</div>
          <p className="text-[11px] text-cyan-600 mt-0.5">Registered in last 30 days</p>
        </div>
      </div>

      {/* Location-Wise Students Breakdown Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-cyan-700" />
            <span>Location-wise Students ({computedStats.locationCounts.length} locations)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Student</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel / CSV</span>
            </button>

            <button
              type="button"
              disabled={filteredStudents.length === 0}
              onClick={() => exportStudentsToExcel(filteredStudents)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              title="Export filtered rows to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              disabled={filteredStudents.length === 0}
              onClick={() => exportStudentsToCSV(filteredStudents)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              title="Export filtered rows to CSV"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {computedStats.locationCounts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLocationFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                locationFilter === 'all'
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Locations ({computedStats.totalStudents})
            </button>
            {computedStats.locationCounts.map((loc) => (
              <button
                key={loc.location}
                type="button"
                onClick={() => setLocationFilter(locationFilter === loc.location ? 'all' : loc.location)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  locationFilter === loc.location
                    ? 'bg-cyan-700 text-white border-cyan-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {loc.location} <span className="font-mono ml-1 opacity-80">({loc.count})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Location counts will calculate automatically from imported or manually added students.
          </p>
        )}
      </div>

      {/* Empty Dataset Quick Import Callout when 0 records */}
      {students.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-display text-blue-950">
              Ready for Your Student Enrollment Dataset
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              No placeholder Aadhaar, PAN, or personal student records have been fabricated. Upload your Excel
              (.xlsx / .xls) or CSV file to permanently import all 17 student fields into the database, or add students
              individually.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadSampleStudentTemplate('xlsx')}
              className="px-3.5 py-2 text-xs font-bold text-blue-950 bg-white border border-blue-300 hover:bg-blue-50 rounded-xl cursor-pointer"
            >
              Download Sample Excel
            </button>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
            >
              Upload Excel / CSV Now
            </button>
          </div>
        </div>
      )}

      {/* Search & Multi-Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Search &amp; Filter Students</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-semibold text-blue-900 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, employee code, Aadhaar, PAN, mobile, email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
          >
            <option value="all">Location: All</option>
            {computedStats.locationCounts.map((loc) => (
              <option key={loc.location} value={loc.location}>
                {loc.location} ({loc.count})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Active' | 'Inactive')}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
          >
            <option value="all">Status: All</option>
            <option value="Active">Active Only ({computedStats.activeStudents})</option>
            <option value="Inactive">Inactive Only ({computedStats.inactiveStudents})</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
            >
              <option value="all">Gender: All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
            >
              <option value="all">Staff: All</option>
              {computedStats.staffList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Paginated Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-5">Student Name</th>
                <th className="py-3.5 px-4">Employee Code</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      {students.length === 0
                        ? 'No students enrolled in the directory yet.'
                        : 'No student records match your current search or filters.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {students.length === 0
                        ? 'Click "Add New Student" or "Import Excel / CSV" to populate the database.'
                        : 'Try clearing one or more filter dropdowns.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => setViewingStudent(s)}
                        className="font-bold text-slate-900 hover:text-blue-900 text-left cursor-pointer"
                      >
                        {s.studentName}
                      </button>
                      {s.assignedStaffName && (
                        <div className="text-[11px] text-slate-400 mt-0.5">Staff: {s.assignedStaffName}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        {s.employeeCode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">{s.location || '—'}</td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {s.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{s.email}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {s.mobileNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span>{s.mobileNumber}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{s.gender || '—'}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {s.registrationDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{s.registrationDate}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(s)}
                        title="Click to toggle Active / Inactive"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {s.status === 'Active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{s.status}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingStudent(s)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                          title="View Complete Student Profile (17 Fields)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(s);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Student Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(s)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            s.status === 'Active'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={s.status === 'Active' ? 'Deactivate Student' : 'Activate Student'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTarget(s)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Student"
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

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing{' '}
              <strong>
                {filteredStudents.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredStudents.length)}
              </strong>{' '}
              of <strong>{filteredStudents.length}</strong> filtered ({students.length} total)
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded bg-white text-xs outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="font-mono font-semibold px-2">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EnrolledStudentFormModal
        isOpen={isFormOpen}
        editingStudent={editingStudent}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
      />

      <EnrolledStudentProfileModal
        student={viewingStudent}
        onClose={() => setViewingStudent(null)}
        onEdit={(student) => {
          setEditingStudent(student);
          setIsFormOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      <BulkStudentImportModal
        isOpen={isImportOpen}
        existingStudents={students}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={async (importedCount, skippedCount) => {
          await onRefresh();
          if (importedCount > 0) {
            onNotifySuccess(
              `Bulk import completed: ${importedCount} student(s) added${
                skippedCount > 0 ? ` (${skippedCount} duplicate(s) skipped)` : ''
              }.`
            );
          }
        }}
      />

      {/* Delete Confirmation Modal (avoids window.confirm inside iframe) */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Delete Student Record?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently remove <strong>{deletingTarget.studentName}</strong> (
                  <span className="font-mono">{deletingTarget.employeeCode}</span>) from the database? This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
