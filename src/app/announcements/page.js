"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Announcements() {
    const { t } = useLanguage();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const res = await fetch('/api/admin/announcements');
                const data = await res.json();
                if (Array.isArray(data)) setAnnouncements(data);
            } catch (e) {
                console.error('Failed to load announcements', e);
            } finally {
                setLoading(false);
            }
        }
        fetchAnnouncements();
    }, []);

    return (
        <AnimatedPage>
            <PageHeader
                title={t('announcements.title')}
                subtitle={t('announcements.subtitle')}
                description={t('announcements.description')}
            />

            <section className="mx-auto max-w-6xl px-6 pb-16">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-white/30 text-sm">Loading announcements...</div>
                    ) : announcements.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-white/30 text-sm">No announcements posted yet.</div>
                    ) : announcements.map((ann) => (
                        <Link key={ann.id} href={`/announcements/${ann.id}`} className="glass-panel group p-0 overflow-hidden flex flex-col h-full transition-all duration-500">
                            {ann.image && (
                                <img src={ann.image} alt={ann.title} className="w-full h-48 object-cover border-b border-white/10" />
                            )}
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
                                    <span>{ann.is_pinned ? <><i className="fas fa-thumbtack mr-1" /> PINNED</> : 'UPDATE'}</span>
                                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-white group-hover:text-accent-400 transition-colors">{ann.title}</h3>
                                <p className="mt-4 text-sm text-white/60 line-clamp-3 flex-1">{ann.content}</p>
                                <span className="mt-6 inline-flex text-xs text-white font-bold tracking-widest">{t('announcements.readMore', 'READ MORE')} →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </AnimatedPage>
    );
}
