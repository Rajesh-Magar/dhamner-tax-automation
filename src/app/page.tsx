import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
              🏛️
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">
                यशवंत ग्रामपंचायत धामणेर
              </h1>
              <p className="text-orange-100 text-xs md:text-sm">
                ध्यास विकासाचा, वेग प्रगतीचा
              </p>
            </div>
          </div>
          <Link
            href="https://grampanchayatdhamner.in"
            className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            मुख्य पृष्ठ ↗
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
          {/* Decorative background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-xl shadow-orange-500/25 mb-8">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                />
              </svg>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              कर व्यवस्थापन प्रणाली
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Tax Management System
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto mb-10">
              आपल्या मालमत्तेचा कर शोधा, ऑनलाइन भरणा करा, पावत्या डाउनलोड करा
              — सर्व एकाच ठिकाणी.
            </p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-10">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              प्रणाली कार्यरत आहे — System Online
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
              <FeatureCard
                icon="🔍"
                title="मालमत्ता शोधा"
                titleEn="Search Property"
                description="मालमत्ता क्रमांक किंवा नावाने शोधा"
                status="Phase 2"
              />
              <FeatureCard
                icon="💳"
                title="ऑनलाइन भरणा"
                titleEn="Online Payment"
                description="घरपट्टी, पाणीपट्टी ऑनलाइन भरा"
                status="Phase 2"
              />
              <FeatureCard
                icon="📋"
                title="प्रशासक पॅनेल"
                titleEn="Admin Dashboard"
                description="प्रभागनिहाय वसुली व थकबाकीदार"
                status="Phase 2"
              />
            </div>
          </div>
        </section>

        {/* API Status Section */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-center mb-8 text-gray-800">
              Backend API Endpoints — Phase 1 ✅
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ApiEndpoint
                method="GET"
                path="/api/properties?search=पाटील"
                description="मालमत्ता शोधा (Search properties)"
              />
              <ApiEndpoint
                method="GET"
                path="/api/properties/GP-001"
                description="मालमत्ता तपशील (Property details)"
              />
              <ApiEndpoint
                method="GET"
                path="/api/transactions?propertyNo=GP-001"
                description="व्यवहार इतिहास (Transaction history)"
              />
              <ApiEndpoint
                method="POST"
                path="/api/transactions"
                description="नवीन भरणा नोंदवा (Record payment)"
              />
              <ApiEndpoint
                method="GET"
                path="/api/admin/stats"
                description="डॅशबोर्ड आकडेवारी (Dashboard stats)"
              />
              <ApiEndpoint
                method="GET"
                path="/api/health"
                description="सिस्टम स्थिती (System health)"
              />
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              📞 संपर्क / Contact
            </h3>
            <div className="flex flex-wrap justify-center gap-6 text-gray-600">
              <p>
                📧{" "}
                <a
                  href="mailto:dhamner189585@gmail.com"
                  className="text-orange-600 hover:underline"
                >
                  dhamner189585@gmail.com
                </a>
              </p>
              <p>
                📞{" "}
                <a
                  href="tel:+919850032987"
                  className="text-orange-600 hover:underline"
                >
                  +91 9850032987
                </a>
              </p>
              <p>
                🌐{" "}
                <a
                  href="https://grampanchayatdhamner.in"
                  className="text-orange-600 hover:underline"
                >
                  grampanchayatdhamner.in
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 px-4 text-center text-sm">
        <p>
          © {new Date().getFullYear()} यशवंत ग्रामपंचायत धामणेर — कर
          व्यवस्थापन प्रणाली
        </p>
        <p className="text-gray-500 mt-1">
          Developed for Grampanchayat Dhamner, Tal. Dhamner, Dist. Jalgaon
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  titleEn,
  description,
  status,
}: {
  icon: string;
  title: string;
  titleEn: string;
  description: string;
  status: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-400 mb-2">{titleEn}</p>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <span className="inline-block text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
        🔜 {status}
      </span>
    </div>
  );
}

function ApiEndpoint({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
      <span
        className={`text-xs font-mono font-bold px-2 py-1 rounded ${methodColors[method] || "bg-gray-100"}`}
      >
        {method}
      </span>
      <div className="min-w-0">
        <code className="text-sm text-gray-800 break-all">{path}</code>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
}
