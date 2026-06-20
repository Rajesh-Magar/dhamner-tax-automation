import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "कर व्यवस्थापन — यशवंत ग्रामपंचायत धामणेर",
  description:
    "धामणेर ग्रामपंचायत कर भरणा प्रणाली — घरपट्टी, पाणीपट्टी, सॅनिटरी व दिवाबत्ती कर ऑनलाइन भरा. Tax Management System for Grampanchayat Dhamner.",
  keywords: [
    "धामणेर",
    "ग्रामपंचायत",
    "कर भरणा",
    "घरपट्टी",
    "पाणीपट्टी",
    "Dhamner",
    "Grampanchayat",
    "Tax Payment",
    "Property Tax",
    "Water Tax",
  ],
  authors: [{ name: "यशवंत ग्रामपंचायत धामणेर" }],
  openGraph: {
    title: "कर व्यवस्थापन — यशवंत ग्रामपंचायत धामणेर",
    description:
      "धामणेर ग्रामपंचायत कर भरणा प्रणाली — घरपट्टी, पाणीपट्टी, सॅनिटरी व दिवाबत्ती कर ऑनलाइन भरा.",
    type: "website",
    locale: "mr_IN",
    siteName: "Grampanchayat Dhamner Tax Portal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
