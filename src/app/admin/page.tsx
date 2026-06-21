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
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [selectedWards, setSelectedWards] = useState<string[]>(["1", "2", "3"]);
  const [selectedFys, setSelectedFys] = useState<string[]>(["2025-26"]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cashFy, setCashFy] = useState("2025-26");

  // Enhancements states
  const [selectedProfileNo, setSelectedProfileNo] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingProperty, setIsEditingProperty] = useState(false);

  // Assess rollover states
  const [assessFy, setAssessFy] = useState("2026-27");
  const [assessPropertyNo, setAssessPropertyNo] = useState("");
  const [assessSuccessMsg, setAssessSuccessMsg] = useState("");
  const [assessErrorMsg, setAssessErrorMsg] = useState("");
  
  // Search query, filter & sort states
  const [defaulterSearch, setDefaulterSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [defaulterDuesFilter, setDefaulterDuesFilter] = useState("all");
  const [defaulterSort, setDefaulterSort] = useState("due_desc");
  const [propertyDuesFilter, setPropertyDuesFilter] = useState("all");
  const [propertySort, setPropertySort] = useState("prop_asc");

  // Daily Report states
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [reconciliationDate, setReconciliationDate] = useState(() => {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, '0');
    const dy = String(today.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  });
  const [reconciliationData, setReconciliationData] = useState<any>(null);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);

  // Printable Notice state
  const [printableNoticeProperty, setPrintableNoticeProperty] = useState<any | null>(null);

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
      const wardsQuery = selectedWards.join(",");
      const yearsQuery = selectedFys.join(",");

      // 1. Fetch Stats
      const statsRes = await fetch(`/api/admin/stats?ward=${wardsQuery}&year=${yearsQuery}`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const statsData = await statsRes.json();

      // 2. Fetch all properties
      const propsRes = await fetch(`/api/admin/properties?ward=${wardsQuery}&year=${yearsQuery}`, {
        headers: { "x-admin-key": ADMIN_KEY },
      });
      const propsData = await propsRes.json();

      // 3. Fetch recent transactions
      const txnsRes = await fetch(`/api/transactions?ward=${wardsQuery}&year=${yearsQuery}&limit=5`);
      const txnsData = await txnsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (propsData.success) setProperties(propsData.data);
      if (txnsData.success) setRecentTxns(txnsData.data);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Profile modal fetch helper
  const handleOpenProfile = async (propertyNo: string) => {
    setSelectedProfileNo(propertyNo);
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyNo}`);
      const resJson = await res.json();
      if (resJson.success) {
        setProfileData(resJson.data);
      }
    } catch (err) {
      console.error("Error loading property profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Edit property form pre-fill helper
  const handleEditProperty = (prop: Property) => {
    setIsEditingProperty(true);
    setPropFormNo(prop.propertyNo);
    setPropFormName(prop.ownerName);
    setPropFormNameEn(prop.ownerNameEn || "");
    setPropFormMobile(prop.mobileNumber);
    setPropFormWard(String(prop.wardNo));
    setPropFormAddress(prop.address || "");
    setPropFormHouse(String(prop.houseTaxDue));
    setPropFormWater(String(prop.waterTaxDue));
    setPropFormFy(selectedFys[0] || "2025-26");
    setIsPropertyModalOpen(true);
  };

  const handleWhatsAppReminder = async (propertyNo: string, ownerName: string, mobileNumber: string, totalDue: number) => {
    const text = lang === "mr" 
      ? `नमस्कार ${ownerName}, आपल्या मालमत्ता क्र. ${propertyNo} चा एकूण थकबाकी कर ₹${totalDue.toFixed(2)} भरण्यासाठी ग्रामपंचायत कार्यालयात संपर्क साधावा किंवा ऑनलाइन भरावा.` 
      : `Hello ${ownerName}, please contact Grampanchayat office or pay online to clear outstanding dues of ₹${totalDue.toFixed(2)} for Property No. ${propertyNo}.`;
    
    try {
      await fetch(`/api/properties/${propertyNo}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHATSAPP",
          recipient: `${ownerName} (${mobileNumber})`,
          message: text,
          sentBy: "ग्रामसेवक"
        })
      });
    } catch (err) {
      console.error("Failed to log WhatsApp notification:", err);
    }

    window.open(`https://wa.me/91${mobileNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    
    if (selectedProfileNo === propertyNo) {
      handleOpenProfile(propertyNo);
    }
  };

  const handlePrintNotice = async (prop: any) => {
    if (!prop || !prop.propertyNo) return;
    setPrintableNoticeProperty(prop);
    
    try {
      await fetch(`/api/properties/${prop.propertyNo}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PRINT",
          recipient: prop.ownerName,
          message: `कराची मागणी नोटीस प्रिंट केली (एकूण थकबाकी ₹${Number(prop.totalDue || 0).toFixed(2)})`,
          sentBy: "ग्रामसेवक"
        })
      });
    } catch (err) {
      console.error("Failed to log print notice:", err);
    }
    
    setTimeout(() => {
      window.print();
      setPrintableNoticeProperty(null);
      if (prop && prop.propertyNo && selectedProfileNo === prop.propertyNo) {
        handleOpenProfile(prop.propertyNo);
      }
    }, 150);
  };

  // Switch to cash tab and load property helper
  const handleRecordCashRedirect = async (propertyNo: string) => {
    setActiveTab("cash");
    setCashPropertyNo(propertyNo);
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyNo}`);
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
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  // CSV Export utility functions
  const handleExportCSV = (type: "properties" | "defaulters") => {
    if (type === "properties") {
      const headers = [
        lang === "mr" ? "अ.क्र." : "Sr. No.",
        lang === "mr" ? "मालमत्ता क्र." : "Property No.",
        lang === "mr" ? "धारकाचे नाव (मराठी)" : "Owner Name (Marathi)",
        lang === "mr" ? "धारकाचे नाव (इंग्रजी)" : "Owner Name (English)",
        lang === "mr" ? "प्रभाग" : "Ward",
        lang === "mr" ? "मोबाईल" : "Mobile",
        lang === "mr" ? "घरपट्टी थकबाकी" : "House Tax Due",
        lang === "mr" ? "पाणीपट्टी थकबाकी" : "Water Tax Due",
        lang === "mr" ? "एकूण देय कर" : "Total Dues",
        lang === "mr" ? "व्यवहार संख्या" : "Txns Count"
      ];
      
      const keys = ["index", "propertyNo", "ownerName", "ownerNameEn", "wardNo", "mobileNumber", "houseTaxDue", "waterTaxDue", "totalDue", "transactionCount"];
      
      const csvData = filteredProperties.map((p, idx) => ({
        index: idx + 1,
        propertyNo: p.propertyNo,
        ownerName: p.ownerName,
        ownerNameEn: p.ownerNameEn || "",
        wardNo: p.wardNo,
        mobileNumber: p.mobileNumber,
        houseTaxDue: p.houseTaxDue,
        waterTaxDue: p.waterTaxDue,
        totalDue: p.totalDue,
        transactionCount: p.transactionCount
      }));
      
      downloadCSV(csvData, `Properties_Report_${selectedFys.join("_")}.csv`, headers, keys);
    } else {
      const headers = [
        lang === "mr" ? "अ.क्र." : "Sr. No.",
        lang === "mr" ? "मालमत्ता क्र." : "Property No.",
        lang === "mr" ? "धारकाचे नाव (मराठी)" : "Owner Name (Marathi)",
        lang === "mr" ? "धारकाचे नाव (इंग्रजी)" : "Owner Name (English)",
        lang === "mr" ? "प्रभाग" : "Ward",
        lang === "mr" ? "मोबाईल" : "Mobile",
        lang === "mr" ? "एकूण थकबाकी" : "Total Dues"
      ];
      
      const keys = ["index", "propertyNo", "ownerName", "ownerNameEn", "wardNo", "mobileNumber", "totalDue"];
      
      const csvData = filteredDefaulters.map((d, idx) => ({
        index: idx + 1,
        propertyNo: d.propertyNo,
        ownerName: d.ownerName,
        ownerNameEn: d.ownerNameEn || "",
        wardNo: d.wardNo,
        mobileNumber: d.mobileNumber,
        totalDue: d.totalDue
      }));
      
      downloadCSV(csvData, `Defaulters_Report_${selectedFys.join("_")}.csv`, headers, keys);
    }
  };

  const downloadCSV = (data: any[], filename: string, headers: string[], keys: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) => 
        keys.map(key => {
          let val = row[key];
          if (val === null || val === undefined) val = "";
          val = String(val).replace(/"/g, '""'); // escape double quotes
          return `"${val}"`;
        }).join(",")
      )
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // include BOM for Marathi characters
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadDashboardData();
  }, [authChecked, selectedWards, selectedFys]);

  useEffect(() => {
    if (!isDailyReportOpen) return;
    const fetchReconciliationData = async () => {
      setReconciliationLoading(true);
      try {
        const res = await fetch(`/api/transactions?date=${reconciliationDate}&limit=100`);
        const json = await res.json();
        if (json.success) {
          const txns = json.data || [];
          let cashTotal = 0;
          let upiTotal = 0;
          let onlineTotal = 0;
          txns.forEach((t: any) => {
            const amt = Number(t.amountPaid) || 0;
            if (t.paymentMethod === "CASH") cashTotal += amt;
            else if (t.paymentMethod === "UPI") upiTotal += amt;
            else if (t.paymentMethod === "ONLINE") onlineTotal += amt;
          });
          setReconciliationData({
            transactions: txns,
            cashTotal,
            upiTotal,
            onlineTotal,
            total: cashTotal + upiTotal + onlineTotal,
          });
        }
      } catch (err) {
        console.error("Error loading reconciliation:", err);
      } finally {
        setReconciliationLoading(false);
      }
    };
    fetchReconciliationData();
  }, [isDailyReportOpen, reconciliationDate]);

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
            financialYear: propData.financialyear || selectedFys[0] || "2025-26",
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
  const formatFyTag = (fy: string) => {
    const parts = fy.split('-');
    if (parts.length === 2) {
      const yr1 = parts[0].slice(-2);
      const yr2 = parts[1];
      return `${yr1}-${yr2}`;
    }
    return fy;
  };

  const getWardTagLabel = (ward: string) => {
    return lang === "mr" ? `वॉर्ड ${ward}` : `Ward ${ward}`;
  };

  const renderFilterTags = () => {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {selectedFys.map(fy => (
          <span 
            key={fy} 
            className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold select-none transition-all hover:border-slate-300"
          >
            {formatFyTag(fy)}
            {selectedFys.length > 1 && (
              <button 
                onClick={() => setSelectedFys(selectedFys.filter(v => v !== fy))}
                className="text-slate-400 hover:text-red-500 font-bold ml-1 cursor-pointer focus:outline-none transition-colors text-[9px]"
              >
                ✕
              </button>
            )}
          </span>
        ))}
        {selectedWards.map(ward => (
          <span 
            key={ward} 
            className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold select-none transition-all hover:border-slate-300"
          >
            {getWardTagLabel(ward)}
            {selectedWards.length > 1 && (
              <button 
                onClick={() => setSelectedWards(selectedWards.filter(v => v !== ward))}
                className="text-slate-400 hover:text-red-500 font-bold ml-1 cursor-pointer focus:outline-none transition-colors text-[9px]"
              >
                ✕
              </button>
            )}
          </span>
        ))}
      </div>
    );
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
            <div className="space-y-2">
              {[
                { val: "1", label: lang === "mr" ? "प्रभाग १ (Ward 1)" : "Ward 1" },
                { val: "2", label: lang === "mr" ? "प्रभाग २ (Ward 2)" : "Ward 2" },
                { val: "3", label: lang === "mr" ? "प्रभाग ३ (Ward 3)" : "Ward 3" }
              ].map(w => {
                const isChecked = selectedWards.includes(w.val);
                return (
                  <label key={w.val} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          if (selectedWards.length > 1) {
                            setSelectedWards(selectedWards.filter(v => v !== w.val));
                          }
                        } else {
                          setSelectedWards([...selectedWards, w.val]);
                        }
                      }}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer accent-slate-900"
                    />
                    <span>{w.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Financial Year Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              {lang === "mr" ? "आर्थिक वर्ष निवडा" : "Select Financial Year"}
            </label>
            <div className="space-y-2">
              {["2025-26", "2026-27", "2027-28"].map(fy => {
                const isChecked = selectedFys.includes(fy);
                return (
                  <label key={fy} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          if (selectedFys.length > 1) {
                            setSelectedFys(selectedFys.filter(v => v !== fy));
                          }
                        } else {
                          setSelectedFys([...selectedFys, fy]);
                        }
                      }}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer accent-slate-900"
                    />
                    <span>{fy}</span>
                  </label>
                );
              })}
            </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-800">
                        {lang === "mr" ? "वसुली आकडेवारी (Overview)" : "Collection Stats (Overview)"}
                      </h3>
                      {renderFilterTags()}
                    </div>
                    <button
                      onClick={() => setIsDailyReportOpen(true)}
                      className="self-end sm:self-center h-9 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors border border-slate-900 shrink-0"
                    >
                      📊 {lang === "mr" ? "दैनिक अहवाल (Daily Report)" : "Daily Report"}
                    </button>
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
                      textColor="text-orange-700" 
                      icon="⏳" 
                    />
                    {/* SVG circular progress ring replaces Collection % card */}
                    <div className="p-4 rounded-3xl shadow-sm border border-slate-100 bg-white flex items-center justify-between transition-all duration-300 hover:shadow-md border-l-4 border-l-blue-600">
                      <div className="flex flex-col justify-between h-full">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {lang === "mr" ? "वसुली टक्केवारी" : "Collection %"}
                        </span>
                        <span className="text-lg md:text-xl font-extrabold mt-3 tracking-tight text-blue-700">
                          {stats.overview.collectionPercentage}%
                        </span>
                      </div>
                      <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 ml-2">
                        {/* Background Circle */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            className="text-slate-100"
                            strokeWidth="4"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          {/* Progress Circle */}
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            className="text-blue-650 transition-all duration-500 ease-out"
                            strokeWidth="4"
                            strokeDasharray={2 * Math.PI * 22}
                            strokeDashoffset={(2 * Math.PI * 22) - (stats.overview.collectionPercentage / 100) * (2 * Math.PI * 22)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px]">
                          📊
                        </div>
                      </div>
                    </div>
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
                        <tbody className="divide-y divide-slate-100">
                          {stats.wardStats.map((w) => (
                            <tr key={w.wardNo} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800">
                                {lang === "mr" ? `प्रभाग क्रमांक ${w.wardNo}` : `Ward No. ${w.wardNo}`}
                              </td>
                              <td className="p-4 text-center font-semibold text-slate-600">{w.totalProperties}</td>
                              <td className="p-4 text-center font-semibold text-orange-600">{w.propertiesWithDues}</td>
                              <td className="p-4 text-right font-bold text-green-600">₹{w.totalCollected.toLocaleString("mr-IN")}</td>
                              <td className="p-4 text-right font-bold text-orange-600">₹{w.totalDue.toLocaleString("mr-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Activity and Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Recent Transactions Activity Feed */}
                    <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-4">
                          {lang === "mr" ? "नुकतेच झालेले कर भरणा व्यवहार" : "Recent Tax Payments"}
                        </h4>
                        {recentTxns && recentTxns.length > 0 ? (
                          <div className="space-y-3.5">
                            {recentTxns.map((txn: any) => {
                              const dateStr = new Date(txn.paymentDate).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-US", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              return (
                                <div key={txn.transactionId} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-slate-800">{txn.propertyNo}</span>
                                      <span className="text-slate-400">•</span>
                                      <span className="font-semibold text-slate-600">{txn.property?.ownerName || (lang === "mr" ? "अज्ञात धारक" : "Unknown Owner")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                      <span>{dateStr}</span>
                                      <span>•</span>
                                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[8px]">
                                        {txn.paymentMethod}
                                      </span>
                                      <span>•</span>
                                      <span>{txn.taxType === "house_tax" ? (lang === "mr" ? "घरपट्टी" : "House Tax") : (lang === "mr" ? "पाणीपट्टी" : "Water Tax")}</span>
                                    </div>
                                  </div>
                                  <span className="font-extrabold text-green-600 text-sm shrink-0">
                                    +₹{Number(txn.amountPaid).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic py-4 text-center">
                            {lang === "mr" ? "या फिल्टरसाठी नुकतेच व्यवहार आढळले नाहीत." : "No recent transactions found for these filters."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Top 5 Defaulters Quick View */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-4">
                          {lang === "mr" ? "शीर्ष ५ थकबाकीदार (Top 5 Defaulters)" : "Top 5 Defaulters"}
                        </h4>
                        {stats.defaulters.list && stats.defaulters.list.length > 0 ? (
                          <div className="space-y-3.5">
                            {stats.defaulters.list.slice(0, 5).map((def: any) => (
                              <div key={def.propertyNo} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-slate-800">{def.propertyNo}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="font-semibold text-slate-600">{def.ownerName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {lang === "mr" ? `प्रभाग ${def.wardNo}` : `Ward ${def.wardNo}`}
                                  </div>
                                </div>
                                <span className="font-extrabold text-orange-600 text-sm shrink-0">
                                  ₹{Number(def.totalDue).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic py-4 text-center">
                            {lang === "mr" ? "थकबाकीदार आढळले नाहीत." : "No defaulters found."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Defaulters Directory */}
              {activeTab === "defaulters" && stats && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Title and Action Button Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                      {lang === "mr" ? "थकबाकीदार यादी (Defaulters)" : "Defaulters List"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportCSV("defaulters")}
                        className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm border border-slate-200 transition-colors cursor-pointer"
                      >
                        📥 {lang === "mr" ? "CSV निर्यात करा" : "Export CSV"}
                      </button>
                      <button
                        onClick={() => {
                          const defaultersCount = filteredDefaulters.length;
                          if (defaultersCount === 0) {
                            alert(lang === "mr" ? "सध्या कोणतेही थकबाकीदार नाहीत." : "There are currently no defaulters.");
                            return;
                          }
                          alert(lang === "mr" 
                            ? `SMS रिमाइंडर्स ब्रॉडकास्ट यशस्वी! ${defaultersCount} थकबाकीदार धारकांना देय कराचे मेसेज पाठवले गेले.` 
                            : `SMS Reminders Broadcasted Successfully! Sent tax reminders to ${defaultersCount} pending accounts.`
                          );
                        }}
                        className="h-9 px-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer transition-colors border border-orange-700 animate-pulse-subtle"
                      >
                        <span>💬</span>
                        <span>{lang === "mr" ? "रिमाइंडर्स पाठवा" : "Send Reminders"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Two-Row Filters Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 space-y-3.5">
                    {/* Row 1: Search, Filter Selects, and Sorting */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-md">
                        <input
                          type="text"
                          placeholder={lang === "mr" ? "नाव किंवा मालमत्ता क्र. शोधा..." : "Search name or property no..."}
                          value={defaulterSearch}
                          onChange={(e) => setDefaulterSearch(e.target.value)}
                          className="w-full h-9.5 pl-9 pr-4 bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl text-xs focus:ring-0 focus:outline-none transition-all placeholder-slate-400 font-medium"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      </div>

                      {/* Dropdown Filters */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {lang === "mr" ? "थकबाकी:" : "Dues:"}
                          </span>
                          <select
                            value={defaulterDuesFilter}
                            onChange={(e) => setDefaulterDuesFilter(e.target.value)}
                            className="h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer transition-colors"
                          >
                            <option value="all">{lang === "mr" ? "सर्व थकबाकी" : "All Dues"}</option>
                            <option value="above_5000">{lang === "mr" ? "थकबाकी > ₹५,०००" : "Dues > ₹5,000"}</option>
                            <option value="above_10000">{lang === "mr" ? "थकबाकी > ₹१०,०००" : "Dues > ₹10,000"}</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {lang === "mr" ? "क्रमवारी:" : "Sort:"}
                          </span>
                          <select
                            value={defaulterSort}
                            onChange={(e) => setDefaulterSort(e.target.value)}
                            className="h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer transition-colors"
                          >
                            <option value="due_desc">{lang === "mr" ? "थकबाकी (उतरता)" : "Dues (High to Low)"}</option>
                            <option value="due_asc">{lang === "mr" ? "थकबाकी (चढता)" : "Dues (Low to High)"}</option>
                            <option value="prop_asc">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</option>
                            <option value="name_asc">{lang === "mr" ? "मालकाचे नाव" : "Owner Name"}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Active Filters */}
                    {(selectedFys.length > 0 || selectedWards.length > 0) && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "mr" ? "सक्रिय फिल्टर्स:" : "Active Filters:"}
                        </span>
                        {renderFilterTags()}
                      </div>
                    )}
                  </div>

                  {/* Defaulter list Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {filteredDefaulters.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                              <th className="p-4 text-center w-12">{lang === "mr" ? "अ.क्र." : "Sr. No."}</th>
                              <th className="p-4">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</th>
                              <th className="p-4">{lang === "mr" ? "धारकाचे नाव" : "Owner Name"}</th>
                              <th className="p-4 text-center">{lang === "mr" ? "प्रभाग" : "Ward"}</th>
                              <th className="p-4">{lang === "mr" ? "मोबाईल" : "Mobile"}</th>
                              <th className="p-4 text-right">{lang === "mr" ? "एकूण थकबाकी" : "Total Dues"}</th>
                              <th className="p-4 text-right">{lang === "mr" ? "कृती" : "Actions"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredDefaulters.map((d, idx) => (
                              <tr 
                                key={d.propertyNo} 
                                onClick={() => handleOpenProfile(d.propertyNo)}
                                className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                              >
                                <td className="p-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
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
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleRecordCashRedirect(d.propertyNo)}
                                      className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                                      title={lang === "mr" ? "रोख भरा" : "Record Cash"}
                                    >
                                      💵 {lang === "mr" ? "रोख भरा" : "Pay"}
                                    </button>
                                    {d.mobileNumber && (
                                      <button
                                        onClick={() => handleWhatsAppReminder(d.propertyNo, d.ownerName, d.mobileNumber, d.totalDue)}
                                        className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                                        title={lang === "mr" ? "WhatsApp रिमांडर" : "WhatsApp"}
                                      >
                                        💬 {lang === "mr" ? "रिमांडर" : "WhatsApp"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handlePrintNotice(d)}
                                      className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all border border-slate-200 active:scale-95 cursor-pointer"
                                      title={lang === "mr" ? "मागणी नोटीस प्रिंट" : "Print Notice"}
                                    >
                                      📄 {lang === "mr" ? "नोटीस" : "Notice"}
                                    </button>
                                  </div>
                                </td>
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
                  {/* Title and Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                      {lang === "mr" ? "मालमत्ता व्यवस्थापन (Properties)" : "Property Management"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportCSV("properties")}
                        className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm border border-slate-200 transition-colors cursor-pointer"
                      >
                        📥 {lang === "mr" ? "CSV निर्यात करा" : "Export CSV"}
                      </button>
                      <button
                        onClick={() => {
                          setPropFormError("");
                          setPropFormFy(selectedFys[0] || "2025-26");
                          setIsPropertyModalOpen(true);
                        }}
                        className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-colors border border-slate-900"
                      >
                        {lang === "mr" ? "➕ नवीन मालमत्ता" : "➕ Add Property"}
                      </button>
                    </div>
                  </div>

                  {/* Two-Row Filters Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 space-y-3.5">
                    {/* Row 1: Search, Filter Selects, and Sorting */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-md">
                        <input
                          type="text"
                          placeholder={lang === "mr" ? "नाव किंवा मालमत्ता क्र..." : "Search name or property..."}
                          value={propertySearch}
                          onChange={(e) => setPropertySearch(e.target.value)}
                          className="w-full h-9.5 pl-9 pr-4 bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl text-xs focus:ring-0 focus:outline-none transition-all placeholder-slate-400 font-medium"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      </div>

                      {/* Dropdowns */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {lang === "mr" ? "कर थकबाकी:" : "Tax Dues:"}
                          </span>
                          <select
                            value={propertyDuesFilter}
                            onChange={(e) => setPropertyDuesFilter(e.target.value)}
                            className="h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer transition-colors"
                          >
                            <option value="all">{lang === "mr" ? "सर्व थकबाकी" : "All Dues"}</option>
                            <option value="above_5000">{lang === "mr" ? "थकबाकी > ₹५,०००" : "Dues > ₹5,000"}</option>
                            <option value="above_10000">{lang === "mr" ? "थकबाकी > ₹१०,०००" : "Dues > ₹10,000"}</option>
                            <option value="paid_up">{lang === "mr" ? "पूर्ण भरलेले" : "Paid Up"}</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {lang === "mr" ? "क्रमवारी:" : "Sort:"}
                          </span>
                          <select
                            value={propertySort}
                            onChange={(e) => setPropertySort(e.target.value)}
                            className="h-9.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer transition-colors"
                          >
                            <option value="prop_asc">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</option>
                            <option value="due_desc">{lang === "mr" ? "थकबाकी (उतरता)" : "Dues (High to Low)"}</option>
                            <option value="due_asc">{lang === "mr" ? "थकबाकी (चढता)" : "Dues (Low to High)"}</option>
                            <option value="name_asc">{lang === "mr" ? "मालकाचे नाव" : "Owner Name"}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Active Filters */}
                    {(selectedFys.length > 0 || selectedWards.length > 0) && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "mr" ? "सक्रिय फिल्टर्स:" : "Active Filters:"}
                        </span>
                        {renderFilterTags()}
                      </div>
                    )}
                  </div>

                  {/* Properties table list */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {filteredProperties.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                              <th className="p-4 text-center w-12">{lang === "mr" ? "अ.क्र." : "Sr. No."}</th>
                              <th className="p-4">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</th>
                              <th className="p-4">{lang === "mr" ? "धारकाचे नाव" : "Owner Name"}</th>
                              <th className="p-4 text-center">{lang === "mr" ? "प्रभाग" : "Ward"}</th>
                              <th className="p-4">{lang === "mr" ? "मोबाईल" : "Mobile"}</th>
                              <th className="p-4 text-right">{lang === "mr" ? "एकूण देय कर" : "Total Dues"}</th>
                              <th className="p-4 text-center">{lang === "mr" ? "व्यवहार" : "Txns"}</th>
                              <th className="p-4 text-right">{lang === "mr" ? "कृती" : "Actions"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredProperties.map((p, idx) => (
                              <tr 
                                key={p.propertyNo} 
                                onClick={() => handleOpenProfile(p.propertyNo)}
                                className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                              >
                                <td className="p-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                                <td className="p-4 font-mono font-bold text-slate-800">{p.propertyNo}</td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-700 block">{p.ownerName}</span>
                                  {p.ownerNameEn && <span className="text-[10px] text-slate-400">{p.ownerNameEn}</span>}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {lang === "mr" ? `वॉर्ड ${p.wardNo}` : `Ward ${p.wardNo}`}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-600">{p.mobileNumber}</td>
                                <td className="p-4 text-right font-extrabold text-slate-800">₹{p.totalDue.toFixed(2)}</td>
                                <td className="p-4 text-center text-slate-500 font-semibold">{p.transactionCount}</td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleEditProperty(p)}
                                      className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                                      title={lang === "mr" ? "बदल करा" : "Edit Property"}
                                    >
                                      ✏️ {lang === "mr" ? "बदल" : "Edit"}
                                    </button>
                                    {p.mobileNumber && p.totalDue > 0 && (
                                      <button
                                        onClick={() => handleWhatsAppReminder(p.propertyNo, p.ownerName, p.mobileNumber, p.totalDue)}
                                        className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                                        title={lang === "mr" ? "WhatsApp रिमांडर" : "WhatsApp"}
                                      >
                                        💬 {lang === "mr" ? "रिमांडर" : "WhatsApp"}
                                      </button>
                                    )}
                                    {p.totalDue > 0 && (
                                      <button
                                        onClick={() => handlePrintNotice(p)}
                                        className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all border border-slate-200 active:scale-95 cursor-pointer"
                                        title={lang === "mr" ? "मागणी नोटीस प्रिंट" : "Print Notice"}
                                      >
                                        📄 {lang === "mr" ? "नोटीस" : "Notice"}
                                      </button>
                                    )}
                                  </div>
                                </td>
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

      {/* Property Profile Modal Overlay */}
      {selectedProfileNo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm print:hidden">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {lang === "mr" ? `मालमत्ता तपशील: ${selectedProfileNo}` : `Property Profile: ${selectedProfileNo}`}
              </h3>
              <button 
                onClick={() => {
                  setSelectedProfileNo(null);
                  setProfileData(null);
                }} 
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <svg className="animate-spin h-8 w-8 text-slate-900 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs font-semibold">{lang === "mr" ? "माहिती लोड होत आहे..." : "Loading details..."}</p>
                </div>
              ) : profileData ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block">{lang === "mr" ? "धारकाचे नाव:" : "Owner Name:"}</span>
                      <span className="font-bold text-slate-800 block">{profileData.ownerName}</span>
                      {profileData.ownerNameEn && <span className="text-[10px] text-slate-400 font-mono">{profileData.ownerNameEn}</span>}
                    </div>
                    <div>
                      <span className="text-slate-400 block">{lang === "mr" ? "मोबाईल क्रमांक:" : "Mobile Number:"}</span>
                      <span className="font-bold text-slate-800">{profileData.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{lang === "mr" ? "प्रभाग क्रमांक:" : "Ward Number:"}</span>
                      <span className="font-semibold text-slate-800">{lang === "mr" ? `वॉर्ड ${profileData.wardNo}` : `Ward ${profileData.wardNo}`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{lang === "mr" ? "पत्ता:" : "Address:"}</span>
                      <span className="font-semibold text-slate-800">{profileData.address || "-"}</span>
                    </div>
                  </div>

                  {/* Year-by-year Tax Breakdown */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-3">
                      {lang === "mr" ? "आर्थिक वर्षनिहाय कर थकबाकी" : "Financial Year Tax Breakdown"}
                    </h4>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                            <th className="p-3">{lang === "mr" ? "आर्थिक वर्ष" : "FY"}</th>
                            <th className="p-3 text-right">{lang === "mr" ? "घरपट्टी आकारणी" : "House Assessed"}</th>
                            <th className="p-3 text-right">{lang === "mr" ? "घरपट्टी जमा" : "House Paid"}</th>
                            <th className="p-3 text-right">{lang === "mr" ? "पाणीपट्टी आकारणी" : "Water Assessed"}</th>
                            <th className="p-3 text-right">{lang === "mr" ? "पाणीपट्टी जमा" : "Water Paid"}</th>
                            <th className="p-3 text-right">{lang === "mr" ? "एकूण थकबाकी" : "Total Due"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {profileData.yearDues?.map((yd: any) => {
                            const totalDue = yd.houseTaxDue + yd.waterTaxDue;
                            return (
                              <tr key={yd.financialYear} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-700">{yd.financialYear}</td>
                                <td className="p-3 text-right text-slate-600">₹{yd.houseTaxAssessed.toFixed(2)}</td>
                                <td className="p-3 text-right text-green-600">₹{yd.houseTaxPaid.toFixed(2)}</td>
                                <td className="p-3 text-right text-slate-600">₹{yd.waterTaxAssessed.toFixed(2)}</td>
                                <td className="p-3 text-right text-green-600">₹{yd.waterTaxPaid.toFixed(2)}</td>
                                <td className={`p-3 text-right font-bold ${totalDue > 0 ? "text-orange-600" : "text-green-600"}`}>
                                  ₹{totalDue.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment History Ledger */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-3">
                      {lang === "mr" ? "भरणा इतिहास (Payment History)" : "Payment History Ledger"}
                    </h4>
                    {profileData.transactions && profileData.transactions.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                              <th className="p-3">{lang === "mr" ? "व्यवहार क्र." : "Transaction ID"}</th>
                              <th className="p-3">{lang === "mr" ? "तारीख" : "Date"}</th>
                              <th className="p-3">{lang === "mr" ? "कर प्रकार" : "Tax Type"}</th>
                              <th className="p-3">{lang === "mr" ? "पद्धत" : "Method"}</th>
                              <th className="p-3 text-right">{lang === "mr" ? "रक्कम" : "Amount"}</th>
                              <th className="p-3 text-center">{lang === "mr" ? "पावती" : "Receipt"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {profileData.transactions.map((txn: any) => {
                              const dateStr = new Date(txn.paymentDate).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              });
                              return (
                                <tr key={txn.transactionId} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono font-bold text-slate-700">{txn.transactionId}</td>
                                  <td className="p-3 text-slate-600">{dateStr}</td>
                                  <td className="p-3 text-slate-600">
                                    {txn.taxType === "house_tax" ? (lang === "mr" ? "घरपट्टी" : "House Tax") : (lang === "mr" ? "पाणीपट्टी" : "Water Tax")}
                                  </td>
                                  <td className="p-3">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                      {txn.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-bold text-green-600">₹{Number(txn.amountPaid).toFixed(2)}</td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => {
                                        setCashSuccessTxn(txn);
                                        setIsReceiptOpen(true);
                                      }}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      📄 {lang === "mr" ? "पहा" : "View"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic text-center py-4">
                        {lang === "mr" ? "भरणा इतिहास उपलब्ध नाही." : "No payment history found."}
                      </p>
                    )}
                  </div>
                  
                  {/* Communication History Log Timeline */}
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-800 text-xs mb-4">
                      {lang === "mr" ? "नोटीस व संपर्क इतिहास (Notification History)" : "Notification & Reminder Logs"}
                    </h4>
                    {profileData.communicationLogs && profileData.communicationLogs.length > 0 ? (
                      <div className="space-y-4">
                        {profileData.communicationLogs.map((log: any, idx: number) => {
                          const lDateStr = new Date(log.sentAt).toLocaleString(lang === "mr" ? "mr-IN" : "en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                          
                          let badgeBg = "bg-slate-100 text-slate-700";
                          if (log.type === "WHATSAPP") badgeBg = "bg-green-50 text-green-700 border border-green-100";
                          else if (log.type === "SMS") badgeBg = "bg-blue-50 text-blue-700 border border-blue-100";
                          else if (log.type === "PRINT") badgeBg = "bg-purple-50 text-purple-700 border border-purple-100";

                          return (
                            <div key={log.id || idx} className="flex gap-3 text-xs">
                              <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                                {idx < profileData.communicationLogs.length - 1 && (
                                  <div className="w-0.5 bg-slate-200 grow my-1" />
                                )}
                              </div>
                              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 grow space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${badgeBg}`}>
                                    {log.type}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{lDateStr}</span>
                                </div>
                                <p className="text-slate-700 font-medium leading-relaxed mt-1 text-[11px]">{log.message}</p>
                                <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1">
                                  <span>{lang === "mr" ? "कोणाकडून:" : "By:"} <span className="font-semibold text-slate-600">{log.sentBy}</span></span>
                                  <span>{lang === "mr" ? "प्राप्तकर्ता:" : "To:"} <span className="font-semibold text-slate-600">{log.recipient}</span></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic text-center py-2">
                        {lang === "mr" ? "नोटीस इतिहास उपलब्ध नाही." : "No reminder logs found."}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-red-500 text-xs text-center py-4">{lang === "mr" ? "माहिती मिळवता आली नाही." : "Unable to retrieve details."}</p>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3 flex justify-between border-t border-slate-100">
              <button
                onClick={() => handlePrintNotice(profileData)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                📄 {lang === "mr" ? "मागणी नोटीस प्रिंट" : "Print Demand Notice"}
              </button>
              <button
                onClick={() => {
                  setSelectedProfileNo(null);
                  setProfileData(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === "mr" ? "बंद करा" : "Close"}
              </button>
            </div>
          </div>
        </div>
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

      {isDailyReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm print:hidden">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span>📊</span>
                {lang === "mr" ? "दैनिक अहवाल (Daily Reconciliation)" : "Daily Reconciliation Report"}
              </h3>
              <button 
                onClick={() => {
                  setIsDailyReportOpen(false);
                  setReconciliationData(null);
                }} 
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {lang === "mr" ? "तारीख निवडा:" : "Select Date:"}
                </label>
                <input
                  type="date"
                  value={reconciliationDate}
                  onChange={(e) => setReconciliationDate(e.target.value)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              {reconciliationLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <span className="animate-spin text-xl mb-2">⏳</span>
                  <span className="text-xs">{lang === "mr" ? "अहवाल लोड होत आहे..." : "Loading report..."}</span>
                </div>
              ) : reconciliationData ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === "mr" ? "रोख (Cash)" : "Cash"}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">
                        ₹{(reconciliationData.cashTotal || 0).toLocaleString("mr-IN")}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === "mr" ? "UPI" : "UPI"}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">
                        ₹{(reconciliationData.upiTotal || 0).toLocaleString("mr-IN")}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === "mr" ? "ऑनलाईन" : "Online"}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">
                        ₹{(reconciliationData.onlineTotal || 0).toLocaleString("mr-IN")}
                      </span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                      <span className="text-[9px] font-extrabold text-green-700 uppercase tracking-wider block">
                        {lang === "mr" ? "एकूण जमा" : "Total"}
                      </span>
                      <span className="text-sm font-extrabold text-green-700">
                        ₹{(reconciliationData.total || 0).toLocaleString("mr-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {lang === "mr" ? "भरणा यादी" : "Payment List"} ({reconciliationData.transactions.length})
                    </h4>
                    {reconciliationData.transactions.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                              <th className="p-3">{lang === "mr" ? "मालमत्ता क्र." : "Property No."}</th>
                              <th className="p-3">{lang === "mr" ? "मालक" : "Owner"}</th>
                              <th className="p-3">{lang === "mr" ? "वेळ" : "Time"}</th>
                              <th className="p-3">{lang === "mr" ? "पद्धत" : "Method"}</th>
                              <th className="p-3 text-right">{lang === "mr" ? "रक्कम" : "Amount"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {reconciliationData.transactions.map((txn: any) => {
                              const tTime = new Date(txn.paymentDate).toLocaleTimeString(lang === "mr" ? "mr-IN" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit"
                              });
                              return (
                                <tr key={txn.transactionId} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono font-bold text-slate-700">{txn.propertyNo}</td>
                                  <td className="p-3 text-slate-700 font-semibold">{txn.property?.ownerName || txn.propertyNo}</td>
                                  <td className="p-3 text-slate-500 font-mono text-[10px]">{tTime}</td>
                                  <td className="p-3">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                      {txn.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-extrabold text-green-600">₹{Number(txn.amountPaid).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic py-6 text-center border border-slate-100 rounded-xl">
                        {lang === "mr" ? "या दिवशी कोणताही भरणा झाला नाही." : "No payments recorded on this day."}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-slate-50 px-5 py-3 flex justify-between border-t border-slate-100">
              <button
                onClick={() => window.print()}
                disabled={!reconciliationData || reconciliationData.transactions.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                🖨️ {lang === "mr" ? "प्रिंट अहवाल" : "Print Report"}
              </button>
              <button
                onClick={() => {
                  setIsDailyReportOpen(false);
                  setReconciliationData(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === "mr" ? "बंद करा" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area (Hidden on screen, visible on print) */}
      <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-8 z-[9999] overflow-y-auto">
        {/* Notice Print View */}
        {printableNoticeProperty && (
          <div className="space-y-6 text-sm font-sans">
            <div className="text-center border-b-2 border-slate-800 pb-4">
              <h1 className="text-2xl font-bold uppercase tracking-wide">ग्रामपंचायत कार्यालय, धामणेर</h1>
              <p className="text-xs text-slate-500 mt-1">ता. कोरेगाव, जि. सातारा • पिन: ४१५५११</p>
              <h2 className="text-md font-bold mt-3 bg-slate-100 py-1 inline-block px-6 rounded border border-slate-300 uppercase tracking-wider">
                कराची मागणी नोटीस (Tax Demand Notice)
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-4">
              <div>
                <p><strong>मालमत्ता क्रमांक:</strong> {printableNoticeProperty.propertyNo}</p>
                <p className="mt-1.5"><strong>मालकाचे नाव:</strong> {printableNoticeProperty.ownerName}</p>
                {printableNoticeProperty.ownerNameEn && <p className="text-[10px] text-slate-400 font-mono">({printableNoticeProperty.ownerNameEn})</p>}
                <p className="mt-1.5"><strong>पत्ता:</strong> {printableNoticeProperty.address || "-"}</p>
              </div>
              <div className="text-right">
                <p><strong>नोटीस तारीख:</strong> {new Date().toLocaleDateString("mr-IN")}</p>
                <p className="mt-1.5"><strong>प्रभाग क्रमांक (Ward):</strong> {printableNoticeProperty.wardNo}</p>
                <p className="mt-1.5"><strong>आर्थिक वर्ष:</strong> {selectedFys.join(", ")}</p>
              </div>
            </div>

            <div className="mt-6 border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-3 border-r border-slate-300">कर प्रकार (Tax Type)</th>
                    <th className="p-3 border-r border-slate-300 text-right">आकारणी (Assessed)</th>
                    <th className="p-3 border-r border-slate-300 text-right">भरलेला कर (Paid)</th>
                    <th className="p-3 text-right">उर्वरित थकबाकी (Due)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="border-b border-slate-200">
                    <td className="p-3 border-r border-slate-300 font-semibold">घरपट्टी (House Tax)</td>
                    <td className="p-3 border-r border-slate-300 text-right font-mono">₹{Number(printableNoticeProperty.houseTaxAssessed || 0).toFixed(2)}</td>
                    <td className="p-3 border-r border-slate-300 text-right font-mono">₹{Number(printableNoticeProperty.houseTaxPaid || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{Number(printableNoticeProperty.houseTaxDue || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 border-r border-slate-300 font-semibold">पाणीपट्टी (Water Tax)</td>
                    <td className="p-3 border-r border-slate-300 text-right font-mono">₹{Number(printableNoticeProperty.waterTaxAssessed || 0).toFixed(2)}</td>
                    <td className="p-3 border-r border-slate-300 text-right font-mono">₹{Number(printableNoticeProperty.waterTaxPaid || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{Number(printableNoticeProperty.waterTaxDue || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
                    <td className="p-3 border-r border-slate-300">एकूण (Total)</td>
                    <td className="p-3 border-r border-slate-300 text-right font-mono">₹{((Number(printableNoticeProperty.houseTaxAssessed || 0)) + (Number(printableNoticeProperty.waterTaxAssessed || 0))).toFixed(2)}</td>
                    <td className="p-3 border-r border-slate-300 text-right font-mono">₹{((Number(printableNoticeProperty.houseTaxPaid || 0)) + (Number(printableNoticeProperty.waterTaxPaid || 0))).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-orange-600 text-sm underline">₹{Number(printableNoticeProperty.totalDue || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-800">⚠️ महत्वाच्या सूचना:</p>
              <p>१. कृपया वरील थकबाकी नोटीस मिळाल्यापासून ७ दिवसांच्या आत ग्रामपंचायत कार्यालयात रोख स्वरूपात किंवा ऑनलाईन जमा करावी.</p>
              <p>२. मुदतीत कर न भरल्यास नळ कनेक्शन खंडित केले जाईल किंवा कायदेशीर जप्तीची कारवाई सुरू करण्यात येईल, याची नोंद घ्यावी.</p>
            </div>

            <div className="mt-20 flex justify-between text-xs pt-8 border-t border-slate-200">
              <div className="text-center w-40">
                <div className="h-16"></div>
                <p className="border-t border-slate-400 pt-1 font-bold">कर लिपिक / लिपिक</p>
                <p className="text-[10px] text-slate-400">ग्रामपंचायत धामणेर</p>
              </div>
              <div className="text-center w-40">
                <div className="h-16"></div>
                <p className="border-t border-slate-400 pt-1 font-bold">ग्रामसेवक / सरपंच</p>
                <p className="text-[10px] text-slate-400">ग्रामपंचायत धामणेर</p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Reconciliation Print View */}
        {!printableNoticeProperty && isDailyReportOpen && reconciliationData && (
          <div className="space-y-6 text-sm font-sans">
            <div className="text-center border-b-2 border-slate-800 pb-4">
              <h1 className="text-2xl font-bold uppercase tracking-wide">ग्रामपंचायत कार्यालय, धामणेर</h1>
              <p className="text-xs text-slate-500 mt-1">ता. कोरेगाव, जि. सातारा • दैनिक कर संकलन अहवाल</p>
              <h2 className="text-md font-bold mt-3 bg-slate-100 py-1 inline-block px-6 rounded border border-slate-300 uppercase tracking-wider">
                तारीख: {new Date(reconciliationDate).toLocaleDateString("mr-IN")}
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-4 text-xs pt-4">
              <div className="p-3 border border-slate-300 rounded-xl text-center">
                <p className="text-slate-500 font-semibold">रोख जमा (Cash)</p>
                <p className="text-lg font-bold mt-1.5">₹{Number(reconciliationData.cashTotal || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 border border-slate-300 rounded-xl text-center">
                <p className="text-slate-500 font-semibold">UPI जमा (UPI)</p>
                <p className="text-lg font-bold mt-1.5">₹{Number(reconciliationData.upiTotal || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 border border-slate-300 rounded-xl text-center">
                <p className="text-slate-500 font-semibold">ऑनलाईन जमा (Online)</p>
                <p className="text-lg font-bold mt-1.5">₹{Number(reconciliationData.onlineTotal || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-300 rounded-xl text-center">
                <p className="text-green-700 font-semibold">एकूण संकलित जमा</p>
                <p className="text-lg font-bold text-green-700 mt-1.5">₹{Number(reconciliationData.total || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">व्यवहार यादी (Transactions Ledger)</h3>
              <table className="w-full text-left text-xs border-collapse border border-slate-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-3 border-r border-slate-300">मालमत्ता क्र.</th>
                    <th className="p-3 border-r border-slate-300">मालकाचे नाव</th>
                    <th className="p-3 border-r border-slate-300">कर प्रकार</th>
                    <th className="p-3 border-r border-slate-300">पद्धत</th>
                    <th className="p-3 text-right">रक्कम</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reconciliationData.transactions.map((txn: any) => (
                    <tr key={txn.transactionId} className="border-b border-slate-200">
                      <td className="p-3 border-r border-slate-300 font-mono font-bold">{txn.propertyNo}</td>
                      <td className="p-3 border-r border-slate-300">{txn.property?.ownerName || txn.propertyNo}</td>
                      <td className="p-3 border-r border-slate-300">
                        {txn.taxType === "house_tax" ? "घरपट्टी" : "पाणीपट्टी"}
                      </td>
                      <td className="p-3 border-r border-slate-300 font-semibold">{txn.paymentMethod}</td>
                      <td className="p-3 text-right font-bold text-green-700">₹{Number(txn.amountPaid).toFixed(2)}</td>
                    </tr>
                  ))}
                  {reconciliationData.transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center italic text-slate-400">
                        या दिवशी कोणताही भरणा झाला नाही.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-20 flex justify-between text-xs pt-8 border-t border-slate-200">
              <div className="text-center w-40">
                <div className="h-16"></div>
                <p className="border-t border-slate-400 pt-1 font-bold">तपासले (Audited By)</p>
                <p className="text-[10px] text-slate-400">कर लिपिक / ग्रामसेवक</p>
              </div>
              <div className="text-center w-40">
                <div className="h-16"></div>
                <p className="border-t border-slate-400 pt-1 font-bold">सरपंच / उपसरपंच</p>
                <p className="text-[10px] text-slate-400">ग्रामपंचायत धामणेर</p>
              </div>
            </div>
          </div>
        )}
      </div>
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
