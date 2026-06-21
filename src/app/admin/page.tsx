"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReceiptView from "@/components/ReceiptView";
import { useLanguage } from "@/context/LanguageContext";

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
  const [activeTab, setActiveTab] = useState<"overview" | "defaulters" | "cash" | "properties" | "import" | "assess">("overview");
  const { lang, toggleLang, t } = useLanguage();

  // State data
  const [stats, setStats] = useState<Stats | null>(null);
  const [wardFilter, setWardFilter] = useState("all");
  const [selectedFy, setSelectedFy] = useState("2025-26");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cashFy, setCashFy] = useState("2025-26");

  // Assess rollover states
  const [assessFy, setAssessFy] = useState("2026-27");
  const [assessPropertyNo, setAssessPropertyNo] = useState("");
  const [assessSuccessMsg, setAssessSuccessMsg] = useState("");
  const [assessErrorMsg, setAssessErrorMsg] = useState("");
  
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
  const [propFormError, setPropFormError] = useState("");
  const [propFormFy, setPropFormFy] = useState("2025-26");

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
      const statsRes = await fetch(`/api/admin/stats?ward=${wardFilter}&year=${selectedFy}`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const statsData = await statsRes.json();

      // 2. Fetch all properties
      const propsRes = await fetch(`/api/admin/properties?ward=${wardFilter === "all" ? "" : wardFilter}&year=${selectedFy}`, {
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
  }, [authChecked, wardFilter, selectedFy]);

  useEffect(() => {
    if (!cashSelectedProperty) return;

    const yearDueRecord = (cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy) || {
      houseTaxDue: 0,
      waterTaxDue: 0,
    };

    const dueAmount = cashTaxType === "house_tax" ? yearDueRecord.houseTaxDue : yearDueRecord.waterTaxDue;
    setCashAmount(dueAmount > 0 ? dueAmount.toString() : "0");
  }, [cashFy, cashTaxType, cashSelectedProperty]);

  if (!authChecked) return null;

  // Handle cash collection property lookup — search by property no, owner name, or mobile
  const handleCashPropertyLookup = async () => {
    const query = cashPropertyNo.trim().toUpperCase();
    if (!query) {
      alert(lang === "mr" ? "कृपया शोध माहिती प्रविष्ट करा." : "Please enter a search query.");
      return;
    }

    let propNo = query;
    const foundLocal = properties.find(p =>
      p.propertyNo.toUpperCase() === query ||
      p.ownerName.toLowerCase().includes(query.toLowerCase()) ||
      (p.ownerNameEn && p.ownerNameEn.toLowerCase().includes(query.toLowerCase())) ||
      p.mobileNumber.includes(query)
    );
    if (foundLocal) {
      propNo = foundLocal.propertyNo;
    } else {
      // Fallback to searching all properties via the search API to support search across wards/years
      try {
        setLoading(true);
        const searchRes = await fetch(`/api/properties?search=${encodeURIComponent(cashPropertyNo.trim())}&year=${cashFy}`);
        const searchData = await searchRes.json();
        if (searchData.success && searchData.data && searchData.data.length > 0) {
          propNo = searchData.data[0].propertyNo;
        }
      } catch (err) {
        console.error("Error doing remote lookup:", err);
      } finally {
        setLoading(false);
      }
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/properties/${propNo}`);
      const data = await res.json();
      setLoading(false);

      if (data.success && data.data) {
        const fullProp = data.data;
        setCashSelectedProperty(fullProp);
        
        const yearDueRecord = fullProp.yearDues?.find((yd: any) => yd.financialYear === cashFy) || {
          houseTaxDue: 0,
          waterTaxDue: 0,
        };

        let selectedType = "house_tax";
        if (yearDueRecord.houseTaxDue > 0) {
          selectedType = "house_tax";
        } else if (yearDueRecord.waterTaxDue > 0) {
          selectedType = "water_tax";
        }
        setCashTaxType(selectedType);

        const dueAmount = selectedType === "house_tax" ? yearDueRecord.houseTaxDue : yearDueRecord.waterTaxDue;
        setCashAmount(dueAmount > 0 ? dueAmount.toString() : "0");
      } else {
        setCashSelectedProperty(null);
        alert(lang === "mr" ? "खाते सापडले नाही! कृपया मालमत्ता क्रमांक, नाव किंवा मोबाईल क्रमांक तपासा." : "Account not found! Please check property number, name, or mobile number.");
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("खाते शोधताना अडचण आली.");
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
          financialYear: cashFy,
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
          financialYear: propFormFy,
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
      // Robust CSV splitting that respects quotes
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;
      for (let charIdx = 0; charIdx < row.length; charIdx++) {
        const char = row[charIdx];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      if (values.length < 4) continue;

      const propData: any = {};
      headers.forEach((header, idx) => {
        propData[header] = values[idx]?.replace(/^["']|["']$/g, "").trim();
      });

      let mobile = propData.mobilenumber || "";
      if (mobile && /^[0-9.]+[eE]\+?[0-9]+$/.test(mobile)) {
        try {
          mobile = String(Number(mobile));
        } catch (e) {}
      }

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
            mobileNumber: mobile,
            wardNo: parseInt(propData.wardno || "1", 10),
            address: propData.address || null,
            houseTaxDue: parseFloat(propData.housetaxdue || "0"),
            waterTaxDue: parseFloat(propData.watertaxdue || "0"),
            financialYear: propData.financialyear || selectedFy,
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
  const filteredDefaulters = stats?.defaulters.list.filter(d => {
    const q = defaulterSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      d.ownerName.toLowerCase().includes(q) ||
      (d.ownerNameEn && d.ownerNameEn.toLowerCase().includes(q)) ||
      d.propertyNo.toLowerCase().includes(q) ||
      (d.mobileNumber && d.mobileNumber.includes(q))
    );
  }) || [];

  const filteredProperties = properties.filter(p => {
    const q = propertySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.ownerName.toLowerCase().includes(q) ||
      (p.ownerNameEn && p.ownerNameEn.toLowerCase().includes(q)) ||
      p.propertyNo.toLowerCase().includes(q) ||
      (p.mobileNumber && p.mobileNumber.includes(q))
    );
  }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 py-8 gap-6">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              {lang === "mr" ? "मुख्य मेनू" : "Main Menu"}
            </span>
            
            <SidebarBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon="📊" label={lang === "mr" ? "वसुली आकडेवारी" : "Collection Stats"} />
            <SidebarBtn active={activeTab === "defaulters"} onClick={() => setActiveTab("defaulters")} icon="⚠️" label={lang === "mr" ? "थकबाकीदार यादी" : "Defaulters List"} />
            <SidebarBtn active={activeTab === "cash"} onClick={() => setActiveTab("cash")} icon="💵" label={lang === "mr" ? "रोख कर भरणा" : "Record Cash"} />
            <SidebarBtn active={activeTab === "properties"} onClick={() => setActiveTab("properties")} icon="🏠" label={lang === "mr" ? "मालमत्ता यादी" : "Properties List"} />
            <SidebarBtn active={activeTab === "import"} onClick={() => setActiveTab("import")} icon="📥" label={lang === "mr" ? "डेटा आयात (Import)" : "Import Data"} />
            <SidebarBtn active={activeTab === "assess"} onClick={() => setActiveTab("assess")} icon="⚙️" label={lang === "mr" ? "आकारणी व rollover" : "Assessment & Rollover"} />
          </div>

          {/* Quick Ward Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              {lang === "mr" ? "प्रभाग निवडा" : "Select Ward"}
            </label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="all">{t("allWards")}</option>
              <option value="1">{t("ward1")}</option>
              <option value="2">{t("ward2")}</option>
              <option value="3">{t("ward3")}</option>
            </select>
          </div>

          {/* Financial Year Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              {lang === "mr" ? "आर्थिक वर्ष निवडा" : "Select Financial Year"}
            </label>
            <select
              value={selectedFy}
              onChange={(e) => setSelectedFy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
              <option value="2027-28">2027-28</option>
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
              <p className="text-slate-500 text-sm font-semibold">
                {lang === "mr" ? "माहिती लोड होत आहे..." : "Loading data..."}
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: Overview stats */}
              {activeTab === "overview" && stats && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">
                      {lang === "mr" ? "वसुली आकडेवारी (Overview)" : "Collection Stats (Overview)"}
                    </h3>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                      FY {stats.financialYear}
                    </span>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatsCard 
                      label={lang === "mr" ? "एकूण अपेक्षित वसुली" : "Total Expected"} 
                      val={`₹${stats.overview.totalExpected.toLocaleString("mr-IN")}`} 
                      borderColor="border-l-slate-900" 
                      bgColor="bg-white" 
                      textColor="text-slate-900" 
                      icon="📈" 
                    />
                    <StatsCard 
                      label={lang === "mr" ? "एकूण संकलित कर" : "Total Collected"} 
                      val={`₹${stats.overview.totalCollected.toLocaleString("mr-IN")}`} 
                      borderColor="border-l-green-600" 
                      bgColor="bg-white" 
                      textColor="text-green-700" 
                      icon="✅" 
                    />
                    <StatsCard 
                      label={lang === "mr" ? "उर्वरित थकबाकी" : "Pending Dues"} 
                      val={`₹${stats.overview.totalPending.toLocaleString("mr-IN")}`} 
                      borderColor="border-l-orange-600" 
                      bgColor="bg-white" 
                      textColor="text-orange-750" 
                      icon="⏳" 
                    />
                    <StatsCard 
                      label={lang === "mr" ? "वसुली टक्केवारी" : "Collection %"} 
                      val={`${stats.overview.collectionPercentage}%`} 
                      borderColor="border-l-blue-600" 
                      bgColor="bg-white" 
                      textColor="text-blue-700" 
                      icon="📊" 
                    />
                  </div>

                  {/* Itemized Dues and collections chart mock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">
                        {lang === "mr" ? "कर प्रकारानुसार आकडेवारी" : "Tax Type Statistics"}
                      </h4>
                      <div className="space-y-3.5">
                        <ProgressBarItem title={lang === "mr" ? "घरपट्टी (House Tax)" : "House Tax"} collected={stats.taxBreakdown.houseTax.collected} pending={stats.taxBreakdown.houseTax.pending} />
                        <ProgressBarItem title={lang === "mr" ? "पाणीपट्टी (Water Tax)" : "Water Tax"} collected={stats.taxBreakdown.waterTax.collected} pending={stats.taxBreakdown.waterTax.pending} />
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">
                        {lang === "mr" ? "भरणा पद्धती (Payment Methods)" : "Payment Methods"}
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">
                            {lang === "mr" ? "💻 ऑनलाइन पेमेंट (Gateway):" : "💻 Online Payment (Gateway):"}
                          </span>
                          <span className="font-bold text-slate-800">
                            {stats.paymentMethods.online} {lang === "mr" ? "व्यवहार" : "Txns"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">
                            {lang === "mr" ? "💵 रोख भरणा (Cash):" : "💵 Cash Payment:"}
                          </span>
                          <span className="font-bold text-slate-800">
                            {stats.paymentMethods.cash} {lang === "mr" ? "व्यवहार" : "Txns"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">
                            {lang === "mr" ? "📱 UPI पेमेंट:" : "📱 UPI Payment:"}
                          </span>
                          <span className="font-bold text-slate-800">
                            {stats.paymentMethods.upi} {lang === "mr" ? "व्यवहार" : "Txns"}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center text-xs">
                        <span className="text-slate-400">
                          {lang === "mr" ? "एकूण व्यवहार संख्या:" : "Total Transactions:"}
                        </span>
                        <span className="font-bold text-slate-700">{stats.paymentMethods.totalTransactions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ward wise Breakdown Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {lang === "mr" ? "प्रभागनिहाय वसुली अहवाल (Ward-wise Summary)" : "Ward-wise Summary Report"}
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                            <th className="p-4">{lang === "mr" ? "प्रभाग क्रमांक" : "Ward Number"}</th>
                            <th className="p-4 text-center">{lang === "mr" ? "एकूण कुटुंबे (Properties)" : "Total Properties"}</th>
                            <th className="p-4 text-center">{lang === "mr" ? "थकबाकीदार कुटुंबे" : "Defaulter Families"}</th>
                            <th className="p-4 text-right">{lang === "mr" ? "संकलित कर" : "Collected Tax"}</th>
                            <th className="p-4 text-right">{lang === "mr" ? "थकबाकी" : "Outstanding Dues"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-55">
                          {stats.wardStats.map((w) => (
                            <tr key={w.wardNo} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800">
                                {lang === "mr" ? `प्रभाग क्रमांक ${w.wardNo}` : `Ward No. ${w.wardNo}`}
                              </td>
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
                    <h3 className="text-xl font-bold text-slate-800">
                      {lang === "mr" ? "थकबाकीदार यादी (Defaulters)" : "Defaulters List"}
                    </h3>
                    
                    {/* Search bar */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder={lang === "mr" ? "नाव किंवा मालमत्ता क्र. शोधा..." : "Search name or property no..."}
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
                              <th className="p-4">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</th>
                              <th className="p-4">{lang === "mr" ? "धारकाचे नाव" : "Owner Name"}</th>
                              <th className="p-4 text-center">{lang === "mr" ? "प्रभाग" : "Ward"}</th>
                              <th className="p-4">{lang === "mr" ? "मोबाईल" : "Mobile"}</th>
                              <th className="p-4 text-right">{lang === "mr" ? "एकूण थकबाकी" : "Total Dues"}</th>
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
                                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {lang === "mr" ? `वॉर्ड ${d.wardNo}` : `Ward ${d.wardNo}`}
                                  </span>
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
                        <p className="text-xs font-semibold">
                          {lang === "mr" ? "थकबाकीदार आढळले नाहीत." : "No defaulters found."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Cash collection */}
              {activeTab === "cash" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-xl font-bold text-slate-800">
                    {lang === "mr" ? "रोख कर भरणा नोंदणी (Cash Collection)" : "Record Cash Tax Payment"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Input lookup */}
                    <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 h-fit">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {lang === "mr" ? "खाते शोधा (Lookup Account)" : "Search Account"}
                      </h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          {lang === "mr" ? "मालमत्ता क्र. / नाव / मोबाईल:" : "Property No / Name / Mobile:"}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={lang === "mr" ? "उदा. GP-002, पाटील, 9823..." : "e.g. GP-002, Patil, 9823..."}
                            value={cashPropertyNo}
                            onChange={(e) => setCashPropertyNo(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCashPropertyLookup(); }}
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCashPropertyLookup}
                            className="px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            {lang === "mr" ? "शोधा" : "Search"}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {lang === "mr" ? "मालमत्ता क्रमांक, धारकाचे नाव किंवा मोबाईल क्रमांक प्रविष्ट करा" : "Enter property number, owner name, or mobile number"}
                        </p>
                      </div>

                      {/* Summary details if found */}
                      {cashSelectedProperty && (
                        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">{lang === "mr" ? "मालमत्ता क्र.:" : "Property No:"}</span> 
                            <span className="font-bold text-slate-700">{cashSelectedProperty.propertyNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{lang === "mr" ? "नाव:" : "Name:"}</span> 
                            <span className="font-bold text-slate-700">{cashSelectedProperty.ownerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{lang === "mr" ? "वॉर्ड:" : "Ward:"}</span> 
                            <span className="font-semibold text-slate-700">
                              {lang === "mr" ? `वॉर्ड ${cashSelectedProperty.wardNo}` : `Ward ${cashSelectedProperty.wardNo}`}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-50 pt-2">
                            <span className="text-slate-400">{lang === "mr" ? "घरपट्टी (या वर्षाची):" : "House Tax (This Year):"}</span> 
                            <span className={`font-semibold ${((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0) > 0 ? "text-orange-600" : "text-green-600"}`}>
                              {((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0) > 0 
                                ? `₹${((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0).toFixed(2)}` 
                                : (lang === "mr" ? "✅ भरले" : "✅ Paid")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{lang === "mr" ? "पाणीपट्टी (या वर्षाची):" : "Water Tax (This Year):"}</span> 
                            <span className={`font-semibold ${((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0) > 0 ? "text-orange-600" : "text-green-600"}`}>
                              {((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0) > 0 
                                ? `₹${((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0).toFixed(2)}` 
                                : (lang === "mr" ? "✅ भरले" : "✅ Paid")}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-50 pt-2">
                            <span className="text-slate-400 font-bold">{lang === "mr" ? "या वर्षाची एकूण थकबाकी:" : "Total Dues (This Year):"}</span> 
                            <span className="font-extrabold text-orange-600">
                              ₹{(
                                ((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0) +
                                ((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-50 pt-1">
                            <span className="text-slate-400 font-bold">{lang === "mr" ? "सर्व वर्षांची एकूण थकबाकी:" : "Total Dues (All Years):"}</span> 
                            <span className="font-extrabold text-red-600">₹{cashSelectedProperty.totalDue.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Record payment form */}
                    <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">
                        {lang === "mr" ? "भरणा नोंद (Record Transaction)" : "Record Payment Detail"}
                      </h4>
                      {cashSelectedProperty ? (
                        <form onSubmit={handleCashPaymentSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                {lang === "mr" ? "आर्थिक वर्ष (Financial Year):" : "Financial Year:"}
                              </label>
                              <select
                                value={cashFy}
                                onChange={(e) => setCashFy(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                              >
                                <option value="2025-26">2025-26</option>
                                <option value="2026-27">2026-27</option>
                                <option value="2027-28">2027-28</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                {lang === "mr" ? "कराचा प्रकार (Tax Type):" : "Tax Type:"}
                              </label>
                              <select
                                value={cashTaxType}
                                onChange={(e) => setCashTaxType(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                              >
                                {((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0) > 0 && (
                                  <option value="house_tax">
                                    {lang === "mr" 
                                      ? "घरपट्टी (House Tax) — ₹" + ((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0).toFixed(2) 
                                      : "House Tax — ₹" + ((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue || 0).toFixed(2)}
                                  </option>
                                )}
                                {((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0) > 0 && (
                                  <option value="water_tax">
                                    {lang === "mr" 
                                      ? "पाणीपट्टी (Water Tax) — ₹" + ((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0).toFixed(2) 
                                      : "Water Tax — ₹" + ((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue || 0).toFixed(2)}
                                  </option>
                                )}
                                {!((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.houseTaxDue > 0) && 
                                 !((cashSelectedProperty as any).yearDues?.find((yd: any) => yd.financialYear === cashFy)?.waterTaxDue > 0) && (
                                  <option value="" disabled>{lang === "mr" ? "कोणताही कर शिल्लक नाही" : "No tax pending"}</option>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                {lang === "mr" ? "रक्कम (Amount - ₹):" : "Amount (₹):"}
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                readOnly
                                value={cashAmount}
                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-bold cursor-not-allowed focus:outline-none"
                              />
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {lang === "mr" ? "रक्कम थकबाकीनुसार स्वयं-निर्धारित" : "Amount auto-set from pending dues"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              {lang === "mr" ? "तपशील / नोंद (Notes):" : "Notes / Remarks:"}
                            </label>
                            <textarea
                              rows={2}
                              placeholder={lang === "mr" ? "उदा. घरपट्टी रोख भरणा..." : "e.g. House tax cash payment..."}
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
                              {lang === "mr" ? "रद्द करा" : "Cancel"}
                            </button>
                            <button
                              type="submit"
                              disabled={actionLoading || !cashAmount}
                              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                            >
                              {actionLoading 
                                ? (lang === "mr" ? "नोंदवत आहे..." : "Recording...") 
                                : (lang === "mr" ? "भरणा सबमिट करा" : "Submit Payment")}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                          <span className="text-3xl mb-2">🔍</span>
                          <p className="text-xs font-semibold">
                            {lang === "mr" 
                              ? "भरणा करण्यासाठी प्रथम मालमत्ता क्रमांक शोधून खाते सिलेक्ट करा." 
                              : "Please search and select a property first to record cash payment."}
                          </p>
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
                    <h3 className="text-xl font-bold text-slate-800">
                      {lang === "mr" ? "मालमत्ता व्यवस्थापन (Properties)" : "Property Management"}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      {/* Search */}
                      <div className="relative w-full sm:w-48">
                        <input
                          type="text"
                          placeholder={lang === "mr" ? "नाव किंवा मालमत्ता क्र..." : "Search name or property..."}
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
                          setPropFormFy(selectedFy);
                          setIsPropertyModalOpen(true);
                        }}
                        className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                      >
                        {lang === "mr" ? "➕ नवीन मालमत्ता" : "➕ Add Property"}
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
                              <th className="p-4">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</th>
                              <th className="p-4">{lang === "mr" ? "धारकाचे नाव" : "Owner Name"}</th>
                              <th className="p-4 text-center">{lang === "mr" ? "प्रभाग" : "Ward"}</th>
                              <th className="p-4">{lang === "mr" ? "मोबाईल" : "Mobile"}</th>
                              <th className="p-4 text-right">{lang === "mr" ? "एकूण देय कर" : "Total Dues"}</th>
                              <th className="p-4 text-center">{lang === "mr" ? "व्यवहार" : "Txns"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredProperties.map((p) => (
                              <tr key={p.propertyNo} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-slate-800">{p.propertyNo}</td>
                                <td className="p-4 font-bold text-slate-700">{p.ownerName}</td>
                                <td className="p-4 text-center">
                                  <span className="bg-orange-50 text-orange-655 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {lang === "mr" ? `वॉर्ड ${p.wardNo}` : `Ward ${p.wardNo}`}
                                  </span>
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
                        <p className="text-xs font-semibold">
                          {lang === "mr" ? "कोणतीही मालमत्ता सापडली नाही." : "No properties found."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Bulk Import csv */}
              {activeTab === "import" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-xl font-bold text-slate-800">
                    {lang === "mr" ? "डेटा आयात (Bulk CSV Import)" : "Bulk CSV Import"}
                  </h3>

                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {lang === "mr" ? "पारंपारिक रेकॉर्ड्स आयात करा" : "Import Historical Records"}
                      </h4>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                        {lang === "mr" 
                          ? "आपल्याकडील सर्व ५४४ मालमत्तांचे रेकॉर्ड्स एकाच वेळी आयात करण्यासाठी CSV फाइल निवडा. फाइलमध्ये खालील हेडर कॉलम्स असणे अनिवार्य आहे:" 
                          : "Select a CSV file to import all 544 property records at once. The CSV file must contain the following headers:"}
                      </p>
                      <code className="block bg-slate-50 border border-slate-100 p-3 rounded-lg text-[10px] font-mono text-slate-600">
                        propertyNo,financialYear,ownerName,ownerNameEn,mobileNumber,wardNo,address,houseTaxDue,waterTaxDue
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
                      <span className="text-xs font-semibold text-slate-700">
                        {lang === "mr" ? "CSV फाइल निवडा किंवा ड्रॅग करा" : "Select or Drag CSV File"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {lang === "mr" ? "फक्त .csv फाइल्स" : "Only .csv files"}
                      </span>
                    </div>

                    {csvFileContent && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {lang === "mr" ? "फाइल तयार आहे!" : "File ready!"}
                          </span>
                          <button
                            type="button"
                            onClick={handleStartImport}
                            disabled={importStatus === "IMPORTING" || importStatus === "PARSING"}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                          >
                            {importStatus === "IMPORTING" 
                              ? (lang === "mr" 
                                  ? `आयात होत आहे (${importProgress.current}/${importProgress.total})...` 
                                  : `Importing (${importProgress.current}/${importProgress.total})...`) 
                              : (lang === "mr" ? "डेटा आयात सुरू करा" : "Start Import")}
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

              {/* TAB 6: Yearly Assessment & Rollover */}
              {activeTab === "assess" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-xl font-bold text-slate-800">
                    {lang === "mr" ? "वार्षिक कर आकारणी व रोलओव्हर (Rollover)" : "Yearly Tax Assessment & Rollover"}
                  </h3>

                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {lang === "mr" ? "नवीन आर्थिक वर्षाची आकारणी करा" : "Assess New Financial Year"}
                      </h4>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                        {lang === "mr" 
                          ? "या पर्यायाद्वारे तुम्ही संपूर्ण गाव किंवा विशिष्ट मालमत्तेसाठी नवीन आर्थिक वर्षाचे कर आकारू शकता. कर आकारणी करताना मागील वर्षाच्या मूल्याचा आधार घेऊन नवीन येणे रक्कम जोडली जाईल व एकूण थकबाकीत वाढ केली जाईल." 
                          : "This utility rolls over active properties into a new financial year. It baseline-copies the previous year's assessed taxes, adds them as current outstanding year dues, and increases the aggregate outstanding dues on the property records."}
                      </p>
                    </div>

                    {assessSuccessMsg && (
                      <div className="p-4 bg-green-50 border border-green-200/50 rounded-2xl text-xs text-green-700">
                        <strong>✅ {lang === "mr" ? "यशस्वी!" : "Success!"}</strong> {assessSuccessMsg}
                      </div>
                    )}

                    {assessErrorMsg && (
                      <div className="p-4 bg-red-50 border border-red-200/50 rounded-2xl text-xs text-red-700">
                        <strong>⚠️ {lang === "mr" ? "त्रुटी!" : "Error!"}</strong> {assessErrorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === "mr" ? "लक्ष्य आर्थिक वर्ष (Target FY) *" : "Target Financial Year *"}
                        </label>
                        <select
                          value={assessFy}
                          onChange={(e) => setAssessFy(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        >
                          <option value="2026-27">2026-27</option>
                          <option value="2027-28">2027-28</option>
                          <option value="2028-29">2028-29</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === "mr" ? "विशिष्ट मालमत्ता क्रमांक (पर्यायी)" : "Specific Property No (Optional)"}
                        </label>
                        <input
                          type="text"
                          value={assessPropertyNo}
                          onChange={(e) => setAssessPropertyNo(e.target.value)}
                          placeholder="उदा. GP-001"
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setActionLoading(true);
                          setAssessSuccessMsg("");
                          setAssessErrorMsg("");
                          try {
                            const res = await fetch("/api/admin/assess", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "x-admin-key": ADMIN_KEY
                              },
                              body: JSON.stringify({
                                targetFy: assessFy,
                                propertyNo: assessPropertyNo || undefined
                              })
                            });
                            const resJson = await res.json();
                            if (resJson.success) {
                              setAssessSuccessMsg(resJson.message);
                              setAssessPropertyNo("");
                              loadDashboardData();
                            } else {
                              setAssessErrorMsg(resJson.message);
                            }
                          } catch (err: any) {
                            setAssessErrorMsg(lang === "mr" ? "आकारणी करताना तांत्रिक अडचण आली." : "Technical error during assessment rollover.");
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? (lang === "mr" ? "आकारणी सुरू आहे..." : "Processing...") : (lang === "mr" ? "आकारणी लागू करा" : "Apply Assessment")}
                      </button>
                    </div>
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
              <h3 className="font-bold text-sm">
                {lang === "mr" ? "नवीन मालमत्ता नोंदणी (Add Property)" : "Add New Property"}
              </h3>
              <button onClick={() => setIsPropertyModalOpen(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPropertySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "mr" ? "मालमत्ता क्रमांक *" : "Property Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "mr" ? "उदा. GP-031" : "e.g. GP-031"}
                    value={propFormNo}
                    onChange={(e) => setPropFormNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "mr" ? "मोबाईल क्रमांक *" : "Mobile Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "mr" ? "उदा. 9823xxxxxx" : "e.g. 9823xxxxxx"}
                    value={propFormMobile}
                    onChange={(e) => setPropFormMobile(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  {lang === "mr" ? "धारकाचे नाव (मराठी) *" : "Owner Name (Marathi) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === "mr" ? "उदा. श्री. रामचंद्र पाटील" : "e.g. Shri. Ramchandra Patil"}
                  value={propFormName}
                  onChange={(e) => setPropFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  {lang === "mr" ? "धारकाचे नाव (इंग्रजी)" : "Owner Name (English)"}
                </label>
                <input
                  type="text"
                  placeholder="Shri. Ramchandra Patil"
                  value={propFormNameEn}
                  onChange={(e) => setPropFormNameEn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "mr" ? "प्रभाग क्रमांक *" : "Ward Number *"}
                  </label>
                  <select
                    value={propFormWard}
                    onChange={(e) => setPropFormWard(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="1">{lang === "mr" ? "प्रभाग १ (Ward 1)" : "Ward 1"}</option>
                    <option value="2">{lang === "mr" ? "प्रभाग २ (Ward 2)" : "Ward 2"}</option>
                    <option value="3">{lang === "mr" ? "प्रभाग ३ (Ward 3)" : "Ward 3"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "mr" ? "आर्थिक वर्ष (Financial Year) *" : "Financial Year *"}
                  </label>
                  <select
                    value={propFormFy}
                    onChange={(e) => setPropFormFy(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                    <option value="2027-28">2027-28</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  {lang === "mr" ? "पत्ता (Address)" : "Address"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "mr" ? "उदा. बाजारपेठ जवळ..." : "e.g. Near market..."}
                  value={propFormAddress}
                  onChange={(e) => setPropFormAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block text-xs font-bold text-slate-700 mb-2">
                  {lang === "mr" ? "थकबाकी आरंभिक मूल्य (Initial Dues)" : "Initial Dues"}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">
                      {lang === "mr" ? "घरपट्टी थकबाकी (₹)" : "House Tax Dues (₹)"}
                    </label>
                    <input
                      type="number"
                      value={propFormHouse}
                      onChange={(e) => setPropFormHouse(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">
                      {lang === "mr" ? "पाणीपट्टी थकबाकी (₹)" : "Water Tax Dues (₹)"}
                    </label>
                    <input
                      type="number"
                      value={propFormWater}
                      onChange={(e) => setPropFormWater(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {propFormError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-red-700 font-semibold">{propFormError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {lang === "mr" ? "रद्द करा" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading 
                    ? (lang === "mr" ? "नोंदणी होत आहे..." : "Registering...") 
                    : (lang === "mr" ? "मालमत्ता सबमिट करा" : "Submit Property")}
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
  borderColor,
  bgColor,
  textColor,
  icon
}: {
  label: string;
  val: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: string;
}) {
  return (
    <div className={`p-4 rounded-3xl shadow-sm border-l-4 ${borderColor} ${bgColor} flex flex-col justify-between transition-all duration-300 hover:shadow-md border border-slate-100`}>
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm shrink-0">{icon}</span>
      </div>
      <span className={`text-lg md:text-xl font-extrabold mt-3 tracking-tight ${textColor}`}>{val}</span>
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
