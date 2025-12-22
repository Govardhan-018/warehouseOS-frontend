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
    if (!formData.name.trim()) errors.push("Warehouse name is required");
    if (!formData.location.trim()) errors.push("Location is required");
    if (!formData.capacity || formData.capacity <= 0) errors.push("Storage capacity must be greater than 0");
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
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate form
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
        setError("No authentication token. Please log in again.");
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

      const data = await res.json();
      setSuccess(true);
      setFormData({ name: "", location: "", capacity: "" });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      console.error("Error creating warehouse:", err);
      setError(err?.message || "Failed to create warehouse. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 py-12 md:px-8">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-8 py-10 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Create New Warehouse
            </h1>
            <p className="text-slate-400">
              Add a new warehouse to your network and start managing inventory
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 backdrop-blur flex items-center gap-2">
              <span className="text-lg">✓</span>
              Warehouse created successfully! Redirecting to dashboard...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 backdrop-blur">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Warehouse Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center justify-between text-sm font-medium text-slate-300">
                <span>Warehouse Name</span>
                {touched.name && formData.name.trim() && (
                  <span className="flex items-center gap-1 text-xs text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                )}
              </label>
              <div className={`group flex items-center rounded-2xl border bg-slate-900/70 px-4 py-3 text-sm shadow-inner backdrop-blur transition ${touched.name && !formData.name.trim() ? "border-red-500/60" : "border-slate-700/70 focus-within:border-cyan-400/80"}`}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g., Central Warehouse, Regional Hub"
                  className="flex-1 bg-transparent text-slate-50 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
              {touched.name && !formData.name.trim() && (
                <p className="text-xs text-red-300">Warehouse name is required</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="flex items-center justify-between text-sm font-medium text-slate-300">
                <span>Location</span>
                {touched.location && formData.location.trim() && (
                  <span className="flex items-center gap-1 text-xs text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                )}
              </label>
              <div className={`group flex items-center rounded-2xl border bg-slate-900/70 px-4 py-3 text-sm shadow-inner backdrop-blur transition ${touched.location && !formData.location.trim() ? "border-red-500/60" : "border-slate-700/70 focus-within:border-cyan-400/80"}`}>
                <span className="mr-2 text-slate-500">📍</span>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("location")}
                  placeholder="e.g., New York, USA"
                  className="flex-1 bg-transparent text-slate-50 placeholder:text-slate-500 focus:outline-none"
                  required
                />
              </div>
              {touched.location && !formData.location.trim() && (
                <p className="text-xs text-red-300">Location is required</p>
              )}
            </div>

            {/* Storage Capacity */}
            <div className="space-y-2">
              <label htmlFor="capacity" className="flex items-center justify-between text-sm font-medium text-slate-300">
                <span>Storage Capacity (units)</span>
                {touched.capacity && formData.capacity > 0 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                )}
              </label>
              <div className={`group flex items-center rounded-2xl border bg-slate-900/70 px-4 py-3 text-sm shadow-inner backdrop-blur transition ${touched.capacity && (!formData.capacity || formData.capacity <= 0) ? "border-red-500/60" : "border-slate-700/70 focus-within:border-cyan-400/80"}`}>
                <span className="mr-2 text-slate-500">📦</span>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("capacity")}
                  placeholder="e.g., 5000"
                  className="flex-1 bg-transparent text-slate-50 placeholder:text-slate-500 focus:outline-none"
                  min="1"
                  required
                />
              </div>
              {touched.capacity && (!formData.capacity || formData.capacity <= 0) && (
                <p className="text-xs text-red-300">Storage capacity must be greater than 0</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:shadow-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-30 transition" />
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30" />
                      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Warehouse</span>
                    <span className="text-xs opacity-80 group-hover:translate-x-0.5 transition-transform">↳</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/home")}
                className="rounded-2xl border border-slate-700/50 bg-slate-900/50 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 rounded-2xl border border-slate-800/50 bg-slate-900/30 p-4 text-sm text-slate-300 backdrop-blur">
            <p className="font-medium text-slate-100 mb-2">📋 Warehouse Information</p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Warehouse name should be unique and descriptive</li>
              <li>• Location helps organize warehouses geographically</li>
              <li>• Storage capacity is the maximum units this warehouse can hold</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateWarehouse;