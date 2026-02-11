import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Package, Truck, CheckCircle2, XCircle, ChevronRight, ArrowLeft, History, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../services/supabase';
import { Order } from '../types';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await supabase.getOrders();
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'pending': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'cancelled': return 'text-red-500 bg-red-50 border-red-100';
            default: return 'text-gray-500 bg-gray-50 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4" />;
            case 'pending': return <History className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Decrypting Order History</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9] pt-32 pb-24 px-6 md:px-12">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Collection
                        </button>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Your Archive</h1>
                        <div className="flex items-center gap-4">
                            <div className="h-px w-12 bg-black" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {orders.length} Past Transitions Recorded
                            </p>
                        </div>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-16 text-center space-y-8 border border-[#EDEDED] shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black">No acquisitions found</h3>
                            <p className="text-gray-400 font-medium">Your archive is currently empty. Start your collection today.</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="px-10 py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-transform"
                        >
                            Explore Products
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[2.5rem] border border-[#EDEDED] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Order Top Bar */}
                                <div className="px-8 py-6 border-b border-[#EDEDED] flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order Reference</p>
                                            <p className="text-xs font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Transition Date</p>
                                            <p className="text-xs font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="px-8 py-8 space-y-6">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex gap-6 items-center">
                                            <div className="w-20 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                                                <img
                                                    src={item.products?.image_url}
                                                    alt={item.products?.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="grow space-y-1">
                                                <h4 className="font-bold text-sm leading-tight">{item.products?.name}</h4>
                                                <div className="flex gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {item.color && <span>{item.color}</span>}
                                                    {item.size && <span>Size: {item.size}</span>}
                                                    <span>Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm">৳{(item.price_at_time * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer / Summary */}
                                <div className="px-8 py-6 bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <Package className="w-4 h-4" />
                                        Tracking Available soon
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Investment</p>
                                        <p className="text-2xl font-black">৳{Number(order.total).toFixed(2)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
