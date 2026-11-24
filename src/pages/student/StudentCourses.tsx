import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BookOpen, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const StudentCourses: React.FC = () => {
  const { currentUser } = useAuth();
  const { studentCourses: enrolledCourses, studentResources } = useData();
  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            My Enrolled Courses & Technical Specializations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Displaying programs explicitly authorized and assigned to Student ID:{' '}
            <strong className="text-slate-700 font-mono">{currentUser.studentId}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Access Verified: {enrolledCourses.length} Program(s)</span>
        </div>
      </div>

      {/* Courses List */}
      {enrolledCourses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 font-display">No Active Course Enrollments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your student account is active, but you have not yet been assigned to a technical course batch. Please
            contact the AITM training director or batch coordinator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => {
            const resourcesCount = studentResources.filter((r) => r.courseId === course.id).length;

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
                    <div className="absolute top-3 left-3 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {course.courseType}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="font-semibold text-blue-900">{course.category}</span>
                      <span className="font-mono">{course.duration}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display line-clamp-1">{course.title}</h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{course.description}</p>

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      <div>
                        Instructor: <strong className="text-slate-800">{course.instructorName}</strong>
                      </div>
                      <div>
                        Batch: <span className="font-mono text-slate-700">{course.batch}</span>
                      </div>
                      <div className="text-[11px] text-blue-900 font-medium">
                        {resourcesCount} study resource(s) unlocked
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorized</span>
                  </span>

                  <Link
                    to={`/student/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
                  >
                    <span>View Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
