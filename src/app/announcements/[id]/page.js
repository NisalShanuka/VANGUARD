"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/i18n/LanguageContext';
import { getLocalized } from '@/i18n/utils.js';
import { quickLinks as quickLinksData, tags as tagsData } from '@/data/sidebar.js';
import { fadeUp, stagger, tapPress, viewport } from '@/components/motionPresets.js';

export default function AnnouncementDetail() {
    const params = useParams();
    const { language, t } = useLanguage();
    const quickLinks = getLocalized(quickLinksData, language);
    const tags = getLocalized(tagsData, language);

    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnnouncement() {
            try {
                const res = await fetch(`/api/admin/announcements/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncement(data);
                }
            } catch (e) {
                console.error('Failed to load announcement', e);
            } finally {
                setLoading(false);
            }
        }
        if (params?.id) fetchAnnouncement();
    }, [params]);

    if (loading) {
        return (
            <AnimatedPage>
                <div className="flex justify-center py-20 text-white/50 text-sm tracking-widest uppercase">
                    Loading Statement...
                </div>
            </AnimatedPage>
        );
    }

    if (!announcement) {
        return (
            <AnimatedPage>
                <div className="flex justify-center py-20 text-white text-sm tracking-widest uppercase font-bold">
                    Announcement Not Found
                </div>
            </AnimatedPage>
        );
    }

    return (
        <AnimatedPage>
            <PageHeader
                title={announcement.title}
                subtitle={announcement.is_pinned ? <><i className="fas fa-thumbtack mr-1" /> Pinned Update</> : 'Server Update'}
                description={`Published by ${announcement.author_name} on ${new Date(announcement.created_at).toLocaleDateString()}`}
            />

            <section className="mx-auto max-w-6xl px-6 pb-16">
                <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                    <motion.article
                        initial="hidden"
                        whileInView="show"
                        viewport={viewport}
                        variants={stagger(0.1, 0.04)}
                        className="space-y-6 text-body text-white/80"
                    >
                        <motion.div variants={fadeUp(14, 0.35)} className="glass-panel p-8">
                            {announcement.image && (
                                <img src={announcement.image} alt={announcement.title} className="w-full max-h-[400px] object-cover rounded-none mb-6 border border-white/10" />
                            )}
                            <h3 className="text-h3 mb-6 text-white border-b border-white/10 pb-4">Details</h3>
                            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
                                {announcement.content}
                            </div>
                        </motion.div>

                        <motion.div variants={fadeUp(12, 0.3)} className="flex items-center gap-4 pt-4 border-t border-white/5 mt-8">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Author:</span>
                            <span className="text-sm font-bold text-white">{announcement.author_name}</span>
                            <span className="mx-2 text-white/20">|</span>
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Date:</span>
                            <span className="text-sm text-white/70">{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </motion.div>
                    </motion.article>

                    <Sidebar quickLinks={quickLinks} tags={tags} />
                </div>
            </section>
        </AnimatedPage>
    );
}
