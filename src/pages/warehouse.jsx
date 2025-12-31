import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

function Warehouse() {
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispatchingId, setDispatchingId] = useState(null);

  // Load Data
  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        // 1. Get ID from local storage
        let stored = null;
        try {
          const raw = localStorage.getItem("currentWarehouse");
          if (raw) stored = JSON.parse(raw);
        } catch (e) {
          console.warn("Storage parse error", e);
        }

        if (!stored) {
          setError("No warehouse selected.");
          return;
        }

        const warehouseId = stored.id || stored.warehouse_id || stored.warehouseId || stored.warehouseid;

        if (!warehouseId) {
          setError("Invalid warehouse ID reference.");
          return;
        }

        // 2. Fetch Fresh Data
        const res = await fetch(`${BACKEND_BASE}/getinfo_warehouse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ warehouse_id: warehouseId }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.clear();
            navigate("/");
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || "Failed to retrieve node telemetry.");
        }

        const data = await res.json();
        setWarehouse(data.warehouse || stored);
        setBatches(data.batches || []);
      } catch (err) {
        console.error("Warehouse load error:", err);
        setError(err?.message || "Telemetry connection failed.");
      } finally {
        setLoading(false);
      }
    };

    loadWarehouse();
  }, [navigate]);

  // Navigation Helpers
  const goWithWarehouse = (path) => {
    if (!warehouse) return;
    localStorage.setItem("currentWarehouse", JSON.stringify(warehouse));
    navigate(path);
  };

  // Dispatch Action
  const handleDispatch = async (batch) => {
    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");
    const batchId = batch.id || batch.batch_id;

    if (!token || !mail || !batchId) return;

    setDispatchingId(batchId);
    
    try {
      const res = await fetch(`${BACKEND_BASE}/delete-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mail, batchId }),
      });

      if (!res.ok) throw new Error("Dispatch command failed.");

      // Optimistic UI Update
      setBatches((prev) => prev.filter((b) => (b.id || b.batch_id) !== batchId));
    } catch (err) {
      console.error("Dispatch error:", err);
      alert("Failed to dispatch batch: " + err.message);
    } finally {
      setDispatchingId(null);
    }
  };

  // Safe Accessors & Calculations
  const nodeId = warehouse?.id || warehouse?.warehouse_id || "UNK";
  
  // Calculate Load
  const currentLoad = batches.reduce((acc, b) => acc + (Number(b.number_of_batches || b.quantity || 0)), 0);
  
  // Calculate Capacity & Percentage
  const maxCapacity = Number(warehouse?.storage_capacity || 0);
  const utilizationPercent = maxCapacity > 0 ? Math.min((currentLoad / maxCapacity) * 100, 100) : 0;
  const displayCapacity = maxCapacity > 0 ? maxCapacity.toLocaleString() : "—";

  // Helper for progress bar color
  const getProgressColor = (pct) => {
    if (pct > 90) return "from-red-500 to-orange-500";
    if (pct > 75) return "from-amber-400 to-orange-400";
    return "from-cyan-500 to-emerald-500";
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Matrix */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0f172a,transparent)] opacity-60"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* --- Loading State --- */}
        {loading && (
           <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500/20 border-b-emerald-500 rounded-full animate-spin-reverse"></div>
              </div>
              <div className="text-slate-400 font-mono text-sm animate-pulse">Synchronizing Node Telemetry...</div>
           </div>
        )}

        {/* --- Error State --- */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connection Lost</h2>
            <p className="text-slate-400 mb-8">{error}</p>
            <button onClick={() => navigate("/home")} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all">
              Return to Dashboard
            </button>
          </div>
        )}

        {/* --- Main Content --- */}
        {!loading && !error && warehouse && (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Header / Info Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Identity Card */}
              <div className="lg:col-span-2 bg-[#0b1121] border border-slate-800 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                  <svg className="w-24 h-24 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                
                <div className="relative z-10">
                  <button onClick={() => navigate("/home")} className="text-xs font-mono text-cyan-500 hover:text-cyan-400 mb-4 flex items-center gap-2 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    NODE_LIST
                  </button>
                  
                  <h1 className="text-3xl font-bold text-white mb-2">{warehouse.name || "Designated Node"}</h1>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-slate-600 font-mono">ID:</span>
                      <span className="font-mono bg-slate-800/50 px-2 py-0.5 rounded text-slate-300">{nodeId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {warehouse.location || "Sector Unknown"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats / Control Card - FIXED DYNAMIC BAR */}
              <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Capacity Status</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{currentLoad.toLocaleString()}</span>
                    <span className="text-sm text-slate-400 mb-1.5">/ {displayCapacity} units</span>
                  </div>
                  
                  {/* Dynamic Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getProgressColor(utilizationPercent)} opacity-90 transition-all duration-1000 ease-out`}
                      style={{ width: `${utilizationPercent}%` }}
                    ></div>
                  </div>
                  
                  {/* Percentage Label */}
                  <div className="mt-2 text-right text-xs font-mono text-slate-500">
                    {utilizationPercent.toFixed(1)}% Full
                  </div>
                </div>

                <div className="mt-4 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Batches Active</span>
                    <span className="font-mono text-emerald-400">{batches.length} Payload(s)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Action Deck --- */}
            <div className="p-1 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm flex flex-col md:flex-row gap-2">
               <button 
                onClick={() => goWithWarehouse("/create-product")}
                className="flex-1 px-6 py-4 rounded-xl bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-3 border border-transparent hover:border-slate-700 group"
               >
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                 </div>
                 <div className="text-left">
                   <div className="text-sm font-semibold">Add Product</div>
                   <div className="text-xs text-slate-500 group-hover:text-slate-400">Register SKU</div>
                 </div>
               </button>

               <div className="w-px bg-slate-800 hidden md:block"></div>

               <button 
                onClick={() => goWithWarehouse("/create-sensor")}
                className="flex-1 px-6 py-4 rounded-xl bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-3 border border-transparent hover:border-slate-700 group"
               >
                 <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                 </div>
                 <div className="text-left">
                   <div className="text-sm font-semibold">Add Sensor</div>
                   <div className="text-xs text-slate-500 group-hover:text-slate-400">IoT Device</div>
                 </div>
               </button>

               <div className="w-px bg-slate-800 hidden md:block"></div>

               <button 
                onClick={() => goWithWarehouse("/add-batch")}
                className="flex-1 px-6 py-4 rounded-xl bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-3 border border-transparent hover:border-slate-700 group"
               >
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 </div>
                 <div className="text-left">
                   <div className="text-sm font-semibold">New Batch</div>
                   <div className="text-xs text-slate-500 group-hover:text-slate-400">Inbound Logistics</div>
                 </div>
               </button>
            </div>

            {/* --- Inventory Grid --- */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                <h2 className="text-lg font-semibold text-white">Inventory Manifest</h2>
              </div>

              {batches.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h3 className="text-slate-300 font-medium">Empty Manifest</h3>
                  <p className="text-slate-500 text-sm mt-1">No active batches stored in this node.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {batches.map((b, idx) => (
                    <div 
                      key={b.id || b.batch_id || idx} 
                      className="bg-[#0b1121] border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group hover:shadow-lg hover:shadow-cyan-900/10"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                          </div>
                          <div>
                            <div className="text-xs font-mono text-slate-500 uppercase">Batch ID</div>
                            <div className="font-mono text-white">{b.id || b.batch_id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-slate-500 uppercase">Qty</div>
                          <div className="font-bold text-emerald-400">{b.number_of_batches || b.quantity}</div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-lg p-3 text-xs font-mono text-slate-400 flex justify-between items-center mb-5">
                        <span>SENSOR LINK:</span>
                        <span className="text-slate-300">{b.sensor_id || "UNLINKED"}</span>
                      </div>

                      <button 
                        onClick={() => handleDispatch(b)}
                        disabled={dispatchingId === (b.id || b.batch_id)}
                        className="w-full py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {dispatchingId === (b.id || b.batch_id) ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         ) : (
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                         )}
                         {dispatchingId === (b.id || b.batch_id) ? "Dispatching..." : "Dispatch Batch"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-spin-reverse { animation: spin-reverse 3s linear infinite; }
      `}</style>
    </div>
  );
}

export default Warehouse;