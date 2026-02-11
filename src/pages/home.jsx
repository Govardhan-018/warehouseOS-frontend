import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function Home() {
  const [warehouses, setWarehouses] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [utilPercent, setUtilPercent] = useState(null);
  const [utilTotalCapacity, setUtilTotalCapacity] = useState(null);
  const [utilTotalOccupied, setUtilTotalOccupied] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const userEmail = localStorage.getItem("mail");

        if (!token || !userEmail) {
          setError("Authentication missing. Redirecting...");
          navigate("/");
          return;
        }

        const base = import.meta.env.VITE_BACKEND_URL;

        // 1) Get warehouses + alerts
        const whRes = await fetch(`${base}/warehouses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mail: userEmail }),
        });

        if (!whRes.ok) {
          if (whRes.status === 401) {
            localStorage.clear();
            navigate("/");
            return;
          }
          const errData = await whRes.json().catch(() => ({}));
          throw new Error(errData?.error || `Server error: ${whRes.status}`);
        }

        const whData = await whRes.json();
        setWarehouses(whData.warehouses || []);
        setAlertsCount(whData.alertsCount || (whData.alerts?.length || 0));

        // 2) Get utility totals
        try {
          const utilRes = await fetch(`${base}/utility`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mail: userEmail }),
          });

          if (utilRes.ok) {
            const utilData = await utilRes.json();
            setUtilTotalCapacity(utilData.totalCapacity ?? 0);
            setUtilTotalOccupied(utilData.totalOccupied ?? 0);
            setUtilPercent(utilData.utilizationPercent ?? 0);
          }
        } catch (e) {
          console.warn("Utility metrics unavailable:", e);
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
        setError(err?.message || "Failed to synchronize dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCreateWarehouse = () => navigate("/create-warehouse");

  const handleSelectWarehouse = (warehouse) => {
    if (!warehouse) return;

    // Preserve original ID resolution logic
    const warehouseId = warehouse.id || warehouse.warehouse_id || warehouse.warehouseId || warehouse.warehouseid;

    localStorage.setItem("currentWarehouse", JSON.stringify(warehouse));

    if (warehouseId) {
      navigate("/warehouse");
    } else {
      console.warn("Node ID resolution failed for:", warehouse);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-40"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>

      <Navbar />

      <main className="relative z-10 px-6 py-10 max-w-7xl mx-auto">

        {/* --- Dashboard Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in-down">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-mono font-medium text-emerald-500 uppercase tracking-widest">Live Telemetry</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Overview</span>
            </h1>
            <p className="text-slate-500 mt-2 max-w-xl">
              Real-time infrastructure monitoring across all active nodes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sync
            </button>
            <button
              onClick={handleCreateWarehouse}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Deploy Node
            </button>
          </div>
        </div>

        {/* --- Error State --- */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-red-200 font-medium">Connection Error</h3>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <span className="text-slate-500 font-mono text-sm animate-pulse">Establishing uplink...</span>
          </div>
        ) : (
          <>
            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-fade-in-up">

              {/* Card 1: Active Nodes */}
              <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <span className="text-xs font-mono text-slate-500 uppercase">Status: OK</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{warehouses.length}</div>
                <div className="text-sm text-slate-400">Active Nodes</div>
              </div>

              {/* Card 2: Alerts */}
              <button
                onClick={() => navigate("/alerts")}
                className={`bg-[#0b1121] border rounded-2xl p-5 text-left transition-all hover:-translate-y-1 ${alertsCount > 0 ? 'border-red-900/50 hover:border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-slate-800 hover:border-slate-600'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg transition-colors ${alertsCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  {alertsCount > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                </div>
                <div className={`text-3xl font-bold mb-1 ${alertsCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>{alertsCount}</div>
                <div className="text-sm text-slate-400">System Alerts</div>
              </button>

              {/* Card 3: Utilization */}
              <button
                onClick={() => navigate("/utility")}
                className="bg-[#0b1121] border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all text-left group hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {utilPercent != null ? `${utilPercent.toFixed(1)}%` : '—'}
                </div>
                <div className="text-sm text-slate-400">Total Utilization</div>
              </button>

              {/* Card 4: Capacity */}
              <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {utilTotalCapacity != null ? utilTotalCapacity.toLocaleString() : '—'}
                </div>
                <div className="text-sm text-slate-400">Total Capacity</div>
              </div>

              {/* Card 5: AI Intelligence */}
              <button
                onClick={() => navigate("/ai-report")}
                className="bg-[#0b1121] border border-slate-800 rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all text-left group hover:-translate-y-1 col-span-1 md:col-span-2 lg:col-span-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                </div>
                <div className="text-xl font-bold text-white mb-1 group-hover:text-purple-300">
                  AI Intelligence
                </div>
                <div className="text-sm text-slate-400">Generate Report</div>
              </button>
            </div>

            {/* --- Nodes Grid --- */}
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              Active Nodes
            </h2>

            {warehouses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 p-16 text-center animate-fade-in-up">
                <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Network Empty</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Initialize your first storage node to begin monitoring infrastructure.</p>
                <button onClick={handleCreateWarehouse} className="text-cyan-400 hover:text-cyan-300 font-medium">
                  + Initialize Node 01
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {warehouses.map((wh, idx) => (
                  <button
                    key={wh.id || wh.warehouse_id || idx}
                    onClick={() => handleSelectWarehouse(wh)}
                    className="group relative bg-[#0b1121] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20 overflow-hidden"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 group-hover:text-cyan-500 transition-colors">
                            ID: {wh.id || wh.warehouse_id || "UNK"}
                          </span>
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-white truncate max-w-[200px]">
                            {wh.name || "Unnamed Node"}
                          </h3>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="truncate">{wh.location || "Location Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          <span>Cap: {wh.storage_capacity || "—"}</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800 group-hover:border-slate-700/50 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                          Online
                        </span>
                        <span className="text-xs text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                          Access Terminal <span>→</span>
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {/* "Add Node" Placeholder Card */}
                <button
                  onClick={handleCreateWarehouse}
                  className="group relative border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-900/40 min-h-[220px]"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 flex items-center justify-center transition-all mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <h3 className="text-white font-medium mb-1 group-hover:text-cyan-300">Deploy New Node</h3>
                  <p className="text-sm text-slate-500 max-w-[200px]">Expand infrastructure capacity</p>
                </button>
              </div>
            )}
          </>
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

export default Home;