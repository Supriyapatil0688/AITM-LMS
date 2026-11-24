import React, { useState, useEffect } from 'react';
import type { EnrolledStudent, EnrolledStudentStatus, StudentGender } from '../../types';
import {
  X,
  AlertCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  CreditCard,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Edit3,
  Power,
} from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  editingStudent: EnrolledStudent | null;
  onClose: () => void;
  onSave: (
    payload: Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => Promise<void>;
}

const EMPTY_FORM: Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'> = {
  location: '',
  employeeCode: '',
  studentName: '',
  motherName: '',
  fatherName: '',
  dateOfBirth: '',
  email: '',
  mobileNumber: '',
  gender: 'Male',
  aadhaarNumber: '',
  permanentAddress: '',
  panNumber: '',
  status: 'Active',
  remarks: '',
  registrationDate: new Date().toISOString().split('T')[0],
  assignedStaffName: '',
  abcId: '',
};

export const EnrolledStudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  editingStudent,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Omit<EnrolledStudent, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingStudent) {
      setForm({
        location: editingStudent.location || '',
        employeeCode: editingStudent.employeeCode || '',
        studentName: editingStudent.studentName || '',
        motherName: editingStudent.motherName || '',
        fatherName: editingStudent.fatherName || '',
        dateOfBirth: editingStudent.dateOfBirth || '',
        email: editingStudent.email || '',
        mobileNumber: editingStudent.mobileNumber || '',
        gender: editingStudent.gender || '',
        aadhaarNumber: editingStudent.aadhaarNumber || '',
        permanentAddress: editingStudent.permanentAddress || '',
        panNumber: editingStudent.panNumber || '',
        status: editingStudent.status || 'Active',
        remarks: editingStudent.remarks || '',
        registrationDate: editingStudent.registrationDate || new Date().toISOString().split('T')[0],
        assignedStaffName: editingStudent.assignedStaffName || '',
        abcId: editingStudent.abcId || '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        registrationDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, editingStudent]);

  if (!isOpen) return null;

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const empCode = form.employeeCode.trim();
    const studentName = form.studentName.trim();
    const location = form.location.trim();
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobileNumber.trim();
    const aadhaarClean = form.aadhaarNumber.trim().replace(/[\s-]/g, '');
    const panClean = form.panNumber.trim().toUpperCase();

    if (!empCode) {
      setError('Employee Code is required.');
      return;
    }
    if (!studentName) {
      setError('Student Name is required.');
      return;
    }
    if (!location) {
      setError('Location is required.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid Email ID.');
      return;
    }
    const mobileDigits = mobile.replace(/[\s+\-()]/g, '');
    if (!mobile || !/^\d{10,15}$/.test(mobileDigits)) {
      setError('Please enter a valid Mobile Number (10 to 15 digits).');
      return;
    }
    if (!form.gender) {
      setError('Please select a Gender.');
      return;
    }
    if (!form.registrationDate) {
      setError('Registration Date is required.');
      return;
    }
    if (aadhaarClean && !/^\d{12}$/.test(aadhaarClean)) {
      setError('Aadhaar ID Number must be exactly 12 digits (stored as text).');
      return;
    }
    if (panClean && !/^[A-Z]{5}\d{4}[A-Z]$/.test(panClean)) {
      setError('PAN ID Number must match standard 10-character format (e.g. ABCDE1234F).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          ...form,
          location,
          employeeCode: empCode,
          studentName,
          motherName: form.motherName.trim(),
          fatherName: form.fatherName.trim(),
          email,
          mobileNumber: mobile,
          aadhaarNumber: aadhaarClean,
          permanentAddress: form.permanentAddress.trim(),
          panNumber: panClean,
          remarks: form.remarks.trim(),
          assignedStaffName: form.assignedStaffName.trim(),
          abcId: form.abcId.trim(),
        },
        editingStudent?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
              AITM Student Enrollment Directory
            </span>
            <h3 className="text-lg font-bold font-display text-slate-900">
              {editingStudent ? `Edit Student · ${editingStudent.studentName}` : 'Add New Student'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={validateAndSubmit} className="overflow-y-auto p-6 space-y-6 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identity & Family */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-700" />
              <span>Personal Identity & Location</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.employeeCode}
                  onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                  placeholder="e.g. AITM-EMP-1001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="Full legal name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Thane West"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Father&apos;s Name</label>
                <input
                  type="text"
                  value={form.fatherName}
                  onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  placeholder="Father's full name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mother&apos;s Name</label>
                <input
                  type="text"
                  value={form.motherName}
                  onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                  placeholder="Mother's full name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as StudentGender })}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Permanent Address */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-700" />
              <span>Contact Information & Permanent Address</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  placeholder="9820012345"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Permanent Address</label>
                <textarea
                  rows={2}
                  value={form.permanentAddress}
                  onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                  placeholder="Complete residential permanent address with PIN code"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: KYC & Academic IDs */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-700" />
              <span>Government KYC & Academic Bank of Credits (Stored Strictly as Text)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Aadhaar ID Number (12 Digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={form.aadhaarNumber}
                  onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                  placeholder="234567890123"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PAN ID Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ABC ID</label>
                <input
                  type="text"
                  value={form.abcId}
                  onChange={(e) => setForm({ ...form, abcId: e.target.value })}
                  placeholder="12-digit Academic Bank ID"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Registration, Assigned Staff & Remarks */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-700" />
              <span>Enrollment Status & Staff Assignment</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Registration Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.registrationDate}
                  onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Staff Name</label>
                <input
                  type="text"
                  value={form.assignedStaffName}
                  onChange={(e) => setForm({ ...form, assignedStaffName: e.target.value })}
                  placeholder="Coordinator / Counselor name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Active / Inactive Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EnrolledStudentStatus })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Administrative remarks or verification notes"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface StudentProfileModalProps {
  student: EnrolledStudent | null;
  onClose: () => void;
  onEdit: (student: EnrolledStudent) => void;
  onToggleStatus: (student: EnrolledStudent) => Promise<void>;
}

export const EnrolledStudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  if (!student) return null;

  const val = (s?: string) => (s && s.trim() !== '' ? s : '—');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-lg font-bold text-cyan-200 shrink-0">
              {student.studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 border border-white/20 text-yellow-300">
                  {student.employeeCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    student.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                  }`}
                >
                  {student.status === 'Active' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  <span>{student.status}</span>
                </span>
              </div>
              <h3 className="text-xl font-bold font-display mt-1">{student.studentName}</h3>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{val(student.location)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 text-xs">
          {/* Personal & Family */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Father&apos;s Name</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{val(student.fatherName)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Mother&apos;s Name</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{val(student.motherName)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Date of Birth / Gender</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {val(student.dateOfBirth)} · {val(student.gender)}
              </span>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-700" />
              <span>Contact & Permanent Address</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Email ID</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{val(student.email)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile Number</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">{val(student.mobileNumber)}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Permanent Address</span>
                <span className="font-medium text-slate-800 mt-0.5 block leading-relaxed">
                  {val(student.permanentAddress)}
                </span>
              </div>
            </div>
          </div>

          {/* Statutory KYC IDs */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/70 space-y-3">
            <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
              <span>Verification & Statutory Identifiers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Aadhaar ID Number</span>
                <span className="font-mono font-bold text-blue-950 text-sm mt-0.5 block tracking-wide">
                  {val(student.aadhaarNumber)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">PAN ID Number</span>
                <span className="font-mono font-bold text-blue-950 text-sm mt-0.5 block">
                  {val(student.panNumber)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">ABC ID</span>
                <span className="font-mono font-bold text-blue-950 text-sm mt-0.5 block">
                  {val(student.abcId)}
                </span>
              </div>
            </div>
          </div>

          {/* Registration & Staff */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Registration Date</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{val(student.registrationDate)}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Staff Name</span>
                <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{val(student.assignedStaffName)}</span>
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Remarks</span>
                <span className="font-medium text-slate-700 mt-0.5 block">{val(student.remarks)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void onToggleStatus(student)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
              student.status === 'Active'
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{student.status === 'Active' ? 'Deactivate Student' : 'Activate Student'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Student Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
