"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KnowledgebaseEditor() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPage, setEditingPage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchPages();
    }, []);

    async function fetchPages() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/knowledgebase');
            const data = await res.json();
            if (!data.error) setPages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!editingPage) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/knowledgebase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPage)
            });
            const data = await res.json();
            if (data.success) {
                setToast({ msg: 'Knowledgebase page updated!', type: 'success' });
                setEditingPage(null);
                fetchPages();
            } else {
                setToast({ msg: data.error || 'Failed to save', type: 'error' });
            }
        } catch (error) {
            setToast({ msg: 'Server error', type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-10 text-center text-white/30 font-mono text-xs tracking-widest uppercase">Fetching Knowledgebase...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white">Knowledgebase & Rules</h3>
                    <p className="text-sm text-white/40 mt-1">Directly edit rule pages and situation counts.</p>
                </div>
                {editingPage && (
                    <button onClick={() => setEditingPage(null)} className="btn-secondary text-[10px] px-4 py-2">
                        BACK TO LIST
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {editingPage ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-panel p-6 space-y-8"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight">Editing: <span className="text-white/40 font-mono">/{editingPage.slug}</span></h4>
                            <div className="flex gap-3">
                                <button onClick={() => setEditingPage(null)} className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white transition">CANCEL</button>
                                <button onClick={handleSave} disabled={saving} className="btn-accent px-6 py-2 text-xs">
                                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* English Content */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7289da] border-b border-[#7289da]/20 pb-2">English Content</h5>

                                <div>
                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">Page Title</label>
                                    <input
                                        type="text"
                                        value={editingPage.en.title}
                                        onChange={e => setEditingPage({ ...editingPage, en: { ...editingPage.en, title: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white/40 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">Introductory Text</label>
                                    <textarea
                                        rows={3}
                                        value={editingPage.en.intro || ''}
                                        onChange={e => setEditingPage({ ...editingPage, en: { ...editingPage.en, intro: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white/40 outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest block font-mono">Sections ({editingPage.en.sections.length})</label>
                                        <button
                                            onClick={() => {
                                                const newEn = { ...editingPage.en };
                                                newEn.sections.push({ title: "New Section", items: ["New Item"] });
                                                setEditingPage({ ...editingPage, en: newEn });
                                            }}
                                            className="text-[9px] font-bold text-white/30 hover:text-[#43b581] transition uppercase tracking-widest"
                                        >
                                            + Add Section
                                        </button>
                                    </div>

                                    {editingPage.en.sections.map((section, sIdx) => (
                                        <div key={sIdx} className="bg-white/5 border border-white/5 p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <input
                                                    type="text"
                                                    value={section.title}
                                                    onChange={e => {
                                                        const newEn = { ...editingPage.en };
                                                        newEn.sections[sIdx].title = e.target.value;
                                                        setEditingPage({ ...editingPage, en: newEn });
                                                    }}
                                                    className="bg-transparent border-b border-white/10 text-white font-bold text-sm outline-none pb-1 focus:border-white/40 w-full mr-4"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newEn = { ...editingPage.en };
                                                        newEn.sections.splice(sIdx, 1);
                                                        setEditingPage({ ...editingPage, en: newEn });
                                                    }}
                                                    className="text-white/20 hover:text-red-500 transition"
                                                ><i className="fas fa-trash-can text-xs" /></button>
                                            </div>

                                            <div className="space-y-2">
                                                {section.items.map((item, iIdx) => (
                                                    <div key={iIdx} className="flex gap-2">
                                                        <textarea
                                                            rows={2}
                                                            value={item}
                                                            onChange={e => {
                                                                const newEn = { ...editingPage.en };
                                                                newEn.sections[sIdx].items[iIdx] = e.target.value;
                                                                setEditingPage({ ...editingPage, en: newEn });
                                                            }}
                                                            className="flex-1 bg-black/20 border border-white/5 text-white/70 text-xs p-2 outline-none focus:border-white/20"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newEn = { ...editingPage.en };
                                                                newEn.sections[sIdx].items.splice(iIdx, 1);
                                                                setEditingPage({ ...editingPage, en: newEn });
                                                            }}
                                                            className="text-white/10 hover:text-white/30 px-1"
                                                        >×</button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const newEn = { ...editingPage.en };
                                                        newEn.sections[sIdx].items.push("New rule/item content");
                                                        setEditingPage({ ...editingPage, en: newEn });
                                                    }}
                                                    className="text-[9px] text-white/20 hover:text-white/50 uppercase tracking-widest font-bold"
                                                >
                                                    + Add Item
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sinhala Content */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0b429] border-b border-[#f0b429]/20 pb-2">Sinhala Content</h5>

                                <div>
                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">පිටුවේ මාතෘකාව (Pitawe Mathrukawa)</label>
                                    <input
                                        type="text"
                                        value={editingPage.si.title}
                                        onChange={e => setEditingPage({ ...editingPage, si: { ...editingPage.si, title: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white/40 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1.5 block">හඳුන්වා දීමේ ලිපිය (Intro Text)</label>
                                    <textarea
                                        rows={3}
                                        value={editingPage.si.intro || ''}
                                        onChange={e => setEditingPage({ ...editingPage, si: { ...editingPage.si, intro: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white/40 outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest block font-mono">Sections (Si)</label>
                                        <button
                                            onClick={() => {
                                                const newSi = { ...editingPage.si };
                                                newSi.sections.push({ title: "නව කොටස (New Section)", items: ["නව අයිතමය (New Item)"] });
                                                setEditingPage({ ...editingPage, si: newSi });
                                            }}
                                            className="text-[9px] font-bold text-white/30 hover:text-[#43b581] transition uppercase tracking-widest"
                                        >
                                            + Add Section (Si)
                                        </button>
                                    </div>

                                    {editingPage.si.sections.map((section, sIdx) => (
                                        <div key={sIdx} className="bg-white/5 border border-white/5 p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <input
                                                    type="text"
                                                    value={section.title}
                                                    onChange={e => {
                                                        const newSi = { ...editingPage.si };
                                                        newSi.sections[sIdx].title = e.target.value;
                                                        setEditingPage({ ...editingPage, si: newSi });
                                                    }}
                                                    className="bg-transparent border-b border-white/10 text-white font-bold text-sm outline-none pb-1 focus:border-white/40 w-full mr-4"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                {section.items.map((item, iIdx) => (
                                                    <div key={iIdx} className="flex gap-2">
                                                        <textarea
                                                            rows={2}
                                                            value={item}
                                                            onChange={e => {
                                                                const newSi = { ...editingPage.si };
                                                                newSi.sections[sIdx].items[iIdx] = e.target.value;
                                                                setEditingPage({ ...editingPage, si: newSi });
                                                            }}
                                                            className="flex-1 bg-black/20 border border-white/5 text-white/70 text-xs p-2 outline-none focus:border-white/20"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 flex justify-end">
                            <button onClick={handleSave} disabled={saving} className="btn-accent py-4 px-12">
                                {saving ? 'SAVING CONTENT...' : 'COMMIT CHANGES TO KNOWLEDGEBASE'}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {pages.map(page => (
                            <div key={page.id} className="glass-panel p-5 group hover:border-white transition flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">/{page.slug}</span>
                                        <i className="fas fa-file-signature text-white/10 group-hover:text-white/30 transition" />
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-1">{page.en.title}</h4>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-4">{page.si.title}</p>
                                </div>
                                <button
                                    onClick={() => setEditingPage(JSON.parse(JSON.stringify(page)))}
                                    className="w-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 text-[10px] font-black py-2.5 transition uppercase tracking-widest"
                                >
                                    EDIT PAGE
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {toast && (
                <div className={`fixed bottom-10 right-10 px-6 py-3 font-bold text-sm border shadow-2xl z-[5000] animate-fade-in ${toast.type === 'success' ? 'bg-[#43b581] border-white text-white' : 'bg-red-500 border-white text-white'}`}>
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100">×</button>
                </div>
            )}
        </div>
    );
}
