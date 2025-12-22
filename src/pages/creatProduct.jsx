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

  const getWarehouseId = () => {
    const sid = localStorage.getItem("selectedWarehouseId");
    if (sid) return sid;
    const cw = localStorage.getItem("currentWarehouse");
    if (cw) {
      try {
        return JSON.parse(cw).id;
      } catch {
        return null;
      }
    }
    return null;
  };

  // fetch products on mount
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

        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/getproducts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mail }),
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Server error: ${res.status}`);
        }

        const data = await res.json();
        // expect array; adapt if wrapped
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (err) {
        console.error("Fetch products error:", err);
        setError(err?.message || "Failed to load products.");
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
    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("token");
      const mail = localStorage.getItem("mail");
      if (!token || !mail) {
        navigate("/");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/delete-product`,
        {
          method: "POST", // or DELETE if your API uses that
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mail, product_id: productId }),
        }
      );

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

      // remove from UI
      setProducts((prev) => prev.filter((p) => (p.product_id || p.id) !== productId));
      setSuccess("Product deleted.");
    } catch (err) {
      console.error("Delete product error:", err);
      setError(err?.message || "Failed to delete product.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    // parse temps
    const minTemp = form.minTemp === "" ? null : Number(form.minTemp);
    const maxTemp = form.maxTemp === "" ? null : Number(form.maxTemp);

    if (minTemp === null || Number.isNaN(minTemp)) {
      setError("Minimum temperature is required and must be a number.");
      return;
    }
    if (maxTemp === null || Number.isNaN(maxTemp)) {
      setError("Maximum temperature is required and must be a number.");
      return;
    }
    if (minTemp > maxTemp) {
      setError("Minimum temperature cannot be greater than maximum temperature.");
      return;
    }

    // parse humi
    const minHumi = form.minHumi === "" ? null : Number(form.minHumi);
    const maxHumi = form.maxHumi === "" ? null : Number(form.maxHumi);

    if (minHumi === null || Number.isNaN(minHumi)) {
      setError("Minimum humidity is required and must be a number (0-100).");
      return;
    }
    if (maxHumi === null || Number.isNaN(maxHumi)) {
      setError("Maximum humidity is required and must be a number (0-100).");
      return;
    }
    if (minHumi > maxHumi) {
      setError("Minimum humidity cannot be greater than maximum humidity.");
      return;
    }
    if (minHumi < 0 || maxHumi < 0 || minHumi > 100 || maxHumi > 100) {
      setError("Humidity values must be between 0 and 100 (percentage).");
      return;
    }

    const token = localStorage.getItem("token");
    const mail = localStorage.getItem("mail");

    if (!token || !mail) {
      navigate("/");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/create-product`,
        {
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
        }
      );

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

      const created = await res.json();
      // push new product into list (adapt to response shape)
      setProducts((prev) => [...prev, created.product || created]);

      setForm({
        name: "",
        description: "",
        minTemp: "",
        maxTemp: "",
        minHumi: "",
        maxHumi: "",
      });
      setSuccess("Product created.");
    } catch (err) {
      console.error("Create product error:", err);
      setError(err?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  return (
  <div className="relative min-h-screen bg-slate-950 text-slate-50">
    {/* background gradients */}
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-24 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_55%)]" />
    </div>

    <Navbar />

    <main className="mx-auto max-w-5xl px-4 pb-12 pt-8 md:px-6">
      {/* header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400 backdrop-blur">
            product catalog
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            Products for this account
          </h1>
          <p className="text-sm text-slate-400">
            Define storage envelopes for each product and keep your cold-chain in spec.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur hover:border-cyan-400/70 hover:text-cyan-100 hover:bg-slate-900/80 transition-colors"
        >
          <span className="text-sm">←</span>
          Back
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/50 bg-red-500/15 px-4 py-3 text-sm text-red-100 backdrop-blur">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 backdrop-blur">
          {success}
        </div>
      )}

      {/* grid: list + form */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* products list */}
        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Existing products
            </h2>
            {loadingList && (
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
                Loading…
              </span>
            )}
          </div>

          {loadingList ? (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-400">
              Fetching products…
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-sm text-slate-400">
              No products yet. Use the form on the right to create your first one.
            </div>
          ) : (
            <div className="-mx-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-1.5">Name</th>
                    <th className="px-3 py-1.5 hidden md:table-cell">
                      Description
                    </th>
                    <th className="px-3 py-1.5">Temp (°C)</th>
                    <th className="px-3 py-1.5 hidden sm:table-cell">
                      Humidity (%)
                    </th>
                    <th className="px-3 py-1.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.product_id || p.id}
                      className="group rounded-2xl border border-transparent bg-slate-950/60 align-top shadow-sm transition hover:border-cyan-400/50 hover:bg-slate-900/80"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-100 group-hover:text-cyan-200 transition-colors">
                          {p.product_name || p.name}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 md:hidden">
                          {p.description || "—"}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-slate-400 md:table-cell max-w-xs">
                        <p className="line-clamp-2">
                          {p.description || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-200">
                        <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5">
                          {p.min_temp ?? p.minTemp ?? "—"} –{" "}
                          {p.max_temp ?? p.maxTemp ?? "—"}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2 text-xs text-slate-200 sm:table-cell">
                        <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5">
                          {p.min_humi ?? p.minHumi ?? "—"} –{" "}
                          {p.max_humi ?? p.maxHumi ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.product_id || p.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-500/60 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-100 transition hover:bg-red-500/20"
                        >
                          <span className="text-xs">✕</span>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* create form */}
        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Create new product
            </h2>
            <span className="text-[11px] text-slate-500">
              All fields required
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-medium text-slate-300"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="e.g. Frozen Vaccine Vial"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-xs font-medium text-slate-300"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Short description (optional)"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="minTemp"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Min temperature (°C)
                </label>
                <input
                  id="minTemp"
                  name="minTemp"
                  type="number"
                  step="0.1"
                  value={form.minTemp}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="maxTemp"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Max temperature (°C)
                </label>
                <input
                  id="maxTemp"
                  name="maxTemp"
                  type="number"
                  step="0.1"
                  value={form.maxTemp}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="minHumi"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Min humidity (% RH)
                </label>
                <input
                  id="minHumi"
                  name="minHumi"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.minHumi}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="maxHumi"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Max humidity (% RH)
                </label>
                <input
                  id="maxHumi"
                  name="maxHumi"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.maxHumi}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:shadow-cyan-400/70 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                    Creating…
                  </>
                ) : (
                  <>
                    <span>Create product</span>
                    <span className="text-xs opacity-80">↳</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  </div>
);
}