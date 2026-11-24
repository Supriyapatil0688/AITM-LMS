import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { generateEnrollmentPDFReport } from '../../lib/pdfReportGenerator';
import {
  Users,
  BookOpen,
  Layers,
  UserCheck,
  FileDown,
  Printer,
  PlusCircle,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AdminOverview: React.FC = () => {
  const { enrollmentDashboardStats, settings, studentEnrollmentRecords, activityLogs, wsConnected } = useData();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);

  const stats = enrollmentDashboardStats || {
    totalRegisteredStudents: 0,
    totalEnrolledStudents: 0,
    totalAvailableCourses: 0,
    totalActiveBatches: 0,
    pendingStudents: 0,
    completedStudents: 0,
    courseReports: [],
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfSuccessMessage(null);
    setPdfErrorMessage(null);
    try {
      await generateEnrollmentPDFReport({
        settings,
        stats,
        enrollments: studentEnrollmentRecords,
      });
      setPdfSuccessMessage('Official Course-Wise Enrollment PDF Report generated and downloaded successfully.');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setPdfErrorMessage(err instanceof Error ? err.message : 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const chartData = stats.courseReports.map((item) => ({
    name: item.courseName.length > 20 ? item.courseName.substring(0, 18) + '...' : item.courseName,
    fullTitle: item.courseName,
    enrolled: item.totalEnrolledStudents,
    pending: item.pendingStudents,
    available: item.availableSeats,
  }));

  return (
    <div className="space-y-8">
      {/* PRINT-ONLY OFFICIAL HEADER */}
      <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-4">
          <img
            src={settings.logoUrl || '/assets/aistudio/image_e53c2b5b.png'}
            alt="AITM Logo"
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold font-display text-blue-950 uppercase tracking-tight">
              {settings.instituteName}
            </h1>
            <p className="text-xs text-slate-600">
              ॥ तमसो मां ज्योतिर्गमय ॥ · {settings.isoCertification} · {settings.nsdcAffiliation}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {settings.headOfficeAddress} | Tel: {settings.phone}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-900">
            OFFICIAL COURSE-WISE STUDENT ENROLLMENT REPORT
          </span>
          <span className="text-slate-600 font-mono">
            Date: {new Date().toLocaleDateString('en-IN')}{' '}
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Top Actions & Report Controls (Hidden in print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              {settings.shortName} Thane · Academic Session 2026-27
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{wsConnected ? 'SQLite Live Sync Active' : 'SQLite Connected'}</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 mt-1">
            Student Enrollment Dashboard & Course Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time enrollment counts and seat availability calculated directly from database records.
          </p>
        </div>

        {/* Buttons: Download PDF Report & Print Report */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Generate official PDF report containing institute logo, statistics, and course breakdown"
          >
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span>{isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Open browser print dialog for printing or saving clean PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          <Link
            to="/admin/students"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-blue-950 bg-yellow-400 hover:bg-yellow-300 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Enroll Student</span>
          </Link>
        </div>
      </div>

      {pdfSuccessMessage && (
        <div className="no-print p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pdfSuccessMessage}</span>
        </div>
      )}

      {pdfErrorMessage && (
        <div className="no-print p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{pdfErrorMessage}</span>
        </div>
      )}

      {/* 4 Required Statistical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Total Registered Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {stats.totalRegisteredStudents}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-600">{stats.totalEnrolledStudents} Enrolled</span>
            <span>·</span>
            <span className="font-semibold text-amber-600">{stats.pendingStudents} Pending</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Total Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-700">
            {stats.totalEnrolledStudents}
          </div>
          <div className="text-[11px] text-slate-500">Active verified student admissions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Total Available Courses</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-cyan-800">
            {stats.totalAvailableCourses}
          </div>
          <div className="text-[11px] text-slate-500">Active vocational & apprenticeship tracks</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Total Active Batches</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-700">
            {stats.totalActiveBatches}
          </div>
          <div className="text-[11px] text-slate-500">Concurrent training cohorts</div>
        </div>
      </div>

      {/* Required Course-Wise Student Enrollment Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-break-inside-avoid">
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Course-Wise Student Enrollment Report
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates automatically in real time as students enroll or their enrollment status changes.
            </p>
          </div>

          <div className="no-print flex items-center gap-2 text-xs">
            <span className="text-slate-500">Auto-calculated from SQLite:</span>
            <span className="font-mono font-bold text-blue-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {stats.totalRegisteredStudents} total records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-6 text-center w-20">Sr. No.</th>
                <th className="py-3.5 px-6">Course Name</th>
                <th className="py-3.5 px-6 text-center">Total Enrolled Students</th>
                <th className="py-3.5 px-6 text-center">Pending Students</th>
                <th className="py-3.5 px-6 text-center">Available Seats</th>
                <th className="py-3.5 px-6 no-print text-right">Program Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stats.courseReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No course records available in the database.
                  </td>
                </tr>
              ) : (
                stats.courseReports.map((report) => (
                  <tr key={report.courseId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 text-center font-mono font-semibold text-slate-600">
                      {report.srNo}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{report.courseName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Duration: {report.duration}</span>
                        <span>·</span>
                        <span className="font-medium text-cyan-800">Fees: {report.fees}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {report.totalEnrolledStudents}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono ${
                          report.pendingStudents > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {report.pendingStudents}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-xs font-extrabold font-mono px-3 py-1 rounded-full ${
                            report.availableSeats < 10
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                          }`}
                        >
                          {report.availableSeats} Seats
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          of {report.totalSeats} total
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 no-print text-right">
                      <Link
                        to={`/admin/students?course=${report.courseId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:underline"
                      >
                        <span>View Students</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs text-slate-900">
                <td className="py-3 px-6 text-center">Total</td>
                <td className="py-3 px-6">Across All {stats.courseReports.length} Available Courses</td>
                <td className="py-3 px-6 text-center font-mono text-emerald-700 text-sm">
                  {stats.totalEnrolledStudents}
                </td>
                <td className="py-3 px-6 text-center font-mono text-amber-700 text-sm">
                  {stats.pendingStudents}
                </td>
                <td className="py-3 px-6 text-center font-mono text-cyan-800 text-sm">
                  {stats.courseReports.reduce((acc, c) => acc + c.availableSeats, 0)} Seats
                </td>
                <td className="py-3 px-6 no-print text-right text-[11px] text-slate-500 font-normal">
                  Live Synced
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Visual Analytics Chart & Live Audit Log */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">
                Capacity & Enrollment Visualization
              </h3>
              <p className="text-xs text-slate-500">
                Comparison of active enrolled students, pending verifications, and available seats per program.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Dynamic Recharts View</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  angle={-10}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    `${val} students/seats`,
                    name === 'enrolled' ? 'Enrolled' : name === 'pending' ? 'Pending' : 'Available Seats',
                  ]}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                <Bar name="Enrolled" dataKey="enrolled" fill="#0B4A9C" radius={[4, 4, 0, 0]} />
                <Bar name="Pending" dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar name="Available Seats" dataKey="available" fill="#00A3E0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Audit Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-900" />
              <span>Recent Portal Activity</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">LIVE</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activityLogs.slice(0, 12).map((log) => (
              <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                <div className="font-semibold text-slate-800">{log.action}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>{log.actorName}</span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SIGNATURE BLOCK */}
      <div className="print-only mt-12 pt-6 border-t border-slate-300">
        <div className="flex justify-between items-end">
          <div className="text-xs text-slate-600">
            <p>Certified that the above student enrollment records are verified against institute databases.</p>
            <p className="mt-1 font-mono text-[10px]">{settings.shortName} Thane Registration & Admissions Control</p>
          </div>
          <div className="text-right">
            <div className="w-48 border-b border-slate-600 mb-1"></div>
            <p className="text-xs font-bold text-slate-900">Training Director / Registrar</p>
            <p className="text-[10px] text-slate-500">{settings.instituteName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
