"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to admin panel
    const loggedIn = localStorage.getItem("admin_session") === "true";
    if (loggedIn) {
      router.push("/admin");
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Get expected credentials from process.env (exposed via Next config or fallback)
    const expectedUser = "admin";
    const expectedPass = "dhamner@2026";

    // Simulate verification delay
    setTimeout(() => {
      if (username === expectedUser && password === expectedPass) {
        // Set local storage session
        localStorage.setItem("admin_session", "true");
        // Set cookie for route protection/middleware simulation
        document.cookie = "admin_session=true; path=/; max-age=86400;";
        
        // Dispatch event so navbar updates immediately
        window.dispatchEvent(new Event("admin-login-change"));

        router.push("/admin");
      } else {
        setError("अवैध युझरनेम किंवा पासवर्ड! कृपया पुन्हा तपासा.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-6 text-center">
            <span className="text-3xl mb-2 block">🔒</span>
            <h3 className="text-xl font-bold">प्रशासक लॉगिन</h3>
            <p className="text-slate-400 text-xs mt-0.5">Admin Dashboard Login</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-4">
            {/* Info Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              <strong>💡 चाचणीसाठी खालील क्रेडेन्शियल्स वापरा:</strong>
              <div className="grid grid-cols-2 mt-1 font-mono">
                <span>Username: admin</span>
                <span>Password: dhamner@2026</span>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                युझरनेम (Username):
              </label>
              <input
                type="text"
                required
                placeholder="उदा. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:outline-none transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                पासवर्ड (Password):
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:border-slate-800 focus:outline-none transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  तपासणी होत आहे...
                </>
              ) : (
                "लॉगिन करा (Login)"
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-850">
        <p>© {new Date().getFullYear()} यशवंत ग्रामपंचायत धामणेर — कर व्यवस्थापन प्रणाली</p>
      </footer>
    </div>
  );
}
