import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

function UtilityPage() {
    const navigate = useNavigate();
    const [warehouses, setWarehouses] = useState([]);
    const [totalCapacity, setTotalCapacity] = useState(0);
    const [totalOccupied, setTotalOccupied] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");
                const mail = localStorage.getItem("mail");
                if (!token || !mail) {
                    navigate("/");
                    return;
                }

                // 1. Fetch Warehouses
                const res = await fetch(`${BACKEND_BASE}/warehouses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ mail }),
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        localStorage.clear();
                        navigate("/");
                        return;
                    }
                    throw new Error("Failed to fetch warehouse nodes");
                }

                const data = await res.json();
                let list = data.warehouses || [];

                // 2. Fetch Occupancy for EACH warehouse in parallel
                // We map over the list to attach 'current_occupancy' to each item
                const enrichedList = await Promise.all(
                    list.map(async (w) => {
                        const warehouseId = w.id || w.warehouse_id || w.warehouseId || w.warehouseid;
                        let occupied = 0;

                        // Normalize capacity to number
                        let capacity = w.storage_capacity ?? w.capacity ?? 0;
                        capacity = typeof capacity === "number" ? capacity : Number(capacity) || 0;

                        if (warehouseId) {
                            try {
                                const r = await fetch(`${BACKEND_BASE}/getinfo_warehouse`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ warehouse_id: warehouseId }),
                                });
                                if (r.ok) {
                                    const js = await r.json();
                                    const batches = js.batches || [];
                                    occupied = batches.reduce((acc, b) => {
                                        const q = b.number_of_batches ?? b.quantity ?? b.count ?? 0;
                                        return acc + (typeof q === "number" ? q : Number(q) || 0);
                                    }, 0);
                                }
                            } catch (e) {
                                console.warn(`Failed to fetch batches for ${warehouseId}`, e);
                            }
                        }

                        return { 
                            ...w, 
                            normalized_capacity: capacity,
                            current_occupancy: occupied,
                            utilization: capacity > 0 ? (occupied / capacity) * 100 : 0
                        };
                    })
                );

                setWarehouses(enrichedList);

                // 3. Calculate Totals
                const capSum = enrichedList.reduce((acc, w) => acc + w.normalized_capacity, 0);
                const occSum = enrichedList.reduce((acc, w) => acc + w.current_occupancy, 0);

                setTotalCapacity(capSum);
                setTotalOccupied(occSum);

            } catch (err) {
                console.error("Utility load error:", err);
                setError(err?.message || "Failed to load utility data");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [navigate]);

    const globalUtilization = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100) : 0;

    // Helper to get color based on percentage
    const getProgressColor = (pct) => {
        if (pct >= 90) return "bg-red-500";
        if (pct >= 75) return "bg-amber-400";
        return "bg-cyan-500";
    };

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0f172a,transparent)] opacity-60"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
            </div>

            <Navbar />

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                
                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in-down">
                    <div>
                        <button 
                            onClick={() => navigate("/home")}
                            className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 text-sm font-medium mb-4 transition-colors group"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Return to Dashboard
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            Capacity <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Utilization</span>
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Global infrastructure load balancing and storage metrics.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                            <div className="text-xs font-mono text-slate-500 uppercase">Network Load</div>
                            <div className="text-xl font-bold text-white">{globalUtilization.toFixed(1)}%</div>
                        </div>
                        <div className="h-10 w-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center relative">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                </div>

                {/* --- Error State --- */}
                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-fade-in-down">
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-red-300 font-medium">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                        <div className="text-slate-500 font-mono text-sm animate-pulse">Calculating network volume...</div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in-up">
                        
                        {/* --- KPI Cards --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Capacity */}
                            <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-2">Total Capacity</div>
                                    <div className="text-4xl font-bold text-white mb-1">{totalCapacity.toLocaleString()}</div>
                                    <div className="text-sm text-slate-500">Max Units</div>
                                </div>
                            </div>

                            {/* Card 2: Occupied */}
                            <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2">Currently Stored</div>
                                    <div className="text-4xl font-bold text-white mb-1">{totalOccupied.toLocaleString()}</div>
                                    <div className="text-sm text-slate-500">Active Batches</div>
                                </div>
                            </div>

                            {/* Card 3: Utilization Gauge */}
                            <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Efficiency</div>
                                    <div className="text-2xl font-bold text-white">{globalUtilization.toFixed(1)}%</div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${getProgressColor(globalUtilization)}`}
                                        style={{ width: `${globalUtilization}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500 text-right">Network Load</div>
                            </div>
                        </div>

                        {/* --- Detailed Breakdown Header --- */}
                        <div className="flex items-center gap-3 mt-12 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            <h2 className="text-lg font-semibold text-white">Node Breakdown</h2>
                            <div className="h-px flex-1 bg-slate-800"></div>
                        </div>

                        {/* --- Node Grid --- */}
                        {warehouses.length === 0 ? (
                            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                <p className="text-slate-500">No nodes active. Deploy a warehouse to view metrics.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {warehouses.map((node, idx) => (
                                    <div 
                                        key={node.id || idx}
                                        className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-cyan-900/10 group"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-white truncate">
                                                    {node.name || "Unnamed Node"}
                                                </h3>
                                                <div className="text-[10px] font-mono text-slate-500 uppercase">
                                                    ID: {node.id || node.warehouse_id}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded bg-slate-900 border border-slate-700">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Mini Stats */}
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
                                                    <div className="text-xs text-slate-500">Stored</div>
                                                    <div className="font-mono font-medium text-slate-200">{node.current_occupancy.toLocaleString()}</div>
                                                </div>
                                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
                                                    <div className="text-xs text-slate-500">Total Cap</div>
                                                    <div className="font-mono font-medium text-slate-200">{node.normalized_capacity.toLocaleString()}</div>
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-slate-400">Utilization</span>
                                                    <span className={node.utilization > 90 ? "text-red-400 font-bold" : "text-cyan-400 font-bold"}>
                                                        {node.utilization.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(node.utilization)}`}
                                                        style={{ width: `${Math.min(node.utilization, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Animation Styles */}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
}

export default UtilityPage;