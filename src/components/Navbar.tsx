"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    // Check if admin is logged in (simple local check for UI indicator)
    const checkLogin = () => {
      const loggedIn = localStorage.getItem("admin_session") === "true";
      setIsAdminLoggedIn(loggedIn);
    };
    checkLogin();
    // Listen for custom login events if any
    window.addEventListener("admin-login-change", checkLogin);
    return () => window.removeEventListener("admin-login-change", checkLogin);
  }, [pathname]);

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_session");
    // Clear cookies as well
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setIsAdminLoggedIn(false);
    router.push("/admin/login");
    window.dispatchEvent(new Event("admin-login-change"));
  };

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo and Title */}
        <Link href="/" className="flex items-center gap-3 group transition-transform duration-200 active:scale-95">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-orange-500/25 group-hover:rotate-6 transition-transform">
            🏛️
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold leading-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              यशवंत ग्रामपंचायत धामणेर
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              कर व्यवस्थापन प्रणाली • Tax Portal
            </p>
          </div>
        </Link>

        {/* Action Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              isLinkActive("/") && !pathname.startsWith("/admin")
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            गृह (Home)
          </Link>

          {pathname.startsWith("/admin") ? (
            isAdminLoggedIn ? (
              <button
                onClick={handleAdminLogout}
                className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-red-600/20 text-red-400 border border-red-550/30 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
              >
                बाहेर पडा (Logout)
              </button>
            ) : (
              <Link
                href="/admin/login"
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  isLinkActive("/admin/login")
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                लॉगिन (Login)
              </Link>
            )
          ) : (
            <Link
              href={isAdminLoggedIn ? "/admin" : "/admin/login"}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                isLinkActive("/admin")
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              प्रशासक (Admin)
            </Link>
          )}

          <Link
            href="https://grampanchayatdhamner.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            मुख्य संकेतस्थळ ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
