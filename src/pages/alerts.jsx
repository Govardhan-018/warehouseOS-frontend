import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const mail = localStorage.getItem("mail");

        if (!token || !mail) {
          navigate("/");
          return;
        }

        const res = await fetch(`${BACKEND_BASE}/alerts`, {
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
          const txt = await res.text().catch(() => "");
          let parsed;
          try { parsed = JSON.parse(txt); } catch { parsed = null; }
          throw new Error(parsed?.error || "Failed to retrieve logs");
        }

        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error("Fetch alerts error:", err);
        setError(err?.message || "System error fetching alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [navigate]);

  const handleResolveAll = async () => {
    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");
    if (!token || !mail) {
      navigate("/");
      return;
    }

    setResolving(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/alerts/resolve-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mail }),
      });

      if (!res.ok) throw new Error("Resolution failed");

      setAlerts((prev) => prev.map((a) => ({ ...a, is_resolved: true })));
    } catch (err) {
      console.error("Resolve all error:", err);
      setError("Failed to execute batch resolution.");
    } finally {
      setResolving(false);
    }
  };

  const unresolved = alerts.filter((a) => a.is_resolved === false || a.is_resolved == null);
  const resolved = alerts.filter((a) => a.is_resolved === true);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-red-500/30 selection:text-red-200">
      
      {/* Red/Danger Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#450a0a,transparent)] opacity-30"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in-down">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 text-sm font-medium mb-4 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Alert Logs</span>
              {unresolved.length > 0 && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </h1>
            <p className="text-slate-500 mt-2">
              Anomaly detection stream. Prioritize active threats to network integrity.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-xs font-mono text-slate-500 uppercase">Active Threats</span>
              <span className="text-2xl font-bold text-red-400">{unresolved.length}</span>
            </div>
            
            <button 
              onClick={handleResolveAll}
              disabled={resolving || unresolved.length === 0}
              className="relative group overflow-hidden px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10 flex items-center gap-2 font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                {resolving ? (
                   <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
                Batch Resolve
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-3 animate-fade-in-down">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
             <div className="text-slate-500 font-mono text-sm">Querying sensor logs...</div>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* --- Unresolved Section --- */}
            <section className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                <span className="text-sm font-mono text-red-400 uppercase tracking-widest font-bold">Critical Attention Required</span>
                <div className="h-px flex-1 bg-gradient-to-r from-red-500/20 to-transparent"></div>
              </div>

              {unresolved.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-center">
                  <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-slate-200 font-medium">All Systems Nominal</h3>
                  <p className="text-slate-500 text-sm mt-1">No pending critical alerts in the queue.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {unresolved.map((alert, idx) => (
                    <div 
                      key={alert.id || idx}
                      className="group relative bg-[#0b1121] border border-red-500/30 hover:border-red-500/60 rounded-xl p-5 transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:-translate-y-0.5 overflow-hidden"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Left Alert Strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-orange-500"></div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-4">
                          <div className="mt-1">
                            <div className="p-2 rounded bg-red-500/10 text-red-400 shadow-inner">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-100 group-hover:text-red-100 transition-colors">
                              {alert.alert_type || "ANOMALY DETECTED"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm font-mono text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="text-slate-600">SID:</span>
                                <span className="text-slate-300">{alert.sensor_id}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-slate-600">NODE:</span>
                                <span className="text-slate-300">{alert.warehouse_id}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                          <div className="text-right">
                            <div className="text-xs text-red-400 font-mono font-bold uppercase tracking-wider mb-1">Active</div>
                            <div className="text-xs text-slate-500 font-mono">
                              {new Date(alert.created_at).toLocaleDateString()}
                              <span className="mx-1 text-slate-700">|</span>
                              {new Date(alert.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                          {/* Optional individual resolve action could go here */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* --- Resolved Section --- */}
            {resolved.length > 0 && (
              <section className="opacity-70 hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-sm font-mono text-slate-500 uppercase tracking-widest font-bold">Resolved History</span>
                </div>
                
                <div className="grid gap-3">
                  {resolved.map((alert) => (
                    <div 
                      key={alert.id}
                      className="bg-[#0b1121]/50 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 grayscale hover:grayscale-0 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-emerald-500/50">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium text-sm">{alert.alert_type || "Resolved Alert"}</div>
                          <div className="text-xs font-mono text-slate-600">
                             SID: {alert.sensor_id} • Node: {alert.warehouse_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-600">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>

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
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out backwards; }
      `}</style>
    </div>
  );
}

export default Alerts;