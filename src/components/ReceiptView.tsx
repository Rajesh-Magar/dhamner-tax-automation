"use client";

import { useEffect, useRef } from "react";

interface ReceiptViewProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    transactionId: string;
    propertyNo: string;
    amountPaid: number;
    taxType: string;
    paymentMethod: string;
    paymentDate: string;
    financialYear: string;
    gatewayRef?: string | null;
    recordedBy?: string | null;
    notes?: string | null;
    property?: {
      ownerName: string;
      ownerNameEn?: string | null;
      wardNo: number;
      address?: string | null;
    };
  } | null;
  propertyData?: {
    ownerName: string;
    ownerNameEn?: string | null;
    wardNo: number;
    address?: string | null;
  } | null;
}

const taxNames: Record<string, string> = {
  house_tax: "घरपट्टी (House Tax)",
  water_tax: "पाणीपट्टी (Water Tax)",
};

export default function ReceiptView({ isOpen, onClose, transaction, propertyData }: ReceiptViewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const owner = transaction.property?.ownerName || propertyData?.ownerName || "माहिती उपलब्ध नाही";
  const ownerEn = transaction.property?.ownerNameEn || propertyData?.ownerNameEn || "";
  const ward = transaction.property?.wardNo || propertyData?.wardNo || "-";
  const address = transaction.property?.address || propertyData?.address || "धामणेर";

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a print window or style override
      const style = document.createElement("style");
      style.innerHTML = `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `;
      document.head.appendChild(style);
      window.print();
      document.head.removeChild(style);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div>
            <h3 className="font-bold text-base">कर भरणा पावती (Tax Receipt)</h3>
            <p className="text-slate-400 text-xs font-mono">{transaction.transactionId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
            >
              🖨️ प्रिंट (Print)
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>

        {/* Receipt Page Body */}
        <div className="p-8 md:p-12 print-area" ref={printAreaRef}>
          <div className="border-4 border-double border-slate-850 p-6 rounded-lg bg-amber-50/20 relative">
            
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <span className="text-[180px]">🏛️</span>
            </div>

            {/* Receipt Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <h4 className="text-xs font-bold text-slate-600 tracking-wider">महाराष्ट्र शासन</h4>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mt-1">यशवंत ग्रामपंचायत धामणेर</h2>
              <p className="text-xs text-slate-500">ता. कोरेगाव, जि. सातारा, महाराष्ट्र</p>
              <h3 className="text-sm font-extrabold text-slate-700 bg-slate-100 py-1.5 px-4 rounded-md inline-block mt-3 border border-slate-205">
                कर भरणा पावती • TAX PAYMENT RECEIPT
              </h3>
            </div>

            {/* Meta Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs md:text-sm mb-6 border-b border-dashed border-slate-300 pb-4">
              <div>
                <p className="text-slate-500">पावती क्रमांक (Receipt No):</p>
                <p className="font-mono font-bold text-slate-800">{transaction.transactionId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">दिनांक (Payment Date):</p>
                <p className="font-semibold text-slate-800">
                  {new Date(transaction.paymentDate).toLocaleString("mr-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-500">मालमत्ता क्रमांक (Property No):</p>
                <p className="font-mono font-bold text-slate-800">{transaction.propertyNo}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">आर्थिक वर्ष (Financial Year):</p>
                <p className="font-semibold text-slate-800">{transaction.financialYear}</p>
              </div>
            </div>

            {/* Payer Details */}
            <div className="text-xs md:text-sm space-y-2 mb-6 border-b border-dashed border-slate-300 pb-4">
              <div className="grid grid-cols-3">
                <span className="text-slate-500 col-span-1">करदात्याचे नाव (Payer Name):</span>
                <span className="font-bold text-slate-800 col-span-2">{owner}</span>
              </div>
              {ownerEn && (
                <div className="grid grid-cols-3 text-xs text-slate-500 -mt-1">
                  <span className="col-span-1"></span>
                  <span className="col-span-2 font-medium">{ownerEn}</span>
                </div>
              )}
              <div className="grid grid-cols-3">
                <span className="text-slate-500 col-span-1">प्रभाग क्रमांक (Ward No):</span>
                <span className="font-semibold text-slate-800 col-span-2">वॉर्ड {ward}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 col-span-1">पत्ता (Address):</span>
                <span className="text-slate-700 col-span-2">{address}</span>
              </div>
            </div>

            {/* Payment Particulars Table */}
            <table className="w-full text-left text-xs md:text-sm mb-6 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-t border-b border-slate-800">
                  <th className="py-2.5 px-2 font-bold text-slate-700">तपशील (Particulars)</th>
                  <th className="py-2.5 px-2 font-bold text-slate-700">भरणा पद्धत (Method)</th>
                  <th className="py-2.5 px-2 font-bold text-slate-700 text-right">रक्कम (Amount)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-2 font-semibold text-slate-800">
                    {taxNames[transaction.taxType] || transaction.taxType}
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-600">
                    {transaction.paymentMethod}
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-800 text-right">
                    ₹{Number(transaction.amountPaid).toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-slate-50 border-t-2 border-slate-800 font-bold">
                  <td className="py-2.5 px-2 text-slate-700" colSpan={2}>एकूण भरलेली रक्कम (Total Paid):</td>
                  <td className="py-2.5 px-2 text-slate-850 text-right text-base">
                    ₹{Number(transaction.amountPaid).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Transaction Ref & Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-500 mb-8 space-y-1 font-mono">
              <div>व्यवहार स्थिती (Status): यशस्वी / SUCCESSFUL</div>
              {transaction.gatewayRef && <div>पेमेंट रेफरन्स (Reference ID): {transaction.gatewayRef}</div>}
              {transaction.recordedBy && <div>नोंदणीकर्ता (Recorded By): {transaction.recordedBy}</div>}
              {transaction.notes && <div>नोंद (Notes): {transaction.notes}</div>}
            </div>

            {/* Signatures & Seal */}
            <div className="flex items-end justify-between mt-12 pt-6 border-t border-slate-200 text-xs">
              <div className="text-center relative">
                {/* Stamp */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-[10px] text-slate-400/80 font-bold uppercase rotate-12 pointer-events-none">
                  कार्यालय सील
                </div>
                <div className="w-24 h-8" />
                <p className="font-semibold text-slate-600">कर वसूल अधिकारी</p>
                <p className="text-slate-400">ग्रामपंचायत धामणेर</p>
              </div>

              <div className="text-center">
                {/* Simulated Digital Signature Stamp */}
                <div className="inline-block border border-green-500 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase mb-2 bg-green-50/50 font-mono tracking-wider rotate-[-2deg]">
                  Digitally Verified
                </div>
                <p className="font-semibold text-slate-600">ग्रामसेवक / विकास अधिकारी</p>
                <p className="text-slate-400">ग्रामपंचायत धामणेर</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer (Hidden on print) */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center no-print">
          <span className="text-[11px] text-slate-400">
            * ही संगणक जनरेट केलेली पावती आहे, स्वाक्षरीची आवश्यकता नाही.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
