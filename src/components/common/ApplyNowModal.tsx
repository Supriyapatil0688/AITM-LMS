import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useData } from '../../context/DataContext';
import type { Application } from '../../types';

interface ApplyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCourseId?: string;
}

export const ApplyNowModal: React.FC<ApplyNowModalProps> = ({
  isOpen,
  onClose,
  preselectedCourseId,
}) => {
  const { publishedCourses, settings } = useData();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    educationQualification: 'Diploma in Engineering (Mechanical/Electrical/Auto)',
    interestedCourseId: preselectedCourseId || publishedCourses[0]?.id || '',
    programType: 'naps' as Application['programType'],
    city: 'Thane',
    state: 'Maharashtra',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{ id: string; fullName: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        interestedCourseId: preselectedCourseId || prev.interestedCourseId || publishedCourses[0]?.id || '',
      }));
    }
  }, [isOpen, preselectedCourseId, publishedCourses]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10)
      errs.phone = 'Valid 10-digit mobile number required';
    if (!formData.city.trim()) errs.city = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const app = await api.submitApplication(formData);
      setSubmittedApp({ id: app.id, fullName: app.fullName });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedApp(null);
    setSubmitError(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      educationQualification: 'Diploma in Engineering (Mechanical/Electrical/Auto)',
      interestedCourseId: publishedCourses[0]?.id || '',
      programType: 'naps',
      city: 'Thane',
      state: 'Maharashtra',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-blue-900 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-200 tracking-wider uppercase">
              {settings.instituteName}
            </span>
            <h3 className="text-xl font-bold font-display mt-0.5">
              Online Admission & Apprenticeship Application
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {submittedApp ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 font-display">
                Application Received Successfully!
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-slate-900">{submittedApp.fullName}</strong>. Your application has been saved in the {settings.shortName} admissions database under Reference ID:
              </p>
              <div className="inline-block px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 font-mono text-base font-bold text-blue-900">
                {submittedApp.id.toUpperCase()}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Our admissions and apprenticeship counselors will review your academic background. Once approved, the admin will provision your official student credentials.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Done & Return to Website
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 mb-4">
                Fill in your details below to apply for government-stipend apprenticeship programs (NAPS/NATS), YCMOU Learn & Earn models, or technical certifications.
              </p>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Rohan V. Patil"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 98200 12345"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Highest Qualification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.educationQualification}
                    onChange={(e) => setFormData({ ...formData, educationQualification: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white"
                  >
                    <option value="HSC / 12th Pass">HSC / 12th Pass</option>
                    <option value="ITI (Fitter/Machinist/Electrician/COPA)">ITI Certified</option>
                    <option value="Diploma in Engineering (Mechanical/Electrical/Auto)">Diploma in Engineering</option>
                    <option value="B.E. / B.Tech Graduate">B.E. / B.Tech Graduate</option>
                    <option value="B.Sc / BCA / BCS">B.Sc / BCA / BCS</option>
                    <option value="Non-Technical Graduate (B.Com/BA)">Non-Technical Graduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Program Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.programType}
                    onChange={(e) => setFormData({ ...formData, programType: e.target.value as Application['programType'] })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white"
                  >
                    <option value="naps">NAPS (National Apprenticeship Scheme)</option>
                    <option value="nats">NATS (Graduate/Diploma Apprenticeship)</option>
                    <option value="learn_earn">Learn & Earn (YCMOU Work-Integrated)</option>
                    <option value="vocational_diploma">Vocational Skill Diploma</option>
                    <option value="degree">B.Voc Degree Program</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interested Course / Specialization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.interestedCourseId}
                    onChange={(e) => setFormData({ ...formData, interestedCourseId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white"
                  >
                    {publishedCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Thane, Navi Mumbai, Pune"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Background or Aspirations (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Mention previous workshop experience, academic percentage, or specific industry interests..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-all shadow-sm"
                >
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
