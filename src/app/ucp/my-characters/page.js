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
        <div className="w-full h-1.5 bg-white/10 overflow-hidden">
            <div className="h-full transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

function ItemImage({ name }) {
    const [err, setErr] = useState(false);
    // Use the proxy API that fetches from ox_inventory
    const src = err ? `/images/items/${name}.png` : `/api/items/${name}.png`;

    return err
        ? <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 2 }}>{name?.replace(/_/g, ' ')}</div>
        : <img src={src} alt={name} onError={() => setErr(true)} style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }} />;
}

function InventoryGrid({ items, title = 'Inventory', icon = <i className="fas fa-suitcase" /> }) {
    if (!items || items.length === 0) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '12px 0' }}>Empty</p>;
    return (
        <div>
            {title && <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>{icon} {title}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
                {items.filter(i => i && i.name).map((item, i) => (
                    <div key={i} title={item.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 8, textAlign: 'center', position: 'relative', transition: 'all 0.2s' }}>
                        <ItemImage name={item.name} />
                        {(item.count || item.amount) > 1 && (
                            <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '1px 4px' }}>
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
                                <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 0', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}%</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        {metadata.inlaststand && (
                            <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                    borderRadius: 12, padding: '10px 14px', marginBottom: 8
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
                <div className="char-card-header"><i className="fas fa-suitcase mr-2" /> Backpack Inventory</div>
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
            {vehicles.map((v, i) => (
                <VehicleCard key={i} vehicle={v} />
            ))}
        </div>
    );
}

function VehicleCard({ vehicle: v }) {
    const [imgErr, setImgErr] = useState(false);
    const state = vehicleStateMap[v.state ?? 0];
    const modelSlug = (v.vehicle || '').toLowerCase().trim();

    return (
        <div className="glass-panel p-0 group">
            {/* Vehicle image */}
            <div className="relative h-40 bg-black/60 overflow-hidden">
                {!imgErr
                    ? <img src={`https://docs.fivem.net/vehicles/${modelSlug}.webp`} alt={v.vehicle}
                        onError={() => setImgErr(true)}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl text-white/10"><i className="fas fa-car" /></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div>
                        <p className="text-sm font-black text-white uppercase tracking-widest leading-none drop-shadow-md">{v.vehicle}</p>
                        <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] mt-1">{v.plate}</p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 bg-white/10 text-white border border-white/20 uppercase tracking-widest backdrop-blur-sm">{state.label}</span>
                </div>
            </div>
            {/* Condition bars */}
            <div className="p-5 flex flex-col gap-4">
                {[
                    { label: 'Engine', value: v.engine ?? 1000, max: 1000, color: '#fff' },
                    { label: 'Body', value: v.body ?? 1000, max: 1000, color: '#fff' },
                    { label: 'Fuel', value: v.fuel ?? 0, max: 100, color: '#fff' },
                ].map(({ label, value, max, color }) => (
                    <div key={label}>
                        <div className="flex justify-between text-[10px] mb-1.5 font-black uppercase tracking-widest text-white/40">
                            <span>{label}</span>
                            <span className="text-white">{Math.round(value / max * 100)}%</span>
                        </div>
                        <StatBar value={value} max={max} color={color} />
                    </div>
                ))}
                {v.traveldistance > 0 && (
                    <p className="text-[10px] text-white/30 border-t border-white/5 pt-3 mt-1 font-bold tracking-wider uppercase">
                        <i className="fas fa-location-dot mr-1 text-white/20" /> {(v.traveldistance / 1000).toFixed(1)} km
                        {v.state === 2 && v.depotprice > 0 && <span className="text-white"> - Depot: ${v.depotprice.toLocaleString()}</span>}
                    </p>
                )}
            </div>
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
                <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
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
                                <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 0', border: `1px solid ${highlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
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
                                <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                                <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 10px' }}>
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
                                        <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 10px' }}>
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
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 10px' }}>
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
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>{out.label || `Outfit ${idx + 1}`}</span>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {out.jobname && <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 7px', borderRadius: 12, fontWeight: 700 }}>{out.jobname}</span>}
                                            <span style={{ fontSize: 14, transform: openIdx === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</span>
                                        </div>
                                    </div>
                                    {openIdx === idx && (
                                        <div style={{ padding: 14, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderRadius: 12 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                                                {Object.entries(out.outfit?.drawables || {}).filter(([, c]) => c?.value != null && c.value !== -1).map(([name, c]) => (
                                                    <div key={name} style={{ fontSize: 9, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '5px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
        <div className="liquid-card mb-12">
            {/* Hero section */}
            <div className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-6 p-6 md:px-10 md:py-10 bg-gradient-to-br from-white/[0.03] to-transparent border-b border-white/5">
                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (ci.firstname?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h3 className="m-0 text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest">{ci.firstname} {ci.lastname}</h3>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            <span className="text-[10px] font-black px-3 py-1 bg-white/5 text-white/50 border border-white/10 uppercase tracking-widest">
                                {char.citizenid}
                            </span>
                            {job.label && (
                                <span className="text-[10px] font-black px-3 py-1 bg-white/10 border border-white/20 text-white uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                    {job.label} — {job.grade?.name || `Grade ${job.grade?.level ?? 0}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Money */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center bg-white/[0.02] px-8 py-5 border border-white/5 backdrop-blur-md w-full md:w-auto">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] mb-1">Bank Balance</p>
                        <p className="text-xl font-black text-white">${(money.bank ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <p className="text-[9px] font-black text-accent-400 uppercase tracking-[0.25em] mb-1">Cash Assets</p>
                        <p className="text-xl font-black text-accent-400">${(money.cash ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-white/[0.02] border-b border-white/5 overflow-x-auto">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-3 transition-colors border-b-2 ${tab === t.key ? 'text-white border-white bg-white/5' : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.02]'}`}>
                        {t.label}
                        {t.count !== null && (
                            <span className={`text-[9px] px-2 py-0.5 font-black ${tab === t.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 md:p-8">
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
        else if (status === 'authenticated') {
            fetchCharacters();
            const interval = setInterval(fetchCharacters, 15000); // Auto-refresh every 15s
            return () => clearInterval(interval);
        }
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
            <div style={{ position: 'relative' }}>
                <PageHeader
                    title="My Characters"
                    subtitle="City Registry"
                    description="View your in-game characters, vehicles, inventory, and statistics."
                />
                <div className="absolute top-8 right-6 md:top-10 md:right-8 flex gap-3">
                    <button onClick={fetchCharacters} disabled={loading} className="btn-outline px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-none">
                        <i className={`fas fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
                        <span className="hidden md:inline ml-2">{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>
            <section className="mx-auto max-w-6xl px-6 pb-20">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
                @keyframes spin {to {transform: rotate(360deg); } }
                .char-card {@apply glass-panel p-0 mb-6; border: 1px solid rgba(255,255,255,0.07) !important; background: rgba(255,255,255,0.01) !important; }
                .char-card-header {@apply flex items-center px-6 py-4 bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase tracking-[0.25em] text-white/40; }
                .char-card-body {@apply p-6; }
                .char-row {@apply flex justify-between items-center py-3 border-b border-white/5 text-xs; }
                .char-row:last-child {@apply border-none pb-0 mb-0; }
                .char-row span {@apply text-white/40 font-black uppercase text-[9px] tracking-[0.2em]; }
                .char-row strong {@apply text-white font-bold; }
            `}</style>
        </AnimatedPage>
    );
}
