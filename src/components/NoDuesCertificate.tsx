"use client";

import { useRef } from "react";

interface NoDuesCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    propertyNo: string;
    ownerName: string;
    ownerNameEn?: string | null;
    wardNo: number;
    address?: string | null;
  } | null;
}

export default function NoDuesCertificate({ isOpen, onClose, property }: NoDuesCertificateProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !property) return null;

  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear}-${String(currentYear + 1).slice(2)}`;
  const todayDate = new Date().toLocaleDateString("mr-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (printContent) {
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
            <h3 className="font-bold text-base">थकबाकी नसल्याचे प्रमाणपत्र</h3>
            <p className="text-slate-400 text-xs">No Dues Certificate</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-green-500/10 cursor-pointer"
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

        {/* Certificate Body */}
        <div className="p-8 md:p-12 print-area" ref={printAreaRef}>
          <div className="border-8 border-double border-amber-600/70 p-8 rounded-lg bg-amber-50/10 relative">
            
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <span className="text-[200px]">🏛️</span>
            </div>

            {/* Official Header */}
            <div className="text-center border-b-2 border-amber-600/70 pb-4 mb-8">
              <h4 className="text-xs font-bold text-slate-600 tracking-wider">महाराष्ट्र शासन</h4>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mt-1">यशवंत ग्रामपंचायत धामणेर</h2>
              <p className="text-xs text-slate-500">ता. धामणेर, जि. जळगाव, महाराष्ट्र</p>
              <div className="flex justify-between text-[11px] text-slate-500 mt-4 px-2">
                <span>जा.क्र. (Ref): GP-DHAM/ND/{currentYear}/{Math.floor(1000 + Math.random() * 9000)}</span>
                <span>दिनांक (Date): {todayDate}</span>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="text-center mb-8">
              <h3 className="text-base md:text-lg font-extrabold text-amber-800 bg-amber-100/50 py-2 px-6 rounded-lg inline-block border border-amber-200">
                थकबाकी नसल्याचे प्रमाणपत्र
              </h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1">
                NO DUES CERTIFICATE
              </p>
            </div>

            {/* Certificate Text Content */}
            <div className="text-sm md:text-base text-slate-800 leading-loose space-y-6 text-justify">
              <p className="indent-8">
                प्रमाणित करण्यात येते की, मालमत्ता क्रमांक <strong className="font-bold font-mono text-slate-900">{property.propertyNo}</strong> चे अधिकृत धारक 
                <strong> श्री/श्रीमती {property.ownerName}</strong> {property.ownerNameEn && <span className="text-xs text-slate-500">({property.ownerNameEn})</span>}, 
                राहणार प्रभाग क्रमांक <strong className="font-semibold text-slate-900">{property.wardNo}</strong>, धामणेर, ता. धामणेर, जि. जळगाव, यांच्या नावावर नोंदणीकृत असलेल्या मालमत्तेचे सर्व कर आर्थिक वर्ष 
                <strong className="font-semibold text-slate-900"> {financialYear}</strong> अखेरपर्यंत पूर्णपणे भरलेले आहेत.
              </p>
              <p className="indent-8">
                सध्याच्या अधिकृत नोंदीनुसार, ग्रामपंचायत कार्यालयाकडे घरपट्टी (House Tax), पाणीपट्टी (Water Tax), दिवाबत्ती (Street Light Tax) व सॅनिटरी कर (Sanitary Tax) यापोटी कोणतीही थकबाकी शिल्लक नाही.
              </p>
              <p className="indent-8">
                सदर प्रमाणपत्र मालमत्ता धारकांच्या विनंतीवरून व कर भरणा पावतीच्या आधारे संगणकीय प्रणालीद्वारे वितरीत करण्यात आले आहे.
              </p>
            </div>

            {/* Signatures & Seal Section */}
            <div className="flex items-end justify-between mt-16 pt-8 border-t border-slate-100 text-xs">
              <div className="text-center relative">
                {/* Official Seal Mock */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 border-2 border-double border-amber-600/50 rounded-full flex flex-col items-center justify-center text-[8px] text-amber-700/80 font-bold uppercase rotate-12 bg-white/20 backdrop-blur-[1px] pointer-events-none">
                  <span>ग्रामपंचायत</span>
                  <span className="text-[10px]">धामणेर</span>
                  <span>कार्यालय सील</span>
                </div>
                <div className="w-24 h-12" />
                <p className="font-bold text-slate-700">कार्यालयीन शिक्का</p>
                <p className="text-slate-400">ग्रामपंचायत धामणेर</p>
              </div>

              <div className="text-center">
                {/* Digital Verification stamp */}
                <div className="inline-block border-2 border-green-500 text-green-600 px-3 py-1 rounded text-[10px] font-bold uppercase mb-3 bg-green-50/50 font-mono tracking-wider rotate-[-3deg] shadow-sm">
                  ✓ Verified Digitally
                </div>
                <p className="font-bold text-slate-700">ग्रामसेवक / विकास अधिकारी</p>
                <p className="text-slate-400">यशवंत ग्रामपंचायत धामणेर</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer (Hidden on print) */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center no-print">
          <span className="text-[11px] text-slate-400">
            * हे प्रमाणपत्र संगणक प्रणालीद्वारे स्वयंचलित जनरेट केले आहे.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            बंद करा (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
