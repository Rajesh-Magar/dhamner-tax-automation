"use client";

import { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import PaymentModal from "@/components/PaymentModal";
import ReceiptView from "@/components/ReceiptView";
import NoDuesCertificate from "@/components/NoDuesCertificate";
import Link from "next/link";

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

interface PropertyDetails {
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
  totalPaid: number;
  transactions: Transaction[];
}

const taxDisplayNames: Record<string, string> = {
  house_tax: "घरपट्टी",
  water_tax: "पाणीपट्टी",
  sanitary_tax: "सॅनिटरी कर",
  light_tax: "दिवाबत्ती कर",
};

export default function CitizenDashboard({ params }: { params: Promise<{ propertyNo: string }> }) {
  const resolvedParams = use(params);
  const propertyNo = resolvedParams.propertyNo;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment triggers
  const [selectedTax, setSelectedTax] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
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
        setError(data.message || "मालमत्ता शोधताना अडचण आली.");
      }
    } catch (err) {
      console.error(err);
      setError("तांत्रिक अडचण! सर्व्हरशी संपर्क होऊ शकला नाही.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [propertyNo]);

  const handlePayClick = (taxType: string, amount: number) => {
    setSelectedTax(taxType);
    setPaymentAmount(amount);
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
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <svg className="animate-spin h-10 w-10 text-orange-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-600 text-sm font-semibold">खाते माहिती लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="text-xl font-bold text-slate-800">खाते सापडले नाही</h3>
          <p className="text-slate-500 text-sm mt-1">{error || "मालमत्ता अस्तित्वात नाही किंवा अक्रिय आहे."}</p>
          <Link href="/" className="mt-6 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/10">
            मुख्य पृष्ठावर जा
          </Link>
        </div>
      </div>
    );
  }

  const isDuesCleared = property.totalDue === 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-slate-600 transition-colors">कर प्रणाली</Link>
          <span>/</span>
          <span className="text-slate-650 font-medium">नागरिक डॅशबोर्ड ({property.propertyNo})</span>
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
                  प्रभाग क्रमांक {property.wardNo}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{property.ownerName}</h2>
                {property.ownerNameEn && <p className="text-xs text-slate-400 font-medium mt-0.5">{property.ownerNameEn}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs md:text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📞</span>
                  <span><strong>मोबाईल:</strong> {property.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📍</span>
                  <span><strong>पत्ता:</strong> {property.address || "वॉर्ड १, धामणेर"}</span>
                </div>
              </div>
            </div>

            {/* Download Certificate Bar if dues are cleared */}
            {isDuesCleared && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200/50 rounded-2xl flex items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="text-green-800 font-bold block">अभिनंदन! आपला सर्व कर भरला आहे.</span>
                  <span className="text-green-600">You have no outstanding dues.</span>
                </div>
                <button
                  onClick={() => setIsCertificateOpen(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold shadow-md shadow-green-500/10 transition-colors cursor-pointer"
                >
                  दाखला मिळवा (Get No Dues)
                </button>
              </div>
            )}
          </div>

          {/* Dues Aggregator Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center">
            <span className="text-xs font-bold text-slate-400">एकूण थकबाकी कर (Total Outstanding Dues)</span>
            <div className="my-4">
              <span className={`text-4xl font-black ${isDuesCleared ? "text-green-600" : "text-orange-600 animate-pulse"}`}>
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
              {isDuesCleared ? "कर भरला आहे (Fully Paid)" : "भरणा करणे आवश्यक आहे"}
            </span>
          </div>

        </div>

        {/* Taxes Breakdown and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Bills details card */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">करांचे तपशील (Taxes Breakdown)</h3>
            
            {/* House Tax Card */}
            <TaxCard
              title="घरपट्टी (House Tax)"
              amount={property.houseTaxDue}
              onPay={() => handlePayClick("house_tax", property.houseTaxDue)}
            />
            {/* Water Tax Card */}
            <TaxCard
              title="पाणीपट्टी (Water Tax)"
              amount={property.waterTaxDue}
              onPay={() => handlePayClick("water_tax", property.waterTaxDue)}
            />
            {/* Sanitary Tax Card */}
            <TaxCard
              title="सॅनिटरी कर (Sanitary Tax)"
              amount={property.sanitaryTaxDue}
              onPay={() => handlePayClick("sanitary_tax", property.sanitaryTaxDue)}
            />
            {/* Light Tax Card */}
            <TaxCard
              title="दिवाबत्ती कर (Street Light Tax)"
              amount={property.lightTaxDue}
              onPay={() => handlePayClick("light_tax", property.lightTaxDue)}
            />
          </div>

          {/* Transactions History Tab */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">व्यवहार इतिहास (Payment History)</h3>
            
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1">
              {property.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase">
                        <th className="p-4">पावती (Receipt)</th>
                        <th className="p-4">कर प्रकार (Tax)</th>
                        <th className="p-4">रक्कम (Amount)</th>
                        <th className="p-4 text-center">कृती (Action)</th>
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
                              {new Date(txn.paymentDate).toLocaleDateString("mr-IN")}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-slate-700">
                              {taxDisplayNames[txn.taxType] || txn.taxType}
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
                                पावती 📄
                              </button>
                            ) : (
                              <span className="text-red-500 font-semibold text-[10px]">अयशस्वी</span>
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
                  <p className="text-xs font-semibold">कोणताही जुना व्यवहार इतिहास सापडला नाही.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-850">
        <p>© {new Date().getFullYear()} यशवंत ग्रामपंचायत धामणेर — कर व्यवस्थापन प्रणाली</p>
      </footer>

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
            भरला आहे
          </span>
        ) : (
          <button
            onClick={onPay}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            भरणा करा (Pay)
          </button>
        )}
      </div>
    </div>
  );
}
