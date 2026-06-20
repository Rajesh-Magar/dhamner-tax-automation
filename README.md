# 🏛️ धामणेर कर व्यवस्थापन प्रणाली | Dhamner Tax Automation

Automated Tax Collection System for **यशवंत ग्रामपंचायत धामणेर** (Yashwant Grampanchayat Dhamner)

> Digital platform for property tax management, online payments, citizen dashboards, and admin oversight for 544+ households across 3 wards.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, TypeScript) |
| **Database** | PostgreSQL via [Neon](https://neon.tech/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Styling** | Tailwind CSS v4 |
| **Hosting** | [Vercel](https://vercel.com/) |
| **Domain** | `taxes.grampanchayatdhamner.in` |

## 📋 Project Phases

| Phase | Description | Status |
|-------|------------|--------|
| **Phase 1** | Foundation & Backend (Database, API Routes, Seed Data) | ✅ Complete |
| **Phase 2** | Core UI (Citizen Search, Dashboard, Admin Panel) | 🔜 Upcoming |
| **Phase 3** | Integrations (Payment Gateway, WhatsApp, PDF Receipts) | 🔜 Upcoming |

## 🗄️ Database Schema

### Properties Table (मालमत्ता माहिती)
- `property_no` — मालमत्ता क्रमांक (e.g., GP-001)
- `owner_name` — मालमत्ता धारकाचे नाव (Marathi)
- `owner_name_en` — Owner Name (English)
- `mobile_number` — मोबाईल क्रमांक
- `ward_no` — प्रभाग क्रमांक (1, 2, or 3)
- `house_tax_due` — घरपट्टी थकबाकी
- `water_tax_due` — पाणीपट्टी थकबाकी
- `sanitary_tax_due` — सॅनिटरी कर
- `light_tax_due` — दिवाबत्ती कर

### Transactions Table (व्यवहार इतिहास)
- `transaction_id` — पावती क्रमांक (e.g., TXN-2025-00001)
- `property_no` — FK → Properties
- `amount_paid` — भरलेली रक्कम
- `tax_type` — house_tax / water_tax / sanitary_tax / light_tax
- `payment_method` — ONLINE / CASH / UPI
- `status` — SUCCESS / FAILED / PENDING

## 🔌 API Endpoints

### Public APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/properties?search=<query>&ward=<1\|2\|3>` | Search properties |
| `GET` | `/api/properties/[propertyNo]` | Property details + history |
| `GET` | `/api/transactions?propertyNo=<id>` | Transaction history |
| `POST` | `/api/transactions` | Record new payment |
| `GET` | `/api/health` | System health check |

### Admin APIs (requires `x-admin-key` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats?ward=<all\|1\|2\|3>` | Dashboard statistics |
| `GET` | `/api/admin/properties?ward=<1\|2\|3>` | List all properties |
| `POST` | `/api/admin/properties` | Create new property |
| `PUT` | `/api/admin/properties` | Update property |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech/) free tier)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rajesh-Magar/dhamner-tax-automation.git
   cd dhamner-tax-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Seed sample data**
   ```bash
   npm run db:seed
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Useful Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push Prisma schema to DB
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:migrate   # Create migration files
```

## 🌐 Deployment

This project is configured for automatic deployment via **Vercel**:
1. Push to `main` branch → automatic deployment
2. Subdomain: `taxes.grampanchayatdhamner.in`
3. DNS: CNAME `taxes` → `cname.vercel-dns.com`

## 📄 License

This project is built for **यशवंत ग्रामपंचायत धामणेर, ता. धामणेर, जि. जळगाव**.

---

**Developed with ❤️ for Digital Governance**
