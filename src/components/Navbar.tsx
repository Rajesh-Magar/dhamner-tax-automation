"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Phone, Clock, Globe, Search, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

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
    <div className="w-full shadow-md sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-300">
      
      {/* 🔝 TOP HEADER */}
      <div className="bg-white px-4 lg:px-10 py-3 flex justify-between items-center gap-4 border-b border-gray-100">
        
        {/* Brand Section */}
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
              यशवंत ग्रामपंचायत धामणेर
            </h1>
            <p className="text-xs md:text-sm font-semibold text-orange-600">
              ध्यास विकासाचा, वेग प्रगतीचा
            </p>
          </div>
        </Link>

        {/* Contact Info (Hidden on Mobile) */}
        <div className="hidden lg:flex gap-6 text-gray-700 items-center">
          <div className="flex flex-col gap-1 border-r border-gray-250 pr-6 py-0.5">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-green-700 shrink-0" />
              <div className="text-[11px] text-gray-800 leading-normal">
                <span className="font-semibold text-gray-400 uppercase mr-1">ईमेल:</span>
                <a href="mailto:dhamner189585@gmail.com" className="hover:text-green-700 transition-colors font-medium">dhamner189585@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-green-700 shrink-0" />
              <div className="text-[11px] text-gray-800 leading-normal">
                <span className="font-semibold text-gray-400 uppercase mr-1">कार्यालयीन वेळ:</span>
                <span className="font-medium">सकाळी ९.१५ ते सायंकाळी ६.१५</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-green-700 shrink-0" />
              <div className="text-[11px] text-gray-800 leading-normal">
                <span className="font-semibold text-gray-400 uppercase mr-1">दूरध्वनी:</span>
                <a href="tel:+919850032987" className="hover:text-green-700 transition-colors font-medium">+91 9850032987</a>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {/* Language Toggle */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm w-full cursor-pointer"
            >
              <Globe size={14} />
              <span>English</span>
            </button>

            {/* Search Trigger */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm w-full cursor-pointer"
            >
              <Search size={14} />
              <span>शोधा</span>
            </Link>
          </div>
        </div>

        {/* Mobile Header Menu Trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button 
            className="p-2 rounded-xl hover:bg-gray-100 hover:text-green-700 transition text-green-800 cursor-pointer"
            onClick={() => router.push("/")}
            aria-label="Open Search"
          >
            <Search size={20} />
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

      {/* 🔻 DESKTOP SECONDARY NAV */}
      <div className="hidden lg:flex justify-center gap-6 py-2.5 bg-gradient-to-r from-green-50/50 via-white to-green-50/50 border-b border-gray-100 text-xs font-bold text-gray-700">
        
        <Link 
          href="/" 
          className={`px-3 py-1 rounded-lg transition-all ${
            isLinkActive("/") && !pathname.startsWith("/admin")
              ? "text-green-700 font-extrabold bg-green-50"
              : "hover:text-green-700 hover:bg-green-50/80"
          }`}
        >
          गृह (Home)
        </Link>

        {pathname.startsWith("/admin") ? (
          isAdminLoggedIn ? (
            <button
              onClick={handleAdminLogout}
              className="px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 transition-all font-bold cursor-pointer"
            >
              बाहेर पडा (Logout)
            </button>
          ) : (
            <Link
              href="/admin/login"
              className={`px-3 py-1 rounded-lg transition-all ${
                isLinkActive("/admin/login")
                  ? "text-green-700 font-extrabold bg-green-50"
                  : "hover:text-green-700 hover:bg-green-50/80"
              }`}
            >
              प्रशासक लॉगिन (Login)
            </Link>
          )
        ) : (
          <Link
            href={isAdminLoggedIn ? "/admin" : "/admin/login"}
            className={`px-3 py-1 rounded-lg transition-all ${
              isLinkActive("/admin")
                ? "text-green-700 font-extrabold bg-green-50"
                : "hover:text-green-700 hover:bg-green-50/80"
            }`}
          >
            प्रशासक (Admin)
          </Link>
        )}

        <Link
          href="https://grampanchayatdhamner.in"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 rounded-lg hover:text-green-700 hover:bg-green-50/80 transition-all"
        >
          मुख्य संकेतस्थळ ↗
        </Link>
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
            गृह (Home)
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
                बाहेर पडा (Logout)
              </button>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-sm font-semibold border-b border-gray-50 text-gray-800 ${
                  isLinkActive("/admin/login") ? "text-green-700 font-bold" : ""
                }`}
              >
                प्रशासक लॉगिन (Login)
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
              प्रशासक (Admin)
            </Link>
          )}

          <Link
            href="https://grampanchayatdhamner.in"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-850"
          >
            मुख्य संकेतस्थळ ↗
          </Link>
        </div>
      )}
    </div>
  );
}
