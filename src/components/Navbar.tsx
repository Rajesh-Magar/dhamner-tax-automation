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

  // Accessibility zoom & Theme states
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load settings from localStorage on mount/path change
  useEffect(() => {
    if (pathname === "/") {
      // Force light mode and normal font size on the homepage
      document.documentElement.classList.remove("dark");
      document.documentElement.style.fontSize = "";
      return;
    }

    const savedTheme = localStorage.getItem("admin_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(systemPrefersDark ? "dark" : "light");
    }

    const savedFontSize = localStorage.getItem("admin_font_size_level");
    if (savedFontSize) {
      setFontSizeLevel(parseInt(savedFontSize, 10));
    }
  }, [pathname]);

  // Effect to apply theme class (only if not on homepage)
  useEffect(() => {
    if (pathname === "/") return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin_theme", "light");
    }
  }, [theme, pathname]);

  // Effect to apply font size levels (only if not on homepage)
  useEffect(() => {
    if (pathname === "/") return;

    const sizes = {
      "-1": "14px",
      "0": "16px",
      "1": "18px"
    };
    const size = sizes[fontSizeLevel.toString() as "-1" | "0" | "1"] || "16px";
    document.documentElement.style.fontSize = size;
    localStorage.setItem("admin_font_size_level", fontSizeLevel.toString());

    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontSizeLevel, pathname]);

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
    <div className="w-full shadow-md sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 border-b border-gray-100 dark:border-slate-800">
      
      {/* 🔝 MAIN HEADER */}
      <div className="bg-white dark:bg-slate-900 px-4 lg:px-10 py-3 flex justify-between items-center gap-4 transition-colors">
        
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

          {/* Action Buttons: Zoom, Theme and Language */}
          <div className="flex items-center gap-3">
            {pathname !== "/" && pathname !== "/admin/login" && !pathname.startsWith("/dashboard/") && (
              <>
                {/* Accessibility Font Size Buttons (A-, A, A+) */}
                <div className="flex items-center border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm shrink-0">
                  <button 
                    type="button"
                    onClick={() => setFontSizeLevel(-1)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors border-r border-gray-200 dark:border-slate-800 cursor-pointer ${
                      fontSizeLevel === -1 
                        ? "bg-orange-500 text-white" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    title={lang === "mr" ? "फॉन्ट लहान करा" : "Decrease Font Size"}
                  >
                    A-
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFontSizeLevel(0)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors border-r border-gray-200 dark:border-slate-800 cursor-pointer ${
                      fontSizeLevel === 0 
                        ? "bg-orange-500 text-white" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    title={lang === "mr" ? "फॉन्ट मूळ आकार" : "Reset Font Size"}
                  >
                    A
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFontSizeLevel(1)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                      fontSizeLevel === 1 
                        ? "bg-orange-500 text-white" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    title={lang === "mr" ? "फॉन्ट मोठा करा" : "Increase Font Size"}
                  >
                    A+
                  </button>
                </div>

                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-8 h-8 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-all shadow-sm active:scale-[0.98] shrink-0"
                  title={theme === "light" ? (lang === "mr" ? "गडद मोड चालू करा" : "Switch to Dark Mode") : (lang === "mr" ? "प्रकाश मोड चालू करा" : "Switch to Light Mode")}
                >
                  {theme === "light" ? (
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.978 4.978l1.591 1.591m10.862 10.862l1.591 1.591M21.25 12h-2.25M5.25 12H3m4.722 4.722l-1.591 1.591m10.862-10.862l-1.591 1.591M12 7a5 5 0 100 10 5 5 0 000-10z" />
                    </svg>
                  )}
                </button>
              </>
            )}

            {/* Language Toggler */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white h-8 px-3.5 rounded-full text-[11px] font-bold transition-all shadow-md cursor-pointer"
              aria-label="Toggle Language"
            >
              <Globe size={13} />
              <span>{lang === "mr" ? "English" : "मराठी"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Header Menu Trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Theme Toggle for mobile in header */}
          {pathname !== "/" && pathname !== "/admin/login" && !pathname.startsWith("/dashboard/") && (
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-8 h-8 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full border border-gray-250 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-all shadow-sm active:scale-[0.98]"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.978 4.978l1.591 1.591m10.862 10.862l1.591 1.591M21.25 12h-2.25M5.25 12H3m4.722 4.722l-1.591 1.591m10.862-10.862l-1.591 1.591M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              )}
            </button>
          )}

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
