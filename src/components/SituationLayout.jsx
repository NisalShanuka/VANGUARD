"use client";
import { motion } from 'framer-motion';
import PageHeader from './PageHeader.jsx';
import Sidebar from './Sidebar.jsx';
import { quickLinks as quickLinksData, tags as tagsData } from '../data/sidebar.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getLocalized } from '../i18n/utils.js';
import { fadeUp, stagger, viewport } from './motionPresets.js';

function splitItem(item) {
  const index = item.indexOf(':');
  if (index === -1) return { label: item, value: '' };
  return {
    label: item.slice(0, index),
    value: item.slice(index + 1).trim(),
  };
}

export default function SituationLayout({ data }) {
  const { language, t } = useLanguage();
  const quickLinks = getLocalized(quickLinksData, language);
  const tags = getLocalized(tagsData, language);

  return (
    <>
      <PageHeader title={data.title} subtitle={t('situations.subtitle')} />
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger(0.1, 0.04)}
            className="space-y-6"
          >
            {data.sections.map((section) => (
              <motion.div key={section.title} variants={fadeUp(16, 0.4)} className="glass-panel">
                <h3>{section.title}</h3>
                <motion.div
                  variants={stagger(0.06, 0.02)}
                  initial="hidden"
                  whileInView="show"
                  viewport={viewport}
                  className="mt-4 space-y-2"
                >
                  {section.items.map((item) => {
                    const { label, value } = splitItem(item);
                    return (
                      <motion.div
                        key={item}
                        variants={fadeUp(8, 0.2)}
                        className="flex items-center justify-between text-body text-white/70"
                      >
                        <span className="font-semibold text-white">{label}</span>
                        <span>{value}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            ))}

            {data.update && (
              <motion.div variants={fadeUp(14, 0.35)} className="glass-panel">
                <h4>{t('situations.updates')}</h4>
                <div className="mt-4 flex items-center gap-3">
                  <img src="/images/logo.png" alt="" className="h-10 w-10 rounded-xl" />
                  <div>
                    <p className="text-small text-white">{data.update.author}</p>
                    <p className="text-caption text-white/50">{data.update.date}</p>
                  </div>
                </div>
                <p className="mt-4 text-body text-white/70">{data.update.note}</p>
              </motion.div>
            )}
          </motion.div>
          <Sidebar quickLinks={quickLinks} tags={tags} />
        </div>
      </section>
    </>
  );
}
