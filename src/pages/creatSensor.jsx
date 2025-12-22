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

    // fetch existing sensors for this warehouse
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
                try {
                    parsed = JSON.parse(txt);
                } catch {
                    parsed = null;
                }
                throw new Error(parsed?.error || txt || `Server error: ${res.status}`);
            }

            const created = await res.json();
            setSensors((prev) => [...prev, created.sensor || created]);

            setForm({
                ipAddress: "",
                sensorType: "",
                deviceId: "",
            });
            setSuccess("Sensor created.");
        } catch (err) {
            console.error("Create sensor error:", err);
            setError(err?.message || "Failed to create sensor.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => navigate(-1);

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-50">
            {/* background */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -left-24 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
                <div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
            </div>

            <Navbar />

            <main className="mx-auto max-w-5xl px-4 pb-12 pt-8 md:px-6">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-2">
                        <p className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400 backdrop-blur">
                            sensor network
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        </p>
                        <h1 className="text-2xl font-semibold md:text-3xl">
                            Sensors for this warehouse
                        </h1>
                        <p className="text-sm text-slate-400">
                            View all registered sensors and add new ones by IP address.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
                    >
                        ← Back
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-2xl border border-red-500/50 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {success}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                    {/* existing sensors */}
                    <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">
                                Existing sensors
                            </h2>
                            {loading && (
                                <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
                                    Loading…
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-8 text-sm text-slate-400">
                                Fetching sensors…
                            </div>
                        ) : sensors.length === 0 ? (
                            <p className="py-4 text-sm text-slate-400">
                                No sensors yet for this warehouse.
                            </p>
                        ) : (
                            <div className="-mx-3 max-h-[420px] overflow-y-auto pr-1">
                                <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                                        <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                                            <th className="px-3 py-1.5">Device</th>
                                            <th className="px-3 py-1.5">IP address</th>
                                            <th className="px-3 py-1.5">Type</th>
                                            <th className="px-3 py-1.5">Batch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sensors.map((s) => (
                                            <tr
                                                key={s.sensor_id || s.id}
                                                className="rounded-2xl bg-slate-950/60 shadow-sm transition hover:bg-slate-900/80"
                                            >
                                                <td className="px-3 py-2 text-slate-100">
                                                    {s.device_id || `Sensor #${s.sensor_id}`}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-slate-200">
                                                    {s.ip_address || s.ip}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-slate-200">
                                                    <span className="inline-flex rounded-full bg-slate-900/80 px-2 py-0.5">
                                                        {s.sensor_type}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-slate-200">
                                                    {s.batch_code
                                                        ? `${s.batch_code} (${s.batch_id})`
                                                        : s.batch_id || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* create sensor form (with IP address) */}
                    <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
                        <h2 className="mb-4 text-sm font-semibold text-slate-200">
                            Register new sensor
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label
                                    htmlFor="ipAddress"
                                    className="block text-xs font-medium text-slate-300"
                                >
                                    IP address
                                </label>
                                <input
                                    id="ipAddress"
                                    name="ipAddress"
                                    value={form.ipAddress}
                                    onChange={handleChange}
                                    placeholder="192.168.0.120"
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="sensorType"
                                    className="block text-xs font-medium text-slate-300"
                                >
                                    Sensor type
                                </label>
                                <input
                                    id="sensorType"
                                    name="sensorType"
                                    value={form.sensorType}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    placeholder="e.g. temperature, humidity, combo"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="deviceId"
                                        className="block text-xs font-medium text-slate-300"
                                    >
                                        Device ID (optional)
                                    </label>
                                    <input
                                        id="deviceId"
                                        name="deviceId"
                                        value={form.deviceId}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                        placeholder="HW-123456"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/70 disabled:opacity-70"
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-slate-50" />
                                        Creating sensor…
                                    </>
                                ) : (
                                    <>
                                        <span>Create sensor</span>
                                        <span className="text-xs opacity-80">↳</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default CreateSensor;
