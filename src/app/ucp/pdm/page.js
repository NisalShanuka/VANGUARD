"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { fadeUp, stagger } from '@/components/motionPresets.js';

export default function PDMDealership() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedShop, setSelectedShop] = useState('All');
    const [sortBy, setSortBy] = useState('price-asc');
    const [placingOrder, setPlacingOrder] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchVehicles();
        }
    }, [status]);

    async function fetchVehicles() {
        try {
            const res = await fetch('/api/ucp/pdm/vehicles');
            const data = await res.json();
            if (data.success) {
                setVehicles(data.vehicles);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleOrder(vehicle, isPreorder) {
        if (!confirm(`Are you sure you want to ${isPreorder ? 'pre-order' : 'order'} the ${vehicle.brand} ${vehicle.model} for $${vehicle.price}?`)) return;
        setPlacingOrder(vehicle.spawn_code);
        try {
            const res = await fetch('/api/ucp/pdm/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_model: vehicle.spawn_code,
                    vehicle_name: `${vehicle.brand} ${vehicle.model}`,
                    price: vehicle.price,
                    is_preorder: isPreorder
                })
            });
            const data = await res.json();
            if (data.success) {
                setToast(`Successfully ${isPreorder ? 'pre-ordered' : 'ordered'} the vehicle! A dealer will contact you soon.`);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Failed to place order.');
        } finally {
            setPlacingOrder(null);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
            </div>
        );
    }

    const categories = ['All', ...Array.from(new Set(vehicles.map(v => v.category))).sort()];
    const shops = ['All', ...Array.from(new Set(vehicles.map(v => v.shop))).sort()];

    let filteredVehicles = vehicles.filter(v => 
        (v.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (v.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        v.spawn_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedShop !== 'All') {
        filteredVehicles = filteredVehicles.filter(v => v.shop === selectedShop);
    }

    if (selectedCategory !== 'All') {
        filteredVehicles = filteredVehicles.filter(v => v.category === selectedCategory);
    }

    filteredVehicles.sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        const nameA = `${a.brand || ''} ${a.model}`.trim();
        const nameB = `${b.brand || ''} ${b.model}`.trim();
        if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
        return 0;
    });

    return (
        <AnimatedPage>
            <PageHeader
                title="PDM Dealership"
                subtitle="Vehicle Catalog"
                description={`Browse our premium selection of vehicles. Order now and collect in-city.`}
            />

            <section className="mx-auto max-w-7xl px-6 pb-20">
                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/40 p-5 border border-white/10 rounded-lg">
                    <div className="flex-1 w-full">
                        <input 
                            type="text" 
                            placeholder="Search by brand, model or spawn code..." 
                            className="glass-input w-full md:max-w-md ring-1 ring-white/10 focus:ring-accent-400/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <select 
                            className="glass-input w-full sm:w-auto ring-1 ring-white/10 [&>option]:bg-black text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                        >
                            {shops.map(shop => (
                                <option key={shop} value={shop}>{shop === 'All' ? 'All Shops / Dealerships' : shop}</option>
                            ))}
                        </select>
                        <select 
                            className="glass-input w-full sm:w-auto ring-1 ring-white/10 [&>option]:bg-black text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                            ))}
                        </select>
                        <select 
                            className="glass-input w-full sm:w-auto ring-1 ring-white/10 [&>option]:bg-black text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="price-asc">Sort: Price (Low to High)</option>
                            <option value="price-desc">Sort: Price (High to Low)</option>
                            <option value="name-asc">Sort: Name (A-Z)</option>
                            <option value="name-desc">Sort: Name (Z-A)</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6 border-b border-white/10 pb-4 flex justify-between items-center text-white/40 text-[10px] font-black tracking-[0.2em] uppercase">
                    <p>{filteredVehicles.length} Vehicles Matching Criteria</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence>
                        {filteredVehicles.map((vehicle, i) => {
                            const hasStock = vehicle.unlimited_stock || vehicle.current_stock > 0;
                            return (
                                <motion.div
                                    key={vehicle.spawn_code}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className="glass-panel group relative flex flex-col overflow-hidden p-0 border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all"
                                >
                                    {/* Vehicle Image */}
                                    <div className="h-40 w-full bg-black/40 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                        <img 
                                            src={`https://docs.fivem.net/vehicles/${vehicle.spawn_code}.webp`}
                                            alt={vehicle.model}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                            onError={(e) => {
                                                // If image not found, try a generic GTA V vehicle database URL or fallback to icon
                                                e.target.onerror = null; 
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <i className="fas fa-car text-6xl text-white/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden" style={{ display: 'none' }}></i>
                                        <div className="absolute top-3 right-3 z-20">
                                            <span className="bg-black/80 backdrop-blur text-white text-[10px] font-black tracking-widest px-3 py-1 uppercase rounded-full border border-white/10">
                                                {vehicle.shop || vehicle.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="mb-auto">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-accent-400 mb-1">{vehicle.brand || 'Custom'}</p>
                                            <h3 className="text-xl font-display font-black text-white uppercase tracking-wider mb-2">{vehicle.model}</h3>
                                            <p className="text-white/60 text-sm font-mono">{vehicle.spawn_code}</p>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-white/40 mb-1">Price</p>
                                                <p className="text-lg font-black text-white">${vehicle.price.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase text-white/40 mb-1">Status</p>
                                                {hasStock ? (
                                                    <p className="text-green-400 text-xs font-black uppercase tracking-widest">In Stock</p>
                                                ) : (
                                                    <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Pre-Order</p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOrder(vehicle, !hasStock)}
                                            disabled={placingOrder === vehicle.spawn_code}
                                            className={`mt-4 w-full py-3 text-xs font-black uppercase tracking-widest transition-all rounded ${
                                                hasStock 
                                                    ? 'bg-accent-400 text-black hover:bg-white' 
                                                    : 'bg-yellow-400 text-black hover:bg-white'
                                            } disabled:opacity-50`}
                                        >
                                            {placingOrder === vehicle.spawn_code ? 'Processing...' : (hasStock ? 'Order Vehicle' : 'Pre-Order Now')}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredVehicles.length === 0 && (
                    <div className="text-center py-20 text-white/40 font-bold uppercase tracking-widest">
                        No vehicles found matching your criteria.
                    </div>
                )}
            </section>
            
            {toast && (
                <div className="fixed bottom-10 right-10 z-50 bg-black border border-accent-400 text-white px-6 py-4 rounded shadow-2xl flex items-center gap-4 animate-bounce">
                    <i className="fas fa-check-circle text-accent-400 text-xl"></i>
                    <div>
                        <p className="font-bold text-sm">{toast}</p>
                        <p className="text-xs text-white/60">An admin or dealer will coordinate with you via Discord.</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-4 text-white/40 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
            )}
        </AnimatedPage>
    );
}
