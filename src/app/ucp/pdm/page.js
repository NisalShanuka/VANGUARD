"use client";
import { useEffect, useState, useMemo } from 'react';
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
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [myOrders, setMyOrders] = useState([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [toast, setToast] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

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

    async function fetchMyOrders() {
        try {
            const res = await fetch('/api/ucp/pdm/my-orders');
            const data = await res.json();
            if (data.success) {
                setMyOrders(data.orders);
            }
        } catch (error) {
            console.error('Error fetching my orders:', error);
        }
    }

    function openMyOrders() {
        fetchMyOrders();
        setIsOrdersOpen(true);
    }

    function addToCart(vehicle) {
        setCart(prev => {
            const existing = prev.find(item => item.spawn_code === vehicle.spawn_code);
            if (existing) {
                return prev.map(item => item.spawn_code === vehicle.spawn_code ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...vehicle, qty: 1 }];
        });
        setToast(`Added ${vehicle.brand || 'Custom'} ${vehicle.model} to cart.`);
    }

    function removeFromCart(spawn_code) {
        setCart(prev => prev.filter(item => item.spawn_code !== spawn_code));
    }

    function updateCartQty(spawn_code, delta) {
        setCart(prev => prev.map(item => {
            if (item.spawn_code === spawn_code) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    }

    async function handleCheckout() {
        if (cart.length === 0) return;
        setPlacingOrder(true);
        try {
            let allSuccess = true;
            let orderIds = [];
            for (const item of cart) {
                let isPreorder = false;
                if (!item.unlimited_stock && item.qty > item.current_stock) {
                    isPreorder = true; 
                }

                const res = await fetch('/api/ucp/pdm/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicle_model: item.spawn_code,
                        vehicle_name: `${item.brand} ${item.model}`,
                        price: item.price * item.qty,
                        quantity: item.qty,
                        is_preorder: isPreorder
                    })
                });
                const data = await res.json();
                if (!data.success) {
                    allSuccess = false;
                } else {
                    orderIds.push(data.order_id);
                }
            }

            if (allSuccess) {
                const idStr = orderIds.map(id => `#PDM-${id}`).join(', ');
                setToast(`Order successful! Reference ID: ${idStr}`);
                setCart([]);
                setIsCartOpen(false);
                fetchVehicles();
            } else {
                alert('Some items failed to order.');
            }
        } catch (e) {
            alert('Checkout failed.');
        } finally {
            setPlacingOrder(false);
        }
    }

    const categories = useMemo(() => ['All', ...Array.from(new Set(vehicles.map(v => v.category || 'Other'))).sort()], [vehicles]);
    const shops = useMemo(() => ['All', ...Array.from(new Set(vehicles.map(v => v.shop || 'Other'))).sort()], [vehicles]);

    const filteredVehicles = useMemo(() => {
        let result = vehicles.filter(v => 
            (v.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
            (v.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (v.spawn_code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );

        if (selectedShop !== 'All') {
            result = result.filter(v => v.shop === selectedShop);
        }

        if (selectedCategory !== 'All') {
            result = result.filter(v => v.category === selectedCategory);
        }

        const sorted = [...result].sort((a, b) => {
            if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
            const nameA = `${a.brand || ''} ${a.model || ''}`.trim();
            const nameB = `${b.brand || ''} ${b.model || ''}`.trim();
            if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
            if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
            return 0;
        });

        return sorted;
    }, [vehicles, searchTerm, selectedShop, selectedCategory, sortBy]);

    const suggestions = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        return vehicles
            .filter(v => 
                (v.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                (v.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            )
            .slice(0, 6); // Top 6 suggestions
    }, [vehicles, searchTerm]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
            </div>
        );
    }

    return (
        <AnimatedPage>
            <PageHeader
                title="PDM Dealership"
                subtitle="Vehicle Catalog"
                description={`Browse our premium selection of vehicles. Order now and collect in-city.`}
            />

            <section className="mx-auto max-w-7xl px-6 pb-20">
                <div className="flex justify-end gap-4 mb-6">
                    <button 
                        onClick={openMyOrders}
                        className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded font-black uppercase tracking-widest text-xs flex items-center hover:bg-white/10 transition-all"
                    >
                        <i className="fas fa-list-alt mr-3 text-accent-400"></i>
                        My Orders
                    </button>
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="bg-accent-400 text-black px-6 py-3 rounded font-black uppercase tracking-widest text-xs flex items-center shadow-[0_0_20px_rgba(var(--accent-400-rgb),0.3)] hover:bg-white hover:scale-105 transition-all"
                    >
                        <i className="fas fa-shopping-cart mr-3"></i>
                        My Cart ({cart.reduce((a,b)=>a+b.qty, 0)})
                    </button>
                </div>

                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/40 p-5 border border-white/10 rounded-lg">
                    <div className="flex-1 w-full relative">
                        <input 
                            type="text" 
                            placeholder="Search by brand, model or spawn code..." 
                            className="glass-input w-full md:max-w-md ring-1 ring-white/10 focus:ring-accent-400/50"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        
                        {/* Search Suggestions Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-0 right-0 md:max-w-md mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden"
                                >
                                    <div className="p-2 border-b border-white/5 bg-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 px-3">Quick Suggestions</p>
                                    </div>
                                    <div className="py-2">
                                        {suggestions.map((s, idx) => (
                                            <button
                                                key={s.spawn_code}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent-400 group transition-colors text-left"
                                                onClick={() => {
                                                    setSearchTerm(s.model);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center border border-white/5 group-hover:border-black/20">
                                                        <img 
                                                            src={`https://docs.fivem.net/vehicles/${s.spawn_code}.webp`} 
                                                            className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                                                            onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block';}}
                                                        />
                                                        <i className="fas fa-car text-white/20 text-lg hidden" style={{ display: 'none' }}></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-xs font-black uppercase group-hover:text-black transition-colors">{s.brand} {s.model}</p>
                                                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest group-hover:text-black/60 transition-colors">{s.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-accent-400 group-hover:text-black font-black text-[10px]">${s.price.toLocaleString()}</p>
                                                    <i className="fas fa-arrow-right text-[10px] text-white/10 group-hover:text-black/40 mt-1"></i>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 1) }}
                                    className="glass-panel group relative flex flex-col overflow-hidden p-0 border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all"
                                >
                                    {/* Vehicle Image */}
                                    <div className="h-40 w-full bg-black/40 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                        <img 
                                            src={`https://docs.fivem.net/vehicles/${vehicle.spawn_code}.webp`}
                                            alt={vehicle.model}
                                            loading="lazy"
                                            className="w-full h-full object-contain p-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
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
                                                <p className="text-[10px] font-bold uppercase text-white/40 mb-1">Stock</p>
                                                {vehicle.unlimited_stock ? (
                                                    <p className="text-green-400 text-xs font-black uppercase tracking-widest">In Stock</p>
                                                ) : hasStock ? (
                                                    <p className="text-green-400 text-xs font-black uppercase tracking-widest" title={`${vehicle.pending_orders} pending orders limit actual stock`}>
                                                        {vehicle.current_stock} Available
                                                        {vehicle.pending_orders > 0 && <span className="text-white/30 text-[9px] ml-1">({vehicle.pending_orders} Pending)</span>}
                                                    </p>
                                                ) : (
                                                    <p className="text-yellow-400 text-xs font-black uppercase tracking-widest" title={`Original stock was ${vehicle.original_stock}, but ${vehicle.pending_orders} are pending`}>
                                                        Pre-Order
                                                        {vehicle.pending_orders > 0 && <span className="text-white/30 text-[9px] ml-1">({vehicle.pending_orders} Pending)</span>}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => addToCart(vehicle)}
                                            className={`mt-4 w-full py-3 text-xs font-black uppercase tracking-widest transition-all rounded bg-white/10 text-white hover:bg-accent-400 hover:text-black shadow-lg border border-white/10 hover:border-transparent`}
                                        >
                                            <i className="fas fa-cart-plus mr-2"></i> Add to Cart
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
            
            {/* Cart Sidebar */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ x: '100%' }} 
                            animate={{ x: 0 }} 
                            exit={{ x: '100%' }} 
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                                <h2 className="text-xl font-display font-black uppercase tracking-widest text-white">Your Cart</h2>
                                <button onClick={() => setIsCartOpen(false)} className="text-white/40 hover:text-white">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>

                            {cart.length > 0 && (
                                <div className="p-6 border-b border-white/10 bg-black/60 shadow-lg z-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Total</span>
                                        <span className="text-2xl font-black text-white">${cart.reduce((a,b)=>a+(b.price*b.qty),0).toLocaleString()}</span>
                                    </div>
                                    <button 
                                        onClick={handleCheckout}
                                        disabled={placingOrder}
                                        className="w-full bg-accent-400 text-black py-4 rounded font-black uppercase tracking-widest text-sm hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(var(--accent-400-rgb),0.3)]"
                                    >
                                        {placingOrder ? 'Processing...' : 'Place Order Now'}
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="text-center text-white/40 pt-20">
                                        <i className="fas fa-shopping-cart text-4xl mb-4 opacity-20"></i>
                                        <p className="font-bold uppercase tracking-widest text-xs">Cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => {
                                        const isPreorder = !item.unlimited_stock && item.qty > item.current_stock;
                                        return (
                                            <div key={item.spawn_code} className="bg-white/5 border border-white/10 p-4 rounded flex gap-4 relative group">
                                                <button onClick={() => removeFromCart(item.spawn_code)} className="absolute top-2 right-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                <div className="w-20 h-16 bg-black/50 rounded overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                                    <img src={`https://docs.fivem.net/vehicles/${item.spawn_code}.webp`} className="w-full h-full object-contain opacity-80" onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block';}} />
                                                    <i className="fas fa-car text-white/20 text-2xl" style={{ display: 'none' }}></i>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-white uppercase">{item.brand} {item.model}</h4>
                                                    <p className="text-accent-400 font-black text-xs mt-1">${(item.price * item.qty).toLocaleString()}</p>
                                                    {isPreorder && (
                                                        <p className="text-yellow-400 text-[9px] uppercase font-black tracking-widest mt-1">Contains Pre-order</p>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <button onClick={() => updateCartQty(item.spawn_code, -1)} className="w-6 h-6 rounded bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><i className="fas fa-minus text-[10px]"></i></button>
                                                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                                        <button onClick={() => updateCartQty(item.spawn_code, 1)} className="w-6 h-6 rounded bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><i className="fas fa-plus text-[10px]"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* My Orders Sidebar */}
            <AnimatePresence>
                {isOrdersOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsOrdersOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ x: '100%' }} 
                            animate={{ x: 0 }} 
                            exit={{ x: '100%' }} 
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-xl font-display font-black uppercase tracking-widest text-white">My Order History</h2>
                                <button onClick={() => setIsOrdersOpen(false)} className="text-white/40 hover:text-white">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto w-full p-6 space-y-4">
                                {myOrders.length === 0 ? (
                                    <div className="text-center text-white/40 pt-20">
                                        <i className="fas fa-box-open text-4xl mb-4 opacity-20"></i>
                                        <p className="font-bold uppercase tracking-widest text-xs">No orders found</p>
                                    </div>
                                ) : (
                                    myOrders.map(order => (
                                        <div key={order.id} className="bg-white/5 border border-white/10 p-4 rounded flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-accent-400/80 text-xs font-mono mb-1 block">#PDM-{order.id}</span>
                                                    <h4 className="text-sm font-bold text-white uppercase">{order.vehicle_name}</h4>
                                                    {order.is_preorder === 1 && (
                                                        <span className="text-yellow-400 text-[9px] uppercase font-black tracking-widest">Pre-Order</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${
                                                        order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                                                        order.status === 'declined' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                                        'bg-white/10 text-white border border-white/20'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center opacity-60">
                                                <p className="text-xs">{(order.quantity || 1)}x • ${(order.price).toLocaleString()}</p>
                                                <p className="text-[10px]">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {toast && (
                <div className="fixed bottom-10 right-10 z-50 bg-black border border-accent-400 text-white px-6 py-4 rounded shadow-2xl flex items-center gap-4 animate-bounce">
                    <i className="fas fa-check-circle text-accent-400 text-xl"></i>
                    <div>
                        <p className="font-bold text-sm">{toast}</p>
                        <p className="text-xs text-white/60">Give this ID to a dealer in-city when collecting your vehicle!</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-4 text-white/40 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
            )}
        </AnimatedPage>
    );
}
