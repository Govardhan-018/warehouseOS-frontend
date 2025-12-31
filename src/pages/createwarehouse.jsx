import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function CreateWarehouse() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ name: false, location: false, capacity: false });
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push("Node designation required");
    if (!formData.location.trim()) errors.push("Geo-location required");
    if (!formData.capacity || formData.capacity <= 0) errors.push("Valid storage capacity required");
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const errors = validateForm();
    setTouched({ name: true, location: true, capacity: true });

    if (errors.length > 0) {
      setError(errors.join(" • "));
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const userEmail = localStorage.getItem("mail");

      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/create-warehouse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          location: formData.location.trim(),
          capacity: parseInt(formData.capacity),
          mail: userEmail,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `Server error: ${res.status}`);
      }

      setSuccess(true);
      setFormData({ name: "", location: "", capacity: "" });

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      console.error("Error creating warehouse:", err);
      setError(err?.message || "Initialization failed. Check network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Matrix */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0f172a,transparent)] opacity-60"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>

      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        
        {/* --- Header --- */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            System Expansion
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">New Node</span>
          </h1>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            Configure a new warehouse terminal to expand the neural tracking network.
          </p>
        </div>

        {/* --- Success View --- */}
        {success ? (
          <div className="bg-[#0b1121] border border-emerald-500/30 rounded-2xl p-12 text-center shadow-2xl shadow-emerald-900/20 animate-fade-in-up">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Node Online</h2>
            <p className="text-slate-400 mb-6">Telemetry established. Redirecting to dashboard...</p>
            <div className="h-1 w-32 bg-slate-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out]"></div>
            </div>
          </div>
        ) : (
          
          /* --- Form View --- */
          <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden animate-fade-in-up">
            
            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <svg className="w-64 h-64 text-cyan-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5 10 5 10-5-5-2.5-5 2.5z"/></svg>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div className="text-red-300 text-sm font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Node Designation
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("name")}
                    placeholder="e.g. Sector 7 Distribution"
                    className={`w-full bg-slate-900/50 border rounded-xl px-4 py-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${touched.name && !formData.name.trim() ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Geo-Coordinates / Address
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("location")}
                    placeholder="e.g. 192.168.1.1 or Physical Address"
                    className={`w-full bg-slate-900/50 border rounded-xl px-4 py-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${touched.location && !formData.location.trim() ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
              </div>

              {/* Capacity Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Storage Matrix Capacity
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("capacity")}
                    placeholder="e.g. 50000"
                    min="1"
                    className={`w-full bg-slate-900/50 border rounded-xl px-4 py-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${touched.capacity && (!formData.capacity || formData.capacity <= 0) ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500'}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors text-xs font-mono">
                    UNITS
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="px-6 py-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold tracking-wide shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <span>Deploy Node</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </>
                  )}
                </button>
              </div>

            </form>
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
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out backwards; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}

export default CreateWarehouse;