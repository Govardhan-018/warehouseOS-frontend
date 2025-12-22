import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function Home() {
  const [warehouses, setWarehouses] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const userEmail = localStorage.getItem("mail");

        if (!token) {
          setError("No authentication token. Please log in again.");
          navigate("/");
          return;
        }

        if (!userEmail) {
          setError("User email not found. Please log in again.");
          navigate("/");
          return;
        }

        const base = import.meta.env.VITE_BACKEND_URL;

        const res = await fetch(`${base}/warehouses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mail: userEmail }),
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
        console.log("WAREHOUSES RESPONSE:", data); // DEBUG, see field names

        setWarehouses(data.warehouses || []);
        setAlertsCount(data.alertsCount || (data.alerts?.length || 0));
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        setError(
          err?.message || "Failed to load warehouses. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [navigate]);

  const handleCreateWarehouse = () => {
    navigate("/create-warehouse");
  };

  const handleSelectWarehouse = (warehouse) => {
    if (!warehouse) {
      console.warn("handleSelectWarehouse called with null warehouse");
      return;
    }

    // Try all likely id keys based on different schemas
    const warehouseId =
      warehouse.id ||
      warehouse.warehouse_id ||
      warehouse.warehouseId ||
      warehouse.warehouseid;

    console.log("Clicked warehouse object:", warehouse, "resolved id:", warehouseId);

    try {
      localStorage.setItem("currentWarehouse", JSON.stringify(warehouse));
    } catch (e) {
      console.warn("Failed to save warehouse to localStorage", e);
    }

    if (!warehouseId) {
      console.warn("Clicked warehouse has no id; cannot navigate to details.");
      return;
    }

    navigate("/warehouse");
  };

  const handleAlertsClick = () => {
    navigate("/alerts");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-24 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* main */}
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8">
        {/* header + actions */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              warehouse overview
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-50 md:text-3xl">
              Your cold-chain network
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Monitor capacity, status, and performance across all connected
              sites.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateWarehouse}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:shadow-cyan-400/70"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/20 text-base">
                +
              </span>
              New warehouse
            </button>
            <button
              type="button"
              onClick={window.location.reload}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs text-slate-200 backdrop-blur hover:border-cyan-400/70 hover:text-cyan-100"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Live sync enabled
            </button>
          </div>
        </div>

        {/* error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100 backdrop-blur">
            {error}
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            <p className="text-sm text-slate-400">Loading warehouses…</p>
          </div>
        )}

        {/* loaded */}
        {!loading && !error && (
          <>
            {/* small stats strip */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs backdrop-blur">
                <p className="mb-1 text-slate-400">Total warehouses</p>
                <p className="text-xl font-semibold text-slate-50">
                  {warehouses.length}
                </p>
                <p className="mt-1 text-[11px] text-emerald-300">
                  All synced with backend
                </p>
              </div>

              {/* Alerts card */}
              <button
                type="button"
                onClick={handleAlertsClick}
                className="hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-left text-xs backdrop-blur transition hover:border-cyan-400/70 sm:block"
              >
                <p className="mb-1 text-slate-400">Alerts</p>
                <p className="text-xl font-semibold text-slate-50">
                  {alertsCount}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Click to review and resolve
                </p>
              </button>

              <div className="hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs backdrop-blur sm:block">
                <p className="mb-1 text-slate-400">Utilization</p>
                <p className="text-xl font-semibold text-slate-50">—</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Detailed metrics inside each warehouse
                </p>
              </div>
            </div>

            {/* warehouses list */}
            {warehouses.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
                <p className="mb-4 text-sm text-slate-300">
                  No warehouses yet. Create your first node to start tracking
                  inventory and alerts.
                </p>
                <button
                  onClick={handleCreateWarehouse}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:shadow-cyan-400/70"
                >
                  <span className="text-base">+</span>
                  Create first warehouse
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {warehouses.map((warehouse) => (
                  <button
                    key={
                      warehouse.id ||
                      warehouse.warehouse_id ||
                      warehouse.warehouseId ||
                      warehouse.warehouseid
                    }
                    onClick={() => handleSelectWarehouse(warehouse)}
                    className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 text-left shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl transition hover:border-cyan-400/70 hover:shadow-cyan-500/25"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-sky-500/0 to-emerald-500/0 opacity-0 transition group-hover:opacity-100 group-hover:from-cyan-500/8 group-hover:via-sky-500/6 group-hover:to-emerald-500/10" />

                    <div className="relative z-10 flex flex-col gap-3">
                      {/* top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-50 md:text-lg group-hover:text-cyan-300 transition">
                            {warehouse.name ||
                              warehouse.warehouse_name ||
                              "Unnamed warehouse"}
                          </h3>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            node{" "}
                            {warehouse.id ||
                              warehouse.warehouse_id ||
                              warehouse.warehouseId ||
                              warehouse.warehouseid ||
                              "—"}
                          </p>
                        </div>
                        <div className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300">
                          Online
                        </div>
                      </div>

                      {/* details */}
                      <div className="space-y-2 text-sm text-slate-300">
                        {warehouse.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📍</span>
                            <span className="truncate">
                              {warehouse.location}
                            </span>
                          </div>
                        )}
                        {warehouse.storage_capacity && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">📦</span>
                            <span>
                              Capacity: {warehouse.storage_capacity}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* footer */}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <div className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>Telemetry healthy</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-300 group-hover:gap-2 transition-all">
                          <span className="font-medium">Open dashboard</span>
                          <span>↗</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* create card */}
                <button
                  onClick={handleCreateWarehouse}
                  className="group relative flex min-h-[220px] flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-dashed border-slate-700/70 bg-slate-950/40 p-6 text-center backdrop-blur-xl transition hover:border-cyan-400/70 hover:bg-slate-950/70"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl text-cyan-300 group-hover:bg-cyan-400/25 transition">
                    +
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50 group-hover:text-cyan-300 transition">
                      Create new warehouse
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Add another node to your network and start streaming
                      data.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
