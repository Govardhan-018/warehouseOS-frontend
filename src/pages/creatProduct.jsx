import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    minTemp: "",
    maxTemp: "",
    minHumi: "",
    maxHumi: "",
  });

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingList(true);
        setError("");
        setSuccess("");

        const token = localStorage.getItem("token");
        const mail = localStorage.getItem("mail");

        if (!token || !mail) {
          navigate("/");
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/getproducts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mail }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Server error: ${res.status}`);
        }

        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (err) {
        console.error("Fetch products error:", err);
        setError(err?.message || "Failed to synchronize catalog.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleDelete = async (productId) => {
    if(!window.confirm("Confirm deletion of product definition? This cannot be undone.")) return;

    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      const mail = localStorage.getItem("mail");
      
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delete-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mail, product_id: productId }),
      });

      if (!res.ok) throw new Error("Deletion failed.");

      setProducts((prev) => prev.filter((p) => (p.product_id || p.id) !== productId));
      setSuccess("Definition purged from catalog.");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to purge definition.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) return setError("Payload designation required.");

    const minTemp = form.minTemp === "" ? null : Number(form.minTemp);
    const maxTemp = form.maxTemp === "" ? null : Number(form.maxTemp);
    const minHumi = form.minHumi === "" ? null : Number(form.minHumi);
    const maxHumi = form.maxHumi === "" ? null : Number(form.maxHumi);

    if (minTemp === null || isNaN(minTemp)) return setError("Min Temp required.");
    if (maxTemp === null || isNaN(maxTemp)) return setError("Max Temp required.");
    if (minTemp > maxTemp) return setError("Invalid Temperature envelope.");

    if (minHumi === null || isNaN(minHumi)) return setError("Min Humidity required.");
    if (maxHumi === null || isNaN(maxHumi)) return setError("Max Humidity required.");
    if (minHumi > maxHumi) return setError("Invalid Humidity envelope.");
    if (minHumi < 0 || maxHumi > 100) return setError("Humidity out of bounds (0-100%).");

    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");

    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mail,
          name: form.name.trim(),
          description: form.description.trim(),
          min_temp: minTemp,
          max_temp: maxTemp,
          min_humi: minHumi,
          max_humi: maxHumi,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Creation failed.");
      }

      const created = await res.json();
      setProducts((prev) => [...prev, created.product || created]);

      setForm({ name: "", description: "", minTemp: "", maxTemp: "", minHumi: "", maxHumi: "" });
      setSuccess("Payload definition registered.");
    } catch (err) {
      console.error("Create error:", err);
      setError(err?.message || "Failed to register payload.");
    } finally {
      setSubmitting(false);
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

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-down">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              Catalog Management
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Definitions</span>
            </h1>
            <p className="text-slate-500 mt-3 max-w-xl">
              Configure environmental thresholds and handling parameters for monitored assets.
            </p>
          </div>
          
          <button 
            onClick={() => navigate(-1)}
            className="group px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-medium transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COL: Product List (Catalog) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              Active Definitions ({products.length})
            </h2>

            {loadingList ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="text-slate-500 font-mono text-sm">Syncing Catalog...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <p className="text-slate-500">Catalog is empty. Initialize new definitions using the terminal.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {products.map((p, idx) => (
                  <div 
                    key={p.product_id || p.id || idx}
                    className="group relative bg-[#0b1121] border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-900/10 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Icon & Name */}
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">{p.product_name || p.name}</h3>
                          <p className="text-sm text-slate-500 line-clamp-1">{p.description || "Standard definition"}</p>
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button 
                        onClick={() => handleDelete(p.product_id || p.id)}
                        className="self-end sm:self-start p-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
                        title="Purge Definition"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                      {/* Temp */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-sky-500/10 text-sky-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10a2 2 0 11-4 0 2 2 0 014 0zM12 2a5 5 0 00-5 5v7a5 5 0 0010 0V7a5 5 0 00-5-5z" /></svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Temperature</span>
                          <span className="text-sm font-mono text-slate-300">
                            {p.min_temp ?? p.minTemp ?? "?"}° — {p.max_temp ?? p.maxTemp ?? "?"}°C
                          </span>
                        </div>
                      </div>

                      {/* Humi */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Humidity</span>
                          <span className="text-sm font-mono text-slate-300">
                            {p.min_humi ?? p.minHumi ?? "?"}% — {p.max_humi ?? p.maxHumi ?? "?"}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COL: Definition Form */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-fade-in-up delay-100">
                
                {/* Form Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">New Definition</h2>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>

                {/* Feedback */}
                {(error || success) && (
                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${error ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {error ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                    </svg>
                    <span className="text-sm font-medium">{error || success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Designation</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Pfizer-BioNTech Vaccine"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Notes</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Handling instructions or storage codes..."
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                    />
                  </div>

                  <div className="h-px bg-slate-800 my-2"></div>

                  {/* Temperature Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10a2 2 0 11-4 0 2 2 0 014 0zM12 2a5 5 0 00-5 5v7a5 5 0 0010 0V7a5 5 0 00-5-5z" /></svg>
                      Temp Envelope (°C)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        name="minTemp"
                        value={form.minTemp}
                        onChange={handleChange}
                        step="0.1"
                        placeholder="Min"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                      <input
                        type="number"
                        name="maxTemp"
                        value={form.maxTemp}
                        onChange={handleChange}
                        step="0.1"
                        placeholder="Max"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Humidity Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      Humidity Envelope (%)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        name="minHumi"
                        value={form.minHumi}
                        onChange={handleChange}
                        step="0.1"
                        placeholder="Min"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                      />
                      <input
                        type="number"
                        name="maxHumi"
                        value={form.maxHumi}
                        onChange={handleChange}
                        step="0.1"
                        placeholder="Max"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Deploy Definition</span>
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
        
        /* Custom Scrollbar for Catalog */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 0.8); }
      `}</style>
    </div>
  );
}