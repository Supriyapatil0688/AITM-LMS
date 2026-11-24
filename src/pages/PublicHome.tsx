import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { api } from '../lib/api';
import {
  Award,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Wrench,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  BookOpen,
  Send,
  AlertCircle,
} from 'lucide-react';

interface PublicHomeProps {
  onOpenApplyModal: (courseId?: string) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({ onOpenApplyModal }) => {
  const { settings, publishedCourses: courses, publicMeetings: meetings, isLoadingPublic } = useData();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const categories = ['all', ...Array.from(new Set(courses.map((c) => c.category)))];

  const filteredCourses =
    activeCategory === 'all' ? courses : courses.filter((c) => c.category === activeCategory);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError(null);
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) return;
    setInquirySubmitting(true);
    try {
      await api.submitInquiry(inquiryForm);
      setInquirySubmitted(true);
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Unable to send inquiry. Please try again.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-slate-950 text-white overflow-hidden py-16 lg:py-24 border-b border-slate-800">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={settings.heroImageUrl || '/src/assets/images/hero_aitm_campus_1792739247335.jpg'}
            alt="AITM Training Campus and Students"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-900/60 border border-blue-700/60 text-blue-200 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>{settings.heroBadge || `${settings.isoCertification} · ${settings.nsdcAffiliation}`}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
                {settings.heroHeadline || 'Empowering Youth with Industry Apprenticeships & Technical Skills'}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {settings.heroSubtitle ||
                  `${settings.instituteName} (${settings.shortName}) bridges the divide between corporate workforce demands and job-seeking candidates through NAPS, NATS, and YCMOU-affiliated Learn & Earn frameworks.`}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onOpenApplyModal()}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-md transition-all"
                >
                  <span>Apply for 2026 Batch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#courses"
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900/80 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Explore Courses</span>
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 text-xs">
                <div>
                  <div className="text-xl font-bold font-mono text-white">NAPS & NATS</div>
                  <div className="text-slate-400 mt-0.5">Govt Stipend Support</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">Learn & Earn</div>
                  <div className="text-slate-400 mt-0.5">YCMOU Degree Collab</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">{courses.length} Active</div>
                  <div className="text-slate-400 mt-0.5">Live Skill Tracks</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/80 shadow-2xl p-1.5">
                <img
                  src={settings.heroWorkshopImageUrl || '/src/assets/images/aitm_industrial_training_1792739247502.jpg'}
                  alt="AITM CNC Automation Workshop"
                  className="w-full h-80 object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="p-4 bg-slate-900/90 text-left">
                  <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
                    {settings.heroWorkshopLabel || 'Practical Training Center · Thane West'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {settings.heroWorkshopTitle || 'Haas CNC & Automation Precision Engineering Laboratory'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {settings.heroWorkshopDesc || 'Hands-on machine operations, G-code part programming, and PLC automation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ACCREDITATIONS STRIP */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 text-slate-600 text-xs font-medium">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-800" />
              <span>
                <strong>Quality Management:</strong> {settings.isoCertification}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-800" />
              <span>
                <strong>National Affiliations:</strong> {settings.nsdcAffiliation}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-800" />
              <span>
                <strong>Industry Integration:</strong> NAPS, NATS & YCMOU University Collaboration
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT AITM SECTION */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                About the Institute
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-slate-900 tracking-tight leading-tight">
                {settings.aboutTitle || 'Transforming Aspirations into Skilled Careers'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {settings.aboutDescription ||
                  'Abhinav Institute of Technology & Management (AITM) was founded to address one of India’s most critical industrial challenges: closing the talent gap between academic knowledge and actual shop-floor engineering requirements.'}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {settings.aboutSubDescription ||
                  'Headquartered in Thane, Maharashtra, with operations across western and northern industrial corridors, AITM works directly with industrial employers, government bodies, and universities to equip trainees with real mechanical, electrical, computing, and management capabilities.'}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong>Industry-Led Curriculum:</strong> Designed alongside manufacturing plant heads and IT architects.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong>Guaranteed Stipend Pathways:</strong> Candidates in NAPS & NATS programs receive monthly government & employer stipends.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong>Pan-India Footprint:</strong> Training centers and apprenticeship placement tie-ups in Maharashtra, Gujarat, and Delhi NCR.
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={settings.aboutImage1Url || '/src/assets/images/aitm_it_lab_1792739250007.jpg'}
                  alt="AITM IT Lab"
                  className="rounded-xl object-cover h-64 w-full shadow-md border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <img
                  src={settings.aboutImage2Url || '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg'}
                  alt="AITM Workplace Mentorship"
                  className="rounded-xl object-cover h-64 w-full shadow-md border border-slate-200 mt-6"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FLAGSHIP PROGRAMS & GOVERNMENT SCHEMES */}
      <section id="programs" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
              Core Training Frameworks
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Apprenticeship & Work-Integrated Education Schemes
            </h2>
            <p className="text-sm text-slate-600">
              Verified national skill models empowering candidates with on-the-job training, government certifications, and continuous stipends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">
                NAPS (National Apprenticeship Promotion Scheme)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A premier Government of India initiative promoting apprenticeship training. Open to candidates aged 14+ who have completed minimum 5th standard. Trainees obtain real factory floor skills accompanied by official monthly stipend support.
              </p>
              <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
                <li>· Direct shop-floor hands-on machine experience</li>
                <li>· Government & enterprise co-funded stipends</li>
                <li>· National Apprenticeship Certificate on completion</li>
              </ul>
              <button
                onClick={() => onOpenApplyModal()}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-900 hover:text-blue-700 pt-2"
              >
                <span>Apply for NAPS Scheme</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">
                NATS (National Apprenticeship Training Scheme)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tailored 1-year practical program for Engineering Graduates and Diploma holders. Bridges the technical knowledge gap with practical exposure in modern IT, manufacturing, and electrical infrastructure.
              </p>
              <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
                <li>· Open to fresh Diploma & B.E. / B.Tech graduates</li>
                <li>· Official corporate mentorship in corporate plants</li>
                <li>· Government-regulated monthly graduate stipend</li>
              </ul>
              <button
                onClick={() => onOpenApplyModal()}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-900 hover:text-blue-700 pt-2"
              >
                <span>Apply for NATS Scheme</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">
                Learn & Earn (YCMOU Collaboration)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Work-integrated degree and diploma program conducted under specific state Government Resolutions (GR) and university partnership. Students work in industrial setups while earning an accredited qualification.
              </p>
              <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
                <li>· Earn an academic degree while working full-time</li>
                <li>· Monthly stipend to fund academic and living expenses</li>
                <li>· B.Voc and D.Voc mechatronics & automotive tracks</li>
              </ul>
              <button
                onClick={() => onOpenApplyModal()}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-900 hover:text-blue-700 pt-2"
              >
                <span>Explore Learn & Earn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DYNAMIC COURSES & CATALOG (LIVE FROM DATABASE + REAL-TIME SYNC) */}
      <section id="courses" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                Academic & Vocational Programs
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight mt-1">
                Courses & Apprenticeship Tracks
              </h2>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-200/80 p-1.5 rounded-lg text-xs font-medium">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeCategory === cat
                      ? 'bg-blue-900 text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:text-blue-900'
                  }`}
                >
                  {cat === 'all' ? 'All Specializations' : cat}
                </button>
              ))}
            </div>
          </div>

          {isLoadingPublic ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
              No published courses found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={course.thumbnailUrl || '/src/assets/images/aitm_industrial_training_1792739247502.jpg'}
                        alt={course.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-blue-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                        {course.courseType}
                      </div>
                      {typeof course.availableSeats === 'number' && (
                        <div className="absolute top-3 right-3 bg-white/95 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                          {course.availableSeats} Seats Left
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{course.category}</span>
                        <span>·</span>
                        <span className="font-mono">{course.duration}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 font-display leading-snug">
                        {course.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      {course.syllabus && course.syllabus.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Core Modules Included:
                          </span>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {course.syllabus.slice(0, 3).map((mod, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-blue-900 font-bold">✓</span>
                                <span className="truncate">{mod}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-4 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span className="block font-medium text-slate-700">{course.instructorName}</span>
                      <span className="text-[10px]">{course.batch}</span>
                    </div>
                    <button
                      onClick={() => onOpenApplyModal(course.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. INDUSTRY VERTICALS & SECTOR SKILL COVERAGE */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Industry Verticals
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Sectors Supported by {settings.shortName} Skill Infrastructure
            </h2>
            <p className="text-sm text-slate-400">
              Training and apprentice placements aligned with national Sector Skill Councils across leading industrial clusters.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { title: 'Manufacturing & CNC', desc: 'Machining, Turning, Milling & Tool Design' },
              { title: 'Automotive Technology', desc: 'Assembly Line, Paint Shop & EV Powertrains' },
              { title: 'IT & Cloud Systems', desc: 'Infrastructure, Linux Administration & Networking' },
              { title: 'Industrial Electrical', desc: 'PLC Automation, Panel Wiring & Drives' },
              { title: 'Quality & Six Sigma', desc: 'SPC, Metrology, CMM Inspection & 5S' },
              { title: 'Healthcare Logistics', desc: 'Hospital Administration & Supply Logistics' },
              { title: 'BFSI & Banking Ops', desc: 'Retail Banking, KYC & Financial Audits' },
              { title: 'Construction & Civil', desc: 'Surveying, Concrete Quality & Site Safety' },
            ].map((sec, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-blue-500 transition-colors"
              >
                <div className="text-xs font-mono text-blue-400 mb-1">0{i + 1}.</div>
                <h4 className="text-sm font-bold text-white font-display">{sec.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. UPCOMING MEETINGS & LIVE WORKSHOPS */}
      {meetings.length > 0 && (
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                  Live Technical Sessions & Events
                </span>
                <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight mt-0.5">
                  Upcoming Masterclasses & Orientation
                </h2>
              </div>
              <Link
                to="/login"
                className="text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Student Login to Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {meetings.slice(0, 3).map((m) => (
                <div key={m.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-medium text-blue-900">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(m.scheduledAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-mono">{m.durationMinutes} mins</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-display">{m.title}</h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{m.description}</p>

                  <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200">
                    <span>Host: {m.hostName}</span>
                    <span className="font-semibold text-blue-900">{m.platform}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. PLACEMENTS & TRAINING SUPPORT */}
      <section id="placements" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                Career Advancement
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight leading-tight">
                {settings.placementTitle || 'Placement & Industry Apprenticeship Support'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {settings.placementDescription ||
                  'AITM operates an active Placement Cell coordinating with manufacturing clusters in Thane-Belapur, Chakan, Sanand, and NCR industrial parks. Trainees are supported from day one with interview preparation, resume structuring, and statutory apprenticeship contracts.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-2xl font-bold font-display text-blue-900">100%</div>
                  <div className="text-xs text-slate-600 mt-1">Stipend Compliance under Govt Guidelines</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-2xl font-bold font-display text-blue-900">Dual</div>
                  <div className="text-xs text-slate-600 mt-1">Classroom Theory + Direct Plant Apprenticeship</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenApplyModal()}
                  className="px-6 py-3 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Register for Placement Drive
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <img
                src={settings.placementImageUrl || '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg'}
                alt="Apprenticeship Mentorship"
                className="w-full h-96 object-cover rounded-2xl shadow-xl border border-slate-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. CONTACT & ADMISSIONS OFFICE */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Institute Contact info */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                  Connect With Us
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight mt-1">
                  Visit {settings.shortName} Head Office
                </h2>
                <p className="text-sm text-slate-600 mt-2">
                  Our admissions and training counselors are available Monday through Saturday.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <MapPin className="w-5 h-5 text-blue-900 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Registered Office Address</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {settings.headOfficeAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Phone className="w-5 h-5 text-blue-900 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Telephone Line</h3>
                    <a href={`tel:${settings.phone}`} className="text-xs text-blue-900 hover:underline font-mono">
                      {settings.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Mail className="w-5 h-5 text-blue-900 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Official Admissions Email</h3>
                    <a href={`mailto:${settings.email}`} className="text-xs text-blue-900 hover:underline">
                      {settings.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Clock className="w-5 h-5 text-blue-900 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Office Working Hours</h3>
                    <p className="text-xs text-slate-600">{settings.hours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold font-display text-slate-900">
                  Send an Inquiry to Admissions
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  Have questions about NAPS eligibility, YCMOU degree curriculum, or employer partnerships? Submit your message below.
                </p>

                {inquiryError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                {inquirySubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-base font-bold text-emerald-950">Thank You for Inquiring!</h4>
                    <p className="text-xs text-emerald-800">
                      Your message has been saved and routed to our admissions desk. A coordinator will contact you at{' '}
                      {inquiryForm.email} shortly.
                    </p>
                    <button
                      onClick={() => {
                        setInquirySubmitted(false);
                        setInquiryForm({ name: '', email: '', phone: '', message: '' });
                      }}
                      className="px-4 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 rounded-lg hover:bg-emerald-200"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.name}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                          placeholder="e.g. Anand Deshmukh"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                          placeholder="anand@example.com"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact</label>
                      <input
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        placeholder="+91 98200..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Details</label>
                      <textarea
                        rows={3}
                        required
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        placeholder="Inquire about batch dates, NAPS stipend calculation, or industrial training..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={inquirySubmitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{inquirySubmitting ? 'Sending...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
