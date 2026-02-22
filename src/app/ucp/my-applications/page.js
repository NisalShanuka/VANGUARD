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
                <div className="h-8 w-8 animate-spin rounded-none border-b-2 border-white"></div>
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
                                className="glass-panel"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-h3">{app.type_name}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${app.status === 'accepted' ? 'bg-white text-black border border-white' :
                                                app.status === 'declined' ? 'bg-white/10 text-white/40 border border-white/20' :
                                                    'bg-white/20 text-white border border-white/30'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-caption text-white/40">Submitted on: {new Date(app.created_at).toLocaleString()}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <p className="text-small text-white/60">Submitted as: <span className="text-white">{app.discord_name}</span></p>
                                    </div>
                                </div>

                                {app.notes && (
                                    <div className="mt-6 border-t border-white/5 pt-4">
                                        <p className="text-overline text-white">Staff Feedback</p>
                                        <p className="mt-2 text-body italic text-white/70">"{app.notes}"</p>
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
