"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedPage from '@/components/AnimatedPage';

const inputClass = "glass-input";
const labelClass = "block text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-3 ml-1";

function FieldInput({ q, value, onChange }) {
    const props = {
        id: `field_${q.id}`,
        required: !!q.is_required,
        value: value || '',
        onChange,
        placeholder: q.field_type === 'number' ? '0' : 'Your answer here...',
        className: inputClass,
    };

    if (q.field_type === 'textarea') {
        return <textarea {...props} placeholder="Write your answer here..." className={`${inputClass} min-h-[110px] resize-y`} />;
    }
    if (q.field_type === 'number') {
        return <input type="number" {...props} />;
    }
    if (q.field_type === 'date') {
        return <input type="date" {...props} placeholder="" />;
    }
    if (q.field_type === 'select') {
        return (
            <select {...props} className={`${inputClass} cursor-pointer [&>option]:bg-[#0a0a0a] [&>option]:text-white`}>
                <option value="" disabled>Select Answer</option>
                {(q.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
        );
    }
    if (q.field_type === 'checkbox_single') {
        return (
            <label className="flex items-center gap-5 p-6 border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer group rounded-2xl">
                <input
                    type="checkbox"
                    style={{ width: 24, height: 24, cursor: 'pointer', accentColor: '#fff' }}
                    checked={value === 'Yes'}
                    onChange={(e) => onChange({ target: { value: e.target.checked ? 'Yes' : 'No' } })}
                />
                <span className="text-xs font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-widest leading-relaxed">
                    Tick to confirm / එකඟ වීමට සලකුණු කරන්න
                </span>
            </label>
        );
    }
    if (q.field_type === 'checkbox') {
        const options = (q.options || '').split(',').map(o => o.trim()).filter(Boolean);
        const selectedValues = (value || '').split(',').map(v => v.trim()).filter(Boolean);

        const handleCheck = (opt, checked) => {
            let newValues;
            if (checked) {
                newValues = [...selectedValues, opt];
            } else {
                newValues = selectedValues.filter(v => v !== opt);
            }
            onChange({ target: { value: newValues.join(', ') } });
        };

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 border border-white/5 bg-white/5 backdrop-blur-md rounded-2xl">
                {options.map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input
                            type="checkbox"
                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#fff' }}
                            checked={selectedValues.includes(opt)}
                            onChange={(e) => handleCheck(opt, e.target.checked)}
                        />
                        <span className="text-sm text-white/50 group-hover:text-white transition-colors">
                            {opt}
                        </span>
                    </label>
                ))}
            </div>
        );
    }
    return <input type="text" {...props} />;
}

