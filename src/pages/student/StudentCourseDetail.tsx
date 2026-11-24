import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  BookOpen,
  FileText,
  Video,
  Calendar,
  Bell,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Download,
  ExternalLink,
  Play,
} from 'lucide-react';

export const StudentCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser } = useAuth();
  const {
    studentCourses,
    studentResources,
    studentMeetings,
    studentAnnouncements,
    isLoadingPortal,
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'pdfs' | 'videos' | 'meetings' | 'announcements'>('overview');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  if (!courseId) return null;

  const course = studentCourses.find((c) => c.id === courseId);

  if (isLoadingPortal && !course) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Server-enforced course isolation check
  if (!course) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            HTTP 403 · FORBIDDEN ACCESS
          </span>
          <h2 className="text-2xl font-bold font-display text-slate-900 mt-2">Course Access Not Permitted</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            You are authenticated as <strong className="text-slate-900">{currentUser?.fullName}</strong> (
            {currentUser?.studentId}), but you have NOT been assigned to this course.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left max-w-md mx-auto space-y-1">
            <div className="font-semibold text-slate-800">Enforcement Policy:</div>
            <p>
              · Study materials, PDFs, YouTube videos, and Google Meet rooms for this program are strictly restricted to
              enrolled students.
            </p>
            <p>· Please contact your institute training coordinator to request course assignment.</p>
          </div>
        </div>

        <div className="pt-4">
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Enrolled Courses</span>
          </Link>
        </div>
      </div>
    );
  }

  const resources = studentResources.filter((r) => r.courseId === courseId);
  const pdfResources = resources.filter((r) => r.resourceType === 'pdf' || r.resourceType === 'document');
  const videoResources = resources.filter(
    (r) => r.resourceType === 'youtube_video' || r.resourceType === 'lecture_recording'
  );
  const courseMeetings = studentMeetings.filter((m) => m.courseId === courseId);
  const courseAnnouncements = studentAnnouncements.filter((a) => a.courseId === courseId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Enrolled Courses</span>
        </Link>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {course.courseType}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{course.category}</span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-600">{course.duration}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">{course.title}</h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">{course.description}</p>

            <div className="text-xs text-slate-500 pt-1 flex flex-wrap items-center gap-4">
              <span>
                Lead Trainer: <strong className="text-slate-800">{course.instructorName}</strong>
              </span>
              <span>
                Batch: <strong className="text-slate-800 font-mono">{course.batch}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Access Unlocked</span>
            </div>
            <div className="text-[11px] text-emerald-700">
              {resources.length} Materials · {courseMeetings.length} Live Classes
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white p-2 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Syllabus & Modules</span>
        </button>

        <button
          onClick={() => setActiveTab('pdfs')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'pdfs' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>PDF Notes & Handouts ({pdfResources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'videos' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Lectures ({videoResources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'meetings' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Live Classes ({courseMeetings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'announcements' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements ({courseAnnouncements.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-bold font-display text-slate-900">
              Curriculum & Technical Competency Blueprint
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This curriculum follows the National Apprenticeship standard. Upon mastering the modules below and
              completing the factory apprenticeship phase, trainees receive government certification.
            </p>
          </div>

          <div className="space-y-3">
            {course.syllabus &&
              course.syllabus.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item}</h4>
                    <p className="text-slate-500 mt-0.5">
                      Includes shop-floor practicals, machine setup, safety compliance, and evaluation.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 2: PDF NOTES */}
      {activeTab === 'pdfs' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Authorized Technical Notes & Handbooks
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Protected PDF documents provided by course faculty. Click to read or download.
            </p>
          </div>

          {pdfResources.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No PDF files uploaded for this course yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pdfResources.map((pdf) => (
                <div key={pdf.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{pdf.title}</div>
                      {pdf.description && <p className="text-xs text-slate-500 mt-0.5">{pdf.description}</p>}
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        {pdf.fileName || 'handbook.pdf'}{' '}
                        {pdf.fileSizeBytes && `· ${(pdf.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                    </div>
                  </div>

                  <a
                    href={pdf.urlOrPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VIDEO LECTURES */}
      {activeTab === 'videos' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">Recorded Lectures & Video Demos</h3>
            <p className="text-xs text-slate-500 mt-1">Practical machine setups and recorded classroom sessions.</p>
          </div>

          {selectedVideo && (
            <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400">Embedded Video Player</span>
                <button onClick={() => setSelectedVideo(null)} className="text-xs text-slate-400 hover:text-white">
                  Close Player ✕
                </button>
              </div>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                <iframe
                  src={
                    selectedVideo.includes('youtube.com/watch?v=')
                      ? selectedVideo.replace('watch?v=', 'embed/')
                      : selectedVideo
                  }
                  title="Course Video Demonstration"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {videoResources.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No recorded lectures added yet for this course.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoResources.map((vid) => (
                <div
                  key={vid.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                        <Play className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{vid.title}</span>
                    </div>
                    {vid.durationMinutes && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {vid.durationMinutes}m
                      </span>
                    )}
                  </div>
                  {vid.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{vid.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedVideo(vid.urlOrPath)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Watch in Portal</span>
                    </button>
                    <a
                      href={vid.urlOrPath}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open External</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIVE CLASSES & MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Live Interactive Google Meet / Zoom Classes
            </h3>
            <p className="text-xs text-slate-500 mt-1">Authorized only for students enrolled in {course.title}.</p>
          </div>

          {courseMeetings.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No upcoming live sessions currently scheduled for this course.
            </p>
          ) : (
            <div className="space-y-4">
              {courseMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">{m.platform}</span>
                      <span className="font-mono text-slate-500">{m.durationMinutes} mins</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Time: <strong className="text-slate-800">{new Date(m.scheduledAt).toLocaleString()}</strong> · Host:{' '}
                      {m.hostName}
                    </div>
                  </div>

                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs shrink-0"
                  >
                    <span>Join Class</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold font-display text-slate-900">Course Announcements & Exam Notices</h3>

          {courseAnnouncements.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No specific circulars posted for this course.</p>
          ) : (
            <div className="space-y-3">
              {courseAnnouncements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ann.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
