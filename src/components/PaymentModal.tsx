"use client";

import { useEffect, useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txnData: any) => void;
  propertyNo: string;
  ownerName: string;
  taxType: string;
  amount: number;
  financialYear?: string;
}

const taxNames: Record<string, string> = {
  house_tax: "घरपट्टी (House Tax)",
  water_tax: "पाणीपट्टी (Water Tax)",
};

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  propertyNo,
  ownerName,
  taxType,
  amount,
  financialYear,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(120); // 2 minute countdown for UPI QR
  const [createdTxn, setCreatedTxn] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setMethod("UPI");
      setStatus("IDLE");
      setErrorMessage("");
      setCountdown(120);
      setCreatedTxn(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && method === "UPI" && status === "IDLE" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, method, status, isOpen]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setStatus("PROCESSING");
    setErrorMessage("");

    try {
      // Prepare request body
      const body = {
        propertyNo,
        amountPaid: amount,
        taxType,
        paymentMethod: method,
        gatewayRef: method === "UPI" ? `UPI_REF_${Math.random().toString(36).substring(2, 10).toUpperCase()}` : `RZP_REF_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        notes: `${taxNames[taxType]} ऑनलाइन भरणा`,
        financialYear,
      };

      // Call API
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "पेमेंट पूर्ण करताना तांत्रिक अडचण आली.");
      }

      setCreatedTxn(data.data);
      setStatus("SUCCESS");

      // Auto-trigger onSuccess callback after showing success screen briefly
      setTimeout(() => {
        onSuccess(data.data);
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setStatus("ERROR");
      setErrorMessage(err.message || "तांत्रिक अडचण! कृपया पुन्हा प्रयत्न करा.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={status === "PROCESSING" ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">सुरक्षित ऑनलाइन कर भरणा</h3>
            <p className="text-orange-100 text-xs">Secure Online Tax Payment</p>
          </div>
          {status !== "PROCESSING" && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {status === "IDLE" && (
          <div className="p-6">
            {/* Bill Summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-slate-500">मालमत्ता धारक (Owner):</span>
                <span className="font-semibold text-slate-800 text-right">{ownerName}</span>
                <span className="text-slate-500">क्रमांक (Property No):</span>
                <span className="font-mono font-semibold text-slate-800 text-right">{propertyNo}</span>
                <span className="text-slate-500">कराचा प्रकार (Tax Type):</span>
                <span className="font-semibold text-slate-800 text-right">{taxNames[taxType] || taxType}</span>
              </div>
              <div className="border-t border-slate-200 my-3" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">एकूण देय रक्कम (Total Amount):</span>
                <span className="text-xl font-extrabold text-orange-600">₹{amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6">
              <span className="block text-sm font-semibold text-slate-700 mb-3">भरणा पद्धत निवडा (Choose Method):</span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                    method === "UPI"
                      ? "border-orange-500 bg-orange-50/50 text-orange-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">📱</span>
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("CARD")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                    method === "CARD"
                      ? "border-orange-500 bg-orange-50/50 text-orange-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span>Credit/Debit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("NETBANKING")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                    method === "NETBANKING"
                      ? "border-orange-500 bg-orange-50/50 text-orange-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">🌐</span>
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {/* Sub-interface for chosen method */}
            {method === "UPI" && (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 bg-slate-50 rounded-xl mb-6 text-center">
                {/* Mock QR Code */}
                <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg flex items-center justify-center relative p-3 shadow-inner">
                  {/* Styled SVG QR Code representation */}
                  <svg className="w-full h-full text-slate-800" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="5" y="5" width="15" height="15" fill="white" />
                    <rect x="75" y="0" width="25" height="25" />
                    <rect x="80" y="5" width="15" height="15" fill="white" />
                    <rect x="0" y="75" width="25" height="25" />
                    <rect x="5" y="80" width="15" height="15" fill="white" />
                    {/* Random squares simulating a QR */}
                    <rect x="35" y="10" width="10" height="10" />
                    <rect x="55" y="20" width="15" height="10" />
                    <rect x="40" y="40" width="20" height="20" />
                    <rect x="10" y="45" width="15" height="10" />
                    <rect x="70" y="45" width="10" height="15" />
                    <rect x="35" y="70" width="15" height="15" />
                    <rect x="65" y="75" width="10" height="10" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-orange-600">UPI Scan Code</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-600 mt-3">
                  आपल्या मोबाईलवरील कोणत्याही UPI ॲपद्वारे (PhonePe, GPAY, BHIM) वरील QR कोड स्कॅन करा.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">
                  वेळ शिल्लक (Expiry): {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}

            {method === "CARD" && (
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">कार्ड क्रमांक (Card Number):</label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    disabled
                    value="4111 2222 3333 4444 (Demo Locked)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">कालावधी (Expiry Date):</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      disabled
                      value="12/29"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">CVV:</label>
                    <input
                      type="password"
                      placeholder="***"
                      disabled
                      value="123"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === "NETBANKING" && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 mb-1">बँक निवडा (Select Bank):</label>
                <select
                  disabled
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 focus:outline-none"
                >
                  <option>State Bank of India (Demo Selected)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Bank of Baroda</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all active:scale-[0.99] cursor-pointer"
              >
                पेमेंट करा (Pay Now)
              </button>
            </div>
          </div>
        )}

        {status === "PROCESSING" && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <svg className="animate-spin h-12 w-12 text-orange-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <h4 className="text-lg font-bold text-slate-800">पेमेंट प्रक्रिया सुरू आहे...</h4>
            <p className="text-slate-500 text-sm mt-1">सुरक्षित पेमेंट सर्व्हरशी कनेक्ट करत आहे. कृपया विंडो बंद करू नका.</p>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            {/* Animated Success Checkmark */}
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4 border border-green-200 shadow-md animate-bounce">
              ✓
            </div>
            <h4 className="text-xl font-bold text-green-700">कर भरणा यशस्वी!</h4>
            <p className="text-slate-500 text-sm mt-1">Payment Successful</p>
            {createdTxn && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-slate-600 text-left w-full space-y-1">
                <div>पावती क्रमांक: {createdTxn.transactionId}</div>
                <div>रक्कम: ₹{Number(createdTxn.amountPaid).toFixed(2)}</div>
                <div>तारीख: {new Date(createdTxn.paymentDate).toLocaleString("mr-IN")}</div>
              </div>
            )}
            <p className="text-slate-400 text-xs mt-4">काही सेकंदात डॅशबोर्डवर रिडायरेक्ट होत आहे...</p>
          </div>
        )}

        {status === "ERROR" && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mb-4">
              ⚠️
            </div>
            <h4 className="text-lg font-bold text-red-700">कर भरणा अयशस्वी</h4>
            <p className="text-slate-600 text-sm mt-1">{errorMessage}</p>
            <div className="flex gap-3 w-full mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                बंद करा (Close)
              </button>
              <button
                type="button"
                onClick={() => setStatus("IDLE")}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                पुन्हा प्रयत्न करा (Retry)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
