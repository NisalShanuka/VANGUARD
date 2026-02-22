"use client";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { heroSlides as heroSlidesData } from '../data/home.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getLocalized } from '../i18n/utils.js';
import { fadeUp, stagger, tapPress, viewport } from './motionPresets.js';

const transition = { duration: 0.6, ease: 'easeOut' };
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: -20, transition },
};

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const { language, t } = useLanguage();
  const heroSlides = getLocalized(heroSlidesData, language);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const slide = heroSlides[index];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={fadeUp(18, 0.5)}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-hero-radial" />
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.42, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundPosition: slide.position ?? 'center',
          }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger(0.12, 0.06)}
        className="relative mx-auto flex h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center gap-12 px-6 pb-24 pt-24"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${language}-${slide.title}`}
            initial="hidden"
            animate="show"
            exit="exit"
            variants={contentVariants}
            className="max-w-2xl"
          >
            <motion.p variants={fadeUp(10, 0.25)} className="section-kicker">
              {slide.tag}
            </motion.p>
            <motion.h1 variants={fadeUp(14, 0.3)} className="mt-4 text-display uppercase tracking-[0.08em]">
              {slide.title}
            </motion.h1>
            <motion.p variants={fadeUp(12, 0.3)} className="mt-4 text-body text-white/70">
              {slide.description}
            </motion.p>
            <motion.div variants={fadeUp(14, 0.32)} className="mt-8 flex flex-wrap gap-4">
              <motion.div whileHover={{ y: -2 }} whileTap={tapPress}>
                <Link href={slide.cta.to} className="btn-primary">
                  {slide.cta.label}
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={tapPress}>
                <Link href="/ucp" className="btn-outline">
                  START STORY
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <motion.div variants={fadeUp(10, 0.2)} className="flex items-center gap-4">
          {heroSlides.map((item, idx) => (
            <motion.button
              key={item.title}
              type="button"
              onClick={() => setIndex(idx)}
              whileHover={{ scaleX: 1.1 }}
              whileTap={tapPress}
              className={`h-1.5 w-10 rounded-none transition ${idx === index ? 'bg-white' : 'bg-white/20'
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
