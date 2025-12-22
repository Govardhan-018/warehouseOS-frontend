import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();
  const errorRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      const expiry = Date.now() + (remember ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000);
      localStorage.setItem("token", token);
      localStorage.setItem("token_expiry", expiry);
      localStorage.setItem("mail", params.get("mail") || "");
      navigate("/home");
    }
  }, [navigate, remember]);

  useEffect(() => {
    if (formError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [formError]);

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const isValid = () => validateEmail(email) && password.length >= 6;

  async function safeParseError(res) {
    try {
      const json = await res.json();
      if (json?.error) return json.error;
      if (json?.message) return json.message;
    } catch {
      // ignore
    }
    return null;
  }

  const doAuthRequest = async (url) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mail: email, pass: password }),
    });
    return res;
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setTouched({ email: true, password: true });
    setFormError("");
    if (!isValid()) {
      setFormError("Please provide a valid email and password (min 6 chars).");
      return;
    }

    setLoading(true);
    try {
      const url = import.meta.env.VITE_USERLOG_URL;
      if (!url) {
        setFormError("Login URL not configured. Set VITE_USERLOG_URL.");
        setLoading(false);
        return;
      }

      const res = await doAuthRequest(url);

      if (res.ok) {
        const data = await res.json();
        const token = data?.token;
        if (!token) {
          setFormError("No token returned by server.");
          setLoading(false);
          return;
        }
        const expiry = Date.now() + (remember ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000);
        localStorage.setItem("token", token);
        localStorage.setItem("token_expiry", expiry);
        localStorage.setItem("mail", email);
        navigate("/home");
      } else {
        const msg = await safeParseError(res);
        setFormError(msg || "Invalid email or password.");
        setPassword("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setFormError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    setTouched({ email: true, password: true });
    setFormError("");
    if (!isValid()) {
      setFormError("Please provide a valid email and password (min 6 chars).");
      return;
    }

    setLoading(true);
    try {
      const url = import.meta.env.VITE_USERSIGN_URL;
      if (!url) {
        setFormError("Signup URL not configured. Set VITE_USERSIGN_URL.");
        setLoading(false);
        return;
      }

      const res = await doAuthRequest(url);

      if (res.ok) {
        const data = await res.json();
        const token = data?.token;
        if (!token) {
          setFormError("No token returned by server after signup.");
          setLoading(false);
          return;
        }
        const expiry = Date.now() + (remember ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000);
        localStorage.setItem("token", token);
        localStorage.setItem("token_expiry", expiry);
        localStorage.setItem("mail", email);
        navigate("/home");
      } else {
        const msg = await safeParseError(res);
        setFormError(msg || "Signup failed. Please try again.");
        setPassword("");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setFormError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = (e) => {
    e.preventDefault();
    const url = import.meta.env.VITE_USERGOOGLE_URL;
    if (!url) {
      setFormError("Google OAuth URL not configured. Set VITE_USERGOOGLE_URL.");
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-50">
      {/* background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* navbar */}
      <Navbar />

      {/* main grid */}
      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 md:px-10">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.05fr,0.95fr] items-center">
          {/* left - hero */}
          <section className="hidden lg:block">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/80 p-8 border border-slate-800/80 shadow-[0_18px_60px_rgba(15,23,42,0.8)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                    operations console
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-50">
                    Monitor every pallet in real time.
                  </h2>
                </div>
              </div>
            </div>
          </section>

          {/* right - form */}
          <section className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-7 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
                <div className="mb-6 flex flex-col gap-2">
                  <p className="inline-flex items-center gap-1 self-start rounded-full border border-slate-700/80 bg-slate-900/70 px-2 py-0.5 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    access portal
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </p>
                  <h3 className="text-2xl font-semibold text-slate-50">
                    Sign in to dashboard
                  </h3>
                  <p className="text-xs text-slate-400">
                    Use your work email. MFA and SSO are enforced for privileged roles.
                  </p>
                </div>

                {formError && (
                  <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-100 backdrop-blur"
                  >
                    {formError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleLogin} noValidate>
                  {/* email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="flex items-center justify-between text-xs font-medium text-slate-300">
                      <span>Email address</span>
                      {touched.email && validateEmail(email) && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Looks good
                        </span>
                      )}
                    </label>
                    <div className={`group flex items-center rounded-2xl border bg-slate-900/70 px-3 py-2 text-sm shadow-inner backdrop-blur transition ${touched.email && !validateEmail(email) ? "border-red-500/60" : "border-slate-700/70 focus-within:border-cyan-400/80"}`}>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))
                        }
                        className="flex-1 bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none"
                        placeholder="you@company.com"
                        aria-invalid={touched.email && !validateEmail(email)}
                        aria-describedby={touched.email && !validateEmail(email) ? "email-error" : undefined}
                        required
                      />
                      <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-cyan-300">
                        work
                      </span>
                    </div>
                    {touched.email && !validateEmail(email) && (
                      <p id="email-error" className="text-[11px] text-red-300">Enter a valid email address.</p>
                    )}
                  </div>

                  {/* password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="flex items-center justify-between text-xs font-medium text-slate-300">
                      <span>Password</span>
                      <span className="text-[11px] text-slate-500">Minimum 6 characters</span>
                    </label>
                    <div className={`group relative flex items-center rounded-2xl border bg-slate-900/70 px-3 py-2 text-sm shadow-inner backdrop-blur transition ${touched.password && password.length < 6 ? "border-red-500/60" : "border-slate-700/70 focus-within:border-cyan-400/80"}`}>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))
                        }
                        className="flex-1 bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none pr-12"
                        placeholder="••••••••"
                        aria-invalid={touched.password && password.length < 6}
                        aria-describedby={touched.password && password.length < 6 ? "password-error" : undefined}
                        minLength={6}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500 hover:text-cyan-300" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {touched.password && password.length < 6 && <p id="password-error" className="text-[11px] text-red-300">Password must be at least 6 characters.</p>}
                  </div>

                  {/* remember / forgot */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="relative inline-flex h-4 w-4 items-center justify-center">
                        <input type="checkbox" checked={remember} onChange={() => setRemember((r) => !r)} className="peer h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-0" />
                        <span className="pointer-events-none absolute inset-[3px] rounded bg-cyan-400/0 transition peer-checked:bg-cyan-400/80" />
                      </span>
                      Remember this device
                    </label>
                    <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Forgot password?</button>
                  </div>

                  {/* actions */}
                  <div className="pt-1">
                    <button type="submit" disabled={loading} className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:shadow-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-70">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-30 transition" />
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin text-slate-900" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30" /><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                          <span>Signing you in…</span>
                        </>
                      ) : (
                        <>
                          <span>Sign in</span>
                          <span className="text-xs opacity-80 group-hover:translate-x-0.5 transition-transform">↳</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative py-1">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                    <span className="absolute inset-0 -top-2 flex justify-center"><span className="bg-slate-950/80 px-2 text-[11px] text-slate-500">or continue with</span></span>
                  </div>

                  <div>
                    <button onClick={handleGoogle} type="button" className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 backdrop-blur hover:border-cyan-400/70 hover:bg-slate-900 transition">
                      <img src="https://www.vectorlogo.zone/logos/google/google-tile.svg" className="h-5 w-5" alt="" aria-hidden="true" />
                      <span>Continue with Google</span>
                    </button>
                  </div>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    <span>Don&apos;t have an account?</span>{" "}
                    <button type="button" onClick={handleSignup} className="font-semibold text-slate-100 hover:text-cyan-200">Create workspace account</button>
                  </div>
                </form>
              </div>

              <p className="mt-4 text-center text-[11px] text-slate-500">
                By continuing, you agree to our{" "}
                <span className="underline underline-offset-2 decoration-slate-600 hover:decoration-cyan-400 cursor-pointer">Terms</span>{" "}
                and{" "}
                <span className="underline underline-offset-2 decoration-slate-600 hover:decoration-cyan-400 cursor-pointer">Data Policy</span>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;
