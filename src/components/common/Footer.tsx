import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Footer: React.FC = () => {
  const { settings, publishedCourses } = useData();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* Top credentials banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{settings.isoCertification}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{settings.nsdcAffiliation}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>National Apprenticeship (NAPS & NATS) Facilitator</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-display text-lg">
                {settings.shortName}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {settings.instituteName}
                </h3>
                <p className="text-xs text-slate-400">
                  Excellence in Vocational & Apprenticeship Training
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {settings.tagline}
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-300">Reg. Office:</strong> Thane West, Maharashtra, India</p>
              <p><strong className="text-slate-300">Affiliations:</strong> {settings.nsdcAffiliation}</p>
            </div>
          </div>

          {/* Programs Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Programs</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/#programs" className="hover:text-white transition-colors">NAPS Apprenticeship</a></li>
              <li><a href="/#programs" className="hover:text-white transition-colors">NATS Engineering Training</a></li>
              <li><a href="/#programs" className="hover:text-white transition-colors">Learn & Earn Degree</a></li>
              {publishedCourses.slice(0, 3).map((course) => (
                <li key={course.id}>
                  <a href="/#courses" className="hover:text-white transition-colors line-clamp-1">
                    {course.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Portals</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/login?tab=student" className="hover:text-white transition-colors">Student Login</Link></li>
              <li><Link to="/login?tab=admin" className="hover:text-white transition-colors">Faculty & Admin Portal</Link></li>
              <li><a href="/#placements" className="hover:text-white transition-colors">Placement Cell</a></li>
              <li><a href="/#courses" className="hover:text-white transition-colors">Course Catalog</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">Admissions Inquiry</a></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contact Institute</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span className="text-xs leading-relaxed">
                  {settings.headOfficeAddress}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`tel:${settings.phone}`} className="text-xs hover:text-white transition-colors font-mono">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`mailto:${settings.email}`} className="text-xs hover:text-white transition-colors">
                  {settings.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs">{settings.hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {settings.instituteName} ({settings.shortName}). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">
              Official Portal:{' '}
              <a href="https://abhinavinst.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                abhinavinst.com
              </a>
            </span>
            <span className="text-slate-400">Privacy Policy</span>
            <span className="text-slate-400">Terms of Training</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
