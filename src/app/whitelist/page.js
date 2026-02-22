"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import AnimatedPage from '@/components/AnimatedPage.jsx';
import { useLanguage } from '@/i18n/LanguageContext.jsx';
import { fadeUp, popIn, stagger, tapPress, viewport } from '@/components/motionPresets.js';

export default function WhitelistLanding() {
    const { t } = useLanguage();

    return (
        <AnimatedPage>
            <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
                    variants={stagger(0.1, 0.05)}
                    className="grid items-center gap-10 lg:grid-cols-2"
                >
                    <motion.div variants={fadeUp(14, 0.35)} className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.15, 0.1] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -top-6 left-6 h-32 w-32 rounded-none bg-white/10 blur-3xl"
                        />
                        <img
                            src="/images/logoL.png"
                            alt="Vanguard"
                            className="relative h-64 w-64"
                        />
                    </motion.div>
                    <motion.div variants={fadeUp(14, 0.35)}>
                        <p className="section-kicker">{t('whitelist.landingKicker')}</p>
                        <h1 className="mt-4">{t('whitelist.landingTitle')}</h1>
                        <p className="mt-4 text-white/70">
                            {t('whitelist.landingDescription')}
                        </p>
                        <div className="mt-6 flex items-center gap-4">
                            <motion.div variants={fadeUp(10, 0.25)} className="rounded-none border border-white/10 bg-black/70 px-6 py-4 text-center">
                                <p className="text-h2 text-white">100+</p>
                                <p className="text-overline uppercase tracking-[0.24em] text-white/60">{t('whitelist.applications')}</p>
                                <p className="text-overline uppercase tracking-[0.24em] text-white/60">{t('whitelist.completed')}</p>
                            </motion.div>
                            <motion.div variants={fadeUp(10, 0.25)} className="flex flex-col gap-3">
                                <motion.div whileHover={{ y: -2 }} whileTap={tapPress}>
                                    <Link href="/whitelist/english" className="btn-primary">
                                        {t('header.english')}
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ y: -2 }} whileTap={tapPress}>
                                    <Link href="/whitelist/sinhala" className="btn-outline">
                                        {t('header.sinhala')}
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>
        </AnimatedPage>
    );
}
