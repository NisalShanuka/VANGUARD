"use client";
import { useState } from 'react';
import PageHeader from './PageHeader.jsx';
import Sidebar from './Sidebar.jsx';
import { quickLinks as quickLinksData, tags as tagsData } from '../data/sidebar.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { getLocalized } from '../i18n/utils.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function RulesLayout({ data, fullPageData, isAdmin, refreshData }) {
  const { language, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPageData, setNewPageData] = useState({ slug: '', enTitle: '', siTitle: '' });

  const quickLinks = getLocalized(quickLinksData, language);
  const tags = getLocalized(tagsData, language);

  const startEditing = () => {
    setEditData(JSON.parse(JSON.stringify(fullPageData)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/knowledgebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      const result = await res.json();
      if (result.success) {
        setIsEditing(false);
        refreshData();
      } else {
        alert(result.error || 'Failed to save');
      }
    } catch (error) {
      alert('Server error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newPageData.slug || !newPageData.enTitle || !newPageData.siTitle) return alert('Fill all fields');
    try {
      const res = await fetch('/api/admin/knowledgebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newPageData.slug,
          en: { title: newPageData.enTitle, intro: '', sections: [] },
          si: { title: newPageData.siTitle, intro: '', sections: [] }
        })
      });
      const result = await res.json();
      if (result.success) {
        window.location.href = `/rules/${newPageData.slug}`;
      } else {
        alert(result.error || 'Failed to create');
      }
    } catch (error) {
      alert('Server error');
    }
  };

  return (
    <>
      <PageHeader title={data.title} subtitle={t('rules.subtitle')} />

      {isAdmin && (
        <div className="mx-auto max-w-6xl px-6 mb-6 flex gap-4">
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition"
            >
              <i className="fas fa-edit" /> Edit This Page
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-white/5 text-white border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition"
          >
            <i className="fas fa-plus" /> Add New Page
          </button>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {!isEditing ? (
              // ── VIEW MODE ──
              <>
                {data.intro && (
                  <div className="glass-panel mb-6">
                    <p className="section-kicker drop-shadow-[0_0_8px_#2dd4bf66]">{t('rules.overview')}</p>
                    <p className="mt-3 text-body text-white/70">{data.intro}</p>
                  </div>
                )}
                {data.sections.map((section, idx) => (
                  <div key={idx} className="glass-panel mb-6">
                    <h3 className="text-h3 section-title mb-4">{section.title}</h3>
                    <ul className="mt-4 list-disc space-y-2 pl-6 text-body text-white/70">
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ) : (
              // ── EDIT MODE ──
              <div className="space-y-8 glass-panel p-8">
                <div>
                  <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-[0.2em]">Editing: {language === 'en' ? 'English' : 'Sinhala'}</h4>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">Title</label>
                      <input
                        type="text"
                        value={editData[language].title}
                        onChange={e => {
                          const newD = { ...editData };
                          newD[language].title = e.target.value;
                          setEditData(newD);
                        }}
                        className="w-full bg-white/5 border border-white/10 p-3 text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">Intro Text</label>
                      <textarea
                        value={editData[language].intro}
                        onChange={e => {
                          const newD = { ...editData };
                          newD[language].intro = e.target.value;
                          setEditData(newD);
                        }}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 p-3 text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Sections</label>
                        <button
                          onClick={() => {
                            const newD = { ...editData };
                            newD[language].sections.push({ title: 'New Section', items: ['New Rule'] });
                            setEditData(newD);
                          }}
                          className="text-[9px] text-white/40 hover:text-white"
                        >+ ADD SECTION</button>
                      </div>

                      {editData[language].sections.map((section, sIdx) => (
                        <div key={sIdx} className="border border-white/5 bg-white/5 p-4 space-y-4">
                          <div className="flex gap-4">
                            <input
                              type="text"
                              value={section.title}
                              onChange={e => {
                                const newD = { ...editData };
                                newD[language].sections[sIdx].title = e.target.value;
                                setEditData(newD);
                              }}
                              className="flex-1 bg-transparent border-b border-white/10 text-white font-bold outline-none"
                            />
                            <button onClick={() => {
                              const newD = { ...editData };
                              newD[language].sections.splice(sIdx, 1);
                              setEditData(newD);
                            }} className="text-white/20 hover:text-red-500">✕</button>
                          </div>

                          <div className="space-y-2">
                            {section.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex gap-2">
                                <textarea
                                  value={item}
                                  onChange={e => {
                                    const newD = { ...editData };
                                    newD[language].sections[sIdx].items[iIdx] = e.target.value;
                                    setEditData(newD);
                                  }}
                                  rows={2}
                                  className="flex-1 bg-black/40 border border-white/5 p-2 text-xs text-white/80 outline-none"
                                />
                                <button onClick={() => {
                                  const newD = { ...editData };
                                  newD[language].sections[sIdx].items.splice(iIdx, 1);
                                  setEditData(newD);
                                }} className="text-white/10 hover:text-white/40">✕</button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newD = { ...editData };
                                newD[language].sections[sIdx].items.push('New Rule');
                                setEditData(newD);
                              }}
                              className="text-[9px] text-white/20 hover:text-white"
                            >+ ADD RULE</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-4">
                    <p className="text-[10px] text-white/30 italic">Tip: Switching language in the header will allow you to edit that translation.</p>
                    <button onClick={handleSave} disabled={saving} className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-white/90">
                      {saving ? 'SAVING...' : 'SAVE ALL CHANGES'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {data.update && !isEditing && (
              <div className="glass-panel">
                <h4 className="text-h4 mb-4">{t('rules.updates')}</h4>
                <div className="mt-4 flex items-center gap-3">
                  <img src="/images/logo.png" alt="" className="h-10 w-10 rounded-xl" />
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

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel max-w-lg w-full p-8 space-y-6"
            >
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Create New Rule Page</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">URL Slug (e.g. general-rules)</label>
                  <input type="text" value={newPageData.slug} onChange={e => setNewPageData({ ...newPageData, slug: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">English Title</label>
                  <input type="text" value={newPageData.enTitle} onChange={e => setNewPageData({ ...newPageData, enTitle: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest block mb-1">Sinhala Title</label>
                  <input type="text" value={newPageData.siTitle} onChange={e => setNewPageData({ ...newPageData, siTitle: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 text-white outline-none" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleCreateNew} className="flex-1 bg-white text-black py-3 font-black uppercase text-xs tracking-widest">CREATE PAGE</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-white/5 text-white border border-white/10 py-3 font-black uppercase text-xs tracking-widest">CANCEL</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