export default function ApplicationForm() {
    const { data: session, status } = useSession();
    const params = useParams();
    const router = useRouter();

    const [type, setType] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
        else if (status === 'authenticated') fetchForm();
    }, [status, params.slug]);

    async function fetchForm() {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`/api/applications/form?slug=${params.slug}`);
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setType(data.type);
            setQuestions(data.questions || []);
            const init = {};
            (data.questions || []).forEach(q => init[q.id] = '');
            setFormData(init);
        } catch { setError('Failed to load form. Please try again.'); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/applications/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ typeId: type.id, answers: formData }),
            });
            const data = await res.json();
            if (data.success) setSubmitSuccess(true);
            else alert(data.error || 'Submission failed.');
        } catch { alert('An error occurred. Please try again.'); }
        finally { setIsSubmitting(false); }
    }

    // ── Loading
    if (loading || status === 'loading') return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">Loading Application...</p>
            </div>
        </div>
    );

    // ── Error
    if (error) return (
        <AnimatedPage>
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <div className="max-w-md w-full text-center border border-white/20 bg-white/5 p-10">
                    <p className="text-4xl mb-4 text-white/40"><i className="fas fa-triangle-exclamation" /></p>
                    <h2 className="text-white font-bold uppercase tracking-wider mb-2 text-sm">Error</h2>
                    <p className="text-white/50 text-xs mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={fetchForm} className="btn-outline text-xs px-5 py-2">Try Again</button>
                        <Link href="/#applications" className="btn-primary text-xs px-5 py-2">Back</Link>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );

    // ── Success
    if (submitSuccess) return (
        <AnimatedPage>
            <div className="flex min-h-[80vh] items-center justify-center px-6 relative">
                {/* Decorative background for success */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] -z-10" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="max-w-md w-full text-center glass-panel p-12 border-white/20"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12, delay: 0.2 }}
                        className="text-6xl mb-8 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    >
                        <i className="fas fa-circle-check" />
                    </motion.div>
                    <h2 className="text-white font-display text-2xl uppercase tracking-[0.2em] mb-4">Application Sent</h2>
                    <p className="text-white/60 text-sm mb-2 font-medium">Your <span className="text-white font-bold">{type?.name}</span> application has been successfully received.</p>
                    <p className="text-white/30 text-xs mb-10 leading-relaxed italic">Our team will review your application and notify you via Discord. Thank you for your interest.</p>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link href="/ucp" className="btn-primary w-full py-4 tracking-[0.25em]">
                            RETURN TO DASHBOARD
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </AnimatedPage>
    );

    // Is field "short" (goes in 2-col grid)?
    const isShort = (q) => (q.field_type === 'text' || q.field_type === 'number' || !q.field_type) && q.field_type !== 'checkbox';

    return (
        <AnimatedPage>
            <div className="mx-auto max-w-3xl px-6 py-16">
                {/* Decorative background elements */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-hero-radial opacity-50" />
                <div className="fixed top-[20%] right-[10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] pointer-events-none -z-10" />
                <div className="fixed bottom-[10%] left-[5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                {/* Page title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 text-center"
                >
                    <h1 className="font-display text-4xl md:text-5xl lg:text-7xl uppercase tracking-[0.1em] leading-[0.9] mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent break-words max-w-4xl mx-auto px-4">
                        {type?.name || 'Application'}
                    </h1>
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <p className="text-[10px] text-white/50 tracking-[0.25em] font-bold uppercase">
                            Whitelist Registration
                        </p>
                    </div>
                </motion.div>

                {/* Form card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="glass-panel border-white/10 overflow-visible"
                >
                    {/* Section header */}
                    <div className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-1">
                                Application Form
                            </p>
                            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">
                                Complete all required sections below
                            </p>
                        </div>
                        <div className="text-[9px] text-white/40 uppercase tracking-[0.15em]">
                            Required fields are marked <span className="text-white">*</span>
                        </div>
                    </div>

                    {questions.length === 0 ? (
                        <div className="px-8 py-16 text-center">
                            <p className="text-3xl mb-4 text-white/20"><i className="fas fa-pen-to-square" /></p>
                            <p className="text-white/50 text-sm font-bold mb-1">No questions configured yet</p>
                            <p className="text-white/30 text-xs">Admin needs to add questions for this application type.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-12">
                            {Array.from(new Set(questions.map(q => q.section_title || 'General Information'))).map(section => (
                                <div key={section} className="space-y-6">
                                    <div className="flex items-center gap-6 py-4">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/70 whitespace-nowrap">
                                            {section}
                                        </h3>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                        {questions.filter(q => (q.section_title || 'General Information') === section).map((q) => (
                                            <div key={q.id} className={!isShort(q) ? 'md:col-span-2' : ''}>
                                                <label htmlFor={`field_${q.id}`} className={labelClass}>
                                                    {q.label}
                                                    {q.is_required ? <span className="text-white ml-1">*</span> : null}
                                                </label>
                                                <FieldInput
                                                    q={q}
                                                    value={formData[q.id]}
                                                    onChange={(e) => setFormData({ ...formData, [q.id]: e.target.value })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Submit row */}
                            <div className="mt-12 flex flex-col md:flex-row items-center gap-8 border-t border-white/5 pt-10">
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn-primary w-full md:w-auto text-[11px] font-black tracking-[0.3em] px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] transition-all"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="relative flex items-center justify-center">
                                                <div className="h-4 w-4 animate-spin rounded-full border-[2px] border-black/10 border-t-black"></div>
                                            </div>
                                            PROCESSING...
                                        </>
                                    ) : (
                                        <>
                                            SUBMIT APPLICATION
                                            <i className="fas fa-arrow-right text-[10px]" />
                                        </>
                                    )}
                                </motion.button>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
                                        Submission Process
                                    </p>
                                    <p className="text-[9px] text-white/20 uppercase tracking-[0.1em]">
                                        By submitting, you agree to server rules.
                                    </p>
                                </div>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatedPage>
    );
}
