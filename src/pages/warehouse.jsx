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

        let stored = null;
        try {
          const raw = localStorage.getItem("currentWarehouse");
          if (raw) stored = JSON.parse(raw);
        } catch (e) {
          console.warn("Failed to parse currentWarehouse from localStorage", e);
        }

        if (!stored) {
          setError("No warehouse selected.");
          return;
        }

        const warehouseId =
          stored.id ||
          stored.warehouse_id ||
          stored.warehouseId ||
          stored.warehouseid;

        if (!warehouseId) {
          setError("Selected warehouse has no id.");
          return;
        }

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
            localStorage.removeItem("token");
            localStorage.removeItem("token_expiry");
            localStorage.removeItem("mail");
            navigate("/");
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || `Server error: ${res.status}`);
        }

        const data = await res.json();
        setWarehouse(data.warehouse || stored);
        setBatches(data.batches || []);
      } catch (err) {
        console.error("Error loading warehouse:", err);
        setError(err?.message || "Failed to load warehouse.");
      } finally {
        setLoading(false);
      }
    };

    loadWarehouse();
  }, [navigate]);

  const handleBack = () => {
    navigate("/home");
  };

  const goWithWarehouse = (path) => {
    if (!warehouse) return;
    try {
      localStorage.setItem("currentWarehouse", JSON.stringify(warehouse));
    } catch (e) {
      console.warn("Failed to save warehouse before navigation", e);
    }
    navigate(path);
  };

  const handleAddProduct = () => goWithWarehouse("/create-product");
  const handleAddSensor = () => goWithWarehouse("/create-sensor");
  const handleAddBatch = () => goWithWarehouse("/add-batch");

  // Dispatch (outboard) a batch using /delete-batch
  const handleDispatch = async (batch) => {
    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");
    if (!token || !mail) {
      navigate("/");
      return;
    }

    const batchId = batch.id || batch.batch_id;
    if (!batchId) {
      console.warn("Batch has no id, cannot dispatch");
      return;
    }

    setDispatchingId(batchId);
    setError("");

    try {
      const res = await fetch(`${BACKEND_BASE}/delete-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mail, batchId }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let parsed;
        try {
          parsed = JSON.parse(txt);
        } catch {
          parsed = null;
        }
        throw new Error(parsed?.error || txt || `Server error: ${res.status}`);
      }

      // Remove batch from local state
      setBatches((prev) =>
        prev.filter((b) => (b.id || b.batch_id) !== batchId)
      );
    } catch (err) {
      console.error("Dispatch batch error:", err);
      setError(err?.message || "Failed to dispatch batch");
    } finally {
      setDispatchingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-8">
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            <p className="text-sm text-slate-400">Loading warehouse…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !warehouse) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-8">
          <button
            onClick={handleBack}
            className="mb-4 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
          >
            ← Back
          </button>
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {error || "Warehouse not found."}
          </div>
        </main>
      </div>
    );
  }

  if (!warehouse) return null;

  const nodeId =
    warehouse.id ||
    warehouse.warehouse_id ||
    warehouse.warehouseId ||
    warehouse.warehouseid ||
    "—";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-8">
        {/* header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={handleBack}
              className="mb-3 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold md:text-3xl">
              {warehouse.name || warehouse.warehouse_name || "Warehouse"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">Node {nodeId}</p>
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddProduct}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
            >
              + Add product
            </button>
            <button
              onClick={handleAddSensor}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
            >
              + Add sensor
            </button>
            <button
              onClick={handleAddBatch}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/70"
            >
              + Add batch
            </button>
          </div>
        </div>

        {/* error banner (non-fatal) */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-100">
            {error}
          </div>
        )}

        {/* info cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs backdrop-blur">
            <p className="mb-1 text-slate-400">Location</p>
            <p className="text-sm text-slate-50">
              {warehouse.location || "Not set"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs backdrop-blur">
            <p className="mb-1 text-slate-400">Capacity</p>
            <p className="text-sm text-slate-50">
              {warehouse.storage_capacity != null
                ? warehouse.storage_capacity
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs backdrop-blur">
            <p className="mb-1 text-slate-400">Batches</p>
            <p className="text-sm text-slate-50">{batches.length}</p>
          </div>
        </div>

        {/* batches list with Dispatch */}
        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 text-sm text-slate-200">
          <h2 className="mb-3 text-base font-semibold">Batches</h2>
          {batches.length === 0 ? (
            <p className="text-xs text-slate-400">
              No batches yet for this warehouse.
            </p>
          ) : (
            <div className="space-y-2">
              {batches.map((b) => {
                const batchId = b.id || b.batch_id;
                return (
                  <div
                    key={batchId}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-100">
                        Batch {batchId}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Quantity:{" "}
                        {b.number_of_batches != null
                          ? b.number_of_batches
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        Sensor: {b.sensor_id ?? "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDispatch(b)}
                        disabled={dispatchingId === batchId}
                        className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {dispatchingId === batchId ? "Dispatching…" : "Dispatch"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Warehouse;
