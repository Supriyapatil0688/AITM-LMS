import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import type { InstituteSettings } from '../../types';
import { Save, CheckCircle2, UploadCloud, AlertCircle, Image as ImageIcon } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, refreshAll } = useData();
  const [form, setForm] = useState<InstituteSettings>(settings);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleImageUpload = async (field: keyof InstituteSettings, file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setUploadingField(field);
    try {
      const uploaded = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, [field]: uploaded.url }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await api.updateSettings(form);
      await refreshAll();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save institute settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderImageUploader = (label: string, field: keyof InstituteSettings, fallbackUrl: string) => {
    const currentUrl = (form[field] as string | undefined) || fallbackUrl;
    const isUploading = uploadingField === field;
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <img
            src={currentUrl}
            alt={label}
            className="w-24 h-16 object-cover rounded-lg border border-slate-300 bg-white shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 w-full space-y-2">
            <input
              type="text"
              value={(form[field] as string | undefined) || ''}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={fallbackUrl}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono outline-none"
            />
            <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => handleImageUpload(field, e.target.files?.[0])}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold font-display text-slate-900">
          Institute Branding, Website CMS & Media Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Every field, banner, logo, and photograph updated here synchronizes in real time across the public website, PDF reports, and student portal.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Institute settings & website CMS saved and synchronized in real time!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Institute Identity & Contact */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-100 pb-3">
            1. Core Branding & Contact Information
          </h3>

          {renderImageUploader('Official Institute Logo', 'logoUrl', '/assets/aistudio/image_e53c2b5b.png')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institute Full Name</label>
              <input
                type="text"
                required
                value={form.instituteName}
                onChange={(e) => setForm({ ...form, instituteName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Name / Acronym</label>
              <input
                type="text"
                required
                value={form.shortName}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Mission / Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Head Office Address</label>
            <textarea
              rows={2}
              value={form.headOfficeAddress}
              onChange={(e) => setForm({ ...form, headOfficeAddress: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Telephone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admissions Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office Hours</label>
              <input
                type="text"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ISO Certification</label>
              <input
                type="text"
                value={form.isoCertification}
                onChange={(e) => setForm({ ...form, isoCertification: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">National Affiliations</label>
              <input
                type="text"
                value={form.nsdcAffiliation}
                onChange={(e) => setForm({ ...form, nsdcAffiliation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Top Notice Banner Text</label>
              <input
                type="text"
                value={form.portalNotice || ''}
                onChange={(e) => setForm({ ...form, portalNotice: e.target.value })}
                placeholder="Live admission notice shown in top navbar..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hero Banner & Workshop Showcase CMS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-900" />
            <span>2. Public Hero Banner & Workshop Showcase CMS</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Trust Badge</label>
            <input
              type="text"
              value={form.heroBadge || ''}
              onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
              placeholder="ISO 9001:2015 Certified · NSDC Affiliated"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Headline</label>
            <input
              type="text"
              value={form.heroHeadline || ''}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Subtitle</label>
            <textarea
              rows={2}
              value={form.heroSubtitle || ''}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderImageUploader(
              'Hero Background Image',
              'heroImageUrl',
              '/src/assets/images/hero_aitm_campus_1792739247335.jpg'
            )}
            {renderImageUploader(
              'Hero Workshop Feature Image',
              'heroWorkshopImageUrl',
              '/src/assets/images/aitm_industrial_training_1792739247502.jpg'
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workshop Card Label</label>
              <input
                type="text"
                value={form.heroWorkshopLabel || ''}
                onChange={(e) => setForm({ ...form, heroWorkshopLabel: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workshop Card Title</label>
              <input
                type="text"
                value={form.heroWorkshopTitle || ''}
                onChange={(e) => setForm({ ...form, heroWorkshopTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Workshop Card Description</label>
            <input
              type="text"
              value={form.heroWorkshopDesc || ''}
              onChange={(e) => setForm({ ...form, heroWorkshopDesc: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
            />
          </div>
        </div>

        {/* Section 3: About & Placement Sections CMS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-100 pb-3">
            3. About & Placements Section Content & Photos
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">About Section Headline</label>
            <input
              type="text"
              value={form.aboutTitle || ''}
              onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">About Description (Primary)</label>
              <textarea
                rows={3}
                value={form.aboutDescription || ''}
                onChange={(e) => setForm({ ...form, aboutDescription: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">About Description (Secondary)</label>
              <textarea
                rows={3}
                value={form.aboutSubDescription || ''}
                onChange={(e) => setForm({ ...form, aboutSubDescription: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderImageUploader('About Lab Photo 1', 'aboutImage1Url', '/src/assets/images/aitm_it_lab_1792739250007.jpg')}
            {renderImageUploader(
              'About Workplace Photo 2',
              'aboutImage2Url',
              '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg'
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Section Title</label>
              <input
                type="text"
                value={form.placementTitle || ''}
                onChange={(e) => setForm({ ...form, placementTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Section Description</label>
              <textarea
                rows={2}
                value={form.placementDescription || ''}
                onChange={(e) => setForm({ ...form, placementDescription: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none resize-none"
              />
            </div>
            {renderImageUploader(
              'Placement Section Image',
              'placementImageUrl',
              '/src/assets/images/aitm_apprenticeship_workplace_1792739247560.jpg'
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || uploadingField !== null}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving & Syncing...' : 'Save Institute Settings & Website CMS'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
