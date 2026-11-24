import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FileText, Video, Download, ExternalLink, Search, Link as LinkIcon } from 'lucide-react';

export const StudentResources: React.FC = () => {
  const { currentUser } = useAuth();
  const { studentCourses: enrolledCourses, studentResources: allResources } = useData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  if (!currentUser) return null;

  const filtered = allResources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || r.resourceType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Authorized Study Materials & Technical Library
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated library of PDFs, reference handbooks, and video lectures across your enrolled courses.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
          {filtered.length} accessible file(s)
        </span>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents, manuals, lecture topics..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF Documents Only</option>
            <option value="youtube_video">Video Demonstrations</option>
            <option value="external_link">External Links</option>
          </select>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No study materials found matching your search.</div>
        ) : (
          filtered.map((item) => {
            const parentCourse = enrolledCourses.find((c) => c.id === item.courseId);

            return (
              <div
                key={item.id}
                className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.resourceType === 'pdf' || item.resourceType === 'document'
                        ? 'bg-rose-100 text-rose-700'
                        : item.resourceType === 'external_link'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.resourceType === 'pdf' || item.resourceType === 'document' ? (
                      <FileText className="w-5 h-5" />
                    ) : item.resourceType === 'external_link' ? (
                      <LinkIcon className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {parentCourse?.title || 'Course'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h3>
                    {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {item.fileName || 'Asset'}{' '}
                      {item.fileSizeBytes && `· ${(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                    </div>
                  </div>
                </div>

                <a
                  href={item.urlOrPath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                >
                  {item.resourceType === 'pdf' || item.resourceType === 'document' ? (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Resource</span>
                    </>
                  )}
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
