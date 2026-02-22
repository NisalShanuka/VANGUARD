"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedPage from '@/components/AnimatedPage';

const inputClass =
    "w-full bg-black border border-white/10 text-white text-sm px-4 py-3 outline-none transition-all focus:border-white/50 placeholder:text-white/20";
const labelClass = "block text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-2";

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
    if (q.field_type === 'select') {
        return (
            <select {...props} className={`${inputClass} cursor-pointer`}>
                <option value="" disabled>Select Answer</option>
                {(q.options || '').split(',').map(o => o.trim()).filter(Boolean).map(o => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
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
                <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-none animate-spin" />
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
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center border border-white bg-black p-12"
                >
                    <div className="text-5xl mb-6 text-white"><i className="fas fa-circle-check" /></div>
                    <h2 className="text-white font-bold uppercase tracking-[0.2em] text-sm mb-3">Application Submitted!</h2>
                    <p className="text-white/50 text-xs mb-1">Your <strong className="text-white">{type?.name}</strong> application has been received.</p>
                    <p className="text-white/30 text-xs mb-8">Staff will review and respond via Discord.</p>
                    <Link href="/ucp" className="btn-primary px-8 py-3 text-xs">Go to Dashboard</Link>
                </motion.div>
            </div>
        </AnimatedPage>
    );

    // Is field "short" (goes in 2-col grid)?
    const isShort = (q) => q.field_type === 'text' || q.field_type === 'number' || !q.field_type;

    return (
        <AnimatedPage>
            <div className="mx-auto max-w-3xl px-6 py-16">
                {/* Page title */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <h1 className="font-display text-h2 uppercase tracking-[0.12em]">
                        {type?.name || 'Application'}
                    </h1>
                    <p className="mt-2 text-xs text-white/40 tracking-widest">
                        All fields marked with <span className="text-white">*</span> are required.
                    </p>
                </motion.div>

                {/* Form card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="border border-white/10 bg-black backdrop-blur-sm"
                >
                    {/* Section header */}
                    <div className="px-8 py-5 border-b border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                            Application Questions
                        </p>
                    </div>

                    {questions.length === 0 ? (
                        <div className="px-8 py-16 text-center">
                            <p className="text-3xl mb-4 text-white/20"><i className="fas fa-pen-to-square" /></p>
                            <p className="text-white/50 text-sm font-bold mb-1">No questions configured yet</p>
                            <p className="text-white/30 text-xs">Admin needs to add questions for this application type.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="px-8 py-8">
                            {/* 2-column grid: short fields side-by-side, textareas/selects full width */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                {questions.map((q) => (
                                    <div
                                        key={q.id}
                                        className={
                                            !isShort(q) ? 'md:col-span-2' : ''
                                        }
                                    >
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

                            {/* Submit row */}
                            <div className="mt-8 flex items-center gap-6 border-t border-white/5 pt-6">
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn-primary text-xs tracking-[0.2em] px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="h-3 w-3 border border-black border-t-transparent rounded-none animate-spin" />
                                            SUBMITTING...
                                        </>
                                    ) : 'SUBMIT APPLICATION'}
                                </motion.button>
                                <span className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                                    Required fields are marked <span className="text-white">*</span>
                                </span>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatedPage>
    );
}
