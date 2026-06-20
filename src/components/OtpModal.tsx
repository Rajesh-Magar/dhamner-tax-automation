"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyNo: string;
  ownerName: string;
  mobileNumber: string;
}

export default function OtpModal({
  isOpen,
  onClose,
  propertyNo,
  ownerName,
  mobileNumber,
}: OtpModalProps) {
  const router = useRouter();
  const [otpCode, setOtpCode] = useState("");
  const [inputOtp, setInputOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Mask mobile number (e.g. ******6701)
  const maskedMobile = mobileNumber
    ? `******${mobileNumber.slice(-4)}`
    : "**********";

  useEffect(() => {
    if (isOpen) {
      // Generate a random 4-digit OTP code for demo purposes
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setOtpCode(code);
      setInputOtp(["", "", "", ""]);
      setError("");
      setLoading(false);
      // Focus the first input after modal opens
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Allow only digits

    const newInput = [...inputOtp];
    newInput[index] = value.slice(-1); // Keep last digit only
    setInputOtp(newInput);
    setError("");

    // Move to next input if digit entered
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: move to previous input if empty
    if (e.key === "Backspace" && !inputOtp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{4}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setInputOtp(digits);
    inputRefs[3].current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = inputOtp.join("");

    if (enteredCode.length !== 4) {
      setError("कृपया ४-अंकी कोड प्रविष्ट करा.");
      return;
    }

    if (enteredCode !== otpCode) {
      setError("अवैध कोड! कृपया स्क्रीनवर दाखवलेला कोड वापरा.");
      return;
    }

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      onClose();
      router.push(`/dashboard/${propertyNo.toUpperCase()}`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-2" />

        <div className="p-6 md:p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Heading */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 text-amber-600 rounded-xl mb-3 text-2xl">
              🛡️
            </span>
            <h3 className="text-xl font-bold text-slate-800">
              सुरक्षा पडताळणी
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Security Verification
            </p>
            <p className="text-sm text-slate-500 mt-3 px-2">
              मालमत्ता धारक <strong>{ownerName}</strong> ({propertyNo}) च्या
              माहितीसाठी मोबाईल नंबर <strong>{maskedMobile}</strong> वर पाठवलेला
              ४-अंकी कोड प्रविष्ट करा.
            </p>
          </div>

          {/* Demo Alert Box with OTP */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200/60 rounded-xl text-center">
            <p className="text-xs text-amber-800 font-medium">
              💡 डेमो सुरक्षा कोड (Demo Verification Code):
            </p>
            <span className="block text-2xl font-mono font-bold tracking-widest text-amber-700 mt-1">
              {otpCode}
            </span>
            <p className="text-[10px] text-amber-600 mt-1 leading-tight">
              (खऱ्या सिस्टीममध्ये हा कोड SMS द्वारे जाईल. चाचणीसाठी वरील कोड
              वापरा.)
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP Input Fields */}
            <div className="flex justify-center gap-3 mb-4">
              {inputOtp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold text-slate-800 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all shadow-inner bg-slate-50 focus:bg-white"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-500 text-center mb-4 flex items-center justify-center gap-1.5">
                <span>⚠️</span> {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    पडताळणी होत आहे...
                  </>
                ) : (
                  "प्रवेश करा (Verify & Enter)"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                रद्द करा (Cancel)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
