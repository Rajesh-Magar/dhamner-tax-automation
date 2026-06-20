"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import OtpModal from "@/components/OtpModal";

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
        <section className="relative overflow-hidden bg-slate-900 text-white py-12 md:py-20 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600/20 via-slate-900 to-slate-950" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
              नागरिक सेवा केंद्र • Citizen Portal
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-orange-100 bg-clip-text text-transparent">
              आपला घरपट्टी व पाणीपट्टी कर शोधा
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              मालमत्ता क्रमांक (Property No) किंवा धारकाच्या नावाने कर शोधा आणि थेट ऑनलाइन भरणा करा.
            </p>

            {/* Quick search form */}
            <form
              onSubmit={handleSearch}
              className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 max-w-2xl mx-auto shadow-2xl flex flex-col sm:flex-row gap-2"
            >
              {/* Ward filter */}
              <div className="w-full sm:w-1/4">
                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="w-full h-12 px-3 bg-slate-800 text-white border-0 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">सर्व प्रभाग (All Wards)</option>
                  <option value="1">प्रभाग १ (Ward 1)</option>
                  <option value="2">प्रभाग २ (Ward 2)</option>
                  <option value="3">प्रभाग ३ (Ward 3)</option>
                </select>
              </div>

              {/* Text input */}
              <div className="w-full sm:w-2/3 relative">
                <input
                  type="text"
                  placeholder="उदा. GP-001 किंवा रामचंद्र पाटील..."
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
                className="w-full sm:w-1/4 h-12 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                शोधा (Search)
              </button>
            </form>

            {/* Quick Helper Tips */}
            <div className="mt-4 text-xs text-slate-400 flex justify-center gap-6">
              <span>💡 मालमत्ता क्रमांक (उदा. GP-001) प्रविष्ट करा</span>
              <span>•</span>
              <span>✍️ मराठी किंवा इंग्रजी नावाने शोधा</span>
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
              <p className="text-slate-650 text-sm font-semibold">मालमत्ता शोधत आहे, कृपया प्रतीक्षा करा...</p>
            </div>
          ) : hasSearched ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  शोध निकाल ({properties.length})
                </h3>
                <span className="text-xs text-slate-500">Search Results</span>
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
                            वॉर्ड {prop.wardNo}
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
                        <span className="text-xs text-slate-400">एकूण देय कर:</span>
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
                              थकबाकी आहे
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              कर भरलेला
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
                  <h4 className="font-bold text-slate-800 text-lg">कोणतीही मालमत्ता सापडली नाही</h4>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                    कृपया मालमत्ता क्रमांक (उदा. GP-001) किंवा नावाची अचूक स्पेलिंग तपासा.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* System Summary Showcase Card */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-6 md:p-10 border border-slate-100 rounded-3xl shadow-sm">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  डिजिटल कर सेवा प्रणाली
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  यशवंत ग्रामपंचायत धामणेरने नागरिकांच्या सोयीसाठी संपूर्ण कर व्यवस्थापन डिजिटल केले आहे. आता ग्रामपंचायतीत न जाता आपण घरूनच कर भरू शकता.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-slate-400 text-xs">नोंदणीकृत मालमत्ता</span>
                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
                      {totalProperties > 0 ? totalProperties : "५४४"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-slate-400 text-xs">एकूण संकलित कर</span>
                    <span className="text-xl font-extrabold text-green-600 mt-1 block">
                      ₹{totalCollected > 0 ? Math.round(totalCollected).toLocaleString("mr-IN") : "१.५ लक्ष+"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphic Showcase */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 shadow-inner flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg shadow-md shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">मालमत्ता शोधा (Search)</h4>
                    <p className="text-slate-500 text-xs mt-0.5">आपले नाव किंवा मालमत्ता क्रमांक टाकून कर तपासा.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg shadow-md shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">सुरक्षित लॉगिन (Secure OTP)</h4>
                    <p className="text-slate-500 text-xs mt-0.5">मोबाईलवर प्राप्त झालेला गुप्त कोड वापरून खात्री करा.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center text-lg shadow-md shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">भरणा करा (Online Payment)</h4>
                    <p className="text-slate-500 text-xs mt-0.5">UPI, QR कोड स्कॅन किंवा कार्डने त्वरित पावती मिळवा.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs border-t border-slate-850">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="font-medium text-slate-300">
            © {new Date().getFullYear()} यशवंत ग्रामपंचायत धामणेर — कर व्यवस्थापन प्रणाली
          </p>
          <div className="flex justify-center gap-6 text-slate-500">
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors">प्रशासक लॉगिन (Admin Login)</Link>
            <span>•</span>
            <Link href="https://grampanchayatdhamner.in" target="_blank" className="hover:text-slate-400 transition-colors">ग्रामपंचायत धामणेर मुख्य संकेतस्थळ</Link>
          </div>
          <p className="text-slate-600 mt-2">
            Developed for Grampanchayat Dhamner, Tal. Koregaon, Dist. Satara.
          </p>
        </div>
      </footer>

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
