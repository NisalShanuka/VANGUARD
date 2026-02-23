"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fadeUp, stagger, tapPress, viewport } from './motionPresets.js';

const shareIcons = [
  { label: 'YouTube', icon: 'fa-brands fa-youtube' },
  { label: 'TikTok', icon: 'fa-brands fa-tiktok' },
];

export default function Sidebar({ quickLinks = [], tags = [] }) {
  const { t } = useLanguage();

  return (
    <aside className="flex flex-col gap-6">
      <div className="glass-panel">
        <h4 className="text-h4 mb-4">{t('sidebar.share')}</h4>
        <div className="flex flex-wrap gap-3">
          {shareIcons.map((social) => (
            <span
              key={social.label}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 h-10 w-10 flex items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-accent-500/20 hover:text-white hover:border-accent-500/50 hover:shadow-[0_0_15px_rgba(200,200,200,0.3)]"
            >
              <i className={social.icon}></i>
            </span>
          ))}
        </div>
      </div>

      <div className="glass-panel">
        <h4 className="text-h4 mb-4">{t('sidebar.quickLinks')}</h4>
        <ul className="space-y-2 text-small text-white/70">
          {quickLinks.map((link) => (
            <li key={link.to}>
              <Link className="transition hover:text-white font-bold tracking-widest text-[11px] uppercase" href={link.to}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-panel">
        <h4 className="text-h4 mb-4">{t('sidebar.tags')}</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-overline uppercase tracking-[0.2em] text-white/60 transition-all duration-300 hover:-translate-y-1 hover:bg-accent-500/20 hover:text-white hover:border-accent-500/50 hover:shadow-[0_0_10px_rgba(200,200,200,0.2)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
