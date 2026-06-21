"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "mr" | "en";

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  mr: {
    title: "यशवंत ग्रामपंचायत धामणेर",
    slogan: "ध्यास विकासाचा, वेग प्रगतीचा",
    taxPortal: "कर व्यवस्थापन प्रणाली • Tax Portal",
    home: "गृह (Home)",
    admin: "प्रशासक (Admin)",
    logout: "बाहेर पडा (Logout)",
    login: "प्रशासक लॉगिन (Login)",
    mainSite: "मुख्य संकेतस्थळ ↗",
    searchTitle: "आपला घरपट्टी व पाणीपट्टी कर शोधा",
    searchPlaceholder: "उदा. GP-001, रामचंद्र पाटील किंवा 9823xxxxxx...",
    searchBtn: "शोधा (Search)",
    allWards: "सर्व प्रभाग (All Wards)",
    ward1: "प्रभाग १ (Ward 1)",
    ward2: "प्रभाग २ (Ward 2)",
    ward3: "प्रभाग ३ (Ward 3)",
    email: "ईमेल",
    officeHours: "कार्यालयीन वेळ",
    officeHoursVal: "सकाळी ९.१५ ते सायंकाळी ६.१५",
    phone: "दूरध्वनी",
    citizenPortal: "नागरिक सेवा केंद्र • Citizen Portal",
    searchSubtitle: "मालमत्ता क्रमांक (Property No), धारकाच्या नावाने किंवा मोबाईल क्रमांकाने कर शोधा आणि थेट ऑनलाइन भरणा करा.",
    searchHelper: "💡 मालमत्ता क्रमांक (उदा. GP-001) प्रविष्ट करा",
    searchHelperName: "नावाने किंवा मोबाईल क्रमांकाने शोधा",
    developedFor: "यशवंत ग्रामपंचायत धामणेर, ता. कोरेगाव, जि. सातारा",
    rightsReserved: "सर्व हक्क राखीव.",
    // Dashboard strings
    citizenDashboard: "नागरिक डॅशबोर्ड",
    ownerName: "मालमत्ता धारक",
    propertyNo: "मालमत्ता क्रमांक",
    wardNo: "प्रभाग क्रमांक",
    mobile: "मोबाईल",
    address: "पत्ता",
    totalDues: "एकूण थकबाकी कर",
    fullyPaid: "कर भरला आहे (Fully Paid)",
    duesClearedMsg: "अभिनंदन! आपला सर्व कर भरला आहे.",
    getNoDuesBtn: "दाखला मिळवा (Get No Dues)",
    payAllBtn: "एकूण कर भरणा",
    taxBreakdown: "करांचे तपशील",
    paymentHistory: "व्यवहार इतिहास",
    receipt: "पावती",
    failed: "अयशस्वी",
    particulars: "तपशील",
    method: "भरणा पद्धत",
    amount: "रक्कम",
    houseTax: "घरपट्टी (House Tax)",
    waterTax: "पाणीपट्टी (Water Tax)",
    payBtn: "भरणा करा (Pay)"
  },
  en: {
    title: "Yeshwant Gram Panchayat Dhamner",
    slogan: "Pursuit of Development, Speed of Progress",
    taxPortal: "Tax Management System",
    home: "Home",
    admin: "Admin",
    logout: "Logout",
    login: "Admin Login",
    mainSite: "Main Website ↗",
    searchTitle: "Search Your Property & Water Tax",
    searchPlaceholder: "e.g. GP-001, Ramchandra Patil or 9823xxxxxx...",
    searchBtn: "Search",
    allWards: "All Wards",
    ward1: "Ward 1",
    ward2: "Ward 2",
    ward3: "Ward 3",
    email: "Email",
    officeHours: "Office Hours",
    officeHoursVal: "9:15 AM to 6:15 PM",
    phone: "Phone",
    citizenPortal: "Citizen Service Center • Tax Portal",
    searchSubtitle: "Search by Property Number, Owner Name, or Mobile Number to make an online payment.",
    searchHelper: "💡 Enter Property Number (e.g., GP-001)",
    searchHelperName: "Search by name or mobile number",
    developedFor: "Yeshwant Grampanchayat Dhamner, Tal. Koregaon, Dist. Satara",
    rightsReserved: "All Rights Reserved.",
    // Dashboard strings
    citizenDashboard: "Citizen Dashboard",
    ownerName: "Owner Name",
    propertyNo: "Property Number",
    wardNo: "Ward Number",
    mobile: "Mobile Number",
    address: "Address",
    totalDues: "Total Outstanding Dues",
    fullyPaid: "Fully Paid",
    duesClearedMsg: "Congratulations! All your dues are cleared.",
    getNoDuesBtn: "Get No Dues Certificate",
    payAllBtn: "Pay All Dues",
    taxBreakdown: "Taxes Breakdown",
    paymentHistory: "Payment History",
    receipt: "Receipt",
    failed: "Failed",
    particulars: "Particulars",
    method: "Payment Method",
    amount: "Amount",
    houseTax: "House Tax",
    waterTax: "Water Tax",
    payBtn: "Pay Now"
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>("mr");

  useEffect(() => {
    const saved = localStorage.getItem("tax_lang") as Language;
    if (saved && (saved === "mr" || saved === "en")) {
      setLang(saved);
    }
  }, []);

  const toggleLang = () => {
    const next = lang === "mr" ? "en" : "mr";
    setLang(next);
    localStorage.setItem("tax_lang", next);
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
