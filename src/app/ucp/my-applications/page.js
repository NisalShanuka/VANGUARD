"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { fadeUp, stagger, viewport } from '@/components/motionPresets.js';
import Link from 'next/link';

export default function MyApplications() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchData();
            const interval = setInterval(fetchData, 30000); // 30s refresh
            return () => clearInterval(interval);
        }
    }, [status]);

    async function fetchData() {
        try {
            const res = await fetch('/api/ucp/applications');
            const data = await res.json();
            setApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
            </div>
        );
    }

    return (
        <AnimatedPage>
            <PageHeader
                title="Application History"
                subtitle="UCP"
                description="View your past submissions and check for feedback from the staff team."
            />

            <section className="mx-auto max-w-6xl px-6 pb-20">
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={stagger(0.1, 0.05)}
                    className="space-y-4"
                >
                    {applications?.length > 0 ? (
                        applications.map((app) => (
                            <motion.div
                                key={app.id}
                                variants={fadeUp(14, 0.4)}
                                whileHover={{ x: 4 }}
                                className="glass-panel group border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300"
                            >
                                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-xl md:text-2xl font-display font-bold uppercase tracking-wider text-white">
                                                {app.type_name}
                                            </h3>
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border ${app.status === 'accepted' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' :
                                                    app.status === 'declined' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-white/10 text-white/60 border-white/10 shadow-inner'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                                            <span className="flex items-center gap-2">
                                                <i className="far fa-calendar text-[8px]" />
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="flex items-center gap-2">
                                                <i className="far fa-clock text-[8px]" />
                                                {new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-1">
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Logged as Discord</p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 group-hover:border-white/10 transition-colors">
                                            <i className="fab fa-discord text-white/40 text-xs" />
                                            <span className="text-xs font-bold text-white/70">{app.discord_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {app.notes && (
                                    <div className="mt-8 pt-6 border-t border-white/5 relative">
                                        <div className="absolute top-0 left-0 w-8 h-[1px] bg-white/20" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Administrator Feedback</p>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 italic text-sm text-white/70 leading-relaxed">
                                            "{app.notes}"
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="glass-panel py-20 text-center">
                            <p className="text-body text-white/50">You haven't submitted any applications yet.</p>
                            <Link href="/ucp" className="btn-primary mt-6">
                                BROWSE OPPORTUNITIES
                            </Link>
                        </div>
                    )}
                </motion.div>
            </section>
        </AnimatedPage>
    );
}
