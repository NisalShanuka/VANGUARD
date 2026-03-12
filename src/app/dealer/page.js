"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnimatedPage from '@/components/AnimatedPage';
import PageHeader from '@/components/PageHeader';
import { fadeUp, stagger } from '@/components/motionPresets.js';

export default function DealerPanel() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchOrders();
        }
    }, [status]);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/dealer');
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else if (data.error === 'Unauthorized. Dealer access only.' || data.status === 401 || !data.success) {
                // If API rejects them, bounce to UCP
                router.push('/ucp');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            const res = await fetch('/api/dealer', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                setToast(`Order updated to ${newStatus}`);
                
                // Show DM result for debugging
                console.log("DM Result:", data.dm_result);
                if (data.dm_result && !data.dm_result.ok) {
                    alert('Discord DM Failed: ' + (data.dm_result.reason || data.dm_result.error));
                }
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Failed to update order.');
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>
            </div>
        );
    }

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const pastOrders = orders.filter(o => o.status !== 'pending');

    return (
        <AnimatedPage>
            <PageHeader
                title="Dealer Panel"
                subtitle="PDM Order Management"
                description={`View and manage vehicle orders placed by players. Handle these manually in the city.`}
            />

            <section className="mx-auto max-w-7xl px-6 pb-20 mt-10">
                <h3 className="text-xl font-display font-black uppercase text-accent-400 mb-6 tracking-[0.2em] border-b border-white/10 pb-4">Pending Orders ({pendingOrders.length})</h3>
                
                <div className="space-y-4 mb-16">
                    <AnimatePresence>
                        {pendingOrders.map((order, i) => (
                            <motion.div
                                key={order.id}
                                variants={fadeUp(10, i * 0.05)}
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                className="glass-panel flex flex-col md:flex-row md:items-center justify-between p-6 w-full"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-white text-lg font-bold flex items-center gap-3">
                                            <span className="bg-accent-400 text-black px-2 py-0.5 rounded text-sm font-black tracking-widest uppercase">
                                                #PDM-{order.id}
                                            </span>
                                            {order.vehicle_name} 
                                            <span className="text-white/40 text-sm font-mono">({order.vehicle_model})</span>
                                            <span className="bg-white/10 text-white border border-white/20 rounded-full px-3 py-0.5 text-xs font-black">x{order.quantity || 1}</span>
                                        </h4>
                                        {order.is_preorder === 1 && (
                                            <span className="bg-yellow-400 text-black text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded">Pre-Order</span>
                                        )}
                                    </div>
                                    <div className="text-white/60 text-sm mt-2 flex gap-6">
                                        <p><span className="text-white/40 uppercase text-[10px] tracking-widest font-bold">Ordered By:</span> @{order.username}</p>
                                        <p><span className="text-white/40 uppercase text-[10px] tracking-widest font-bold">Discord ID:</span> {order.user_id}</p>
                                        <p><span className="text-white/40 uppercase text-[10px] tracking-widest font-bold">Date:</span> {new Date(order.created_at).toLocaleString()}</p>
                                    </div>
                                    <p className="text-accent-400 font-black text-xl mt-3 tracking-widest">${order.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'declined')}
                                        className="bg-black border border-red-500/50 hover:bg-red-500 hover:text-white px-6 py-3 text-[10px] uppercase font-black tracking-widest text-red-500 transition-all rounded"
                                    >
                                        Decline
                                    </button>
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'completed')}
                                        className="bg-accent-400 text-black px-6 py-3 text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all rounded shadow-2xl"
                                    >
                                        Mark Completed
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {pendingOrders.length === 0 && (
                        <div className="p-10 text-center glass-panel">
                            <p className="text-white/40 text-[10px] tracking-widest uppercase font-black">No pending orders</p>
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-display font-black uppercase text-white/40 mb-6 tracking-[0.2em] border-b border-white/10 pb-4">Recent History ({pastOrders.length})</h3>
                <div className="space-y-4">
                    {pastOrders.map((order, i) => (
                        <div key={order.id} className="glass-panel opacity-60 flex items-center justify-between p-4">
                            <div>
                                <h4 className="text-white font-bold flex items-center gap-2">
                                    <span className="text-accent-400/80 text-xs font-mono">#PDM-{order.id}</span>
                                    {order.vehicle_name} 
                                    <span className="text-white/50 text-xs">x{order.quantity || 1}</span>
                                </h4>
                                <p className="text-white/40 text-xs mt-1">Ordered by {order.username} on {new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded ${
                                    order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {pastOrders.length === 0 && (
                        <div className="p-10 text-center glass-panel">
                            <p className="text-white/40 text-[10px] tracking-widest uppercase font-black">No order history</p>
                        </div>
                    )}
                </div>
            </section>
            
            {toast && (
                <div className="fixed bottom-10 right-10 z-50 bg-black border border-accent-400 text-white px-6 py-4 rounded shadow-2xl flex items-center gap-4 animate-bounce">
                    <i className="fas fa-check-circle text-accent-400 text-xl"></i>
                    <div>
                        <p className="font-bold text-sm">{toast}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-4 text-white/40 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
            )}
        </AnimatedPage>
    );
}
