import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("mail");
  const token = localStorage.getItem("token");

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(import.meta.env.VITE_BACKEND_URL + "/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("mail");
      navigate("/");
    }
  };

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-800/50 bg-gradient-to-b from-slate-950/80 to-slate-950/40 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/40">
          <span className="text-lg font-semibold text-slate-950">W</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide text-slate-100">
            WarehouseOS
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            cold chain suite
          </span>
        </div>
      </div>

      {/* Right side - only show if logged in */}
      {token && userEmail && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-semibold text-slate-950">
              {userEmail.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline">
              {userEmail}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-1.5 text-sm font-medium text-slate-100 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;