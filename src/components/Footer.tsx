"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Mail, Clock, Phone } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-b from-green-800 to-green-950 text-green-100 py-10 px-6 border-t border-green-700/30">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {/* Column 1: Info & Links */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              {t("title")}
            </h4>
            <p className="text-green-300/80 text-[11px]">
              {t("taxPortal")}
            </p>
          </div>
          <p className="text-green-200/85 font-medium">
            © {new Date().getFullYear()} {t("title")} — {t("rightsReserved")}
          </p>
          <div className="flex flex-wrap gap-4 text-green-300">
            <Link href="/admin/login" className="hover:text-white transition-colors underline underline-offset-4">
              {t("login")}
            </Link>
            <span>•</span>
            <Link href="https://grampanchayatdhamner.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline underline-offset-4">
              {t("mainSite")}
            </Link>
          </div>
          <p className="text-green-400/80 text-[10px]">
            {t("developedFor")}
          </p>
        </div>

        {/* Column 2: Contact Info */}
        <div className="space-y-4 md:border-l md:border-green-700/40 md:pl-8 flex flex-col justify-center">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
            {t("email") === "Email" ? "Contact Details" : "संपर्क माहिती"}
          </h4>
          <div className="space-y-3 text-green-200 text-xs">
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-green-300/90 mr-1.5">{t("email")}:</span>
                <a href="mailto:dhamner189585@gmail.com" className="hover:text-white transition-colors font-medium">dhamner189585@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={14} className="text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-green-300/90 mr-1.5">{t("officeHours")}:</span>
                <span className="font-medium">{t("officeHoursVal")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-green-300/90 mr-1.5">{t("phone")}:</span>
                <a href="tel:+919850032987" className="hover:text-white transition-colors font-medium">+91 9850032987</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
