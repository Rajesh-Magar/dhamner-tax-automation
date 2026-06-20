"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Mail, Clock, Phone } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-b from-green-800 to-green-950 text-green-100 py-12 px-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
        
        {/* Column 1: Institutional Trust & Navigation Links */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <h4 className="text-lg font-extrabold text-white tracking-tight leading-tight">
              {t("title")}
            </h4>
            <p className="text-green-300 text-xs font-medium tracking-wide">
              {t("taxPortal")}
            </p>
          </div>
          
          <p className="text-green-200/90 text-sm font-normal leading-relaxed">
            © {new Date().getFullYear()} {t("title")} — {t("rightsReserved")}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-green-300">
            <Link 
              href="/admin/login" 
              className="hover:text-white transition-colors duration-250 underline underline-offset-4 cursor-pointer"
            >
              {t("login")}
            </Link>
            <span className="text-green-700 font-bold">•</span>
            <Link 
              href="https://grampanchayatdhamner.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition-colors duration-250 underline underline-offset-4 cursor-pointer"
            >
              {t("mainSite")}
            </Link>
          </div>
          
          <p className="text-green-400 text-xs leading-relaxed font-medium">
            {t("developedFor")}
          </p>
        </div>

        {/* Column 2: Official Contact Details */}
        <div className="space-y-5 md:border-l md:border-green-700/40 md:pl-10 flex flex-col justify-center">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
            {t("email") === "Email" ? "Official Contact Details" : "कार्यालयीन संपर्क तपशील"}
          </h4>
          
          <div className="space-y-3.5 text-green-100 text-sm leading-relaxed">
            <div className="flex items-center gap-3.5 group">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:bg-white/10 group-hover:border-amber-500 transition-all duration-300 shrink-0">
                <Mail size={14} />
              </div>
              <div>
                <span className="font-semibold text-green-300 mr-2 text-xs uppercase tracking-wider">{t("email")}:</span>
                <a 
                  href="mailto:dhamner189585@gmail.com" 
                  className="hover:text-white hover:underline transition-colors duration-200 font-medium text-white"
                >
                  dhamner189585@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3.5 group">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:bg-white/10 group-hover:border-amber-500 transition-all duration-300 shrink-0">
                <Clock size={14} />
              </div>
              <div>
                <span className="font-semibold text-green-300 mr-2 text-xs uppercase tracking-wider">{t("officeHours")}:</span>
                <span className="font-medium text-white">{t("officeHoursVal")}</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 group">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:bg-white/10 group-hover:border-amber-500 transition-all duration-300 shrink-0">
                <Phone size={14} />
              </div>
              <div>
                <span className="font-semibold text-green-300 mr-2 text-xs uppercase tracking-wider">{t("phone")}:</span>
                <a 
                  href="tel:+919850032987" 
                  className="hover:text-white hover:underline transition-colors duration-200 font-medium text-white"
                >
                  +91 9850032987
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
