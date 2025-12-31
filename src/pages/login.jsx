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

  // --- Logic remains the same ---
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
      setFormError("Please provide a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      const url = import.meta.env.VITE_BACKEND_URL + "/login";
      if (!url) {
        setFormError("Configuration Error: Login URL not found.");
        setLoading(false);
        return;
      }

      const res = await doAuthRequest(url);

      if (res.ok) {
        const data = await res.json();
        const token = data?.token;
        if (!token) {
          setFormError("Authentication failed: No token received.");
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
        setFormError(msg || "Invalid credentials.");
        setPassword("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setFormError("Unable to connect to neural server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    setTouched({ email: true, password: true });
    setFormError("");
    if (!isValid()) {
      setFormError("Please provide a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      const url = import.meta.env.VITE_USERSIGN_URL;
      if (!url) {
        setFormError("Configuration Error: Signup URL not found.");
        setLoading(false);
        return;
      }

      const res = await doAuthRequest(url);

      if (res.ok) {
        const data = await res.json();
        const token = data?.token;
        if (!token) {
          setFormError("Signup failed: No token received.");
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
        setFormError(msg || "Signup failed.");
        setPassword("");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setFormError("Unable to connect to neural server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = (e) => {
    e.preventDefault();
    const url = import.meta.env.VITE_USERGOOGLE_URL;
    if (!url) {
      setFormError("Configuration Error: Google OAuth not set.");
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-slate-200 overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* --- Dynamic Background --- */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-40"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* --- Left Column: Hero/Branding --- */}
          <div className="hidden lg:flex flex-col space-y-8 animate-fade-in-left">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-1 h-24 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-full"></div>
              <h1 className="text-5xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                Warehouse <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                  OS
                </span>
              </h1>
            </div>
            
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              Secure enterprise telemetry and real-time infrastructure monitoring. Access the decentralized node network with quantum-resistant encryption.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md">
                <div className="text-cyan-400 text-2xl mb-2">🛡️</div>
                <h3 className="font-semibold text-slate-200">AES-256-GCM</h3>
                <p className="text-xs text-slate-500 mt-1">End-to-end Encrypted</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md">
                <div className="text-emerald-400 text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-slate-200">Real-time</h3>
                <p className="text-xs text-slate-500 mt-1">Zero Latency Sync</p>
              </div>
            </div>
          </div>

          {/* --- Right Column: Auth Card --- */}
          <div className="w-full max-w-md mx-auto animate-fade-in-up">
            
            <div className="relative group">
              {/* Card Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-[2rem] opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
              
              <div className="relative bg-[#0b1121] rounded-[1.9rem] border border-slate-800/80 p-8 shadow-2xl backdrop-blur-xl">
                
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 mb-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">Terminal Access</h2>
                  <p className="text-slate-500 text-sm mt-2">Enter credentials to authenticate node</p>
                </div>

                {/* Error Message */}
                {formError && (
                  <div ref={errorRef} tabIndex={-1} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-shake">
                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-sm text-red-300 font-medium">{formError}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Neural Identifier</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched(t => ({...t, email: true}))}
                        className={`w-full bg-slate-950/50 border ${touched.email && !validateEmail(email) ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-cyan-500'} rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm`}
                        placeholder="user@protocol.net"
                      />
                      {touched.email && validateEmail(email) && (
                        <div className="absolute right-3 top-3.5 text-emerald-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider ml-1">Access Key</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched(t => ({...t, password: true}))}
                        className={`w-full bg-slate-950/50 border ${touched.password && password.length < 6 ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-cyan-500'} rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm pr-12`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border ${remember ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 bg-slate-900'} flex items-center justify-center transition-colors`}>
                        {remember && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input type="checkbox" className="hidden" checked={remember} onChange={() => setRemember(!remember)} />
                      <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">Keep Session Active</span>
                    </label>
                    <button type="button" onClick={() => navigate("/forgot-password")} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Recover Key?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !isValid()}
                    className="w-full relative overflow-hidden h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Establishing Uplink...
                        </>
                      ) : "INITIATE SEQUENCE"}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  </button>
                </form>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-800"></div>
                  <span className="text-xs font-mono text-slate-600 uppercase">Or connect via</span>
                  <div className="h-px flex-1 bg-slate-800"></div>
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-medium transition-all duration-300 group"
                >
                  <img src="https://www.vectorlogo.zone/logos/google/google-tile.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                  <span>Google Workspace</span>
                </button>

                <div className="mt-8 text-center">
                  <p className="text-slate-500 text-sm">
                    Unregistered Node? 
                    <button onClick={handleSignup} className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      Request Access
                    </button>
                  </p>
                </div>
              </div>
            </div>
            
            <p className="mt-8 text-center text-xs text-slate-600 font-mono">
              CCAI SECURITY PROTOCOL V2.4 // 128-BIT SESSION
            </p>

          </div>
        </div>
      </main>

      <style>{`
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-fade-in-left { animation: fade-in-left 0.8s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.2s backwards; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}

export default Login;