"use client";

import { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import ReceiptView from "@/components/ReceiptView";
import NoDuesCertificate from "@/components/NoDuesCertificate";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface Transaction {
  id: number;
  transactionId: string;
  propertyNo: string;
  amountPaid: number;
  taxType: string;
  paymentMethod: string;
  paymentDate: string;
  financialYear: string;
  status: string;
  receiptUrl: string | null;
  gatewayRef: string | null;
  recordedBy: string | null;
  notes: string | null;
}

interface PropertyYearDues {
  id: number;
  propertyNo: string;
  financialYear: string;
  houseTaxAssessed: number;
  waterTaxAssessed: number;
  houseTaxPaid: number;
  waterTaxPaid: number;
  houseTaxDue: number;
  waterTaxDue: number;
  createdAt: string;
  updatedAt: string;
}

interface PropertyDetails {
  propertyNo: string;
  ownerName: string;
  ownerNameEn: string | null;
  mobileNumber: string;
  wardNo: number;
  address: string | null;
  houseTaxDue: number;
  waterTaxDue: number;
  financialYear: string;
  totalDue: number;
  totalPaid: number;
  transactions: Transaction[];
  yearDues: PropertyYearDues[];
}

const taxDisplayNames: Record<string, Record<string, string>> = {
  mr: {
    house_tax: "घरपट्टी",
    water_tax: "पाणीपट्टी",
  },
  en: {
    house_tax: "House Tax",
    water_tax: "Water Tax",
  }
};

export default function CitizenDashboard({ params }: { params: Promise<{ propertyNo: string }> }) {
  const resolvedParams = use(params);
  const propertyNo = resolvedParams.propertyNo;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { lang, t } = useLanguage();

  // Payment triggers
  const [selectedTax, setSelectedTax] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentFy, setPaymentFy] = useState<string | undefined>(undefined);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Receipt view triggers
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // No dues certificate triggers
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const fetchPropertyData = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyNo.toUpperCase()}`);
      const data = await res.json();
      if (data.success) {
        setProperty(data.data);
        setError("");
      } else {
        setError(data.message || (lang === "mr" ? "मालमत्ता शोधताना अडचण आली." : "Error retrieving property data."));
      }
    } catch (err) {
      console.error(err);
      setError(lang === "mr" ? "तांत्रिक अडचण! सर्व्हरशी संपर्क होऊ शकला नाही." : "Technical error! Failed to contact server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [propertyNo]);

  const handlePayClick = (taxType: string, amount: number, fy?: string) => {
    setSelectedTax(taxType);
    setPaymentAmount(amount);
    setPaymentFy(fy || property?.financialYear);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    setLoading(true);
    // Reload database details to reflect updated dues
    fetchPropertyData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-10 w-10 text-orange-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-600 text-sm font-semibold">
            {lang === "mr" ? "खाते माहिती लोड होत आहे..." : "Loading account details..."}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="text-xl font-bold text-slate-800">
            {lang === "mr" ? "खाते सापडले नाही" : "Account Not Found"}
          </h3>
          <p className="text-slate-500 text-sm mt-1">{error || (lang === "mr" ? "मालमत्ता अस्तित्वात नाही किंवा अक्रिय आहे." : "Property does not exist or is inactive.")}</p>
          <Link href="/" className="mt-6 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/10">
            {lang === "mr" ? "मुख्य पृष्ठावर जा" : "Go to Homepage"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isDuesCleared = property.totalDue === 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-slate-600 transition-colors">
            {lang === "mr" ? "कर प्रणाली" : "Tax Portal"}
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">
            {t("citizenDashboard")} ({property.propertyNo})
          </span>
        </div>

        {/* Profile Card & Aggregated Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Owner details card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold">
                  {property.propertyNo}
                </span>
                <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-lg font-semibold">
                  {lang === "mr" ? `प्रभाग क्रमांक ${property.wardNo}` : `Ward No. ${property.wardNo}`}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{property.ownerName}</h2>
                {property.ownerNameEn && <p className="text-xs text-slate-400 font-medium mt-0.5">{property.ownerNameEn}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs md:text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📞</span>
                  <span><strong>{t("mobile")}:</strong> {property.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📍</span>
                  <span><strong>{t("address")}:</strong> {property.address || (lang === "mr" ? "वॉर्ड १, धामणेर" : "Ward 1, Dhamner")}</span>
                </div>
              </div>
            </div>

            {/* Download Certificate Bar if dues are cleared */}
            {isDuesCleared && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200/50 rounded-2xl flex items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="text-green-800 font-bold block">{t("duesClearedMsg")}</span>
                  <span className="text-green-600">You have no outstanding dues.</span>
                </div>
                <button
                  onClick={() => setIsCertificateOpen(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold shadow-md shadow-green-500/10 transition-colors cursor-pointer"
                >
                  {t("getNoDuesBtn")}
                </button>
              </div>
            )}
          </div>

          {/* Dues Aggregator Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center">
            <span className="text-xs font-bold text-slate-400">{t("totalDues")}</span>
            <div className="my-4">
              <span className={`text-4xl font-black ${isDuesCleared ? "text-green-600" : "text-orange-600"}`}>
                ₹{property.totalDue.toFixed(2)}
              </span>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isDuesCleared
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isDuesCleared ? t("fullyPaid") : (lang === "mr" ? "भरणा करणे आवश्यक आहे" : "Outstanding Dues")}
            </span>
          </div>

        </div>

        {/* Taxes Breakdown and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Bills details card */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">{t("taxBreakdown")}</h3>
            
            {/* House Tax Card */}
            <TaxCard
              title={t("houseTax")}
              amount={property.houseTaxDue}
              onPay={() => handlePayClick("house_tax", property.houseTaxDue)}
            />
            {/* Water Tax Card */}
            <TaxCard
              title={t("waterTax")}
              amount={property.waterTaxDue}
              onPay={() => handlePayClick("water_tax", property.waterTaxDue)}
            />
          </div>

          {/* Transactions History Tab */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{t("paymentHistory")}</h3>
            
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1">
              {property.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                        <th className="p-4">{t("receipt")}</th>
                        <th className="p-4">{lang === "mr" ? "कर प्रकार" : "Tax Type"}</th>
                        <th className="p-4">{t("amount")}</th>
                        <th className="p-4 text-center">{lang === "mr" ? "कृती" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {property.transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-800 block">
                              {txn.transactionId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(txn.paymentDate).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-US")}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-slate-700">
                              {taxDisplayNames[lang][txn.taxType] || txn.taxType}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              FY {txn.financialYear} ({txn.paymentMethod})
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            ₹{txn.amountPaid}
                          </td>
                          <td className="p-4 text-center">
                            {txn.status === "SUCCESS" ? (
                              <button
                                onClick={() => {
                                  setSelectedTxn(txn);
                                  setIsReceiptOpen(true);
                                }}
                                className="px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                              >
                                {lang === "mr" ? "पावती 📄" : "Receipt 📄"}
                              </button>
                            ) : (
                              <span className="text-red-500 font-semibold text-[10px]">{t("failed")}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 h-full">
                  <span className="text-3xl mb-2">💸</span>
                  <p className="text-xs font-semibold">
                    {lang === "mr" ? "कोणताही जुना व्यवहार इतिहास सापडला नाही." : "No payment history found."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Yearly Dues History Breakdown */}
        {property.yearDues && property.yearDues.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {lang === "mr" ? "वार्षिक कर आकारणी व थकबाकी तपशील" : "Annual Assessment & Dues History"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="p-4">{lang === "mr" ? "आर्थिक वर्ष" : "Financial Year"}</th>
                    <th className="p-4">{lang === "mr" ? "आकारलेली घरपट्टी" : "Assessed House Tax"}</th>
                    <th className="p-4">{lang === "mr" ? "आकारलेली पाणीपट्टी" : "Assessed Water Tax"}</th>
                    <th className="p-4 text-green-600">{lang === "mr" ? "भरलेली घरपट्टी" : "Paid House Tax"}</th>
                    <th className="p-4 text-green-600">{lang === "mr" ? "भरलेली पाणीपट्टी" : "Paid Water Tax"}</th>
                    <th className="p-4 text-orange-600">{lang === "mr" ? "उर्वरित घरपट्टी" : "Pending House Tax"}</th>
                    <th className="p-4 text-orange-600">{lang === "mr" ? "उर्वरित पाणीपट्टी" : "Pending Water Tax"}</th>
                    <th className="p-4 font-bold text-slate-700">{lang === "mr" ? "एकूण येणे" : "Total Pending"}</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-slate-50 text-slate-700">
                  {property.yearDues.map((yd) => {
                    const houseTaxDue = Number(yd.houseTaxDue || 0);
                    const waterTaxDue = Number(yd.waterTaxDue || 0);
                    const totalFyPending = houseTaxDue + waterTaxDue;
                    return (
                      <tr key={yd.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-800">
                          {yd.financialYear}
                        </td>
                        <td className="p-4">₹{Number(yd.houseTaxAssessed || 0).toFixed(2)}</td>
                        <td className="p-4">₹{Number(yd.waterTaxAssessed || 0).toFixed(2)}</td>
                        <td className="p-4 text-green-700 bg-green-50/30">₹{Number(yd.houseTaxPaid || 0).toFixed(2)}</td>
                        <td className="p-4 text-green-700 bg-green-50/30">₹{Number(yd.waterTaxPaid || 0).toFixed(2)}</td>
                        <td className="p-4 text-orange-700 bg-orange-50/20 font-medium">
                          <div className="flex items-center justify-between gap-1">
                            <span>₹{houseTaxDue.toFixed(2)}</span>
                            {houseTaxDue > 0 && (
                              <button
                                onClick={() => handlePayClick("house_tax", houseTaxDue, yd.financialYear)}
                                className="px-1.5 py-0.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                {lang === "mr" ? "भरा" : "Pay"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-orange-700 bg-orange-50/20 font-medium">
                          <div className="flex items-center justify-between gap-1">
                            <span>₹{waterTaxDue.toFixed(2)}</span>
                            {waterTaxDue > 0 && (
                              <button
                                onClick={() => handlePayClick("water_tax", waterTaxDue, yd.financialYear)}
                                className="px-1.5 py-0.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                {lang === "mr" ? "भरा" : "Pay"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {totalFyPending > 0 ? (
                            <span className="text-orange-600">₹{totalFyPending.toFixed(2)}</span>
                          ) : (
                            <span className="text-green-600">✅ {lang === "mr" ? "पूर्ण भरणा" : "Fully Paid"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Payment simulated modal */}
      {selectedTax && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
          propertyNo={property.propertyNo}
          ownerName={property.ownerName}
          taxType={selectedTax}
          amount={paymentAmount}
          financialYear={paymentFy}
        />
      )}

      {/* Digital Receipt overlay */}
      {selectedTxn && (
        <ReceiptView
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          transaction={selectedTxn}
          propertyData={property}
        />
      )}

      {/* No Dues Certificate overlay */}
      <NoDuesCertificate
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        property={property}
      />
    </div>
  );
}

interface TaxCardProps {
  title: string;
  amount: number;
  onPay: () => void;
}

function TaxCard({ title, amount, onPay }: TaxCardProps) {
  const isPaid = amount === 0;
  const { lang, t } = useLanguage();

  return (
    <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-slate-200 transition-colors">
      <div className="space-y-1">
        <h4 className="font-bold text-slate-700">{title}</h4>
        <span className={`block text-lg font-extrabold ${isPaid ? "text-green-600" : "text-slate-800"}`}>
          ₹{amount.toFixed(2)}
        </span>
      </div>

      <div>
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200/50">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {lang === "mr" ? "भरला आहे" : "Paid"}
          </span>
        ) : (
          <button
            onClick={onPay}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            {t("payBtn")}
          </button>
        )}
      </div>
    </div>
  );
}
