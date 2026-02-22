"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fadeUp, stagger, tapPress, viewport } from './motionPresets.js';

const shareIcons = [
  { label: 'Twitter', icon: 'fa-brands fa-x-twitter' },
  { label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
  { label: 'Reddit', icon: 'fa-brands fa-reddit-alien' },
  { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in' },
  { label: 'Pinterest', icon: 'fa-brands fa-pinterest-p' },
  { label: 'TikTok', icon: 'fa-brands fa-tiktok' },
];

export default function Sidebar({ quickLinks = [], tags = [] }) {
  const { t } = useLanguage();

  return (
    <aside className="flex flex-col gap-6">
      <div className="rounded-none border border-white/10 bg-ink-900/90 p-6 shadow-lg">
        <h4 className="text-h4 mb-4">{t('sidebar.share')}</h4>
        <div className="flex flex-wrap gap-3">
          {shareIcons.map((social) => (
            <span
              key={social.label}
              className="rounded-none border border-white/10 p-2 text-white/70 h-9 w-9 flex items-center justify-center cursor-pointer transition hover:-translate-y-1 hover:scale-105"
            >
              <i className={social.icon}></i>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-white/10 bg-ink-900/90 p-6 shadow-lg">
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

      <div className="rounded-none border border-white/10 bg-ink-900/90 p-6 shadow-lg">
        <h4 className="text-h4 mb-4">{t('sidebar.tags')}</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-none border border-white/10 px-3 py-1 text-overline uppercase tracking-[0.2em] text-white/60 transition hover:-translate-y-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
