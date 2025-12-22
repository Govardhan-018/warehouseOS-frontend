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

  // unified warehouse id source - FIXED to always return UUID string
  const getWarehouseId = () => {
    // 1) if route has /add-batch/:id, use that
    if (routeWarehouseId) return routeWarehouseId;

    // 2) otherwise read from currentWarehouse in localStorage
    const stored = localStorage.getItem("currentWarehouse");
    if (!stored) return "";

    try {
      const obj = JSON.parse(stored);
      return (
        obj.id ||
        obj.warehouse_id ||
        obj.warehouseId ||
        obj.warehouseid ||
        ""
      );
    } catch (e) {
      console.warn("Failed to parse currentWarehouse in getWarehouseId", e);
      return "";
    }
  };

  /* ───────────── Fetch products + sensors ───────────── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const mail = localStorage.getItem("mail");
      const warehouseId = getWarehouseId();

      if (!token || !mail || !warehouseId) {
        setError("Missing auth or warehouse. Please log in again.");
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
          body: JSON.stringify({ mail, warehouseId }), // Now warehouseId is always UUID string
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
          throw new Error(txt || `Server error: ${res.status}`);
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
        setError(err?.message || "Failed to load products and sensors");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, routeWarehouseId]);

  /* ───────────── Handlers ───────────── */
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
      navigate(`/warehouse/${warehouseId}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");
    const warehouseId = getWarehouseId();

    if (!token || !mail || !warehouseId) {
      setFormError("Missing auth or warehouse. Please log in again.");
      navigate("/");
      return;
    }

    if (!formData.productId) {
      setFormError("Please select a product");
      return;
    }
    if (!formData.sensorId) {
      setFormError("Please select a sensor");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setFormError("Please enter a valid quantity");
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        mail,
        warehouseId, // Now always UUID string
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
        try {
          parsed = JSON.parse(txt);
        } catch {
          parsed = null;
        }
        throw new Error(parsed?.error || txt || `Server error: ${res.status}`);
      }

      navigate(`/warehouse`);
    } catch (err) {
      console.error("Submit error:", err);
      setFormError(err?.message || "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  const warehouseIdForNav = getWarehouseId();

  /* ───────────── UI ───────────── */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Add Batches</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create a new batch by selecting a product, an available sensor, and
            quantity.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            <p className="mt-4 text-slate-400">Loading products and sensors...</p>
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-500/30 bg-red-600/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Select */}
            <div>
              <label
                htmlFor="productId"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Product
              </label>
              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleInputChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name || `Product ${p.product_id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Sensor Select (available only) */}
            <div>
              <label
                htmlFor="sensorId"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Sensor (available only)
              </label>
              <select
                id="sensorId"
                name="sensorId"
                value={formData.sensorId}
                onChange={handleInputChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="">Select a sensor...</option>
                {availableSensors.map((s) => (
                  <option key={s.sensor_id || s.id} value={s.sensor_id || s.id}>
                    {(s.device_id || `Sensor ${s.sensor_id || s.id}`) +
                      (s.sensor_type ? ` • ${s.sensor_type}` : "")}
                  </option>
                ))}
              </select>
              {availableSensors.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No available sensors. All sensors are currently in use.
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Quantity (number of batches)
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="e.g. 10"
                className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            {formError && (
              <div className="rounded-md border border-red-500/30 bg-red-600/10 p-3 text-sm text-red-200">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg hover:shadow-cyan-400/60 disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create Batch"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-bold text-slate-50">
              Missing setup
            </h2>
            <p className="mb-6 text-sm text-slate-300">
              You need to create products and sensor devices before adding
              batches. Please go back and set them up first.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
              >
                Stay here
              </button>
              <button
                onClick={() => navigate(`/warehouse/${warehouseIdForNav}`)}
                className="flex-1 rounded-md bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:shadow-cyan-400/60"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
