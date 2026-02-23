"use client";
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { fadeUp, stagger, tapPress, viewport } from './motionPresets';

export default function WhitelistForm({
  slug, // Added slug to fetch dynamic questions
  title: initialTitle,
  submitLabel,
  successMessage,
  errorMessage,
}) {
  const [questions, setQuestions] = useState([]);
  const [typeInfo, setTypeInfo] = useState(null);
  const [loading, setLoading] = useState(!!slug);
  const [status, setStatus] = useState('idle');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (slug) {
      fetch(`/api/applications/form?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          if (data.questions) setQuestions(data.questions);
          if (data.type) setTypeInfo(data.type);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load form:", err);
          setLoading(false);
        });
    }
  }, [slug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('idle');
    setServerErrorMessage('');
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Collect answers
    const answers = {};
    questions.forEach(q => {
      if (q.field_type === 'checkbox') {
        answers[q.id] = formData.getAll(String(q.id)).join(', ');
      } else {
        answers[q.id] = formData.get(String(q.id));
      }
    });

    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeId: typeInfo?.id,
          answers: answers
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setStatus('success');
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setServerErrorMessage(error.message);
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Loading Secure Form...</p>
    </div>
  );

  // Group questions by section
  const sections = [];
  const sectMap = {};
  questions.forEach(q => {
    const sName = q.section_title || 'General Information';
    if (!sectMap[sName]) {
      sectMap[sName] = { title: sName, fields: [] };
      sections.push(sectMap[sName]);
    }
    sectMap[sName].fields.push(q);
  });

  return (
    <div className="w-full">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger(0.1, 0.1)}
        className="glass-panel p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="mb-14 border-b border-white/5 pb-10">
          <h2 className="text-4xl font-display font-black tracking-[0.15em] text-white uppercase italic">
            {typeInfo?.name || initialTitle || "APPLICATION FORM"}
          </h2>
          <p className="mt-4 text-white/40 leading-relaxed max-w-2xl text-sm font-medium">
            {typeInfo?.description || "Please provide accurate information. Your application will be reviewed by our administration team."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-16">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-6 bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80">
                  {section.title}
                </h4>
              </div>

              <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
                {section.fields.map((field) => {
                  const isFullWidth = ['textarea', 'checkbox', 'checkbox_single'].includes(field.field_type);
                  const optionList = field.options ? field.options.split(',').map(s => s.trim()) : [];

                  return (
                    <div key={field.id} className={`flex flex-col gap-4 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                      <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 ml-1">
                        {field.label}
                        {field.is_required ? <span className="ml-2 text-white/60">*</span> : <span className="ml-2 text-white/10">(Optional)</span>}
                      </label>

                      {field.field_type === 'textarea' ? (
                        <textarea
                          name={String(field.id)}
                          required={!!field.is_required}
                          className="w-full border border-white/10 bg-white/[0.02] p-5 text-sm text-white transition-all focus:border-white/40 focus:bg-white/[0.05] outline-none rounded-sm min-h-[120px]"
                        />
                      ) : field.field_type === 'select' ? (
                        <select
                          name={String(field.id)}
                          required={!!field.is_required}
                          defaultValue=""
                          className="w-full border border-white/10 bg-white/[0.02] p-5 text-sm text-white transition-all focus:border-white/40 focus:bg-white/[0.05] outline-none rounded-sm appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-[#111]">Select an Option</option>
                          {optionList.map((opt, oIdx) => (
                            <option key={oIdx} value={opt} className="bg-[#111]">{opt}</option>
                          ))}
                        </select>
                      ) : field.field_type === 'checkbox' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border border-white/10 bg-white/[0.02] rounded-sm">
                          {optionList.map((opt, oIdx) => (
                            <label key={oIdx} className="flex items-center gap-4 cursor-pointer group">
                              <input
                                type="checkbox"
                                name={String(field.id)}
                                value={opt}
                                className="w-5 h-5 accent-white cursor-pointer bg-black"
                              />
                              <span className="text-xs font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">
                                {opt}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : field.field_type === 'checkbox_single' ? (
                        <label className="flex items-center gap-5 p-6 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group rounded-sm">
                          <input
                            type="checkbox"
                            name={String(field.id)}
                            value="Yes"
                            required={!!field.is_required}
                            className="w-6 h-6 accent-white cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest leading-relaxed">
                            {field.label} {field.is_required && <span className="text-white/20 ml-1">(Required to proceed)</span>}
                          </span>
                        </label>
                      ) : (
                        <input
                          type={field.field_type || 'text'}
                          name={String(field.id)}
                          required={!!field.is_required}
                          className="w-full border border-white/10 bg-white/[0.02] p-5 text-sm text-white transition-all focus:border-white/40 focus:bg-white/[0.05] outline-none rounded-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-t border-white/10">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
                {t('whitelist.requiredFieldsNotice') || "* Information provided must be authentic"}
              </span>
              <p className="text-[9px] text-white/10 uppercase tracking-[0.1em]">By submitting you agree to our server rules and terms of conduct.</p>
            </div>

            <motion.button
              type="submit"
              className="px-16 py-5 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] disabled:opacity-50"
              disabled={submitting}
              whileTap={tapPress}
            >
              {submitting ? "UPLOADING DATA..." : submitLabel || "TRANSMIT APPLICATION"}
            </motion.button>
          </div>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-green-500/30 bg-green-500/10 p-8 text-center"
              >
                <i className="fas fa-check-circle text-3xl mb-4 text-green-500"></i>
                <h3 className="text-xl font-bold mb-2">SUBMISSION SUCCESSFUL</h3>
                <p className="text-white/60 text-sm">{successMessage || "Your record has been encrypted and stored. Administration will review it shortly."}</p>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-red-500/30 bg-red-500/10 p-8 text-center"
              >
                <i className="fas fa-triangle-exclamation text-3xl mb-4 text-red-500"></i>
                <h3 className="text-xl font-bold mb-2">SUBMISSION FAILED</h3>
                <p className="text-red-400/80 text-sm">{serverErrorMessage || errorMessage || "Critical error during data transmission. Please try again."}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
