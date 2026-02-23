"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { fadeUp, stagger, tapPress, viewport } from '@/components/motionPresets.js';
import Link from 'next/link';

export default function UCPDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [applications, setApplications] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchData();
        }
    }, [status]);

    async function fetchData() {
        try {
            const res = await fetch('/api/ucp/dashboard');
            const data = await res.json();
            setUserData(data.user || null);
            setApplications(data.recentApplications || []);
            setTypes(data.applicationTypes || []);
        } catch (error) {
            console.error('Error fetching UCP data:', error);
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
                title="User Control Panel"
                subtitle="Dashboard"
                description={`Welcome back, ${session?.user?.name || 'Player'}. Manage your applications and character slots here.`}
            />

            <section className="mx-auto max-w-6xl px-6 pb-20">
                <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={stagger(0.1, 0.05)}
                        className="space-y-8"
                    >
                        {/* Opportunities Section */}
                        <motion.div variants={fadeUp(16, 0.4)}>
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-h2">Available Opportunities</h2>
                                <span className="text-overline text-white">Apply Now</span>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {types?.map((type) => (
                                    <Link key={type.id} href={`/ucp/apply/${type.slug}`}>
                                        <motion.div
                                            whileHover={{ y: -6, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="glass-panel group relative flex flex-col justify-between min-h-[160px] p-8 border-white/5 transition-all duration-500 hover:border-white/20 hover:bg-white/5 shadow-2xl overflow-hidden"
                                        >
                                            {/* Liquid background effect on hover */}
                                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-[60px] transition-all duration-700 group-hover:bg-white/10 group-hover:scale-150" />

                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="mb-auto">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Available</span>
                                                    </div>
                                                    <h4 className="text-xl md:text-2xl font-display font-medium leading-tight uppercase tracking-wider text-white group-hover:text-white transition-colors">
                                                        {type.name}
                                                    </h4>
                                                </div>

                                                <div className="mt-8 flex items-center justify-between">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                        Requirement: <span className="text-white/60">Level 1</span>
                                                    </p>
                                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:border-white">
                                                        <i className="fas fa-arrow-right text-[10px] text-white group-hover:text-black" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Decorative background ID */}
                                            <div className="absolute -right-2 -top-2 text-8xl font-display font-black opacity-[0.02] transition-all duration-500 group-hover:opacity-[0.06] select-none pointer-events-none italic">
                                                0{type.id}
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div variants={fadeUp(16, 0.45)}>
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-h2">Recent Applications</h2>
                                <Link href="/ucp/my-applications" className="text-caption font-bold text-white hover:opacity-70">
                                    VIEW ALL
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {applications.length > 0 ? (
                                    applications.map((app) => (
                                        <motion.div
                                            key={app.id}
                                            variants={fadeUp(12, 0.3)}
                                            className="glass-panel flex items-center justify-between py-4"
                                        >
                                            <div>
                                                <p className="font-bold uppercase tracking-widest text-small">{app.type_name}</p>
                                                <p className="text-caption text-white/40">{new Date(app.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${app.status === 'accepted' ? 'bg-white text-black border border-white' :
                                                    app.status === 'declined' ? 'bg-white/10 text-white/40 border border-white/20' :
                                                        'bg-white/20 text-white border border-white/30'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="glass-panel text-center py-10 opacity-50">
                                        <p>No recent applications found.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Sidebar / Profile Card */}
                    <motion.aside
                        initial="hidden"
                        animate="show"
                        variants={stagger(0.12, 0.05)}
                        className="space-y-6"
                    >
                        <motion.div variants={fadeUp(14, 0.35)} className="glass-panel text-center">
                            <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-none border-2 border-white p-1">
                                <img src={session?.user?.image || '/images/logo.png'} alt="" className="h-full w-full object-cover" />
                            </div>
                            <h4 className="text-h4">{session?.user?.name}</h4>
                            <p className="text-caption uppercase tracking-[0.2em] text-white/40">{userData?.role || 'Citizen'}</p>

                            <div className="mt-6 grid grid-cols-2 border-t border-white/5 pt-4">
                                <div>
                                    <p className="text-display text-2xl leading-none">0</p>
                                    <p className="text-[9px] uppercase tracking-widest text-white/40">Hours</p>
                                </div>
                                <div>
                                    <p className="text-display text-2xl leading-none">{applications.length}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-white/40">Apps</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeUp(14, 0.35)} className="glass-panel">
                            <h4 className="text-h4 mb-4">Quick Links</h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/ucp/my-characters" className="text-caption font-bold tracking-widest text-white/60 hover:text-white">MY CHARACTERS</Link>
                                </li>
                                <li>
                                    <Link href="/ucp/my-applications" className="text-caption font-bold tracking-widest text-white/60 hover:text-white">MY APPLICATIONS</Link>
                                </li>
                                <li>
                                    <Link href="/rules/server" className="text-caption font-bold tracking-widest text-white/60 hover:text-white">SERVER RULES</Link>
                                </li>
                                <li>
                                    <Link href="https://discord.gg/wuq7TFYT" target="_blank" className="text-caption font-bold tracking-widest text-white/60 hover:text-white">DISCORD SUPPORT</Link>
                                </li>
                            </ul>
                        </motion.div>

                        {(userData?.is_admin || session?.user?.role === 'admin') && (
                            <motion.div variants={fadeUp(14, 0.35)} className="glass-panel border-white/20 bg-white/5">
                                <h4 className="text-h4 mb-2 text-white">Admin Section</h4>
                                <Link href="/admin" className="btn-primary w-full justify-center bg-white hover:bg-white/80 text-black">
                                    ADMIN PANEL
                                </Link>
                            </motion.div>
                        )}
                    </motion.aside>
                </div>
            </section>
        </AnimatedPage>
    );
}
