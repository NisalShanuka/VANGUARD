"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import KnowledgebaseEditor from '@/components/KnowledgebaseEditor';

// ─── Reusable input styles ────────────────────────────────────────────────────
const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 0, color: '#fff', fontSize: 12, outline: 'none',
    transition: 'border-color 0.2s',
};
const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.15em',
    marginBottom: 5,
};

function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
    return (
        <div style={{
            position: 'fixed', top: 80, right: 24, zIndex: 9999,
            padding: '14px 20px', borderRadius: 0, fontSize: 13, fontWeight: 700,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid rgba(255,255,255,0.2)`,
            color: '#fff',
            backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', gap: 10
        }}>
            <i className={type === 'success' ? 'fas fa-check-circle text-white' : 'fas fa-exclamation-triangle text-white'} />
            {msg}
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} style={{
            width: 44, height: 24, borderRadius: 0, border: 'none', cursor: 'pointer',
            background: checked ? '#fff' : 'rgba(255,255,255,0.12)',
            position: 'relative', transition: 'background 0.3s', flexShrink: 0,
        }}>
            <span style={{
                position: 'absolute', top: 3, left: checked ? 23 : 3,
                width: 18, height: 18, borderRadius: 0, background: checked ? '#000' : '#fff',
                transition: 'left 0.3s',
            }} />
        </button>
    );
}

// ─── Action Modal (Custom Prompt) ─────────────────────────────────────────────
function ActionModal({ title, promptText, actionButtonText, color, onClose, onSubmit, type = "text", isConfirm = false, selectOptions = null, secondaryType = null, secondaryPlaceholder = "", autocompleteData = null }) {
    const [val, setVal] = useState("");
    const [val2, setVal2] = useState("");
    const [selectVal, setSelectVal] = useState(selectOptions ? selectOptions[0].value : "");

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 400, background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 0, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: '#fff' }}>{title}</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{promptText}</p>

                {!isConfirm && selectOptions && (
                    <select
                        style={{ ...inputStyle, marginBottom: 10, cursor: 'pointer' }}
                        value={selectVal}
                        onChange={e => setSelectVal(e.target.value)}
                    >
                        {selectOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                )}

                {autocompleteData && (
                    <datalist id="actionmodal-datalist">
                        {autocompleteData.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}
                    </datalist>
                )}

                {!isConfirm && (
                    <input
                        autoFocus
                        type={type}
                        list={autocompleteData ? "actionmodal-datalist" : undefined}
                        style={{ ...inputStyle, marginBottom: secondaryType ? 10 : 0 }}
                        value={val}
                        placeholder={autocompleteData ? "Start typing to search..." : ""}
                        onChange={e => setVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !secondaryType && onSubmit(val, selectVal)}
                    />
                )}

                {!isConfirm && secondaryType && (
                    <input
                        type={secondaryType}
                        style={inputStyle}
                        value={val2}
                        placeholder={secondaryPlaceholder}
                        onChange={e => setVal2(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onSubmit(val, selectVal, val2)}
                    />
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: !isConfirm ? 20 : 0, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 0, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cancel</button>
                    <button onClick={() => onSubmit(val, selectVal, val2)} style={{ padding: '8px 16px', background: '#fff', border: 'none', color: '#000', borderRadius: 0, fontSize: 11, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{actionButtonText || 'Confirm'}</button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Player Info Modal (txAdmin Style) ──────────────────────────────────────
function PlayerInfoModal({ player, onClose, onAction, actionLoading }) {
    const [activeTab, setActiveTab] = useState('info');
    const [note, setNote] = useState("");

    const tabs = [
        { id: 'info', label: 'Info', icon: 'fas fa-user-circle' },
        { id: 'history', label: 'History', icon: 'fas fa-history' },
        { id: 'ids', label: 'IDs', icon: 'fas fa-id-card' },
        { id: 'ban', label: 'Ban', icon: 'fas fa-ban' },
    ];

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{ width: 700, background: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: 'monospace' }}>[{player.id}]</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{player.name}</h2>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Character: {player.charName}</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 24 }}>×</button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: '12px 0', border: 'none', background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                                    color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                                    textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.2s',
                                    borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#000' }}>
                        {activeTab === 'info' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Real-time Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Health & Status</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 0, overflow: 'hidden' }}>
                                                <div style={{ width: `${(player.health / player.maxHealth) * 100}%`, height: '100%', background: '#fff' }}></div>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{Math.floor(player.health)}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Current Job</div>
                                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{player.jobLabel}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Money (Cash / Bank)</div>
                                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>${player.cash.toLocaleString()} / <span style={{ opacity: 0.5 }}>${player.bank.toLocaleString()}</span></div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Quick Actions</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                            <button onClick={() => onAction(player, 'revive')} style={{ fontSize: 10, padding: '4px 10px', background: '#fff', color: '#000', border: 'none', borderRadius: 0, cursor: 'pointer', fontWeight: 900 }}>REVIVE</button>
                                            <button onClick={() => onAction(player, 'kill')} style={{ fontSize: 10, padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #fff', borderRadius: 0, cursor: 'pointer', fontWeight: 900 }}>KILL</button>
                                            <button onClick={() => onAction(player, 'clothingMenu')} style={{ fontSize: 10, padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #fff', borderRadius: 0, cursor: 'pointer', fontWeight: 900 }}>CLOTHING</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Session Time</div>
                                        <div style={{ color: '#fff', fontWeight: 700 }}>1 hour, 28 minutes</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Play Time</div>
                                        <div style={{ color: '#fff', fontWeight: 700 }}>1 hour, 27 minutes</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Join Date</div>
                                        <div style={{ color: '#fff', fontWeight: 700 }}>Feb 22, 2026</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>ID Whitelisted</div>
                                        <div style={{ color: '#fff', fontWeight: 700 }}>Yes</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 0 }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Notes:</div>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Type your notes about the player..."
                                        style={{ width: '100%', minHeight: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 0, color: '#fff', fontSize: 13, resize: 'none', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', minHeight: 200 }}>
                                <i className="fas fa-history text-3xl mb-3 opacity-20" />
                                <p style={{ fontSize: 14 }}>No staff action history found for this player.</p>
                            </div>
                        )}

                        {activeTab === 'ids' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Discord ID</div>
                                    <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>discord:{player.discord || "N/A"}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>License</div>
                                    <div style={{ color: '#fff', opacity: 0.8, fontFamily: 'monospace', fontSize: 14 }}>license:{player.license || "N/A"}</div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ban' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: 10 }}>Sanction Player</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Please use the buttons below to ban or unban this player permanently from the server.</p>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={() => onAction(player, 'ban')}
                                        style={{ flex: 1, padding: 14, background: '#fff', color: '#000', border: 'none', borderRadius: 0, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    ><i className="fas fa-hammer" /> Permanent Ban</button>
                                    <button
                                        onClick={() => onAction(player, 'unban')}
                                        style={{ flex: 1, padding: 14, background: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: 0, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    ><i className="fas fa-unlock" /> Lift Ban</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 20px', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => onAction(player, 'giveAdmin')}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        ><i className="fas fa-shield-halved" /> Give Admin</button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => onAction(player, 'dm')}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        ><i className="fas fa-envelope" /> DM</button>
                        <button
                            onClick={() => onAction(player, 'kick')}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        ><i className="fas fa-boot" /> Kick</button>
                        <button
                            onClick={() => onAction(player, 'warn')}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        ><i className="fas fa-exclamation-triangle" /> Warn</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Questions Modal ──────────────────────────────────────────────────────────
function QuestionsModal({ type, onClose }) {
    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState({ label: '', field_type: 'text', options: '', is_required: true });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => { fetchQuestions(); }, []);

    async function fetchQuestions() {
        const res = await fetch(`/api/admin/questions?type_id=${type.id}`);
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
    }

    async function addQuestion(e) {
        e.preventDefault();
        setSaving(true);
        const res = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, type_id: type.id }),
        });
        const data = await res.json();
        setSaving(false);
        if (data.success) {
            setToast({ msg: 'Question added!', type: 'success' });
            setForm({ label: '', field_type: 'text', options: '', is_required: true });
            fetchQuestions();
        } else {
            setToast({ msg: data.error || 'Error', type: 'error' });
        }
    }

    async function deleteQuestion(id) {
        if (!confirm('Delete this question?')) return;
        await fetch('/api/admin/questions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type_id: type.id }),
        });
        fetchQuestions();
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 0, boxShadow: 'none' }}>
                {/* Header */}
                <div style={{ padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#000', zIndex: 1 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Form Builder</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{type.name} — Define application questions</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 0, cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Add form */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, padding: 24 }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Add New Question</h3>
                        <form onSubmit={addQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Question Label *</label>
                                    <input style={inputStyle} placeholder="e.g. Character Age" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Field Type</label>
                                    <select style={{ ...inputStyle }} value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))}>
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="number">Number</option>
                                        <option value="select">Dropdown</option>
                                    </select>
                                </div>
                            </div>
                            {form.field_type === 'select' && (
                                <div>
                                    <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Options (comma separated)</label>
                                    <input style={inputStyle} placeholder="Option 1, Option 2, Option 3" value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} />
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 11, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>
                                    <Toggle checked={form.is_required} onChange={v => setForm(f => ({ ...f, is_required: v }))} />
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Required field</span>
                                </label>
                                <button type="submit" disabled={saving} style={{ padding: '12px 24px', background: '#fff', border: 'none', borderRadius: 0, color: '#000', fontWeight: 900, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {saving ? '...' : '+ Add Question'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Questions list */}
                    <div>
                        <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Existing Questions ({questions.length})</h3>
                        {questions.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0', fontSize: 13, border: '1px dashed rgba(255,255,255,0.1)' }}>No questions yet. Add one above.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {questions.map((q, i) => (
                                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0 }}>
                                        <div>
                                            <p style={{ fontWeight: 800, fontSize: 13, color: '#fff', margin: 0 }}>{i + 1}. {q.label}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Type: <span style={{ color: '#fff' }}>{q.field_type?.toUpperCase()}</span>
                                                {' · '}Required: <span style={{ color: q.is_required ? '#fff' : 'rgba(255,255,255,0.3)' }}>{q.is_required ? 'YES' : 'NO'}</span>
                                                {q.options && <span style={{ opacity: 0.6 }}> · {q.options}</span>}
                                            </p>
                                        </div>
                                        <button onClick={() => deleteQuestion(q.id)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 0, padding: '8px 16px', cursor: 'pointer', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
}

// ─── Type Card ────────────────────────────────────────────────────────────────
function TypeCard({ type: initialType, onDelete, onSave }) {
    const [t, setT] = useState(initialType);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [expanded, setExpanded] = useState(false);

    async function handleSave(overrideData) {
        setSaving(true);
        await onSave(overrideData || t);
        setSaving(false);
    }

    // Auto-save when active toggle is clicked
    async function handleToggleActive(newValue) {
        const updated = { ...t, is_active: newValue };
        setT(updated);
        setToggling(true);
        await onSave(updated);
        setToggling(false);
    }

    async function handleDelete() {
        if (!confirm(`WARNING: This will delete ALL applications and questions for "${t.name}". Proceed?`)) return;
        await onDelete(t.id);
    }

    const statuses = [
        { key: 'pending', label: 'Pending', color: '#f0b429' },
        { key: 'interview', label: 'Interview', color: '#7289da' },
        { key: 'accepted', label: 'Accepted', color: '#43b581' },
        { key: 'declined', label: 'Declined', color: '#f04747' },
    ];

    return (
        <>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.is_active ? 'rgba(67,181,129,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 0, overflow: 'hidden', transition: 'border-color 0.3s' }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 0, background: t.is_active ? 'rgba(67,181,129,0.12)' : 'rgba(114,137,218,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: t.is_active ? '#43b581' : '#7289da', transition: 'all 0.3s' }}>
                            <i className={t.icon || 'fas fa-file-alt'} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>{t.name}</h3>
                            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>/{t.slug}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Active Toggle — auto-saves instantly */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {toggling ? (
                                <div style={{ width: 44, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#43b581', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                </div>
                            ) : (
                                <Toggle checked={!!t.is_active} onChange={handleToggleActive} />
                            )}
                            <span style={{ fontSize: 11, fontWeight: 700, color: t.is_active ? '#43b581' : 'rgba(255,255,255,0.3)' }}>
                                {t.is_active ? 'Active' : 'Hidden'}
                            </span>
                        </div>
                        <button onClick={() => setShowQuestions(true)} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-question-circle" /> Questions
                        </button>
                        <button onClick={() => setExpanded(e => !e)} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            {expanded ? '▲ Collapse' : '▼ Configure'}
                        </button>
                        <button onClick={handleDelete} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-trash-can" /> Delete
                        </button>
                    </div>
                </div>

                {/* Expandable config */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Icon + Cover */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Icon Class (FontAwesome)</label>
                                        <input style={inputStyle} placeholder="fas fa-file-alt" value={t.icon || ''} onChange={e => setT(p => ({ ...p, icon: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Cover Image filename</label>
                                        <input style={inputStyle} placeholder="custom.jpg" value={t.cover_image || ''} onChange={e => setT(p => ({ ...p, cover_image: e.target.value }))} />
                                    </div>
                                </div>

                                {/* Webhooks + Roles */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    {/* Webhooks */}
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 0, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <i className="fas fa-bell" /> Status Webhooks
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {statuses.map(({ key, label, color }) => (
                                                <div key={key}>
                                                    <label style={{ ...labelStyle, color }}>{label} Webhook URL</label>
                                                    <input style={inputStyle} placeholder="https://discord.com/api/webhooks/..."
                                                        value={t[`webhook_${key}`] || ''}
                                                        onChange={e => setT(p => ({ ...p, [`webhook_${key}`]: e.target.value }))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Roles */}
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 0, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <i className="fas fa-masks-theater" /> Auto-Grant Roles
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {statuses.map(({ key, label, color }) => (
                                                <div key={key}>
                                                    <label style={{ ...labelStyle, color }}>{label} Role ID</label>
                                                    <input style={inputStyle} placeholder="Discord Role ID"
                                                        value={t[`role_${key}`] || ''}
                                                        onChange={e => setT(p => ({ ...p, [`role_${key}`]: e.target.value }))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Save button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={() => handleSave()} disabled={saving}
                                        style={{ padding: '12px 32px', background: '#fff', border: 'none', borderRadius: 0, color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {saving ? 'Saving...' : <><i className="fas fa-save" /> Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {showQuestions && <QuestionsModal type={t} onClose={() => setShowQuestions(false)} />}
        </>
    );
}



const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' },
    interview: { label: 'Interview', color: '#fff', bg: 'rgba(255,255,255,0.2)', border: 'rgba(255,255,255,0.4)' },
    accepted: { label: 'Accepted', color: '#000', bg: '#ffffff', border: '#ffffff' },
    declined: { label: 'Declined', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span style={{
            padding: '4px 12px', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
            borderRadius: 0,
        }}>{cfg.label}</span>
    );
}

function ReviewModal({ app, onClose, onUpdated }) {
    const [status, setStatus] = useState(app.status);
    const [notes, setNotes] = useState(app.notes || '');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const answers = (() => {
        try { return typeof app.content === 'string' ? JSON.parse(app.content) : (app.content || {}); }
        catch { return {}; }
    })();

    async function save() {
        setSaving(true);
        const res = await fetch('/api/admin/applications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: app.id, status, notes }),
        });
        const data = await res.json();
        setSaving(false);
        if (data.success) {
            setToast('Saved!');
            setTimeout(() => { onUpdated(); onClose(); }, 800);
        } else {
            setToast(data.error || 'Error saving');
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        }}>
            <motion.div
                initial={{ scale: 0.93, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
                    background: '#000', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 0, boxShadow: 'none',
                }}
            >
                {/* Header */}
                <div style={{ padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#000', zIndex: 1 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Application Review
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {app.username} · {app.type_name}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: 0, cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Applicant info */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                        {app.avatar && (
                            <img src={`https://cdn.discordapp.com/avatars/${app.discord_id}/${app.avatar}.png`}
                                style={{ width: 50, height: 50, borderRadius: 0, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                onError={e => e.target.style.display = 'none'}
                            />
                        )}
                        <div>
                            <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>{app.username}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                                Discord: {app.discord_id} · Submitted: {new Date(app.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div style={{ marginLeft: 'auto' }}><StatusBadge status={app.status} /></div>
                    </div>

                    {/* Answers */}
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Answers</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Object.keys(answers).length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No answers recorded.</p>
                            ) : Object.entries(answers).map(([qId, answer]) => (
                                <div key={qId} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 0 }}>
                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Question #{qId}</p>
                                    <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{answer || '—'}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status update */}
                    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, padding: 24, background: 'rgba(255,255,255,0.01)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Update Decision</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <button key={key} onClick={() => setStatus(key)} style={{
                                    padding: '12px 10px', border: `1px solid ${status === key ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                                    background: status === key ? cfg.bg : 'transparent', color: status === key ? cfg.color : 'rgba(255,255,255,0.4)',
                                    borderRadius: 0, cursor: 'pointer', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                                    transition: 'all 0.2s',
                                }}>
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Staff notes (optional)..."
                            style={{ width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, color: '#fff', fontSize: 13, padding: '12px 16px', outline: 'none', resize: 'vertical', minHeight: 90, boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                            {toast && <span style={{ fontSize: 12, color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{toast}</span>}
                            <button onClick={save} disabled={saving} style={{ marginLeft: 'auto', padding: '12px 32px', background: '#fff', border: 'none', borderRadius: 0, color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {saving ? 'Saving...' : 'Save Decision'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [mainTab, setMainTab] = useState('applications'); // 'applications', 'announcements', 'server'
    const [reviewing, setReviewing] = useState(null);
    const [error, setError] = useState(null);

    const [dashboardToast, setDashboardToast] = useState(null);
    const [actionPrompt, setActionPrompt] = useState(null);

    // Live Server State
    const [players, setPlayers] = useState([]);
    const [serverData, setServerData] = useState({ items: [], jobs: [], gangs: [], vehicles: [] });
    const [serverLoading, setServerLoading] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [capturedScreen, setCapturedScreen] = useState(null);
    const [playerContextMenu, setPlayerContextMenu] = useState(null);

    // Announcements State
    const [announcements, setAnnouncements] = useState([]);
    const [annForm, setAnnForm] = useState({ id: null, title: '', content: '', image: '', is_pinned: false });
    const [isEditingAnn, setIsEditingAnn] = useState(false);
    const [annLoading, setAnnLoading] = useState(false);

    // Application Settings State
    const [types, setTypes] = useState([]);
    const [settingsToast, setSettingsToast] = useState(null);
    const [newForm, setNewForm] = useState({ name: '', description: '', icon: '', cover_image: '' });
    const [creating, setCreating] = useState(false);

    // Admin Logs State
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated' || (status === 'authenticated' && session.user.role !== 'admin')) {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchApps();
        }
    }, [status]);

    async function fetchApps() {
        setLoading(true); setError(null);
        try {
            const res = await fetch('/api/admin/applications');
            const data = await res.json();
            if (Array.isArray(data)) setApplications(data);
            else setError(data.error || 'Failed to load');
        } catch (e) {
            setError('Failed to connect.');
        } finally { setLoading(false); }
    }

    async function fetchServerPlayers() {
        setServerLoading(true); setServerError(null);
        try {
            const res = await fetch('/api/admin/server');
            const data = await res.json();
            if (data.success && Array.isArray(data.players)) {
                setPlayers(data.players);
                // Update selected player data if already selected
                if (selectedPlayer) {
                    const up = data.players.find(p => p.id === selectedPlayer.id);
                    if (up) setSelectedPlayer(up);
                    // Else wait, maybe they disconnected, we can keep it or clear it. We'll leave it as is or handle it later.
                }
            } else {
                setServerError(data.error || 'Failed to fetch players.');
            }
        } catch (e) {
            setServerError('Server offline or API unreachable.');
        } finally {
            setServerLoading(false);
        }
    }

    async function fetchServerData() {
        try {
            const res = await fetch('/api/admin/server/data');
            const data = await res.json();
            if (data.success && data.data) {
                setServerData(data.data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchAnnouncements() {
        try {
            const res = await fetch('/api/admin/announcements');
            const data = await res.json();
            if (Array.isArray(data)) setAnnouncements(data);
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchLogs() {
        setLogsLoading(true);
        try {
            const res = await fetch('/api/admin/logs');
            const data = await res.json();
            if (Array.isArray(data)) setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLogsLoading(false);
        }
    }

    useEffect(() => {
        if (mainTab === 'server') {
            fetchServerPlayers();
            if (serverData.items.length === 0) fetchServerData();
        }
        if (mainTab === 'announcements') fetchAnnouncements();
        if (mainTab === 'settings') fetchTypes();
        if (mainTab === 'logs') fetchLogs();
    }, [mainTab]);

    // --- Settings Methods ---
    async function fetchTypes() {
        setLoading(true);
        const res = await fetch('/api/admin/types');
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
        setLoading(false);
    }

    async function handleSaveType(typeData) {
        const res = await fetch(`/api/admin/types/${typeData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(typeData),
        });
        const data = await res.json();
        if (data.success) {
            setSettingsToast({ msg: `"${typeData.name}" settings saved!`, type: 'success' });
        } else {
            setSettingsToast({ msg: data.error || 'Save failed', type: 'error' });
        }
    }

    async function handleDeleteType(id) {
        const res = await fetch(`/api/admin/types/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            setTypes(ts => ts.filter(t => t.id !== id));
            setSettingsToast({ msg: 'Application type deleted.', type: 'success' });
        } else {
            setSettingsToast({ msg: data.error || 'Delete failed', type: 'error' });
        }
    }

    async function handleCreateType(e) {
        e.preventDefault();
        setCreating(true);
        const res = await fetch('/api/admin/types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newForm),
        });
        const data = await res.json();
        setCreating(false);
        if (data.success) {
            setSettingsToast({ msg: 'New application type created!', type: 'success' });
            setNewForm({ name: '', description: '', icon: '', cover_image: '' });
            fetchTypes();
        } else {
            setSettingsToast({ msg: data.error || 'Creation failed', type: 'error' });
        }
    }

    async function handlePostAnnouncement(e) {
        e.preventDefault();
        setAnnLoading(true);
        try {
            const method = isEditingAnn ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/announcements', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(annForm)
            });
            if (res.ok) {
                setAnnForm({ id: null, title: '', content: '', image: '', is_pinned: false });
                setIsEditingAnn(false);
                fetchAnnouncements();
                alert(`Announcement ${isEditingAnn ? 'updated' : 'posted'}!`);
            } else {
                alert(`Failed to ${isEditingAnn ? 'update' : 'post'} announcement.`);
            }
        } catch (error) {
            alert('An error occurred.');
        } finally {
            setAnnLoading(false);
        }
    }

    function handleEditClick(ann) {
        setIsEditingAnn(true);
        setAnnForm({
            id: ann.id,
            title: ann.title,
            content: ann.content,
            image: ann.image || '',
            is_pinned: ann.is_pinned
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleCancelEdit() {
        setIsEditingAnn(false);
        setAnnForm({ id: null, title: '', content: '', image: '', is_pinned: false });
    }

    async function handleDeleteAnnouncement(id) {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchAnnouncements();
        } catch (e) {
            alert('Failed to delete announcement');
        }
    }

    async function handleServerActionCore(playerId, action, amount = 0, reason = '', accountType = null, grade = null, itemName = null) {
        setActionLoading(true);
        try {
            const payload = { action, playerId };
            if (amount) payload.amount = amount;
            if (reason) payload.reason = reason;
            if (accountType) payload.accountType = accountType;
            if (grade) payload.grade = grade;
            if (itemName) payload.itemName = itemName;

            const res = await fetch('/api/admin/server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (action === 'viewScreen') {
                if (data.success && data.image) {
                    setCapturedScreen(data.image);
                } else {
                    setDashboardToast({ msg: `Screenshot Failed: ${data.error || 'Unknown error'}`, type: 'error' });
                }
                return;
            }

            if (data.success || res.ok) {
                setDashboardToast({ msg: data.message || 'Action successful!', type: 'success' });
                fetchServerPlayers(); // Refresh players silently
            } else {
                setDashboardToast({ msg: `Error: ${data.error}`, type: 'error' });
            }
        } catch (e) {
            setDashboardToast({ msg: 'Failed to execute action.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    }

    function handleServerAction(playerId, action, amount = 0, reason = '') {
        const p = players.find(x => x.id === playerId);
        const name = p ? p.name : playerId;

        if (action === 'kick') {
            setActionPrompt({ isConfirm: false, title: 'Kick Player', promptText: `Reason for kicking ${name}:`, type: 'text', color: '#f97316', actionButtonText: 'Kick Player', onSubmit: (val) => { setActionPrompt(null); if (val) handleServerActionCore(playerId, 'kick', 0, val); } });
        } else if (action === 'ban') {
            setActionPrompt({ isConfirm: false, title: 'Ban Player', promptText: `Reason for banning ${name}:`, type: 'text', color: '#ef4444', actionButtonText: 'Ban Player', onSubmit: (val) => { setActionPrompt(null); if (val) handleServerActionCore(playerId, 'ban', 0, val); } });
        } else if (action === 'giveCash') {
            setActionPrompt({
                isConfirm: false,
                title: 'Give Cash',
                promptText: `Amount to give ${name}:`,
                type: 'number',
                color: '#14b8a6',
                actionButtonText: 'Give Money',
                selectOptions: [
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank', label: 'Bank' }
                ],
                onSubmit: (val, typeVal) => {
                    setActionPrompt(null);
                    if (val && !isNaN(val)) handleServerActionCore(playerId, 'giveCash', parseInt(val), '', typeVal);
                }
            });
        } else if (action === 'setJob') {
            setActionPrompt({
                isConfirm: false,
                title: 'Set Job',
                promptText: `Job name for ${name}:`,
                type: 'text',
                autocompleteData: serverData.jobs,
                color: '#3b82f6',
                actionButtonText: 'Set Job',
                secondaryType: 'number',
                secondaryPlaceholder: 'Job Grade (e.g. 1)',
                onSubmit: (val, _, val2) => {
                    setActionPrompt(null);
                    if (val && val.trim() !== '') handleServerActionCore(playerId, 'setJob', 0, val, null, parseInt(val2) || 0);
                }
            });
        } else if (action === 'setGang') {
            setActionPrompt({
                isConfirm: false,
                title: 'Set Gang',
                promptText: `Gang name for ${name}:`,
                type: 'text',
                autocompleteData: serverData.gangs,
                color: '#ea580c',
                actionButtonText: 'Set Gang',
                secondaryType: 'number',
                secondaryPlaceholder: 'Gang Grade (e.g. 1)',
                onSubmit: (val, _, val2) => {
                    setActionPrompt(null);
                    if (val && val.trim() !== '') handleServerActionCore(playerId, 'setGang', 0, val, null, parseInt(val2) || 0);
                }
            });
        } else if (action === 'giveVehicle') {
            setActionPrompt({
                isConfirm: false,
                title: 'Give Vehicle',
                promptText: `Vehicle spawn name for ${name}:`,
                type: 'text',
                autocompleteData: serverData.vehicles,
                color: '#eab308',
                actionButtonText: 'Give Vehicle',
                onSubmit: (val) => {
                    setActionPrompt(null);
                    if (val && val.trim() !== '') handleServerActionCore(playerId, 'giveVehicle', 0, val);
                }
            });
        } else if (action === 'dm') {
            setActionPrompt({
                isConfirm: false,
                title: 'Direct Message',
                promptText: `Message to ${name}:`,
                type: 'text',
                color: '#f43f5e',
                actionButtonText: 'Send Message',
                onSubmit: (val) => {
                    setActionPrompt(null);
                    if (val && val.trim() !== '') handleServerActionCore(playerId, 'dm', 0, val);
                }
            });
        } else if (action === 'giveItem') {
            setActionPrompt({
                isConfirm: false,
                title: 'Give Item',
                promptText: `Item name for ${name}:`,
                type: 'text',
                autocompleteData: serverData.items,
                color: '#ec4899',
                actionButtonText: 'Give Item',
                secondaryType: 'number',
                secondaryPlaceholder: 'Amount (e.g. 1)',
                onSubmit: (val, _, val2) => {
                    setActionPrompt(null);
                    if (val && val.trim() !== '') handleServerActionCore(playerId, 'giveItem', parseInt(val2) || 1, '', null, null, val);
                }
            });
        } else if (action === 'revive') {
            setActionPrompt({ isConfirm: true, title: 'Revive Player', promptText: `Are you sure you want to revive ${name}?`, color: '#10b981', actionButtonText: 'Revive Player', onSubmit: () => { setActionPrompt(null); handleServerActionCore(playerId, 'revive'); } });
        } else if (action === 'kill') {
            setActionPrompt({ isConfirm: true, title: 'Kill Player', promptText: `Are you sure you want to kill ${name}?`, color: '#ef4444', actionButtonText: 'Kill Player', onSubmit: () => { setActionPrompt(null); handleServerActionCore(playerId, 'kill'); } });
        } else if (action === 'giveAdmin') {
            setActionPrompt({ isConfirm: true, title: 'Give Admin', promptText: `Give Server Admin/God to ${name}?`, color: '#8b5cf6', actionButtonText: 'Give Admin', onSubmit: () => { setActionPrompt(null); handleServerActionCore(playerId, 'giveAdmin'); } });
        } else if (action === 'clothingMenu') {
            setActionPrompt({ isConfirm: true, title: 'Clothing Menu', promptText: `Force open clothing menu for ${name}?`, color: '#f59e0b', actionButtonText: 'Open Menu', onSubmit: () => { setActionPrompt(null); handleServerActionCore(playerId, 'clothingMenu'); } });
        } else if (action === 'viewScreen') {
            setActionPrompt({ isConfirm: true, title: 'View Screen', promptText: `Capture screen of ${name}? Note: This might take a few seconds.`, color: '#a855f7', actionButtonText: 'Capture Screen', onSubmit: () => { setActionPrompt(null); setCapturedScreen(null); handleServerActionCore(playerId, 'viewScreen'); } });
        } else if (action === 'warn') {
            setActionPrompt({ isConfirm: false, title: 'Warn Player', promptText: `Reason for warning ${name}:`, type: 'text', color: '#eab308', actionButtonText: 'Send Warning', onSubmit: (val) => { setActionPrompt(null); if (val) handleServerActionCore(playerId, 'warn', 0, val); } });
        }
    }

    function handlePlayerContextAction(player, action) {
        if (action === 'info') return; // Modal is already open
        else if (action === 'history') alert(`Showing history for ${player.name}`);
        else if (action === 'ids') alert(`IDs: \nDiscord: ${player.discord || 'N/A'}\nLicense: ${player.license || 'N/A'}`);
        else if (action === 'ban') handleServerAction(player.id, 'ban');
        else if (action === 'unban') handleServerAction(player.id, 'unban');
        else if (action === 'kick') handleServerAction(player.id, 'kick');
        else if (action === 'warn') handleServerAction(player.id, 'warn');
        else if (action === 'dm') handleServerAction(player.id, 'dm');
        else if (action === 'giveAdmin') handleServerAction(player.id, 'giveAdmin');
        else if (action === 'kill') handleServerAction(player.id, 'kill');
        else if (action === 'revive') handleServerAction(player.id, 'revive');
        else if (action === 'clothingMenu') handleServerAction(player.id, 'clothingMenu');
    }

    const filteredApps = applications.filter(app => app.status === activeTab);
    const stats = {
        pending: applications.filter(a => a.status === 'pending').length,
        interview: applications.filter(a => a.status === 'interview').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        declined: applications.filter(a => a.status === 'declined').length,
    };

    const TABS = [
        { key: 'pending', label: 'Pending', count: stats.pending, color: '#f0b429' },
        { key: 'interview', label: 'Interview', count: stats.interview, color: '#7289da' },
        { key: 'accepted', label: 'Accepted', count: stats.accepted, color: '#43b581' },
        { key: 'declined', label: 'Declined', count: stats.declined, color: '#f04747' },
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-none animate-spin" />
                <p className="text-[10px] uppercase tracking-widest text-white/30">Loading Applications...</p>
            </div>
        </div>
    );

    return (
        <AnimatedPage>
            {dashboardToast && <Toast msg={dashboardToast.msg} type={dashboardToast.type} onDone={() => setDashboardToast(null)} />}
            {actionPrompt && <ActionModal {...actionPrompt} onClose={() => setActionPrompt(null)} />}
            <PageHeader
                title="Staff Administration"
                subtitle="Admin Panel"
                description="Review and manage incoming community applications."
            />

            <section className="mx-auto max-w-6xl px-6 pb-20">
                {/* Main Tabs */}
                <div className="mb-8 flex gap-2 border-b border-white/10 pb-4">
                    {[
                        { id: 'applications', label: 'Applications', icon: 'fas fa-file-lines' },
                        { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
                        { id: 'server', label: 'Live Server', icon: 'fas fa-network-wired' },
                        { id: 'knowledgebase', label: 'Knowledgebase', icon: 'fas fa-book' },
                        { id: 'logs', label: 'Staff Logs', icon: 'fas fa-folder-open' },
                        { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMainTab(tab.id)}
                            className={`flex items-center gap-2 rounded-none px-5 py-2.5 text-sm font-bold transition-all ${mainTab === tab.id
                                ? 'bg-white text-black'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <i className={tab.icon} /> {tab.label}
                        </button>
                    ))}
                </div>

                {mainTab === 'applications' && (
                    <>
                        <div className="mb-8 flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Application Inbox</p>
                            <button onClick={fetchApps} className="flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition">
                                <i className="fas fa-rotate" /> Refresh
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 border border-white/20 bg-white/5 px-6 py-4 text-white text-sm flex items-center gap-3">
                                <i className="fas fa-exclamation-triangle opacity-50" /> {error}
                            </div>
                        )}

                        {/* Stat cards */}
                        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                            {TABS.map(tab => (
                                <motion.button
                                    key={tab.key}
                                    whileHover={{ y: -3 }}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`glass-panel text-center transition cursor-pointer w-full ${activeTab === tab.key ? 'border-white/50 bg-white/10' : ''}`}
                                >
                                    <p className="text-3xl font-display font-black" style={{ color: activeTab === tab.key ? '#fff' : tab.color }}>{tab.count}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">{tab.label}</p>
                                </motion.button>
                            ))}
                        </div>

                        {/* Tab strip */}
                        <div className="mb-4 flex gap-1 border-b border-white/5 pb-0">
                            {TABS.map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    style={{ color: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.3)' }}
                                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${activeTab === tab.key ? 'border-current' : 'border-transparent'}`}>
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* Applications table */}
                        <div className="glass-panel overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Applicant</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Submitted</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredApps.length > 0 ? filteredApps.map((app) => (
                                            <tr key={app.id} className="transition-colors hover:bg-white/[0.03]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {app.avatar && (
                                                            <img src={`https://cdn.discordapp.com/avatars/${app.discord_id}/${app.avatar}.png`}
                                                                className="h-8 w-8 rounded-none object-cover border border-white/10"
                                                                onError={e => e.target.style.display = 'none'}
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-sm">{app.username || 'Unknown'}</div>
                                                            <div className="text-[10px] text-white/30 font-mono">{app.discord_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-white/10 px-2 py-1 text-[10px] font-bold text-white/80 border border-white/10">
                                                        {app.type_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={app.status} />
                                                </td>
                                                <td className="px-6 py-4 text-[11px] text-white/40">
                                                    {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setReviewing(app)}
                                                        className="btn-primary py-1.5 px-4 text-[10px]"
                                                    >
                                                        REVIEW
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-16 text-center text-white/30 text-sm">
                                                    No {activeTab} applications.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- ANNOUNCEMENTS TAB --- */}
                {mainTab === 'announcements' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="md:col-span-1">
                            <div className="glass-panel p-6 sticky top-24">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                                    {isEditingAnn ? 'Edit Announcement' : 'Post Announcement'}
                                </h3>
                                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1 block">Title</label>
                                        <input
                                            type="text" required
                                            value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-none px-4 py-2 text-sm text-white focus:border-white outline-none"
                                            placeholder="Update v1.5 Deployed"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1 block">Image URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={annForm.image || ''} onChange={e => setAnnForm({ ...annForm, image: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-none px-4 py-2 text-sm text-white focus:border-white outline-none"
                                            placeholder="https://example.com/image.png"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1 block">Content</label>
                                        <textarea
                                            required rows={5}
                                            value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-none px-4 py-2 text-sm text-white focus:border-white outline-none resize-none"
                                            placeholder="Write announcement details here..."
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={annForm.is_pinned} onChange={e => setAnnForm({ ...annForm, is_pinned: e.target.checked })}
                                            className="accent-white"
                                        />
                                        Pin Announcement
                                    </label>
                                    <div className="pt-4 flex flex-col gap-2">
                                        <button
                                            type="submit" disabled={annLoading}
                                            className="w-full btn-primary py-3"
                                        >
                                            {annLoading ? (isEditingAnn ? 'UPDATING...' : 'POSTING...') : (isEditingAnn ? 'UPDATE ANNOUNCEMENT' : 'PUBLISH ANNOUNCEMENT')}
                                        </button>
                                        {isEditingAnn && (
                                            <button
                                                type="button" onClick={handleCancelEdit} disabled={annLoading}
                                                className="w-full py-2.5 px-4 rounded-none border border-white/10 text-white/50 text-xs font-bold tracking-widest uppercase hover:bg-white/5 hover:text-white transition"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="md:col-span-2 space-y-4">
                            {announcements.length === 0 ? (
                                <div className="glass-panel p-12 text-center text-white/30 text-sm">No announcements posted yet.</div>
                            ) : (
                                announcements.map(ann => (
                                    <div key={ann.id} className={`glass-panel p-6 ${ann.is_pinned ? 'border-white/30 bg-white/5' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                {ann.is_pinned && <span className="text-white text-[9px] font-black bg-white/10 px-2 py-0.5 rounded-none border border-white/20 flex items-center gap-1.5"><i className="fas fa-thumbtack" /> PINNED</span>}
                                                <h4 className="text-lg font-bold text-white uppercase tracking-tight">{ann.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-white/30">
                                                    {new Date(ann.created_at).toLocaleDateString()}
                                                </span>
                                                <button onClick={() => handleEditClick(ann)} className="text-white/50 hover:text-white transition" title="Edit">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-white/30 hover:text-white transition" title="Delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        {ann.image && (
                                            <img src={ann.image} alt="Announcement Media" className="w-full h-32 object-cover rounded-none mb-3 border border-white/10" />
                                        )}
                                        <div className="text-white/60 text-sm whitespace-pre-wrap">{ann.content}</div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                            <span>Author:</span> <span className="text-white/70">{ann.author_name}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- LIVE SERVER TAB --- */}
                {mainTab === 'server' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Live Players Overview</h3>
                                <p className="text-sm text-white/40 mt-1">Manage players currently connected to the server.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={fetchServerPlayers} className="border border-white/10 bg-white/5 p-3 rounded-none hover:bg-white/10 transition flex items-center gap-2 text-white/50" disabled={serverLoading}>
                                    <i className={`fas fa-rotate ${serverLoading ? 'animate-spin' : ''}`} /> {serverLoading ? 'Refreshing...' : ''}
                                </button>
                            </div>
                        </div>

                        {serverError && (
                            <div className="border border-white/10 bg-white/5 px-6 py-4 text-white text-sm rounded-none flex items-start gap-4">
                                <i className="fas fa-triangle-exclamation text-white/40 text-lg mt-0.5" />
                                <div>
                                    {serverError}
                                    <span className="text-[10px] text-white/30 mt-2 block uppercase tracking-widest font-bold">Make sure the `vanguard_web_api` Lua script is running on the FiveM server and `.env.local` is configured.</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-6 relative">
                            {/* Left Panel: Selected Player Details & Actions */}
                            <div className="flex-1 space-y-4">
                                {selectedPlayer ? (
                                    <div className="glass-panel p-6 animate-fade-in text-white">
                                        {/* Header */}
                                        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold flex items-center gap-3 uppercase tracking-tight">
                                                    {selectedPlayer.name}
                                                    <span className="bg-white/10 text-white text-[10px] px-2 py-1 rounded-none border border-white/20">ID: {selectedPlayer.id}</span>
                                                </h2>
                                                <p className="text-sm text-white/40 mt-1 uppercase tracking-wider font-semibold">Character: <span className="text-white/80">{selectedPlayer.charName || 'Unknown'}</span></p>
                                                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Job: <span className="text-white font-bold">{selectedPlayer.jobLabel || 'Unemployed'}</span> ({selectedPlayer.jobName || 'unemployed'})</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Ping</p>
                                                    <p className="text-lg font-mono text-white">{selectedPlayer.ping} ms</p>
                                                </div>
                                                <div className="flex gap-4 mt-2">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Cash</p>
                                                        <p className="text-sm font-bold text-white">${(selectedPlayer.cash || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right border-l border-white/10 pl-4">
                                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Bank</p>
                                                        <p className="text-sm font-bold text-white">${(selectedPlayer.bank || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vitals & Needs */}
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Player Vitals & Needs</h3>
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            {/* Health */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                                                    <span>Health</span>
                                                    <span>{selectedPlayer.health} / {selectedPlayer.maxHealth || 200}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden border border-white/10">
                                                    <div className="h-full bg-white rounded-none" style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.health / (selectedPlayer.maxHealth || 200)) * 100))}%` }}></div>
                                                </div>
                                            </div>
                                            {/* Armor */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                                                    <span>Armor</span>
                                                    <span>{selectedPlayer.armor} / 100</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden border border-white/10">
                                                    <div className="h-full bg-white/60 rounded-none" style={{ width: `${Math.min(100, Math.max(0, selectedPlayer.armor))}%` }}></div>
                                                </div>
                                            </div>
                                            {/* Hunger */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                                                    <span>Hunger</span>
                                                    <span>{Math.round(selectedPlayer.hunger)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden border border-white/10">
                                                    <div className="h-full bg-white/40 rounded-none" style={{ width: `${Math.min(100, Math.max(0, selectedPlayer.hunger))}%` }}></div>
                                                </div>
                                            </div>
                                            {/* Thirst */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                                                    <span>Thirst</span>
                                                    <span>{Math.round(selectedPlayer.thirst)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden border border-white/10">
                                                    <div className="h-full bg-white/20 rounded-none" style={{ width: `${Math.min(100, Math.max(0, selectedPlayer.thirst))}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Administration Actions</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {/* Safety & DM Actions */}
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'revive')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Player</span> <span className="flex items-center gap-2"><i className="fas fa-heart" /> Revive</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'kill')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Player</span> <span className="flex items-center gap-2"><i className="fas fa-skull" /> Kill</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'dm')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Social</span> <span className="flex items-center gap-2"><i className="fas fa-comment-dots" /> Direct Msg</span>
                                            </button>

                                            {/* Economy / Reward Actions */}
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'giveCash')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Economy</span> <span className="flex items-center gap-2"><i className="fas fa-money-bill-wave" /> Give Cash</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'giveItem')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Economy</span> <span className="flex items-center gap-2"><i className="fas fa-box-open" /> Give Item</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'giveVehicle')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Reward</span> <span className="flex items-center gap-2"><i className="fas fa-car" /> Give Vehicle</span>
                                            </button>

                                            {/* Roleplay Actions */}
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'setJob')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Roleplay</span> <span className="flex items-center gap-2"><i className="fas fa-briefcase" /> Set Job</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'setGang')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Roleplay</span> <span className="flex items-center gap-2"><i className="fas fa-gun" /> Set Gang</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'clothingMenu')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Roleplay</span> <span className="flex items-center gap-2"><i className="fas fa-shirt" /> Clothing</span>
                                            </button>

                                            {/* Punishment & Staff Actions */}
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'kick')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Punishment</span> <span className="flex items-center gap-2"><i className="fas fa-boot" /> Kick</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'ban')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Punishment</span> <span className="flex items-center gap-2"><i className="fas fa-hammer" /> Ban</span>
                                            </button>

                                            {/* Surveillance / Admin */}
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'viewScreen')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Surveillance</span> <span className="flex items-center gap-2"><i className="fas fa-display" /> View Screen</span>
                                            </button>
                                            <button onClick={() => handleServerAction(selectedPlayer.id, 'giveAdmin')} disabled={actionLoading} className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-bold text-sm transition text-left flex flex-col items-start disabled:opacity-50">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">System</span> <span className="flex items-center gap-2"><i className="fas fa-crown" /> Give Admin</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-16 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-none bg-white/5 flex items-center justify-center mb-4 text-2xl border border-white/10 text-white/20"><i className="fas fa-user-slash" /></div>
                                        <h3 className="text-white font-bold text-lg">No Player Selected</h3>
                                        <p className="text-white/30 text-sm mt-2 max-w-xs">Select a player from the list on the right to view their details and perform administrative actions.</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Player List */}
                            <div className="md:w-72 lg:w-80 shrink-0">
                                <div className="glass-panel sticky top-24 flex flex-col rounded-none" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50">Online Players</h3>
                                        <span className="bg-white text-black px-2 py-0.5 rounded-none text-xs font-bold">{players.length}</span>
                                    </div>

                                    <div className="overflow-y-auto p-2 space-y-1 flex-1 min-h-[300px] custom-scrollbar">
                                        {serverLoading && players.length === 0 ? (
                                            <div className="p-4 text-center text-white/30 text-xs">Loading...</div>
                                        ) : players.length === 0 ? (
                                            <div className="p-4 text-center text-white/30 text-xs">No players online.</div>
                                        ) : (
                                            players.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedPlayer(p)}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setPlayerContextMenu({ x: e.pageX, y: e.pageY, player: p });
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-none flex items-center justify-between group transition-all ${selectedPlayer?.id === p.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
                                                >
                                                    <div className="flex flex-col truncate pr-2">
                                                        <span className={`text-sm font-bold truncate ${selectedPlayer?.id === p.id ? 'text-white' : 'text-white/70'}`}>{p.name}</span>
                                                        <span className="text-[10px] text-white/30 group-hover:text-white/50">{p.charName || 'No Char'}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-none ${selectedPlayer?.id === p.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                                                        #{p.id}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- KNOWLEDGEBASE TAB --- */}
                {mainTab === 'knowledgebase' && (
                    <KnowledgebaseEditor />
                )}

                {/* --- ADMIN LOGS TAB --- */}
                {mainTab === 'logs' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Staff Audit Logs</h3>
                                <p className="text-sm text-white/40 mt-1">Review actions taken by staff members for transparency.</p>
                            </div>
                            <button onClick={fetchLogs} className="border border-white/10 bg-white/5 p-3 rounded-none hover:bg-white/10 transition" disabled={logsLoading}>
                                <i className={`fas fa-rotate ${logsLoading ? 'animate-spin' : ''}`} /> {logsLoading ? 'Loading...' : ''}
                            </button>
                        </div>

                        <div className="glass-panel overflow-hidden">
                            {logsLoading && logs.length === 0 ? (
                                <div className="p-12 text-center text-white/30 text-sm">Loading logs...</div>
                            ) : logs.length === 0 ? (
                                <div className="p-12 text-center text-white/30 text-sm">No logs found.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Timestamp</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Staff Name</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Action Type</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 w-1/2">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {logs.map(log => {
                                            const typeColors = {
                                                'APPLICATION': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
                                                'ANNOUNCEMENT': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                                                'SERVER': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
                                                'SYSTEM': 'text-white/60 bg-white/5 border-white/10'
                                            };
                                            const badgeCls = typeColors[log.action_type] || typeColors['SYSTEM'];

                                            return (
                                                <tr key={log.id} className="hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4 text-xs text-white/40 whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-sm text-white">{log.admin_name}</div>
                                                        <div className="text-[10px] text-white/30 font-mono">{log.admin_discord_id}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-[10px] font-bold border rounded-none ${badgeCls}`}>
                                                            {log.action_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-white/80">
                                                        {log.action_details}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {mainTab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Existing Types */}
                        <div>
                            <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                                Application Categories ({types?.length || 0})
                            </h2>
                            {types?.length === 0 ? (
                                <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                    No application types found. Create one below.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {types?.map(t => (
                                        <TypeCard key={t.id} type={t} onSave={handleSaveType} onDelete={handleDeleteType} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Create New Type */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 0, padding: 24 }}>
                            <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="fas fa-plus-circle opacity-50" /> Add New Application Category
                            </h2>
                            <form onSubmit={handleCreateType}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                                    <div>
                                        <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Category Name *</label>
                                        <input style={inputStyle} placeholder="e.g. Police Department" required value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Description</label>
                                        <input style={inputStyle} placeholder="Short description" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Icon (FA class)</label>
                                        <input style={inputStyle} placeholder="fas fa-shield-halved" value={newForm.icon} onChange={e => setNewForm(f => ({ ...f, icon: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.4)' }}>Cover Image</label>
                                        <input style={inputStyle} placeholder="custom.jpg" value={newForm.cover_image} onChange={e => setNewForm(f => ({ ...f, cover_image: e.target.value }))} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={creating}
                                        style={{ padding: '12px 32px', background: '#fff', border: 'none', borderRadius: 0, color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', opacity: creating ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {creating ? 'Creating...' : <><i className="fas fa-plus" /> Create Category</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </section>

            {/* Review modal */}
            <AnimatePresence>
                {reviewing && (
                    <ReviewModal
                        app={reviewing}
                        onClose={() => setReviewing(null)}
                        onUpdated={fetchApps}
                    />
                )}
            </AnimatePresence>
            {settingsToast && <Toast msg={settingsToast.msg} type={settingsToast.type} onDone={() => setSettingsToast(null)} />}

            {/* --- PLAYER INFO MODAL --- */}
            <AnimatePresence>
                {playerContextMenu && (
                    <PlayerInfoModal
                        player={playerContextMenu.player}
                        onClose={() => setPlayerContextMenu(null)}
                        onAction={handlePlayerContextAction}
                        actionLoading={actionLoading}
                    />
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </AnimatedPage>
    );
}
