import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/navbar";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

export default function AddBatchesPage() {
  const { id: routeWarehouseId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [availableSensors, setAvailableSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    sensorId: "",
    quantity: "",
  });
  const [formError, setFormError] = useState("");

  // Unified warehouse ID source
  const getWarehouseId = () => {
    if (routeWarehouseId) return routeWarehouseId;
    const stored = localStorage.getItem("currentWarehouse");
    if (!stored) return "";
    try {
      const obj = JSON.parse(stored);
      return obj.id || obj.warehouse_id || obj.warehouseId || obj.warehouseid || "";
    } catch (e) {
      console.warn("Failed to parse currentWarehouse", e);
      return "";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const mail = localStorage.getItem("mail");
      const warehouseId = getWarehouseId();

      if (!token || !mail || !warehouseId) {
        setError("Authentication or Node ID missing.");
        navigate("/");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_BASE}/get-products-sensors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mail, warehouseId }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.clear();
            navigate("/");
            return;
          }
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to sync node catalog.");
        }

        const data = await res.json();
        const prodList = data?.products || [];
        const sensorList = data?.sensors || [];

        setProducts(prodList);
        setSensors(sensorList);

        const freeSensors = sensorList.filter(
          (s) => s.status === "available" || s.status === "free" || !s.status
        );
        setAvailableSensors(freeSensors);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err?.message || "System error loading node configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, routeWarehouseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleCancel = () => {
    const warehouseId = getWarehouseId();
    if (products.length === 0 && sensors.length === 0) {
      setShowWarning(true);
    } else {
      navigate(`/warehouse`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");
    const warehouseId = getWarehouseId();

    if (!token || !mail || !warehouseId) {
      navigate("/");
      return;
    }

    if (!formData.productId) return setFormError("Product definition required.");
    if (!formData.sensorId) return setFormError("Sensor assignment required.");
    if (!formData.quantity || Number(formData.quantity) <= 0) return setFormError("Valid quantity required.");

    setSubmitting(true);

    try {
      const body = {
        mail,
        warehouseId,
        productId: formData.productId,
        sensorId: formData.sensorId,
        quantity: formData.quantity,
      };

      const res = await fetch(`${BACKEND_BASE}/create-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let parsed;
        try { parsed = JSON.parse(txt); } catch { parsed = null; }
        throw new Error(parsed?.error || txt || "Deployment failed.");
      }

      navigate(`/warehouse`);
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(err?.message || "Batch deployment failed.");
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

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        
        {/* --- Header --- */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Ready
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Batch Payload</span>
          </h1>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            Configure new inventory parameters. Associate physical assets with neural sensor nodes.
          </p>
        </div>

        {/* --- Loading --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="text-slate-500 font-mono text-sm animate-pulse">Scanning Node Catalog...</div>
          </div>
        ) : (
          <div className="bg-[#0b1121] border border-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden animate-fade-in-up">
            
            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <svg className="w-64 h-64 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5 10 5 10-5-5-2.5-5 2.5z"/></svg>
            </div>

            {/* Error Banner */}
            {(error || formError) && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-red-300 text-sm font-medium">{error || formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              
              {/* Product Select */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Product Configuration
                </label>
                <div className="relative group">
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="text-slate-500">Select Product Definition...</option>
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_name || `Product ID: ${p.product_id}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Sensor Select */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">
                    Sensor Assignment
                  </label>
                  <span className={`text-[10px] font-mono ${availableSensors.length > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {availableSensors.length} NODES AVAILABLE
                  </span>
                </div>
                <div className="relative group">
                  <select
                    name="sensorId"
                    value={formData.sensorId}
                    onChange={handleInputChange}
                    disabled={availableSensors.length === 0}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {availableSensors.length === 0 ? "No Sensors Available" : "Link Sensor Node..."}
                    </option>
                    {availableSensors.map((s) => (
                      <option key={s.sensor_id || s.id} value={s.sensor_id || s.id}>
                        {(s.device_id || `Sensor ${s.sensor_id || s.id}`) + (s.sensor_type ? ` [${s.sensor_type}]` : "")}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Batch Volume
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 font-mono text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 uppercase">
                    Units
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableSensors.length === 0}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <span>Deploy Batch</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* --- Warning Modal --- */}
        {showWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-[#0b1121] border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Infrastructure Missing</h3>
              <p className="text-slate-400 text-sm mb-6">
                You haven't defined any products or deployed any sensors yet. You need to configure these assets before creating a batch.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWarning(false)}
                  className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Stay Here
                </button>
                <button 
                  onClick={() => navigate("/warehouse")}
                  className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                >
                  Configure Node
                </button>
              </div>
            </div>
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