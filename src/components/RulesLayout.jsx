"use client";
import { motion } from 'framer-motion';
import PageHeader from './PageHeader.jsx';
import Sidebar from './Sidebar.jsx';
import { quickLinks as quickLinksData, tags as tagsData } from '../data/sidebar.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getLocalized } from '../i18n/utils.js';
import { fadeUp, stagger, viewport } from './motionPresets.js';

export default function RulesLayout({ data }) {
  const { language, t } = useLanguage();
  const quickLinks = getLocalized(quickLinksData, language);
  const tags = getLocalized(tagsData, language);

  return (
    <>
      <PageHeader title={data.title} subtitle={t('rules.subtitle')} />
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {data.intro && (
              <div className="rounded-none border border-white/10 bg-ink-900/90 p-6 shadow-lg">
                <p className="text-overline uppercase tracking-[0.24em] text-white">{t('rules.overview')}</p>
                <p className="mt-3 text-body text-white/70">{data.intro}</p>
              </div>
            )}
            {data.sections.map((section) => (
              <div key={section.title} className="rounded-none border border-white/10 bg-ink-900/90 p-6 shadow-lg">
                <h3 className="text-h3 mb-4">{section.title}</h3>
                <ul className="mt-4 list-disc space-y-2 pl-6 text-body text-white/70">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {data.update && (
              <div className="rounded-none border border-white/10 bg-ink-900/90 p-6 shadow-lg">
                <h4 className="text-h4 mb-4">{t('rules.updates')}</h4>
                <div className="mt-4 flex items-center gap-3">
                  <img src="/images/logo.png" alt="" className="h-10 w-10 rounded-none" />
                  <div>
                    <p className="text-small text-white font-bold">{data.update.author}</p>
                    <p className="text-caption text-white/50">{data.update.date}</p>
                  </div>
                </div>
                <p className="mt-4 text-body text-white/70">{data.update.note}</p>
              </div>
            )}
          </div>
          <Sidebar quickLinks={quickLinks} tags={tags} />
        </div>
      </section>
    </>
  );
}
