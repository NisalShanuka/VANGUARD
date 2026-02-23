"use client";
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fadeUp, stagger, tapPress, viewport } from './motionPresets.js';

const socials = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@vanguardrp0.1', icon: 'fa-brands fa-tiktok' },
  { label: 'YouTube', href: 'https://www.youtube.com/@VANGUARDROLEPLAY-u3t', icon: 'fa-brands fa-youtube' },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <motion.footer
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={fadeUp(20, 0.45)}
      className="relative z-10 border-t border-white/5 bg-[#050505]/80 backdrop-blur-3xl"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-white/70 md:flex-row">
        <motion.span variants={fadeUp(12, 0.3)} className="uppercase tracking-widest text-[10px] font-bold">
          {t('footer.copyright')}
        </motion.span>
        <motion.div
          variants={stagger(0.08, 0.04)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="flex items-center gap-4"
        >
          {socials.map((social) => (
            <motion.a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition-all duration-300 hover:border-accent-500/50 hover:bg-accent-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(200,200,200,0.3)] h-10 w-10 flex items-center justify-center"
              aria-label={social.label}
              variants={fadeUp(10, 0.2)}
              whileHover={{ y: -3, rotate: -2 }}
              whileTap={tapPress}
            >
              <i className={social.icon}></i>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.footer>
  );
}
