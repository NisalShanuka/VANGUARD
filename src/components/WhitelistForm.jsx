"use client";
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { fadeUp, stagger, tapPress, viewport } from './motionPresets';

export default function WhitelistForm({
  title,
  lead,
  sections,
  submitLabel,
  successMessage,
  errorMessage,
  requiredHint,
}) {
  const fallbackSections = [
    {
      title: 'Personal Information',
      columnsClass: 'md:grid-cols-2',
      fields: [
        { label: 'Full Name', name: 'full_name', placeholder: 'Enter your full name', required: true },
        { label: 'Discord Username', name: 'discord', placeholder: 'Username#0000', required: true },
        { label: 'Age', name: 'age', type: 'number', placeholder: 'Min. 18+', min: 18, max: 99, required: true },
        {
          label: 'FiveM Experience',
          name: 'experience',
          type: 'select',
          required: true,
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ],
        },
        {
          label: 'Why do you want to join Vanguard RP?',
          name: 'why_join',
          type: 'textarea',
          placeholder: 'Tell us about your roleplay goals...',
          required: true,
          rows: 4,
          fullWidth: true,
        },
      ],
    },
  ];

  const [status, setStatus] = useState('idle');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState('');
  const { t } = useLanguage();

  const sectionsToRender = Array.isArray(sections) && sections.length > 0 ? sections : fallbackSections;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('idle');
    setServerErrorMessage('');
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setStatus('success');
      form.reset();
    } catch (error) {
      setServerErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger(0.1, 0.1)}
        className="glass-panel p-8 md:p-12"
      >
        <div className="mb-12 border-b border-white/5 pb-8">
          <h2 className="text-3xl tracking-wider">{title || "APPLICATION FORM"}</h2>
          {lead && <p className="mt-4 text-white/50 leading-relaxed max-w-2xl">{lead}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {sectionsToRender.map((section, idx) => (
            <div key={idx} className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="h-[1px] w-8 bg-white" />
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                  {section.title}
                </h4>
              </div>

              <div className={`grid gap-8 ${section.columnsClass || 'md:grid-cols-2'}`}>
                {section.fields?.map((field, fIdx) => (
                  <div
                    key={fIdx}
                    className={`flex flex-col gap-3 ${field.fullWidth ? 'md:col-span-2' : ''}`}
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {field.label}
                      {field.required && <span className="ml-1 text-white">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={field.rows || 4}
                        className="w-full border border-white/10 bg-black p-4 text-sm text-white transition-all focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        name={field.name}
                        required={field.required}
                        className="w-full border border-white/10 bg-black p-4 text-sm text-white transition-all focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                      >
                        <option value="" disabled selected>Select an option</option>
                        {field.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt.value} className="bg-black">{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        className="w-full border border-white/10 bg-black p-4 text-sm text-white transition-all focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-8 flex flex-col sm:flex-row sm:items-center gap-6 border-t border-white/5">
            <motion.button
              type="submit"
              className="btn-primary min-w-[200px]"
              disabled={submitting}
              whileTap={tapPress}
            >
              {submitting ? "PROCESSING..." : submitLabel || "SUBMIT APPLICATION"}
            </motion.button>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">
              * MANDATORY FIELDS ARE REQUIRED FOR PROCESSING
            </span>
          </div>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/20 bg-white/5 p-6 text-sm text-white"
              >
                {successMessage || "Application submitted successfully!"}
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-400"
              >
                {serverErrorMessage || errorMessage || "An error occurred. Please try again."}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
