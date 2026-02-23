"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
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
            className="glass-panel group p-0 transition-all duration-500"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
            <div className="relative">
                <img
                    src={imgErr ? COVER_FALLBACK : getCoverSrc(type.cover_image)}
                    alt={type.name}
                    className="h-40 w-full object-cover"
                    onError={() => setImgErr(true)}
                />
                <span className="absolute left-4 top-4 rounded-full bg-accent-500/80 px-4 py-1.5 text-overline uppercase tracking-[0.2em] text-white backdrop-blur-md shadow-[0_0_15px_rgba(200,200,200,0.5)]">
                    Open
                </span>
            </div>
            <div className="p-4">
                <h3>{type.name}</h3>
                {type.description && (
                    <p className="mt-1 text-small text-white/50 line-clamp-2">{type.description}</p>
                )}
                <Link href={`/ucp/apply/${type.slug}`} className="btn-outline mt-4 flex items-center justify-center gap-2 py-2 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                    {t('home.applyNow')}
                    <motion.i
                        className="fas fa-arrow-right"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </Link>
            </div>
        </motion.div>
    );
}

export default function HomeClient({ applicationTypes }) {
    const { language, t } = useLanguage();
    const { data: session } = useSession();
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
                <motion.div variants={stagger(0.1, 0.04)} className="relative overflow-hidden glass-panel p-6 md:!p-12 shadow-lg">
                    <motion.img
                        src="/images/slider/1.webp"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-20"
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
                        <motion.div variants={fadeUp(14, 0.35)} className="relative z-10">
                            <motion.p
                                className="section-kicker flex items-center gap-2"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <i className="fas fa-book-open text-accent-500" /> {t('home.storyKicker')}
                            </motion.p>
                            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold tracking-tight">{t('home.storyTitle')}</h2>
                            <p className="mt-4 text-white/70 leading-relaxed text-lg">{t('home.storyDescription')}</p>
                            <motion.div whileHover={{ y: -2 }} whileTap={tapPress} className="mt-6 w-fit">
                                <Link href="/ucp" className="btn-accent">{t('home.storyCta')}</Link>
                            </motion.div>
                        </motion.div>
                        <motion.div variants={fadeUp(14, 0.35)} className="hidden items-end justify-end md:flex">
                            <motion.img
                                src="/images/misc/char.png"
                                alt={t('home.alt.character')}
                                className="h-72 w-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
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
                <motion.div variants={stagger(0.1, 0.05)} className="grid items-center gap-10 md:grid-cols-2 relative h-full">
                    <motion.div className="relative" variants={fadeUp(14, 0.35)}>
                        <motion.div
                            className="absolute inset-0 bg-accent-500/20 blur-[50px] rounded-full"
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.img
                            src="/images/misc/best.webp"
                            alt={t('home.alt.bestServer')}
                            className="relative z-10 w-full rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            whileHover={{ scale: 1.03, rotate: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                    </motion.div>
                    <motion.div variants={fadeUp(14, 0.35)} className="relative z-10">
                        <motion.p
                            className="section-kicker flex items-center gap-2"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        >
                            <i className="fas fa-crown text-accent-500" /> {t('home.bestKicker')}
                        </motion.p>
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
                                    whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.15)", scale: 1.05 }}
                                    className="rounded-full border border-white/10 bg-white/5 flex items-center gap-2 px-5 py-2.5 text-caption font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-colors"
                                >
                                    <i className="fas fa-check text-accent-500 text-[10px]" /> {item}
                                </motion.span>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* ── Dynamic Applications Section ──────────────────────────────────── */}
            <section id="applications" className="relative overflow-hidden py-24">
                <div className="absolute inset-0 overflow-hidden">
                    <motion.img
                        src="/images/slider/3.webp"
                        alt=""
                        className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] max-w-none object-cover opacity-20 will-change-transform"
                        animate={{ scale: [1.02, 1.08, 1.02], rotate: [0, 1, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ transformOrigin: 'center center' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-[#050505]" />
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
                        <div className="mt-10 text-center py-20 glass-panel border border-white/5">
                            <motion.p
                                className="text-4xl mb-4 text-white/20"
                                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <i className="fas fa-clipboard-list drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                            </motion.p>
                            <p className="font-bold text-white/60 text-base">No active application types yet.</p>
                            <p className="text-white/30 text-xs mt-2 uppercase tracking-widest">Admin can activate types via Admin Panel</p>
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
                <motion.div variants={stagger(0.1, 0.05)} className="relative overflow-hidden glass-panel p-6 md:!p-12">
                    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                        <motion.div variants={fadeUp(14, 0.35)}>
                            <p className="section-kicker">{t('home.eventKicker')}</p>
                            <h2 className="mt-4">{t('home.eventTitle')}</h2>
                            <p className="mt-4 max-w-2xl text-white/70">{t('home.eventDescription')}</p>
                        </motion.div>
                        <motion.div variants={fadeUp(12, 0.3)} whileHover={{ y: -2, scale: 1.05 }} whileTap={tapPress} className="w-fit">
                            {session ? (
                                <Link href="/ucp" className="btn-accent shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] px-8 py-4 text-base">
                                    <i className="fas fa-right-to-bracket" /> {t('home.eventCtaDashboard')}
                                </Link>
                            ) : (
                                <button type="button" onClick={() => signIn('discord')} className="btn-accent shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] px-8 py-4 text-base">
                                    <i className="fab fa-discord" /> {t('home.eventCtaJoin')}
                                </button>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

        </AnimatedPage>
    );
}
