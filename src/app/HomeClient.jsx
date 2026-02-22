"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import AnimatedPage from '@/components/AnimatedPage';
import HeroSlider from '@/components/HeroSlider';
import { featureHighlights as featureHighlightsData } from '@/data/home.js';
import { useLanguage } from '@/i18n/LanguageContext';
import { getLocalized } from '@/i18n/utils.js';
import { fadeUp, stagger, tapPress, viewport } from '@/components/motionPresets.js';

const COVER_FALLBACK = '/images/covers/custom.jpg';

function getCoverSrc(cover_image) {
    if (!cover_image) return COVER_FALLBACK;
    if (cover_image.startsWith('http')) return cover_image;
    return `/images/covers/${cover_image}`;
}

function ApplicationCard({ type, t }) {
    const [imgErr, setImgErr] = useState(false);
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.01 }}
            className="group overflow-hidden rounded-none border border-white/10 bg-ink-900/70"
        >
            <div className="relative">
                <img
                    src={imgErr ? COVER_FALLBACK : getCoverSrc(type.cover_image)}
                    alt={type.name}
                    className="h-40 w-full object-cover"
                    onError={() => setImgErr(true)}
                />
                <span className="absolute left-4 top-4 rounded-none bg-black/80 px-3 py-1 text-overline uppercase tracking-[0.24em] text-white">
                    Open
                </span>
            </div>
            <div className="p-4">
                <h3>{type.name}</h3>
                {type.description && (
                    <p className="mt-1 text-small text-white/50 line-clamp-2">{type.description}</p>
                )}
                <Link href={`/ucp/apply/${type.slug}`} className="btn-outline mt-4 block text-center py-2">
                    {t('home.applyNow')}
                </Link>
            </div>
        </motion.div>
    );
}

export default function HomeClient({ applicationTypes }) {
    const { language, t } = useLanguage();
    const featureHighlights = getLocalized(featureHighlightsData, language);

    return (
        <AnimatedPage>
            <HeroSlider />

            {/* Story Section */}
            <motion.section
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp(18, 0.45)}
                className="mx-auto max-w-6xl px-6 py-16"
            >
                <motion.div variants={stagger(0.1, 0.04)} className="relative overflow-hidden rounded-none border border-white/10 bg-ink-900/70 p-10 shadow-lg">
                    <motion.img
                        src="/images/slider/1.webp"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-20"
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
                        <motion.div variants={fadeUp(14, 0.35)}>
                            <p className="section-kicker">{t('home.storyKicker')}</p>
                            <h2 className="mt-4">{t('home.storyTitle')}</h2>
                            <p className="mt-4 text-white/70">{t('home.storyDescription')}</p>
                            <motion.div whileHover={{ y: -2 }} whileTap={tapPress} className="mt-6 w-fit">
                                <Link href="/ucp" className="btn-primary">{t('home.storyCta')}</Link>
                            </motion.div>
                        </motion.div>
                        <motion.div variants={fadeUp(14, 0.35)} className="hidden items-end justify-end md:flex">
                            <motion.img
                                src="/images/misc/char.png"
                                alt={t('home.alt.character')}
                                className="h-72 w-auto"
                                whileHover={{ y: -8, scale: 1.02 }}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* Best Server Section */}
            <motion.section
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp(18, 0.45)}
                className="mx-auto max-w-6xl px-6 py-16"
            >
                <motion.div variants={stagger(0.1, 0.05)} className="grid items-center gap-10 md:grid-cols-2">
                    <motion.img
                        variants={fadeUp(14, 0.35)}
                        src="/images/misc/best.webp"
                        alt={t('home.alt.bestServer')}
                        className="w-full rounded-none"
                        whileHover={{ scale: 1.02 }}
                    />
                    <motion.div variants={fadeUp(14, 0.35)}>
                        <p className="section-kicker">{t('home.bestKicker')}</p>
                        <h2 className="mt-4">
                            {t('home.bestTitleLead')}{' '}
                            <span className="text-white">{t('home.bestTitleHighlight')}</span>{' '}
                            {t('home.bestTitleTail')}
                        </h2>
                        <p className="mt-4 text-white/70">{t('home.bestDescription')}</p>
                        <motion.div variants={stagger(0.05, 0.03)} className="mt-6 flex flex-wrap gap-3">
                            {featureHighlights.map((item) => (
                                <motion.span
                                    key={item}
                                    variants={fadeUp(10, 0.25)}
                                    whileHover={{ y: -2 }}
                                    className="rounded-none border border-white/10 px-4 py-2 text-caption uppercase tracking-[0.2em] text-white/70"
                                >
                                    {item}
                                </motion.span>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* ── Dynamic Applications Section ──────────────────────────────────── */}
            <section id="applications" className="relative overflow-hidden py-16">
                <div className="absolute inset-0 overflow-hidden">
                    <motion.img
                        src="/images/slider/3.webp"
                        alt=""
                        className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] max-w-none object-cover opacity-30 will-change-transform"
                        animate={{ scale: [1.03, 1.07, 1.03] }}
                        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ transformOrigin: 'center center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
                </div>

                <div className="relative mx-auto max-w-6xl px-6">
                    {/* Section heading */}
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="section-kicker">{t('home.applicationsKicker')}</p>
                            <h2 className="mt-4">{t('home.applicationsTitle')}</h2>
                        </div>
                    </div>

                    {/* Cards — rendered from server-fetched data, no client fetch needed */}
                    {applicationTypes.length === 0 ? (
                        <div className="mt-10 text-center py-16 border border-white/5 rounded-none bg-ink-900/50">
                            <p className="text-3xl mb-4 text-white/20"><i className="fas fa-clipboard-list" /></p>
                            <p className="font-bold text-white/60 text-sm">No active application types yet.</p>
                            <p className="text-white/30 text-xs mt-2">Admin can activate types via Admin Panel → Application Settings.</p>
                        </div>
                    ) : (
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {applicationTypes.map((type, i) => (
                                <motion.div
                                    key={type.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                >
                                    <ApplicationCard type={type} t={t} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Discord/Event Section */}
            <motion.section
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={fadeUp(18, 0.45)}
                className="mx-auto max-w-6xl px-6 py-16"
            >
                <motion.div variants={stagger(0.1, 0.05)} className="relative overflow-hidden rounded-none border border-white/10 bg-ink-900/70 p-10">
                    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                        <motion.div variants={fadeUp(14, 0.35)}>
                            <p className="section-kicker">{t('home.eventKicker')}</p>
                            <h2 className="mt-4">{t('home.eventTitle')}</h2>
                            <p className="mt-4 max-w-2xl text-white/70">{t('home.eventDescription')}</p>
                        </motion.div>
                        <motion.div variants={fadeUp(12, 0.3)} whileHover={{ y: -2 }} whileTap={tapPress} className="w-fit">
                            <a href="https://discord.gg/UK4e9QR6fN" target="_blank" rel="noreferrer" className="btn-primary">
                                {t('home.eventCta')}
                            </a>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

        </AnimatedPage>
    );
}
