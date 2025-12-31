import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userEmail = localStorage.getItem("mail");
  const token = localStorage.getItem("token");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Attempt server-side logout, but don't block UI if it fails
        await fetch(import.meta.env.VITE_BACKEND_URL + "/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(err => console.warn("Logout endpoint unreachable, clearing local session.", err));
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("mail");
      setIsLoggingOut(false);
      navigate("/");
    }
  };

  // Get user initials or default
  const getInitials = (email) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#030712]/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          
          {/* --- Brand / Logo Section --- */}
          <div 
            className="group flex items-center gap-4 cursor-pointer" 
            onClick={() => navigate(token ? "/home" : "/")}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-900/20 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105">
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="h-6 w-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                Warehouse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">OS</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 group-hover:text-cyan-400 transition-colors">
                Neural Operations v2.4
              </span>
            </div>
          </div>

          {/* --- Right Side Actions --- */}
          <div className="flex items-center gap-6">
            
            {token && userEmail ? (
              <>
                {/* System Status (Desktop Only) */}
                <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-mono font-medium text-emerald-400 tracking-wider">SYSTEM ONLINE</span>
                </div>

                {/* User Profile Pill */}
                <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                  <div className="group relative hidden sm:flex items-center gap-3 rounded-full border border-white/5 bg-slate-900/50 p-1 pr-4 transition-all hover:border-cyan-500/30 hover:bg-slate-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-slate-700 to-slate-800 text-xs font-bold text-cyan-400 shadow-inner border border-white/5">
                      {getInitials(userEmail)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">{userEmail.split('@')[0]}</span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider group-hover:text-cyan-500">Operator Level 3</span>
                    </div>
                  </div>

                  {/* Mobile Avatar (Icon only) */}
                  <div className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-400">
                    {getInitials(userEmail)}
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-transparent text-slate-400 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    title="Terminate Session"
                  >
                    {isLoggingOut ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="h-5 w-5 transform transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Not Logged In State
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Read Only Mode
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Navbar Styles */}
      <style>{`
        /* Add any navbar specific custom animations here if needed, 
           currently using standard Tailwind classes for cleaner code */
      `}</style>
    </>
  );
}

export default Navbar;