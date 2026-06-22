# 🏛️ धामणेर कर व्यवस्थापन प्रणाली | Dhamner Tax Automation

Automated Tax Collection & Management System for **यशवंत ग्रामपंचायत धामणेर** (Yashwant Grampanchayat Dhamner), Koregaon, Satara.

> Digital platform for property tax management, online payments, citizen dashboards, and admin oversight for 544+ households across 3 wards.

---

## 🏗️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Framework** | [Next.js 15](https://nextjs.org/) | React framework (App Router, TypeScript) |
| **Database** | PostgreSQL | Cloud database hosted on [Neon](https://neon.tech/) |
| **ORM** | [Prisma](https://www.prisma.io/) | Object-Relational Mapping |
| **Styling** | Tailwind CSS v4 | Utility-first CSS styling framework |
| **Hosting** | [Vercel](https://vercel.com/) | Production web hosting and deployment |
| **Domain** | `taxes.grampanchayatdhamner.in` | Custom administrative sub-domain |

---

## 📋 Project Phases

| Phase | Description | Status |
|-------|------------|--------|
| **Phase 1** | Foundation & Backend (Database, API Routes, Seed Data) | ✅ Complete |
| **Phase 2** | Core UI (Citizen Search, Dashboard, Admin Panel) | ✅ Complete |
| **Phase 3** | Integrations & UI Polish (Reconciliation, Printing, WhatsApp Logs, Filters) | ✅ Complete |

---

## ✨ Core Features

### 👤 Citizen Portal
* **Homepage Search**: Dynamic search bar allowing citizens to look up properties instantly by Owner Name (in Marathi or English), Mobile Number, or Property Number (e.g. `GP-005`).
* **Citizen Dashboard**: Visual breakdown of dues per financial year.
* **Scan to Pay**: Interactive UPI payment QR code popups allowing instant payment.
* **Receipt History**: Citizen portal lists all past payments and displays printer-friendly digital tax receipts.

### 🔑 Administrative Dashboard (`/admin`)
* **Secure Authorization**: Admin dashboard protected via password entry.
* **Overview Analytics**: Visual collection progress tracker with charts, recovery percentage, and total expected collection vs. collected vs. outstanding dues.
* **Daily Reconciliation Reports**: Choose any working day to review collection metrics separated by payment method (Cash, UPI, Online) with printable bank audit layouts.
* **Bulk CSV Import**: Import or update all 544+ properties in one click via raw CSV spreadsheets (respects duplicate entries with robust database upsert logic).
* **Tax Assessment & Rollover**: Re-assess taxes or rollover the system to prepare bills for a new financial year.

### ⚙️ Advanced Table Tools
* **Two-Row Filters Card**: High-contrast white filter panel separating searches/select filters (sorting, dues range filters) from active filter tags to prevent line wraps on compact screens.
* **Row Quick Actions**: Clicking anywhere on a table row launches the property's detailed Profile Modal. Row action columns allow quick-redirect triggers for *Record Cash*, *WhatsApp Reminder*, and *Print Notice*.
* **WhatsApp Reminders & Timeline Logs**: Custom-generated Marathi/English text notifications with one-click redirects to WhatsApp. Log histories of sent messages are permanently kept in the DB timeline.
* **Printable A4 Demand Notices (मागणी नोटीस)**: Automatically compiles and structures demand notices with itemized dues, legal warnings, and signature sections formatted for clean printing.

---

## 🗄️ Database Schema

### 1. Properties Table (`properties`)
Represents the property tax record for a household in a specific financial year.

```prisma
model Property {
  id                Int           @id @default(autoincrement())
  propertyNo        String        @map("property_no")
  financialYear     String        @map("financial_year")
  ownerName         String        @map("owner_name")
  ownerNameEn       String?       @map("owner_name_en")
  mobileNumber      String        @map("mobile_number")
  wardNo            Int           @map("ward_no")
  address           String?
  houseTaxAssessed  Decimal       @default(0) @map("house_tax_assessed") @db.Decimal(10, 2)
  waterTaxAssessed  Decimal       @default(0) @map("water_tax_assessed") @db.Decimal(10, 2)
  houseTaxPaid      Decimal       @default(0) @map("house_tax_paid") @db.Decimal(10, 2)
  waterTaxPaid      Decimal       @default(0) @map("water_tax_paid") @db.Decimal(10, 2)
  houseTaxDue       Decimal       @default(0) @map("house_tax_due") @db.Decimal(10, 2)
  waterTaxDue       Decimal       @default(0) @map("water_tax_due") @db.Decimal(10, 2)
  isActive          Boolean       @default(true) @map("is_active")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  transactions      Transaction[]

  @@unique([propertyNo, financialYear])
}
```

### 2. Transactions Table (`transactions`)
Logs payments made towards property taxes.

```prisma
model Transaction {
  id              Int       @id @default(autoincrement())
  transactionId   String    @unique @map("transaction_id")
  propertyNo      String    @map("property_no")
  amountPaid      Decimal   @map("amount_paid") @db.Decimal(10, 2)
  taxType         String    @map("tax_type") // house_tax / water_tax / sanitary_tax / light_tax
  paymentMethod   String    @map("payment_method") // ONLINE / CASH / UPI
  paymentDate     DateTime  @default(now()) @map("payment_date")
  financialYear   String    @map("financial_year")
  status          String    @default("SUCCESS") // SUCCESS / FAILED
  receiptUrl      String?   @map("receipt_url")
  gatewayRef      String?   @map("gateway_ref")
  recordedBy      String?   @map("recorded_by") // e.g. 'ग्रामसेवक' for cash payments
  notes           String?
  createdAt       DateTime  @default(now()) @map("created_at")
}
```

### 3. Communication Log Table (`communication_logs`)
Stores history logs of print notice runs and sent reminders.

```prisma
model CommunicationLog {
  id            Int      @id @default(autoincrement())
  propertyNo    String   @map("property_no")
  type          String   // WHATSAPP, SMS, PRINT
  recipient     String   // Recipient name / phone number
  message       String   // Sent reminder message body
  sentBy        String   @default("ग्रामसेवक") @map("sent_by")
  sentAt        DateTime @default(now()) @map("sent_at")
}
```

---

## 🔌 API Endpoints

### Public Portal APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/properties?search=<query>&ward=<1\|2\|3>` | Search properties |
| `GET` | `/api/properties/[propertyNo]` | Retrieve property info, year dues, and txn logs |
| `GET` | `/api/transactions?propertyNo=<id>` | Retrieve payment ledger |
| `POST` | `/api/transactions` | Record new tax payment |
| `GET` | `/api/health` | Health check endpoint |

### Administrative Dashboard APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats?ward=<all\|1\|2\|3>` | Fetch collection metric stats |
| `GET` | `/api/admin/properties?ward=<1\|2\|3>` | Fetch complete property lists |
| `POST` | `/api/admin/properties` | Save/register a new property |
| `PUT` | `/api/admin/properties` | Edit property credentials |
| `GET` | `/api/properties/[propertyNo]/notifications` | Retrieve reminder notification history |
| `POST` | `/api/properties/[propertyNo]/notifications` | Log a WhatsApp or print notification timeline event |
| `POST` | `/api/admin/assess` | Trigger ward assessments or rollover a financial year |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* PostgreSQL instance (e.g. Neon, AWS RDS, or Local Postgres)

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
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   DIRECT_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   ADMIN_PASSCODE="your-secure-admin-passcode"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Generate Prisma client and push database schema**
   ```bash
   npx prisma generate
   npm run db:push
   ```

5. **Seed the database** (Seeds realistic data for 30 households across 3 wards, with mock transaction ledger entries)
   ```bash
   npm run db:seed
   ```

6. **Start the local server**
   ```bash
   npm run dev
   ```

7. **Visit locally**
   Open [http://localhost:3000](http://localhost:3000) on your web browser.

---

## 🌐 Deployment & Domains

* **Hosting Platform**: Vercel
* **Primary Domain**: `taxes.grampanchayatdhamner.in`
* **Serverless Functions**: Database pool limits are optimized for Neon serverless drivers and Next.js route caches.

---

## 📄 License

This software is custom-built for **यशवंत ग्रामपंचायत धामणेर, ता. कोरेगाव, जि. सातारा**.
All rights reserved.

---

**Developed with ❤️ for Digital Governance & Smart Village Initiatives**
