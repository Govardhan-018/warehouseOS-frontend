import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function CreateSensor() {
  const navigate = useNavigate();

  const [sensors, setSensors] = useState([]);
  const [form, setForm] = useState({
    ipAddress: "",
    sensorType: "",
    deviceId: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getWarehouseId = () => {
    const cw = localStorage.getItem("currentWarehouse");
    if (!cw) return null;
    try {
      return JSON.parse(cw).id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const token = localStorage.getItem("token");
        const mail = localStorage.getItem("mail");
        const warehouseId = getWarehouseId();

        if (!token || !mail || !warehouseId) {
          navigate("/");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/getallsensors`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mail, warehouseId }),
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Server error: ${res.status}`);
        }

        const data = await res.json();
        setSensors(Array.isArray(data) ? data : data.sensors || []);
      } catch (err) {
        console.error("Fetch sensors error:", err);
        setError(err?.message || "Failed to load sensors.");
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");
    const warehouseId = getWarehouseId();

    if (!token || !mail || !warehouseId) {
      navigate("/");
      return;
    }

    if (!form.ipAddress.trim() || !form.sensorType.trim()) {
      setError("IP address and sensor type are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/creatsensor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mail,
            warehouseId,
            ip_address: form.ipAddress.trim(),
            sensor_type: form.sensorType.trim(),
            device_id: form.deviceId.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let parsed;
        try { parsed = JSON.parse(txt); } catch { parsed = null; }
        throw new Error(parsed?.error || txt || `Server error: ${res.status}`);
      }

      const created = await res.json();
      setSensors((prev) => [...prev, created.sensor || created]);

      setForm({ ipAddress: "", sensorType: "", deviceId: "" });
      setSuccess("Sensor node deployed successfully.");
    } catch (err) {
      console.error("Create sensor error:", err);
      setError(err?.message || "Failed to create sensor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Background Matrix */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0f172a,transparent)] opacity-60"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-down">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              Network Configuration
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Telemetry <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">Nodes</span>
            </h1>
            <p className="text-slate-500 mt-3 max-w-xl">
              Provision IoT sensor hardware for real-time environmental monitoring.
            </p>
          </div>
          
          <button 
            onClick={handleBack}
            className="group px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
        </div>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Sensor List */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              Active Nodes ({sensors.length})
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                <span className="text-slate-500 font-mono text-sm">Scanning Network...</span>
              </div>
            ) : sensors.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <p className="text-slate-500">No sensors detected. Register a new node to begin telemetry.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {sensors.map((s, idx) => (
                  <div 
                    key={s.sensor_id || s.id}
                    className="group relative bg-[#0b1121] border border-slate-800 rounded-xl p-5 hover:border-sky-500/30 transition-all hover:shadow-lg hover:shadow-sky-900/10 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-sky-400 group-hover:border-sky-500/30 transition-colors">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        
                        {/* Details */}
                        <div>
                          <h3 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                            {s.device_id || `Sensor Node #${s.sensor_id}`}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-400 uppercase">
                              {s.sensor_type}
                            </span>
                            {s.batch_code && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
                                {s.batch_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* IP Address */}
                      <div className="text-right">
                        <div className="text-sm font-mono text-slate-400">{s.ip_address || s.ip}</div>
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">IPv4 Address</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Registration Form */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-fade-in-up delay-100">
                
                {/* Gloss Effect */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                   <svg className="w-64 h-64 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5 10 5 10-5-5-2.5-5 2.5z"/></svg>
                </div>

                {/* Form Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h2 className="text-lg font-bold text-white">Register Node</h2>
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                </div>

                {/* Feedback */}
                {(error || success) && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border relative z-10 ${error ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {error ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                    </svg>
                    <span className="text-sm font-medium">{error || success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                  
                  {/* IP Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Network IP</label>
                    <div className="relative">
                      <input
                        name="ipAddress"
                        value={form.ipAddress}
                        onChange={handleChange}
                        placeholder="192.168.1.X"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Sensor Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Sensor Type</label>
                    <div className="relative">
                      <input
                        name="sensorType"
                        value={form.sensorType}
                        onChange={handleChange}
                        placeholder="e.g. Temperature/Humidity"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Device ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Hardware ID (Optional)</label>
                    <div className="relative">
                      <input
                        name="deviceId"
                        value={form.deviceId}
                        onChange={handleChange}
                        placeholder="HW-ID-XXXX"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold tracking-wide shadow-lg shadow-sky-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <span>Deploy Node</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </>
                    )}
                  </button>

                </form>
              </div>
            </div>
          </div>

        </div>
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
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 0.8); }
      `}</style>
    </div>
  );
}

export default CreateSensor;