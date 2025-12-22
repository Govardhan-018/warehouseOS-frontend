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
            localStorage.removeItem("token");
            localStorage.removeItem("token_expiry");
            localStorage.removeItem("mail");
            navigate("/");
            return;
          }
          const txt = await res.text().catch(() => "");
          let parsed;
          try {
            parsed = JSON.parse(txt);
          } catch {
            parsed = null;
          }
          throw new Error(parsed?.error || txt || `Server error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Alerts page /alerts response:", data); // debug
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error("Fetch alerts error:", err);
        setError(err?.message || "Failed to load alerts");
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
    setError("");

    try {
      const res = await fetch(`${BACKEND_BASE}/alerts/resolve-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mail }),
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

      setAlerts((prev) => prev.map((a) => ({ ...a, is_resolved: true })));
    } catch (err) {
      console.error("Resolve all error:", err);
      setError(err?.message || "Failed to resolve alerts");
    } finally {
      setResolving(false);
    }
  };

  const unresolved = alerts.filter(
    (a) => a.is_resolved === false || a.is_resolved == null
  );
  const resolved = alerts.filter((a) => a.is_resolved === true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pb-12 pt-8 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">Alerts</h1>
            <p className="mt-1 text-sm text-slate-400">
              Review and resolve alerts from all your warehouses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            <p className="text-sm text-slate-400">Loading alerts…</p>
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-slate-400">No alerts at the moment.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
              <span>
                {unresolved.length} active · {resolved.length} resolved
              </span>
              <button
                type="button"
                disabled={resolving || unresolved.length === 0}
                onClick={handleResolveAll}
                className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {resolving ? "Resolving…" : "Resolve all"}
              </button>
            </div>

            <div className="space-y-3">
              {unresolved.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-red-500/50 bg-red-500/10 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-100">
                      {a.alert_type || "Alert"}
                    </span>
                    <span className="text-[11px] text-red-200">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-100">
                    Sensor #{a.sensor_id} · Warehouse {a.warehouse_id}
                  </div>
                </div>
              ))}

              {resolved.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-slate-400">
                    Resolved alerts ({resolved.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {resolved.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300"
                      >
                        <div className="flex items-center justify-between">
                          <span>{a.alert_type || "Alert"}</span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-400">
                          Sensor #{a.sensor_id} · Warehouse {a.warehouse_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Alerts;
