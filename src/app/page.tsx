"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OtpModal from "@/components/OtpModal";
import { useLanguage } from "@/context/LanguageContext";

interface Property {
  id: number;
  propertyNo: string;
  ownerName: string;
  ownerNameEn: string | null;
  mobileNumber: string;
  wardNo: number;
  address: string | null;
  houseTaxDue: number;
  waterTaxDue: number;
  sanitaryTaxDue: number;
  lightTaxDue: number;
  totalDue: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Selected property for OtpModal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isOtpOpen, setIsOtpOpen] = useState(false);

  // Stats summaries
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalProperties, setTotalProperties] = useState(0);

  const { lang, t } = useLanguage();

  useEffect(() => {
    // Fetch stats for homepage display
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.success) {
          setTotalCollected(data.data.overview.totalCollected);
          setTotalProperties(data.data.overview.totalProperties);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      let url = `/api/properties?search=${encodeURIComponent(searchQuery.trim())}`;
      if (wardFilter !== "all") {
        url += `&ward=${wardFilter}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setProperties(data.data);
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error("Error searching properties:", err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsOtpOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden text-white py-16 md:py-24 px-4 flex items-center justify-center min-h-[50vh]">
          {/* Background image & dark overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: "url('/Dhamner-Village-New-Final.webp')" }}
          />
          <div className="absolute inset-0 bg-black/65" />

          <div className="relative max-w-4xl mx-auto text-center z-10">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
              {t("citizenPortal")}
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-orange-100 bg-clip-text text-transparent">
              {t("searchTitle")}
            </h2>
            <p className="text-slate-350 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              {t("searchSubtitle")}
            </p>

            {/* Quick search form */}
            <form
              onSubmit={handleSearch}
              className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 max-w-2xl mx-auto shadow-2xl flex flex-col sm:flex-row gap-2"
            >
              {/* Ward filter */}
              <div className="w-full sm:w-1/3">
                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="w-full h-12 px-3 bg-slate-800 text-white border-0 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">{t("allWards")}</option>
                  <option value="1">{t("ward1")}</option>
                  <option value="2">{t("ward2")}</option>
                  <option value="3">{t("ward3")}</option>
                </select>
              </div>

              {/* Text input */}
              <div className="w-full sm:w-2/3 relative">
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-4 pr-10 bg-slate-800/80 text-white border-0 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg">
                  🔍
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full sm:w-1/4 h-12 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-50 hover:to-amber-400 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                {t("searchBtn")}
              </button>
            </form>

            {/* Quick Helper Tips */}
            <div className="mt-4 text-xs text-slate-350 flex justify-center gap-6">
              <span>{t("searchHelper")}</span>
              <span>•</span>
              <span>✍️ {t("searchHelperName")}</span>
            </div>
          </div>
        </section>

        {/* Results / Landing Content */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                className="animate-spin h-8 w-8 text-orange-600 mb-3"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-slate-650 text-sm font-semibold">
                {lang === "mr" ? "मालमत्ता शोधत आहे, कृपया प्रतीक्षा करा..." : "Searching properties, please wait..."}
              </p>
            </div>
          ) : hasSearched ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  {lang === "mr" ? "शोध निकाल" : "Search Results"} ({properties.length})
                </h3>
              </div>

              {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => handleSelectProperty(prop)}
                      className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex justify-between items-start group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                            {prop.propertyNo}
                          </span>
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg font-semibold">
                            {lang === "mr" ? "प्रभाग" : "Ward"} {prop.wardNo}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">
                          {prop.ownerName}
                        </h4>
                        {prop.ownerNameEn && (
                          <p className="text-xs text-slate-400 truncate -mt-1">
                            {prop.ownerNameEn}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span>📞</span> {prop.mobileNumber.replace(/(\d{2})\d{4}(\d{4})/, "$1****$2")}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end shrink-0 pl-4">
                        <span className="text-xs text-slate-400">
                          {lang === "mr" ? "एकूण देय कर:" : "Total Dues:"}
                        </span>
                        <span
                          className={`text-lg font-extrabold mt-0.5 ${
                            prop.totalDue > 0 ? "text-orange-600" : "text-green-600"
                          }`}
                        >
                          ₹{prop.totalDue.toFixed(2)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1 ${
                            prop.totalDue > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                              : "bg-green-50 text-green-700 border border-green-200/50"
                          }`}
                        >
                          {prop.totalDue > 0 ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              {lang === "mr" ? "थकबाकी आहे" : "Outstanding Dues"}
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              {lang === "mr" ? "कर भरलेला" : "Fully Paid"}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                  <span className="text-4xl block mb-3">🔍</span>
                  <h4 className="font-bold text-slate-800 text-lg">
                    {lang === "mr" ? "कोणतीही मालमत्ता सापडली नाही" : "No Property Found"}
                  </h4>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                    {lang === "mr" 
                      ? "कृपया मालमत्ता क्रमांक (उदा. GP-001) किंवा नावाची अचूक स्पेलिंग तपासा."
                      : "Please verify the property number (e.g., GP-001) or owner name spelling."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* System Summary Showcase Card */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-6 md:p-10 border border-slate-100 rounded-3xl shadow-sm">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  {lang === "mr" ? "डिजिटल कर सेवा प्रणाली" : "Digital Tax Service System"}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {lang === "mr" 
                    ? "यशवंत ग्रामपंचायत धामणेरने नागरिकांच्या सोयीसाठी संपूर्ण कर व्यवस्थापन डिजिटल केले आहे. आता ग्रामपंचायतीत न जाता आपण घरूनच कर भरू शकता."
                    : "Yashwant Gram Panchayat Dhamner has digitized the entire tax management system for the convenience of citizens. You can now pay tax from home without visiting the Gram Panchayat office."}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-slate-400 text-xs font-semibold">
                      {lang === "mr" ? "नोंदणीकृत मालमत्ता" : "Registered Properties"}
                    </span>
                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                      {totalProperties > 0 ? totalProperties : "५४४"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-slate-400 text-xs font-semibold">
                      {lang === "mr" ? "एकूण संकलित कर" : "Total Collected Tax"}
                    </span>
                    <span className="text-xl font-extrabold text-green-600 mt-1 block font-sans">
                      ₹{totalCollected > 0 ? Math.round(totalCollected).toLocaleString(lang === "mr" ? "en-IN" : "en-US") : "1,50,000+"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphic Showcase */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 shadow-inner flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {lang === "mr" ? "मालमत्ता शोधा" : "Search Property"}
                    </h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {lang === "mr" 
                        ? "आपले नाव किंवा मालमत्ता क्रमांक टाकून कर तपासा."
                        : "Check tax dues using your name or property number."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {lang === "mr" ? "सुरक्षित लॉगिन" : "Secure OTP"}
                    </h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {lang === "mr" 
                        ? "मोबाईलवर प्राप्त झालेला गुप्त कोड वापरून खात्री करा."
                        : "Verify using the security code shown on the screen."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {lang === "mr" ? "भरणा करा" : "Online Payment"}
                    </h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {lang === "mr" 
                        ? "UPI, QR कोड स्कॅन किंवा कार्डने त्वरित पावती मिळवा."
                        : "Scan UPI QR code or pay by card to get instant receipt."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* OTP verification popup */}
      {selectedProperty && (
        <OtpModal
          isOpen={isOtpOpen}
          onClose={() => setIsOtpOpen(false)}
          propertyNo={selectedProperty.propertyNo}
          ownerName={selectedProperty.ownerName}
          mobileNumber={selectedProperty.mobileNumber}
        />
      )}
    </div>
  );
}
