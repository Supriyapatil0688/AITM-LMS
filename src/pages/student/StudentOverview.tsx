import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  BookOpen,
  Video,
  FileText,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const StudentOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    studentCourses: enrolledCourses,
    studentMeetings: meetings,
    studentAnnouncements: announcements,
    studentResources,
    settings,
  } = useData();

  if (!currentUser) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Academic Term 2026-27 · Registered Trainee
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Welcome, {currentUser.fullName}!</h2>
            <p className="text-xs sm:text-sm text-blue-200/90 max-w-xl leading-relaxed">
              You are enrolled under the official {settings.shortName} Training & Apprenticeship Framework. Access your
              authorized technical study materials, recorded lectures, and live sessions below.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 text-xs space-y-1.5 shrink-0 sm:text-right">
            <div>
              Student ID: <strong className="font-mono text-white text-sm">{currentUser.studentId}</strong>
            </div>
            <div>
              Batch: <span className="text-blue-200">{currentUser.batch || 'Batch 2026'}</span>
            </div>
            <div>
              Status: <span className="text-emerald-400 font-semibold uppercase">{currentUser.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Notice Banner if configured by Admin */}
      {settings.portalNotice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900">
          <strong>Institute Notice:</strong> {settings.portalNotice}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Enrolled Courses</span>
            <BookOpen className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">{enrolledCourses.length}</div>
          <div className="text-xs text-slate-500">Explicitly assigned programs</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Upcoming Sessions</span>
            <Video className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">{meetings.length}</div>
          <div className="text-xs text-slate-500">Virtual live classrooms</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Study Resources</span>
            <FileText className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">{studentResources.length}</div>
          <div className="text-xs text-slate-500">Authorized PDFs & videos</div>
        </div>
      </div>

      {/* My Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-display text-slate-900">
            My Authorized Courses ({enrolledCourses.length})
          </h3>
          <Link to="/student/courses" className="text-xs font-semibold text-blue-900 hover:underline">
            View All Courses →
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
            <p className="text-xs text-slate-500">
              No courses have been assigned to your account yet. Please contact your batch coordinator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative h-40 w-full bg-slate-100">
                    <img
                      src={course.thumbnailUrl || '/src/assets/images/aitm_industrial_training_1792739247502.jpg'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {course.courseType}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="font-semibold text-blue-900">{course.category}</span>
                      <span className="font-mono">{course.duration}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 font-display line-clamp-1">{course.title}</h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{course.description}</p>

                    <div className="text-[11px] text-slate-500 pt-1">
                      Instructor: <strong className="text-slate-800">{course.instructorName}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enrolled</span>
                  </span>
                  <Link
                    to={`/student/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
                  >
                    <span>Open Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Upcoming Live Sessions & Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900">Upcoming Live Virtual Classes</h3>
            <Link to="/student/schedule" className="text-xs text-blue-900 font-semibold hover:underline">
              View Schedule
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {meetings.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No scheduled live sessions for your courses right now.
              </p>
            ) : (
              meetings.slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-blue-900">
                      {meeting.courseTitle || 'All Institute Students'}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{meeting.title}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="font-mono">
                        {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>·</span>
                      <span>Host: {meeting.hostName}</span>
                    </div>
                  </div>

                  <a
                    href={meeting.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shrink-0 shadow-xs"
                  >
                    <span>Join Class</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-900">Circulars & Announcements</h3>
            <span className="text-xs text-slate-500 font-mono">Targeted Updates</span>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active announcements for your batch.</p>
            ) : (
              announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ann.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ann.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    {ann.courseTitle ? `Course: ${ann.courseTitle}` : 'Institute-Wide'} ·{' '}
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
