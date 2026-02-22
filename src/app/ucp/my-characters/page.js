"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { fadeUp, stagger, viewport } from '@/components/motionPresets.js';

// ─── Helpers ───────────────────────────────────────────────────────────────
const vehicleStateMap = {
    0: { label: 'Out in World', color: '#fff' },
    1: { label: 'In Garage', color: '#fff' },
    2: { label: 'Impounded', color: '#888' },
};

function StatBar({ value = 0, max = 100, color = '#fff' }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 0, height: 6, overflow: 'hidden', width: '100%' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 0, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function ItemImage({ name }) {
    const [err, setErr] = useState(false);
    return err
        ? <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 2 }}>{name?.replace(/_/g, ' ')}</div>
        : <img src={`https://cfx-nui-ox_inventory/web/images/${name}.png`} alt={name} onError={() => setErr(true)} style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }} />;
}

function InventoryGrid({ items, title = 'Inventory', icon = <i className="fas fa-suitcase" /> }) {
    if (!items || items.length === 0) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '12px 0' }}>Empty</p>;
    return (
        <div>
            {title && <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>{icon} {title}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
                {items.filter(i => i && i.name).map((item, i) => (
                    <div key={i} title={item.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 0, padding: 8, textAlign: 'center', position: 'relative', transition: 'all 0.2s' }}>
                        <ItemImage name={item.name} />
                        {(item.count || item.amount) > 1 && (
                            <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: 0, padding: '1px 4px' }}>
                                {item.count || item.amount}x
                            </span>
                        )}
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(item.label || item.name || '').replace(/_/g, ' ')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function OverviewTab({ char }) {
    const { charinfo, money, job, gang, metadata, inventory } = char;
    const licences = metadata.licences || {};
    const health = Math.min(100, ((metadata.health ?? 200) / 2));
    const armor = Math.min(100, metadata.armor ?? 0);
    const hunger = Math.round(metadata.hunger ?? 100);
    const thirst = Math.round(metadata.thirst ?? 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Info + Vitals + Licenses row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {/* Personal Info */}
                <div className="char-card">
                    <div className="char-card-header">Personal Information</div>
                    <div className="char-card-body">
                        {[
                            ['Gender', charinfo.gender === 0 ? 'Male' : 'Female'],
                            ['Nationality', charinfo.nationality || 'Los Santos'],
                            ['Birthday', charinfo.birthdate || 'N/A'],
                            ['Contact', charinfo.phone || 'N/A'],
                        ].map(([k, v]) => (
                            <div key={k} className="char-row">
                                <span>{k}</span><strong>{v}</strong>
                            </div>
                        ))}
                        {job?.name && job.name !== 'unemployed' && (
                            <>
                                <div className="char-row"><span>Job</span><strong>{job.label}</strong></div>
                                <div className="char-row"><span>Grade</span><strong>{job.grade?.name || `Grade ${job.grade?.level ?? 0}`}</strong></div>
                            </>
                        )}
                        {gang?.name && gang.name !== 'none' && (
                            <div className="char-row"><span>Gang</span><strong>{gang.label}</strong></div>
                        )}
                    </div>
                </div>

                {/* Vitals */}
                <div className="char-card">
                    <div className="char-card-header">Character Vitals</div>
                    <div className="char-card-body">
                        {[
                            { label: 'Health', value: health, max: 100, color: '#fff' },
                            { label: 'Armor', value: armor, max: 100, color: '#fff' },
                        ].map(({ label, value, max, color }) => (
                            <div key={label} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                                    <span style={{ fontWeight: 700, color: '#fff' }}>{Math.round(value)}%</span>
                                </div>
                                <StatBar value={value} max={max} color={color} />
                            </div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                            {[
                                { label: 'Hunger', value: hunger, color: '#fff' },
                                { label: 'Thirst', value: thirst, color: '#fff' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 0, padding: '10px 0', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}%</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        {metadata.inlaststand && (
                            <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 0, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="fas fa-exclamation-triangle" /> Last Stand Active
                            </div>
                        )}
                    </div>
                </div>

                {/* Licenses */}
                <div className="char-card">
                    <div className="char-card-header">Verification & Licenses</div>
                    <div className="char-card-body">
                        {[
                            { label: 'Driver License', key: 'driver', icon: <i className="fas fa-car" /> },
                            { label: 'Firearm Permit', key: 'weapon', icon: <i className="fas fa-gun" /> },
                            { label: 'L.S. ID Card', key: 'id', icon: <i className="fas fa-id-card" /> },
                        ].map(({ label, key, icon }) => {
                            const valid = licences[key] ?? false;
                            return (
                                <div key={key} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: valid ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${valid ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: 0, padding: '10px 14px', marginBottom: 8
                                }}>
                                    <span style={{ fontSize: 16 }}>{icon}</span>
                                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: valid ? '#fff' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: valid ? '#fff' : 'rgba(255,255,255,0.3)' }}>{valid ? 'VALID' : 'NONE'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Inventory */}
            <div className="char-card">
                <div className="char-card-header"><i className="fas fa- suitcase mr-2" /> Backpack Inventory</div>
                <div className="char-card-body">
                    <InventoryGrid items={inventory} title="" />
                </div>
            </div>
        </div>
    );
}

function GarageTab({ vehicles }) {
    if (!vehicles || vehicles.length === 0) {
        return <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}><i className="fas fa-car mr-2" /> No registered vehicles found.</div>;
    }
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {vehicles.map((v, i) => {
                const state = vehicleStateMap[v.state ?? 0];
                const modelSlug = (v.vehicle || '').toLowerCase().trim();
                const [imgErr, setImgErr] = useState(false);
                return (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 0, overflow: 'hidden' }}>
                        {/* Vehicle image */}
                        <div style={{ position: 'relative', height: 140, background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                            {!imgErr
                                ? <img src={`https://docs.fivem.net/vehicles/${modelSlug}.webp`} alt={v.vehicle}
                                    onError={() => setImgErr(true)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><i className="fas fa-car" /></div>
                            }
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                            <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1.2 }}>{v.vehicle}</p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{v.plate}</p>
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 0, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>{state.label}</span>
                            </div>
                        </div>
                        {/* Condition bars */}
                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Engine', value: v.engine ?? 1000, max: 1000, color: '#fff' },
                                { label: 'Body', value: v.body ?? 1000, max: 1000, color: '#fff' },
                                { label: 'Fuel', value: v.fuel ?? 0, max: 100, color: '#fff' },
                            ].map(({ label, value, max, color }) => (
                                <div key={label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                                        <span style={{ color: '#fff', fontWeight: 700 }}>{Math.round(value / max * 100)}%</span>
                                    </div>
                                    <StatBar value={value} max={max} color={color} />
                                </div>
                            ))}
                            {v.traveldistance > 0 && (
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                                    <i className="fas fa-location-dot mr-1" /> {(v.traveldistance / 1000).toFixed(1)} km traveled
                                    {v.state === 2 && v.depotprice > 0 && <span style={{ color: '#fff' }}> · Depot: ${v.depotprice.toLocaleString()}</span>}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AssetsTab({ apartments, stores, fuelStations }) {
    const hasApts = apartments && apartments.length > 0;
    const hasShops = stores && stores.length > 0;
    const hasFuel = fuelStations && fuelStations.length > 0;

    if (!hasApts && !hasShops && !hasFuel) {
        return <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}><i className="fas fa-building mr-2" /> No commercial assets found.</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {hasApts && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-home mr-2" /> Residential Properties</div>
                    <div className="char-card-body">
                        {apartments.map((apt, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 13 }}>Apt Room #{apt.room_id}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Owner: {apt.owner_name}</p>
                                </div>
                                {apt.due_date && (
                                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Contract Due</p>
                                        <p style={{ fontWeight: 700 }}>{new Date(apt.due_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasShops && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-shop mr-2" /> Stores</div>
                    <div className="char-card-body">
                        {stores.map((st, i) => (
                            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <p style={{ fontWeight: 700 }}>{st.name}</p>
                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>${(st.balance || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasFuel && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-gas-pump mr-2" /> Fuel Stations</div>
                    <div className="char-card-body">
                        {fuelStations.map((fs, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div>
                                    <p style={{ fontWeight: 700 }}>{fs.label}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Stock: {(fs.fuel || 0).toLocaleString()}L</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#fff', fontWeight: 800 }}>${(fs.balance || 0).toLocaleString()}</p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>${(fs.fuelprice || 0).toFixed(2)}/L</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatisticsTab({ dmProfile, diceStats, prison }) {
    const dm = dmProfile || {};
    const dice = diceStats || {};
    const kd = (dm.deaths ?? 0) > 0 ? (dm.kills / dm.deaths).toFixed(2) : (dm.kills ?? 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {prison && (
                <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 0, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}><i className="fas fa-lock" /></span>
                    <div>
                        <p style={{ fontWeight: 700, color: '#fff' }}>Incarcerated</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Time remaining: {prison.time ?? 0} min</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {/* Combat */}
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-swords mr-2" /> City Life: Combat Stats</div>
                    <div className="char-card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                            {[
                                { label: 'Wins', value: dm.wins ?? 0 },
                                { label: 'Losses', value: dm.loses ?? 0 },
                                { label: 'K/D', value: kd, highlight: true },
                            ].map(({ label, value, highlight }) => (
                                <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 0, padding: '12px 0', border: `1px solid ${highlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: highlight ? '#fff' : '#fff' }}>{value}</div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        {[
                            { label: 'Kills', val: dm.kills ?? 0 },
                            { label: 'Deaths', val: dm.deaths ?? 0 },
                            { label: 'Matches', val: dm.played_matches ?? 0 },
                        ].map(({ label, val }) => (
                            <div key={label} className="char-row"><span>{label}</span><strong>{val}</strong></div>
                        ))}
                    </div>
                </div>

                {/* Casino */}
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-dice mr-2" /> Casino Records</div>
                    <div className="char-card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            {[
                                { label: 'Net Profit', value: `$${((dice.total_won ?? 0) - (dice.total_lost ?? 0)).toLocaleString()}` },
                                { label: 'Highest Win', value: `$${(dice.biggest_win ?? 0).toLocaleString()}` },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 0, padding: '12px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{value}</div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        {[
                            { label: 'Wins', val: dice.wins ?? 0 },
                            { label: 'Losses', val: dice.losses ?? 0 },
                            { label: 'Bets', val: dice.bets ?? 0 },
                        ].map(({ label, val }) => (
                            <div key={label} className="char-row"><span>{label}</span><strong>{val}</strong></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StyleTab({ appearance, outfits }) {
    const [openIdx, setOpenIdx] = useState(null);
    const skin = appearance?.skin || {};
    const clothes = appearance?.clothes || {};
    const tattoos = appearance?.tattoos || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Current Clothing */}
            {clothes.drawables && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-shirt mr-2" /> Current Wardrobe</div>
                    <div className="char-card-body">
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Components (Drawables)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 16 }}>
                            {Object.entries(clothes.drawables || {}).filter(([, c]) => c?.value != null && c.value !== -1).map(([name, c]) => (
                                <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 0, padding: '8px 10px' }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'capitalize', marginBottom: 2 }}>{name}</p>
                                    <p style={{ fontSize: 10, color: '#fff' }}>Val: {c.value} · Tex: {c.texture ?? 0}</p>
                                </div>
                            ))}
                        </div>
                        {clothes.props && Object.keys(clothes.props).length > 0 && (
                            <>
                                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Accessories (Props)</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                                    {Object.entries(clothes.props || {}).filter(([, p]) => p?.value != null && p.value !== -1).map(([name, p]) => (
                                        <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 0, padding: '8px 10px' }}>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'capitalize', marginBottom: 2 }}>{name}</p>
                                            <p style={{ fontSize: 10, color: '#fff' }}>Val: {p.value} · Tex: {p.texture ?? 0}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Physical Appearance */}
            {skin.model && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-dna mr-2" /> Physical Appearance</div>
                    <div className="char-card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                            {[
                                ['Model', skin.model ?? 'Unknown'],
                                ['Eye Color', `ID #${skin.eyeColor ?? 0}`],
                                ['Hair Style', `ID ${skin.hair?.style ?? 0}`],
                                ['Hair Color', `#${skin.hair?.color ?? 0} / #${skin.hair?.highlight ?? 0}`],
                            ].map(([k, v]) => (
                                <div key={k} className="char-row"><span>{k}</span><strong>{v}</strong></div>
                            ))}
                        </div>
                        {skin.headStructure && Object.keys(skin.headStructure).length > 0 && (
                            <>
                                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Facial Structure</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {Object.entries(skin.headStructure).map(([name, v]) => (
                                        <div key={name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                                                <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{name.replace(/_/g, ' ')}</span>
                                            </div>
                                            <StatBar value={((v?.value ?? 0) + 1) * 50} max={100} color="#fff" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Tattoos */}
            {tattoos.length > 0 && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-paintbrush mr-2" /> Tattoo Records ({tattoos.length})</div>
                    <div className="char-card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                            {tattoos.slice(0, 30).map((t, i) => {
                                if (!t || typeof t !== 'object') return null;
                                const collection = t.tattoo?.dlc ?? t.collection ?? t.Collection ?? 'Standard';
                                const overlay = t.tattoo?.label ?? t.overlay ?? t.Overlay ?? 'Unknown';
                                return (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 0, padding: '8px 10px' }}>
                                        <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{collection.replace(/mp|custom|_/gi, ' ').trim()}</p>
                                        <p style={{ fontSize: 10, color: '#fff', marginTop: 2 }}>{String(overlay).replace(/_/g, ' ')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Outfits */}
            {outfits && outfits.length > 0 && (
                <div className="char-card">
                    <div className="char-card-header"><i className="fas fa-vest mr-2" /> Saved Outfits ({outfits.length})</div>
                    <div className="char-card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {outfits.map((out, idx) => (
                                <div key={idx}>
                                    <div
                                        onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 0, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>{out.label || `Outfit ${idx + 1}`}</span>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {out.jobname && <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 7px', borderRadius: 0, fontWeight: 700 }}>{out.jobname}</span>}
                                            <span style={{ fontSize: 14, transform: openIdx === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</span>
                                        </div>
                                    </div>
                                    {openIdx === idx && (
                                        <div style={{ padding: 14, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderRadius: 0 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                                                {Object.entries(out.outfit?.drawables || {}).filter(([, c]) => c?.value != null && c.value !== -1).map(([name, c]) => (
                                                    <div key={name} style={{ fontSize: 9, background: 'rgba(255,255,255,0.03)', borderRadius: 0, padding: '5px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <span style={{ color: '#fff', textTransform: 'capitalize', fontWeight: 700 }}>{name}</span>
                                                        <span style={{ display: 'block', color: '#fff' }}>Val: {c.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Character Card ─────────────────────────────────────────────────────
function CharacterCard({ char }) {
    const [tab, setTab] = useState('overview');
    const ci = char.charinfo || {};
    const money = char.money || {};
    const job = char.job || {};
    const avatar = char.avatar_hash && char.discord_id
        ? `https://cdn.discordapp.com/avatars/${char.discord_id}/${char.avatar_hash}.png`
        : null;

    const tabs = [
        { key: 'overview', label: 'Overview', count: null },
        { key: 'garage', label: `Garage`, count: char.vehicles?.length ?? 0 },
        { key: 'assets', label: 'Assets', count: null },
        { key: 'statistics', label: 'Statistics', count: null },
        { key: 'style', label: 'Style', count: null },
    ];

    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 0, overflow: 'hidden', marginBottom: 32 }}>
            {/* Hero section */}
            <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    {/* Avatar */}
                    <div style={{ width: 64, height: 64, borderRadius: 0, overflow: 'hidden', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
                        {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (ci.firstname?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>{ci.firstname} {ci.lastname}</h3>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 0, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {char.citizenid}
                            </span>
                            {job.label && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 0, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    {job.label} — {job.grade?.name || `Grade ${job.grade?.level ?? 0}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Money */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: 0, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 3 }}>Bank Balance</p>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>${(money.bank ?? 0).toLocaleString()}</p>
                    </div>
                    <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.07)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 3 }}>Cash Assets</p>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#aaa', fontFamily: 'monospace' }}>${(money.cash ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 22px', fontSize: 11, fontWeight: 700,
                        color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.35)',
                        borderBottom: `2px solid ${tab === t.key ? '#fff' : 'transparent'}`,
                        transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        {t.label}
                        {t.count !== null && (
                            <span style={{ fontSize: 9, background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)', padding: '1px 6px', borderRadius: 0, fontWeight: 800 }}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '24px 28px' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {tab === 'overview' && <OverviewTab char={char} />}
                        {tab === 'garage' && <GarageTab vehicles={char.vehicles} />}
                        {tab === 'assets' && <AssetsTab apartments={char.apartments} stores={char.stores} fuelStations={char.fuelStations} />}
                        {tab === 'statistics' && <StatisticsTab dmProfile={char.dmProfile} diceStats={char.diceStats} prison={char.prison} />}
                        {tab === 'style' && <StyleTab appearance={char.appearance} outfits={char.outfits} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MyCharacters() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [characters, setCharacters] = useState([]);
    const [gameLinked, setGameLinked] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
        else if (status === 'authenticated') fetchCharacters();
    }, [status]);

    async function fetchCharacters() {
        try {
            const res = await fetch('/api/ucp/characters');
            const data = await res.json();
            if (data.error) {
                setError(data.error + (data.details ? `: ${data.details}` : ''));
            } else {
                setCharacters(data.characters || []);
                setGameLinked(data.gameLinked ?? true);
            }
        } catch {
            setError('Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatedPage>
            <PageHeader
                title="My Characters"
                subtitle="City Registry"
                description="View your in-game characters, vehicles, inventory, and statistics."
            />
            <section className="mx-auto max-w-6xl px-6 pb-20">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: 0, animation: 'spin 0.8s linear infinite' }} />
                    </div>
                ) : error ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 32px', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.4)' }}>
                        <p style={{ fontSize: 32, marginBottom: 12 }}><i className="fas fa-exclamation-triangle opacity-20" /></p>
                        <p style={{ fontWeight: 800, color: '#fff', fontSize: 16, marginBottom: 8 }}>Database Connection Error</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{error}</p>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 8 }}>Make sure XAMPP is running and GAME_DB_NAME is set correctly in .env.local</p>
                    </div>
                ) : !gameLinked ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 32px' }}>
                        <p style={{ fontSize: 40, marginBottom: 16, opacity: 0.2 }}><i className="fas fa-link-slash" /></p>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Discord Not Linked</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Your Discord account is not linked to any city records. Join the server and link your account in-game.</p>
                    </div>
                ) : characters.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 32px' }}>
                        <p style={{ fontSize: 40, marginBottom: 16, opacity: 0.2 }}><i className="fas fa-user-secret" /></p>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>No Characters Found</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>You don't have any active characters in the city yet.</p>
                    </div>
                ) : (
                    characters.map((char) => <CharacterCard key={char.citizenid} char={char} />)
                )}
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .char-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 0; display: flex; flex-direction: column; overflow: hidden; }
                .char-card-header { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.4); }
                .char-card-body { padding: 16px; flex: 1; }
                .char-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; }
                .char-row:last-child { border-bottom: none; }
                .char-row span { color: rgba(255,255,255,0.45); }
                .char-row strong { color: #fff; font-weight: 700; }
            `}</style>
        </AnimatedPage>
    );
}
