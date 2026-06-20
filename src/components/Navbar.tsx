"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe, Menu, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  useEffect(() => {
    // Check if admin session exists
    const checkLogin = () => {
      const loggedIn = localStorage.getItem("admin_session") === "true";
      setIsAdminLoggedIn(loggedIn);
    };
    checkLogin();
    window.addEventListener("admin-login-change", checkLogin);
    return () => window.removeEventListener("admin-login-change", checkLogin);
  }, [pathname]);

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_session");
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
    <div className="w-full shadow-md sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-gray-100">
      
      {/* 🔝 MAIN HEADER */}
      <div className="bg-white px-4 lg:px-10 py-3 flex justify-between items-center gap-4">
        
        {/* Brand Section (Left) */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img 
            src="/assets/HD-wallpaper-satyamev-jayate-bharat-civil-service-history-ias-india-indian-ips-lion-emblem-motivation-removebg-preview.png" 
            className="hidden md:block h-[75px] md:h-[85px] w-auto object-contain" 
            alt="Emblem of India" 
          />
          <img 
            src="/assets/Seal_of_Maharashtra.svg.png" 
            className="hidden md:block h-[45px] md:h-[55px] ml-[-10px]" 
            alt="Seal of Maharashtra" 
          />
          <img 
            src="/assets/Gemini_Generated_Image_7qc6v97qc6v97qc6-removebg-preview.png" 
            className="h-[55px] md:h-[65px]" 
            alt="Grampanchayat Logo" 
          />

          <div className="ml-2">
            <h1 className="text-lg lg:text-2xl font-extrabold text-green-800 tracking-tight leading-tight">
              {t("title")}
            </h1>
            <p className="text-xs md:text-sm font-semibold text-orange-600">
              {t("slogan")}
            </p>
          </div>
        </Link>

        {/* Navigation Links & Action Buttons (Hidden on Mobile) */}
        <div className="hidden lg:flex gap-6 items-center">
          {/* Navigation Links in place of Contact Info */}
          <div className="flex items-center gap-4 border-r border-gray-250 pr-6 py-1">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                isLinkActive("/") && !pathname.startsWith("/admin")
                  ? "text-green-700 font-extrabold bg-green-50 shadow-sm"
                  : "text-slate-600 hover:text-green-700 hover:bg-green-50/50"
              }`}
            >
              {t("home")}
            </Link>

            {pathname.startsWith("/admin") ? (
              isAdminLoggedIn ? (
                <button
                  onClick={handleAdminLogout}
                  className="px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                >
                  {t("logout")}
                </button>
              ) : (
                <Link
                  href="/admin/login"
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    isLinkActive("/admin/login")
                      ? "text-green-700 font-extrabold bg-green-50 shadow-sm"
                      : "text-slate-600 hover:text-green-700 hover:bg-green-50/50"
                  }`}
                >
                  {t("login")}
                </Link>
              )
            ) : (
              <Link
                href={isAdminLoggedIn ? "/admin" : "/admin/login"}
                className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  isLinkActive("/admin")
                    ? "text-green-700 font-extrabold bg-green-50 shadow-sm"
                    : "text-slate-600 hover:text-green-700 hover:bg-green-50/50"
                }`}
              >
                {t("admin")}
              </Link>
            )}

            <Link
              href="https://grampanchayatdhamner.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-green-700 hover:bg-green-50/50 transition-all"
            >
              {t("mainSite")}
            </Link>
          </div>

          {/* Action Button: Language Toggler only */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer"
              aria-label="Toggle Language"
            >
              <Globe size={14} />
              <span>{lang === "mr" ? "English" : "मराठी"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Menu Trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Language Toggle for mobile in header */}
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <Globe size={13} />
            <span>{lang === "mr" ? "EN" : "मराठी"}</span>
          </button>
          
          <button 
            className="p-2 rounded-xl hover:bg-gray-100 transition" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} className="text-green-800" /> : <Menu size={24} className="text-green-800" />}
          </button>
        </div>
      </div>

      {/* 📱 MOBILE SIDEBAR MENU */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-inner">
          <Link 
            href="/"
            onClick={() => setIsOpen(false)}
            className={`block py-2 text-sm font-semibold border-b border-gray-50 text-gray-800 ${
              isLinkActive("/") && !pathname.startsWith("/admin") ? "text-green-700 font-bold" : ""
            }`}
          >
            {t("home")}
          </Link>

          {pathname.startsWith("/admin") ? (
            isAdminLoggedIn ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleAdminLogout();
                }}
                className="w-full text-left py-2 text-sm font-semibold border-b border-gray-50 text-red-650 cursor-pointer"
              >
                {t("logout")}
              </button>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-sm font-semibold border-b border-gray-50 text-gray-800 ${
                  isLinkActive("/admin/login") ? "text-green-700 font-bold" : ""
                }`}
              >
                {t("login")}
              </Link>
            )
          ) : (
            <Link
              href={isAdminLoggedIn ? "/admin" : "/admin/login"}
              onClick={() => setIsOpen(false)}
              className={`block py-2 text-sm font-semibold border-b border-gray-50 text-gray-800 ${
                isLinkActive("/admin") ? "text-green-700 font-bold" : ""
              }`}
            >
              {t("admin")}
            </Link>
          )}

          <Link
            href="https://grampanchayatdhamner.in"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-850"
          >
            {t("mainSite")}
          </Link>
        </div>
      )}
    </div>
  );
}
