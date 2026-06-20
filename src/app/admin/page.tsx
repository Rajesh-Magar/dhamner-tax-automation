"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReceiptView from "@/components/ReceiptView";

interface Defaulter {
  propertyNo: string;
  ownerName: string;
  ownerNameEn: string | null;
  wardNo: number;
  mobileNumber: string;
  totalDue: number;
}

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
  transactionCount: number;
}

interface Stats {
  financialYear: string;
  overview: {
    totalProperties: number;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionPercentage: number;
  };
  taxBreakdown: {
    houseTax: { collected: number; pending: number };
    waterTax: { collected: number; pending: number };
    sanitaryTax: { collected: number; pending: number };
    lightTax: { collected: number; pending: number };
  };
  paymentMethods: {
    online: number;
    cash: number;
    upi: number;
    totalTransactions: number;
  };
  defaulters: {
    count: number;
    paidUpCount: number;
    list: Defaulter[];
  };
  wardStats: Array<{
    wardNo: number;
    totalProperties: number;
    propertiesWithDues: number;
    paidUpProperties: number;
    totalDue: number;
    totalCollected: number;
  }>;
}

const ADMIN_KEY = "dhamner-admin-secret-key-2026";

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "defaulters" | "cash" | "properties" | "import">("overview");

  // State data
  const [stats, setStats] = useState<Stats | null>(null);
  const [wardFilter, setWardFilter] = useState("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Search query states
  const [defaulterSearch, setDefaulterSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  // Cash payment states
  const [cashPropertyNo, setCashPropertyNo] = useState("");
  const [cashSelectedProperty, setCashSelectedProperty] = useState<Property | null>(null);
  const [cashTaxType, setCashTaxType] = useState("house_tax");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [cashSuccessTxn, setCashSuccessTxn] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Add/Edit Property states
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [propFormNo, setPropFormNo] = useState("");
  const [propFormName, setPropFormName] = useState("");
  const [propFormNameEn, setPropFormNameEn] = useState("");
  const [propFormMobile, setPropFormMobile] = useState("");
  const [propFormWard, setPropFormWard] = useState("1");
  const [propFormAddress, setPropFormAddress] = useState("");
  const [propFormHouse, setPropFormHouse] = useState("0");
  const [propFormWater, setPropFormWater] = useState("0");
  const [propFormSanitary, setPropFormSanitary] = useState("0");
  const [propFormLight, setPropFormLight] = useState("0");
  const [propFormError, setPropFormError] = useState("");

  // Bulk import states
  const [csvFileContent, setCsvFileContent] = useState("");
  const [importStatus, setImportStatus] = useState<"IDLE" | "PARSING" | "IMPORTING" | "DONE" | "ERROR">("IDLE");
  const [importLog, setImportLog] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    // Route Protection check
    const loggedIn = localStorage.getItem("admin_session") === "true";
    if (!loggedIn) {
      router.push("/admin/login");
    } else {
      setAuthChecked(true);
    }
  }, []);

  const loadDashboardData = async () => {
    if (!authChecked) return;
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`/api/admin/stats?ward=${wardFilter}`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const statsData = await statsRes.json();

      // 2. Fetch all properties
      const propsRes = await fetch(`/api/admin/properties?ward=${wardFilter === "all" ? "" : wardFilter}`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const propsData = await propsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (propsData.success) setProperties(propsData.data);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [authChecked, wardFilter]);

  if (!authChecked) return null;

  // Handle cash collection property lookup
  const handleCashPropertyLookup = () => {
    const found = properties.find(p => p.propertyNo.toUpperCase() === cashPropertyNo.trim().toUpperCase());
    if (found) {
      setCashSelectedProperty(found);
      // Pre-fill amount with selected tax outstanding due
      const currentTaxDue = getTaxDueAmount(found, cashTaxType);
      setCashAmount(currentTaxDue > 0 ? currentTaxDue.toString() : "");
    } else {
      setCashSelectedProperty(null);
      alert("मालमत्ता क्रमांक सापडला नाही! कृपया तपासा.");
    }
  };

  const getTaxDueAmount = (prop: Property, type: string): number => {
    switch (type) {
      case "house_tax": return prop.houseTaxDue;
      case "water_tax": return prop.waterTaxDue;
      case "sanitary_tax": return prop.sanitaryTaxDue;
      case "light_tax": return prop.lightTaxDue;
      default: return 0;
    }
  };

  // Submit cash payment
  const handleCashPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashSelectedProperty || !cashAmount || parseFloat(cashAmount) <= 0) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyNo: cashSelectedProperty.propertyNo,
          amountPaid: parseFloat(cashAmount),
          taxType: cashTaxType,
          paymentMethod: "CASH",
          recordedBy: "ग्रामसेवक",
          notes: cashNotes || "ग्रामपंचायत कार्यालयात रोख भरणा",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCashSuccessTxn(data.data);
        setIsReceiptOpen(true);
        // Reset form
        setCashPropertyNo("");
        setCashSelectedProperty(null);
        setCashAmount("");
        setCashNotes("");
        // Reload dashboard
        loadDashboardData();
      } else {
        alert("त्रुटी: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("भरणा नोंदवताना तांत्रिक अडचण आली.");
    } finally {
      setActionLoading(false);
    }
  };

  // Add new property
  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropFormError("");

    if (!propFormNo || !propFormName || !propFormMobile) {
      setPropFormError("कृपया आवश्यक फील्ड भरा.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY
        },
        body: JSON.stringify({
          propertyNo: propFormNo,
          ownerName: propFormName,
          ownerNameEn: propFormNameEn || null,
          mobileNumber: propFormMobile,
          wardNo: parseInt(propFormWard, 10),
          address: propFormAddress || null,
          houseTaxDue: parseFloat(propFormHouse || "0"),
          waterTaxDue: parseFloat(propFormWater || "0"),
          sanitaryTaxDue: parseFloat(propFormSanitary || "0"),
          lightTaxDue: parseFloat(propFormLight || "0")
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsPropertyModalOpen(false);
        // Reset fields
        setPropFormNo("");
        setPropFormName("");
        setPropFormNameEn("");
        setPropFormMobile("");
        setPropFormAddress("");
        setPropFormHouse("0");
        setPropFormWater("0");
        setPropFormSanitary("0");
        setPropFormLight("0");
        // Reload
        loadDashboardData();
      } else {
        setPropFormError(data.message || "मालमत्ता जोडण्यात अडचण आली.");
      }
    } catch (err) {
      console.error(err);
      setPropFormError("तांत्रिक त्रुटी आली.");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk import client-side parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvFileContent(event.target?.result as string);
      setImportStatus("IDLE");
      setImportLog([]);
    };
    reader.readAsText(file);
  };

  const handleStartImport = async () => {
    if (!csvFileContent) return;

    setImportStatus("PARSING");
    const lines = csvFileContent.split("\n").map(l => l.trim()).filter(Boolean);
    
    // Validate CSV header
    const headers = lines[0].toLowerCase().split(",");
    const requiredHeaders = ["propertyno", "ownername", "mobilenumber", "wardno"];
    
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      setImportStatus("ERROR");
      setImportLog([`❌ चुकीचे फॉरमॅट! आवश्यक हेडर गहाळ आहेत: ${missing.join(", ")}`]);
      return;
    }

    setImportStatus("IMPORTING");
    const rows = lines.slice(1);
    setImportProgress({ current: 0, total: rows.length });
    
    const logs: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Basic CSV splitting (handling quotes optionally, but for simplicity split by comma)
      const values = row.split(",");
      if (values.length < 4) continue;

      const propData: any = {};
      headers.forEach((header, idx) => {
        propData[header] = values[idx]?.replace(/^["']|["']$/g, "").trim();
      });

      try {
        const res = await fetch("/api/admin/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": ADMIN_KEY
          },
          body: JSON.stringify({
            propertyNo: propData.propertyno,
            ownerName: propData.ownername,
            ownerNameEn: propData.ownernameen || null,
            mobileNumber: propData.mobilenumber,
            wardNo: parseInt(propData.wardno || "1", 10),
            address: propData.address || null,
            houseTaxDue: parseFloat(propData.housetaxdue || "0"),
            waterTaxDue: parseFloat(propData.watertaxdue || "0"),
            sanitaryTaxDue: parseFloat(propData.sanitarytaxdue || "0"),
            lightTaxDue: parseFloat(propData.lighttaxdue || "0")
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          successCount++;
          logs.push(`✅ यशस्वी: ${propData.propertyno} - ${propData.ownername}`);
        } else {
          failCount++;
          logs.push(`❌ अयशस्वी: ${propData.propertyno} (${data.message || "Unknown error"})`);
        }
      } catch (err) {
        failCount++;
        logs.push(`❌ त्रुटी: ${propData.propertyno} (नेटवर्क एरर)`);
      }

      setImportProgress({ current: i + 1, total: rows.length });
      setImportLog([...logs]);
    }

    setImportStatus("DONE");
    setImportLog([
      `🎉 आयात पूर्ण! एकूण यशस्वी: ${successCount}, अयशस्वी: ${failCount}`,
      ...logs
    ]);
    loadDashboardData();
  };

  // Filters search outputs
  const filteredDefaulters = stats?.defaulters.list.filter(d => 
    d.ownerName.includes(defaulterSearch) || 
    d.propertyNo.toLowerCase().includes(defaulterSearch.toLowerCase())
  ) || [];

  const filteredProperties = properties.filter(p => 
    p.ownerName.includes(propertySearch) || 
    p.propertyNo.toLowerCase().includes(propertySearch.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 py-8 gap-6">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">मुख्य मेनू</span>
            
            <SidebarBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon="📊" label="वसुली आकडेवारी" />
            <SidebarBtn active={activeTab === "defaulters"} onClick={() => setActiveTab("defaulters")} icon="⚠️" label="थकबाकीदार यादी" />
            <SidebarBtn active={activeTab === "cash"} onClick={() => setActiveTab("cash")} icon="💵" label="रोख कर भरणा" />
            <SidebarBtn active={activeTab === "properties"} onClick={() => setActiveTab("properties")} icon="🏠" label="मालमत्ता यादी" />
            <SidebarBtn active={activeTab === "import"} onClick={() => setActiveTab("import")} icon="📥" label="डेटा आयात (Import)" />
          </div>

          {/* Quick Ward Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">प्रभाग निवडा</label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="all">सर्व प्रभाग (All Wards)</option>
              <option value="1">प्रभाग १ (Ward 1)</option>
              <option value="2">प्रभाग २ (Ward 2)</option>
              <option value="3">प्रभाग ३ (Ward 3)</option>
            </select>
          </div>
        </aside>

        {/* Right Side Working Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <svg className="animate-spin h-8 w-8 text-slate-900 mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-slate-500 text-sm font-semibold">माहिती लोड होत आहे...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Overview stats */}
              {activeTab === "overview" && stats && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">वसुली आकडेवारी (Overview)</h3>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                      FY {stats.financialYear}
                    </span>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatsCard label="एकूण अपेक्षित वसुली" val={`₹${stats.overview.totalExpected.toLocaleString("mr-IN")}`} color="bg-slate-900 text-white" />
                    <StatsCard label="एकूण संकलित कर" val={`₹${stats.overview.totalCollected.toLocaleString("mr-IN")}`} color="bg-green-600 text-white" />
                    <StatsCard label="उर्वरित थकबाकी" val={`₹${stats.overview.totalPending.toLocaleString("mr-IN")}`} color="bg-orange-600 text-white" />
                    <StatsCard label="वसुली टक्केवारी" val={`${stats.overview.collectionPercentage}%`} color="bg-blue-600 text-white" />
                  </div>

                  {/* Itemized Dues and collections chart mock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">कर प्रकारानुसार आकडेवारी</h4>
                      <div className="space-y-3.5">
                        <ProgressBarItem title="घरपट्टी (House Tax)" collected={stats.taxBreakdown.houseTax.collected} pending={stats.taxBreakdown.houseTax.pending} />
                        <ProgressBarItem title="पाणीपट्टी (Water Tax)" collected={stats.taxBreakdown.waterTax.collected} pending={stats.taxBreakdown.waterTax.pending} />
                        <ProgressBarItem title="सॅनिटरी कर (Sanitary)" collected={stats.taxBreakdown.sanitaryTax.collected} pending={stats.taxBreakdown.sanitaryTax.pending} />
                        <ProgressBarItem title="दिवाबत्ती कर (Light Tax)" collected={stats.taxBreakdown.lightTax.collected} pending={stats.taxBreakdown.lightTax.pending} />
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">भरणा पद्धती (Payment Methods)</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">💻 ऑनलाइन पेमेंट (Gateway):</span>
                          <span className="font-bold text-slate-800">{stats.paymentMethods.online} व्यवहार</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">💵 रोख भरणा (Cash):</span>
                          <span className="font-bold text-slate-800">{stats.paymentMethods.cash} व्यवहार</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">📱 UPI पेमेंट:</span>
                          <span className="font-bold text-slate-800">{stats.paymentMethods.upi} व्यवहार</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center text-xs">
                        <span className="text-slate-400">एकूण व्यवहार संख्या:</span>
                        <span className="font-bold text-slate-700">{stats.paymentMethods.totalTransactions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ward wise Breakdown Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm">प्रभागनिहाय वसुली अहवाल (Ward-wise Summary)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                            <th className="p-4">प्रभाग क्रमांक</th>
                            <th className="p-4 text-center">एकूण कुटुंबे (Properties)</th>
                            <th className="p-4 text-center">थकबाकीदार कुटुंबे</th>
                            <th className="p-4 text-right">संकलित कर</th>
                            <th className="p-4 text-right">थकबाकी</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-55">
                          {stats.wardStats.map((w) => (
                            <tr key={w.wardNo} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800">प्रभाग क्रमांक {w.wardNo}</td>
                              <td className="p-4 text-center font-semibold text-slate-600">{w.totalProperties}</td>
                              <td className="p-4 text-center font-semibold text-orange-655">{w.propertiesWithDues}</td>
                              <td className="p-4 text-right font-bold text-green-600">₹{w.totalCollected.toLocaleString("mr-IN")}</td>
                              <td className="p-4 text-right font-bold text-orange-600">₹{w.totalDue.toLocaleString("mr-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Defaulters Directory */}
              {activeTab === "defaulters" && stats && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-slate-800">थकबाकीदार यादी (Defaulters)</h3>
                    
                    {/* Search bar */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="नाव किंवा मालमत्ता क्र. शोधा..."
                        value={defaulterSearch}
                        onChange={(e) => setDefaulterSearch(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-800 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
                    </div>
                  </div>

                  {/* Defaulter list Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {filteredDefaulters.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                              <th className="p-4">मालमत्ता क्र.</th>
                              <th className="p-4">धारकाचे नाव</th>
                              <th className="p-4 text-center">प्रभाग</th>
                              <th className="p-4">मोबाईल</th>
                              <th className="p-4 text-right">एकूण थकबाकी</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredDefaulters.map((d) => (
                              <tr key={d.propertyNo} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-slate-800">{d.propertyNo}</td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-700 block">{d.ownerName}</span>
                                  {d.ownerNameEn && <span className="text-[10px] text-slate-400">{d.ownerNameEn}</span>}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold">वॉर्ड {d.wardNo}</span>
                                </td>
                                <td className="p-4 text-slate-600">{d.mobileNumber}</td>
                                <td className="p-4 text-right font-extrabold text-orange-600 text-sm">₹{d.totalDue.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400">
                        <span className="text-2xl block mb-2">👍</span>
                        <p className="text-xs font-semibold">थकबाकीदार आढळले नाहीत.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Cash collection */}
              {activeTab === "cash" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-xl font-bold text-slate-800">रोख कर भरणा नोंदणी (Cash Collection)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Input lookup */}
                    <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 h-fit">
                      <h4 className="font-bold text-slate-800 text-sm">खाते शोधा (Lookup Account)</h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">मालमत्ता क्रमांक (Property No):</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="उदा. GP-002"
                            value={cashPropertyNo}
                            onChange={(e) => setCashPropertyNo(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg uppercase focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCashPropertyLookup}
                            className="px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            शोधा
                          </button>
                        </div>
                      </div>

                      {/* Summary details if found */}
                      {cashSelectedProperty && (
                        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-slate-400">नाव:</span> <span className="font-bold text-slate-700">{cashSelectedProperty.ownerName}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">वॉर्ड:</span> <span className="font-semibold text-slate-700">वॉर्ड {cashSelectedProperty.wardNo}</span></div>
                          <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">एकूण थकबाकी:</span> <span className="font-extrabold text-orange-600">₹{cashSelectedProperty.totalDue.toFixed(2)}</span></div>
                        </div>
                      )}
                    </div>

                    {/* Right: Record payment form */}
                    <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">भरणा नोंद (Record Transaction)</h4>
                      {cashSelectedProperty ? (
                        <form onSubmit={handleCashPaymentSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">कराचा प्रकार (Tax Type):</label>
                              <select
                                value={cashTaxType}
                                onChange={(e) => {
                                  setCashTaxType(e.target.value);
                                  const currentDue = getTaxDueAmount(cashSelectedProperty, e.target.value);
                                  setCashAmount(currentDue > 0 ? currentDue.toString() : "");
                                }}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                              >
                                <option value="house_tax">घरपट्टी (House Tax)</option>
                                <option value="water_tax">पाणीपट्टी (Water Tax)</option>
                                <option value="sanitary_tax">सॅनिटरी कर (Sanitary)</option>
                                <option value="light_tax">दिवाबत्ती कर (Light Tax)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">रक्कम (Amount Paid - ₹):</label>
                              <input
                                type="number"
                                required
                                min="1"
                                placeholder="रक्कम प्रविष्ट करा..."
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">तपशील / नोंद (Notes):</label>
                            <textarea
                              rows={2}
                              placeholder="उदा. घरपट्टी रोख भरणा..."
                              value={cashNotes}
                              onChange={(e) => setCashNotes(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCashPropertyNo("");
                                setCashSelectedProperty(null);
                              }}
                              className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              रद्द करा
                            </button>
                            <button
                              type="submit"
                              disabled={actionLoading || !cashAmount}
                              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                            >
                              {actionLoading ? "नोंदवत आहे..." : "भरणा सबमिट करा"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                          <span className="text-3xl mb-2">🔍</span>
                          <p className="text-xs font-semibold">भरणा करण्यासाठी प्रथम मालमत्ता क्रमांक शोधून खाते सिलेक्ट करा.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Property Management CRUD */}
              {activeTab === "properties" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-slate-800">मालमत्ता व्यवस्थापन (Properties Directory)</h3>
                    
                    <div className="flex items-center gap-2">
                      {/* Search */}
                      <div className="relative w-full sm:w-48">
                        <input
                          type="text"
                          placeholder="नाव किंवा मालमत्ता क्र..."
                          value={propertySearch}
                          onChange={(e) => setPropertySearch(e.target.value)}
                          className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">🔍</span>
                      </div>
                      
                      {/* Add Button */}
                      <button
                        onClick={() => {
                          setPropFormError("");
                          setIsPropertyModalOpen(true);
                        }}
                        className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                      >
                        ➕ नवीन मालमत्ता
                      </button>
                    </div>
                  </div>

                  {/* Properties table list */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {filteredProperties.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                              <th className="p-4">मालमत्ता क्र.</th>
                              <th className="p-4">धारकाचे नाव</th>
                              <th className="p-4 text-center">प्रभाग</th>
                              <th className="p-4">मोबाईल</th>
                              <th className="p-4 text-right">एकूण देय कर</th>
                              <th className="p-4 text-center">व्यवहार</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredProperties.map((p) => (
                              <tr key={p.propertyNo} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-slate-800">{p.propertyNo}</td>
                                <td className="p-4 font-bold text-slate-700">{p.ownerName}</td>
                                <td className="p-4 text-center">
                                  <span className="bg-orange-50 text-orange-655 px-2 py-0.5 rounded text-[10px] font-bold">वॉर्ड {p.wardNo}</span>
                                </td>
                                <td className="p-4 text-slate-600">{p.mobileNumber}</td>
                                <td className="p-4 text-right font-extrabold text-slate-800">₹{p.totalDue.toFixed(2)}</td>
                                <td className="p-4 text-center text-slate-550 font-semibold">{p.transactionCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400">
                        <p className="text-xs font-semibold">कोणतीही मालमत्ता सापडली नाही.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Bulk Import csv */}
              {activeTab === "import" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-xl font-bold text-slate-800">डेटा आयात (Bulk CSV Import)</h3>

                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">पारंपारिक रेकॉर्ड्स आयात करा</h4>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                        आपल्याकडील सर्व ५४४ मालमत्तांचे रेकॉर्ड्स एकाच वेळी आयात करण्यासाठी CSV फाइल निवडा. फाइलमध्ये खालील हेडर कॉलम्स असणे अनिवार्य आहे:
                      </p>
                      <code className="block bg-slate-50 border border-slate-100 p-3 rounded-lg text-[10px] font-mono text-slate-600">
                        propertyNo,ownerName,ownerNameEn,mobileNumber,wardNo,address,houseTaxDue,waterTaxDue,sanitaryTaxDue,lightTaxDue
                      </code>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center relative group">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span className="text-3xl mb-2">📊</span>
                      <span className="text-xs font-semibold text-slate-700">CSV फाइल निवडा किंवा ड्रॅग करा</span>
                      <span className="text-[10px] text-slate-400 mt-1">फक्त .csv फाइल्स</span>
                    </div>

                    {csvFileContent && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">फाइल तयार आहे!</span>
                          <button
                            type="button"
                            onClick={handleStartImport}
                            disabled={importStatus === "IMPORTING" || importStatus === "PARSING"}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                          >
                            {importStatus === "IMPORTING" ? `आयात होत आहे (${importProgress.current}/${importProgress.total})...` : "डेटा आयात सुरू करा"}
                          </button>
                        </div>

                        {/* Progress Bar */}
                        {(importStatus === "IMPORTING" || importStatus === "DONE") && (
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                            />
                          </div>
                        )}

                        {/* Log viewer */}
                        {importLog.length > 0 && (
                          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-[10px] font-mono text-slate-300 h-48 overflow-y-auto space-y-1 select-text">
                            {importLog.map((log, idx) => (
                              <div key={idx}>{log}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Reusable Overlay printable Receipt if recorded cash payment */}
      {cashSuccessTxn && (
        <ReceiptView
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setCashSuccessTxn(null);
          }}
          transaction={cashSuccessTxn}
          propertyData={cashSelectedProperty}
        />
      )}

      {/* Add Property Modal Overlay */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">नवीन मालमत्ता नोंदणी (Add Property)</h3>
              <button onClick={() => setIsPropertyModalOpen(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPropertySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">मालमत्ता क्रमांक *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. GP-031"
                    value={propFormNo}
                    onChange={(e) => setPropFormNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">मोबाईल क्रमांक *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. 9823xxxxxx"
                    value={propFormMobile}
                    onChange={(e) => setPropFormMobile(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">धारकाचे नाव (मराठी) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. श्री. रामचंद्र पाटील"
                  value={propFormName}
                  onChange={(e) => setPropFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Name (English)</label>
                  <input
                    type="text"
                    placeholder="Shri. Ramchandra Patil"
                    value={propFormNameEn}
                    onChange={(e) => setPropFormNameEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">प्रभाग क्रमांक *</label>
                  <select
                    value={propFormWard}
                    onChange={(e) => setPropFormWard(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="1">प्रभाग १ (Ward 1)</option>
                    <option value="2">प्रभाग २ (Ward 2)</option>
                    <option value="3">प्रभाग ३ (Ward 3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">पत्ता (Address)</label>
                <input
                  type="text"
                  placeholder="उदा. बाजारपेठ जवळ..."
                  value={propFormAddress}
                  onChange={(e) => setPropFormAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block text-xs font-bold text-slate-700 mb-2">थकबाकी आरंभिक मूल्य (Initial Dues)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">घरपट्टी थकबाकी (₹)</label>
                    <input
                      type="number"
                      value={propFormHouse}
                      onChange={(e) => setPropFormHouse(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">पाणीपट्टी थकबाकी (₹)</label>
                    <input
                      type="number"
                      value={propFormWater}
                      onChange={(e) => setPropFormWater(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">सॅनिटरी थकबाकी (₹)</label>
                    <input
                      type="number"
                      value={propFormSanitary}
                      onChange={(e) => setPropFormSanitary(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">दिवाबत्ती थकबाकी (₹)</label>
                    <input
                      type="number"
                      value={propFormLight}
                      onChange={(e) => setPropFormLight(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {propFormError && (
                <p className="text-[11px] text-red-500 text-center">⚠️ {propFormError}</p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "नोंदणी होत आहे..." : "मालमत्ता सबमिट करा"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Side tab item buttons
function SidebarBtn({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
        active
          ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      <span className="text-sm shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Summary cards
function StatsCard({
  label,
  val,
  color
}: {
  label: string;
  val: string;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between ${color}`}>
      <span className="text-[10px] font-bold opacity-80 uppercase tracking-wide">{label}</span>
      <span className="text-xl font-extrabold mt-2 tracking-tight">{val}</span>
    </div>
  );
}

// Progress bars for tax item breakdown
function ProgressBarItem({
  title,
  collected,
  pending
}: {
  title: string;
  collected: number;
  pending: number;
}) {
  const total = collected + pending;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between items-center text-slate-700">
        <span className="font-semibold">{title}</span>
        <span className="font-mono font-bold text-slate-800">{pct}% वसुली</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
        <span>वसूल: ₹{Math.round(collected).toLocaleString("mr-IN")}</span>
        <span>थकबाकी: ₹{Math.round(pending).toLocaleString("mr-IN")}</span>
      </div>
    </div>
  );
}
