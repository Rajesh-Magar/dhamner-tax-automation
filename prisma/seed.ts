import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Property seed data – 30 properties across 3 wards (10 per ward)
// ---------------------------------------------------------------------------

interface PropertySeed {
  propertyNo: string;
  ownerName: string;
  ownerNameEn: string;
  mobileNumber: string;
  wardNo: number;
  address: string;
  houseTaxDue: Prisma.Decimal;
  waterTaxDue: Prisma.Decimal;
  sanitaryTaxDue: Prisma.Decimal;
  lightTaxDue: Prisma.Decimal;
  isActive: boolean;
}

const properties: PropertySeed[] = [
  // ── Ward 1 (मुख्य बाजारपेठ / Main Market Area) ──────────────────────
  {
    propertyNo: 'GP-001',
    ownerName: 'श्री. रामचंद्र पाटील',
    ownerNameEn: 'Shri. Ramchandra Patil',
    mobileNumber: '9823456701',
    wardNo: 1,
    address: 'मुख्य बाजारपेठ, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-002',
    ownerName: 'श्रीमती. सुनीता देशमुख',
    ownerNameEn: 'Smt. Sunita Deshmukh',
    mobileNumber: '8976543210',
    wardNo: 1,
    address: 'बाजारपेठ गल्ली नं. २, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('1500.00'),
    waterTaxDue: new Prisma.Decimal('800.00'),
    sanitaryTaxDue: new Prisma.Decimal('400.00'),
    lightTaxDue: new Prisma.Decimal('200.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-003',
    ownerName: 'श्री. विकास जाधव',
    ownerNameEn: 'Shri. Vikas Jadhav',
    mobileNumber: '7738291045',
    wardNo: 1,
    address: 'दत्त मंदिराजवळ, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('2500.00'),
    waterTaxDue: new Prisma.Decimal('1200.00'),
    sanitaryTaxDue: new Prisma.Decimal('600.00'),
    lightTaxDue: new Prisma.Decimal('350.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-004',
    ownerName: 'श्री. प्रकाश शिंदे',
    ownerNameEn: 'Shri. Prakash Shinde',
    mobileNumber: '9011234567',
    wardNo: 1,
    address: 'ग्रामपंचायत कार्यालयाजवळ, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('800.00'),
    waterTaxDue: new Prisma.Decimal('300.00'),
    sanitaryTaxDue: new Prisma.Decimal('200.00'),
    lightTaxDue: new Prisma.Decimal('100.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-005',
    ownerName: 'श्रीमती. अनिता कुलकर्णी',
    ownerNameEn: 'Smt. Anita Kulkarni',
    mobileNumber: '8459012345',
    wardNo: 1,
    address: 'शाळेजवळ, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-006',
    ownerName: 'श्री. सुरेश गायकवाड',
    ownerNameEn: 'Shri. Suresh Gaikwad',
    mobileNumber: '7028765432',
    wardNo: 1,
    address: 'पोस्ट ऑफिस समोर, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('3000.00'),
    waterTaxDue: new Prisma.Decimal('1500.00'),
    sanitaryTaxDue: new Prisma.Decimal('800.00'),
    lightTaxDue: new Prisma.Decimal('500.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-007',
    ownerName: 'श्री. महेश भोसले',
    ownerNameEn: 'Shri. Mahesh Bhosale',
    mobileNumber: '9765432109',
    wardNo: 1,
    address: 'गणपती मंदिराजवळ, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('1200.00'),
    waterTaxDue: new Prisma.Decimal('600.00'),
    sanitaryTaxDue: new Prisma.Decimal('300.00'),
    lightTaxDue: new Prisma.Decimal('150.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-008',
    ownerName: 'श्रीमती. वंदना मोरे',
    ownerNameEn: 'Smt. Vandana More',
    mobileNumber: '8329876543',
    wardNo: 1,
    address: 'नगरपालिका रस्ता, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('500.00'),
    waterTaxDue: new Prisma.Decimal('300.00'),
    sanitaryTaxDue: new Prisma.Decimal('200.00'),
    lightTaxDue: new Prisma.Decimal('100.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-009',
    ownerName: 'श्री. दीपक सोनवणे',
    ownerNameEn: 'Shri. Deepak Sonawane',
    mobileNumber: '9156789012',
    wardNo: 1,
    address: 'एस.टी. स्टँडजवळ, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('500.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('250.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-010',
    ownerName: 'श्री. अमोल चव्हाण',
    ownerNameEn: 'Shri. Amol Chavhan',
    mobileNumber: '7987654321',
    wardNo: 1,
    address: 'जुना बाजार, वॉर्ड १, धामणेर',
    houseTaxDue: new Prisma.Decimal('1800.00'),
    waterTaxDue: new Prisma.Decimal('900.00'),
    sanitaryTaxDue: new Prisma.Decimal('450.00'),
    lightTaxDue: new Prisma.Decimal('200.00'),
    isActive: true,
  },

  // ── Ward 2 (शिवाजी नगर / Shivaji Nagar Area) ────────────────────────
  {
    propertyNo: 'GP-011',
    ownerName: 'श्री. संजय निकम',
    ownerNameEn: 'Shri. Sanjay Nikam',
    mobileNumber: '9876012345',
    wardNo: 2,
    address: 'शिवाजी नगर, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('2200.00'),
    waterTaxDue: new Prisma.Decimal('1100.00'),
    sanitaryTaxDue: new Prisma.Decimal('550.00'),
    lightTaxDue: new Prisma.Decimal('300.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-012',
    ownerName: 'श्रीमती. रेखा पवार',
    ownerNameEn: 'Smt. Rekha Pawar',
    mobileNumber: '8123456789',
    wardNo: 2,
    address: 'आंबेडकर चौक, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-013',
    ownerName: 'श्री. राजेश वाघ',
    ownerNameEn: 'Shri. Rajesh Wagh',
    mobileNumber: '7654321098',
    wardNo: 2,
    address: 'विठ्ठल मंदिराजवळ, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('1000.00'),
    waterTaxDue: new Prisma.Decimal('500.00'),
    sanitaryTaxDue: new Prisma.Decimal('250.00'),
    lightTaxDue: new Prisma.Decimal('150.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-014',
    ownerName: 'श्री. गणेश लोखंडे',
    ownerNameEn: 'Shri. Ganesh Lokhande',
    mobileNumber: '9234567890',
    wardNo: 2,
    address: 'प्राथमिक आरोग्य केंद्राजवळ, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('2800.00'),
    waterTaxDue: new Prisma.Decimal('1400.00'),
    sanitaryTaxDue: new Prisma.Decimal('700.00'),
    lightTaxDue: new Prisma.Decimal('450.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-015',
    ownerName: 'श्रीमती. मंगल काळे',
    ownerNameEn: 'Smt. Mangal Kale',
    mobileNumber: '8567890123',
    wardNo: 2,
    address: 'शिवाजी नगर गल्ली नं. ३, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('600.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('300.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-016',
    ownerName: 'श्री. नितीन ढोले',
    ownerNameEn: 'Shri. Nitin Dhole',
    mobileNumber: '7890123456',
    wardNo: 2,
    address: 'जिल्हा परिषद शाळेजवळ, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('700.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('300.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-017',
    ownerName: 'श्री. किशोर साळुंके',
    ownerNameEn: 'Shri. Kishor Salunke',
    mobileNumber: '9345678901',
    wardNo: 2,
    address: 'हनुमान मंदिराजवळ, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('1700.00'),
    waterTaxDue: new Prisma.Decimal('850.00'),
    sanitaryTaxDue: new Prisma.Decimal('400.00'),
    lightTaxDue: new Prisma.Decimal('250.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-018',
    ownerName: 'श्रीमती. स्वाती थोरात',
    ownerNameEn: 'Smt. Swati Thorat',
    mobileNumber: '8901234567',
    wardNo: 2,
    address: 'नवीन वसाहत, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-019',
    ownerName: 'श्री. अशोक गोरे',
    ownerNameEn: 'Shri. Ashok Gore',
    mobileNumber: '7456789012',
    wardNo: 2,
    address: 'पाणी टाकीजवळ, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('2100.00'),
    waterTaxDue: new Prisma.Decimal('1050.00'),
    sanitaryTaxDue: new Prisma.Decimal('500.00'),
    lightTaxDue: new Prisma.Decimal('350.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-020',
    ownerName: 'श्री. भरत कदम',
    ownerNameEn: 'Shri. Bharat Kadam',
    mobileNumber: '9678901234',
    wardNo: 2,
    address: 'शिवाजी नगर मुख्य रस्ता, वॉर्ड २, धामणेर',
    houseTaxDue: new Prisma.Decimal('900.00'),
    waterTaxDue: new Prisma.Decimal('450.00'),
    sanitaryTaxDue: new Prisma.Decimal('200.00'),
    lightTaxDue: new Prisma.Decimal('100.00'),
    isActive: true,
  },

  // ── Ward 3 (नदीपात्र परिसर / Riverside Area) ─────────────────────────
  {
    propertyNo: 'GP-021',
    ownerName: 'श्री. तुकाराम माळी',
    ownerNameEn: 'Shri. Tukaram Mali',
    mobileNumber: '9512345678',
    wardNo: 3,
    address: 'नदीपात्र परिसर, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('1400.00'),
    waterTaxDue: new Prisma.Decimal('700.00'),
    sanitaryTaxDue: new Prisma.Decimal('350.00'),
    lightTaxDue: new Prisma.Decimal('200.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-022',
    ownerName: 'श्रीमती. लता इंगळे',
    ownerNameEn: 'Smt. Lata Ingale',
    mobileNumber: '8234567890',
    wardNo: 3,
    address: 'नदीकाठ गल्ली, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-023',
    ownerName: 'श्री. ज्ञानेश्वर बागुल',
    ownerNameEn: 'Shri. Dnyaneshwar Bagul',
    mobileNumber: '7345678901',
    wardNo: 3,
    address: 'पुलाजवळ, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('2600.00'),
    waterTaxDue: new Prisma.Decimal('1300.00'),
    sanitaryTaxDue: new Prisma.Decimal('650.00'),
    lightTaxDue: new Prisma.Decimal('400.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-024',
    ownerName: 'श्री. सतीश बोरसे',
    ownerNameEn: 'Shri. Satish Borse',
    mobileNumber: '9087654321',
    wardNo: 3,
    address: 'स्मशानभूमीजवळ, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('700.00'),
    waterTaxDue: new Prisma.Decimal('400.00'),
    sanitaryTaxDue: new Prisma.Decimal('200.00'),
    lightTaxDue: new Prisma.Decimal('100.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-025',
    ownerName: 'श्रीमती. शोभा नेहते',
    ownerNameEn: 'Smt. Shobha Nehte',
    mobileNumber: '8765432109',
    wardNo: 3,
    address: 'वडाचे झाड चौक, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('600.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('150.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-026',
    ownerName: 'श्री. पांडुरंग वाघमारे',
    ownerNameEn: 'Shri. Pandurang Waghmare',
    mobileNumber: '7012345678',
    wardNo: 3,
    address: 'शेतकरी नगर, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('1900.00'),
    waterTaxDue: new Prisma.Decimal('950.00'),
    sanitaryTaxDue: new Prisma.Decimal('500.00'),
    lightTaxDue: new Prisma.Decimal('300.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-027',
    ownerName: 'श्री. विजय ढवळे',
    ownerNameEn: 'Shri. Vijay Dhawale',
    mobileNumber: '9456789012',
    wardNo: 3,
    address: 'महादेव मंदिराजवळ, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('0.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-028',
    ownerName: 'श्रीमती. माधवी घाडगे',
    ownerNameEn: 'Smt. Madhavi Ghadge',
    mobileNumber: '8678901234',
    wardNo: 3,
    address: 'विहीर गल्ली, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('2300.00'),
    waterTaxDue: new Prisma.Decimal('1150.00'),
    sanitaryTaxDue: new Prisma.Decimal('580.00'),
    lightTaxDue: new Prisma.Decimal('380.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-029',
    ownerName: 'श्री. नामदेव खैरनार',
    ownerNameEn: 'Shri. Namdev Khairnar',
    mobileNumber: '7789012345',
    wardNo: 3,
    address: 'तलावाजवळ, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('1100.00'),
    waterTaxDue: new Prisma.Decimal('550.00'),
    sanitaryTaxDue: new Prisma.Decimal('280.00'),
    lightTaxDue: new Prisma.Decimal('180.00'),
    isActive: true,
  },
  {
    propertyNo: 'GP-030',
    ownerName: 'श्री. बालाजी सूर्यवंशी',
    ownerNameEn: 'Shri. Balaji Suryavanshi',
    mobileNumber: '9890123456',
    wardNo: 3,
    address: 'ग्रामदैवत मंदिराजवळ, वॉर्ड ३, धामणेर',
    houseTaxDue: new Prisma.Decimal('0.00'),
    waterTaxDue: new Prisma.Decimal('0.00'),
    sanitaryTaxDue: new Prisma.Decimal('350.00'),
    lightTaxDue: new Prisma.Decimal('0.00'),
    isActive: false, // inactive / migrated property
  },
];

// ---------------------------------------------------------------------------
// Transaction seed data – 20 transactions across various properties
// ---------------------------------------------------------------------------

interface TransactionSeed {
  transactionId: string;
  propertyNo: string;
  amountPaid: Prisma.Decimal;
  taxType: string;
  paymentMethod: string;
  paymentDate: Date;
  financialYear: string;
  status: string;
  receiptUrl: string | null;
  gatewayRef: string | null;
  recordedBy: string | null;
  notes: string | null;
}

const transactions: TransactionSeed[] = [
  {
    transactionId: 'TXN-2025-00001',
    propertyNo: 'GP-001',
    amountPaid: new Prisma.Decimal('2500.00'),
    taxType: 'house_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-04-15T10:30:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00001.pdf',
    gatewayRef: 'RZP_ABC123DEF456',
    recordedBy: null,
    notes: 'घरपट्टी संपूर्ण भरणा – ऑनलाइन',
  },
  {
    transactionId: 'TXN-2025-00002',
    propertyNo: 'GP-001',
    amountPaid: new Prisma.Decimal('1200.00'),
    taxType: 'water_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-04-15T10:35:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00002.pdf',
    gatewayRef: 'RZP_GHI789JKL012',
    recordedBy: null,
    notes: 'पाणीपट्टी संपूर्ण भरणा – ऑनलाइन',
  },
  {
    transactionId: 'TXN-2025-00003',
    propertyNo: 'GP-003',
    amountPaid: new Prisma.Decimal('1500.00'),
    taxType: 'house_tax',
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-05-02T11:00:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00003.pdf',
    gatewayRef: null,
    recordedBy: 'ग्रामसेवक',
    notes: 'घरपट्टी – अर्धा भरणा रोख',
  },
  {
    transactionId: 'TXN-2025-00004',
    propertyNo: 'GP-005',
    amountPaid: new Prisma.Decimal('3200.00'),
    taxType: 'house_tax',
    paymentMethod: 'UPI',
    paymentDate: new Date('2025-04-20T14:15:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00004.pdf',
    gatewayRef: 'UPI_REF_20250420001',
    recordedBy: null,
    notes: 'सर्व करांचा एकत्रित भरणा – UPI',
  },
  {
    transactionId: 'TXN-2025-00005',
    propertyNo: 'GP-006',
    amountPaid: new Prisma.Decimal('1500.00'),
    taxType: 'house_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-05-10T09:45:00'),
    financialYear: '2025-26',
    status: 'FAILED',
    receiptUrl: null,
    gatewayRef: 'RZP_FAIL_MNO345',
    recordedBy: null,
    notes: 'पेमेंट गेटवे अयशस्वी – पुन्हा प्रयत्न करा',
  },
  {
    transactionId: 'TXN-2025-00006',
    propertyNo: 'GP-007',
    amountPaid: new Prisma.Decimal('1200.00'),
    taxType: 'house_tax',
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-05-15T10:00:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00006.pdf',
    gatewayRef: null,
    recordedBy: 'ग्रामसेवक',
    notes: 'घरपट्टी भरणा – रोख स्वीकार',
  },
  {
    transactionId: 'TXN-2025-00007',
    propertyNo: 'GP-010',
    amountPaid: new Prisma.Decimal('900.00'),
    taxType: 'water_tax',
    paymentMethod: 'UPI',
    paymentDate: new Date('2025-04-28T16:20:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00007.pdf',
    gatewayRef: 'UPI_REF_20250428002',
    recordedBy: null,
    notes: 'पाणीपट्टी भरणा – UPI',
  },
  {
    transactionId: 'TXN-2025-00008',
    propertyNo: 'GP-011',
    amountPaid: new Prisma.Decimal('2200.00'),
    taxType: 'house_tax',
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-06-01T11:30:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00008.pdf',
    gatewayRef: null,
    recordedBy: 'ग्रामसेवक',
    notes: 'घरपट्टी संपूर्ण भरणा – रोख',
  },
  {
    transactionId: 'TXN-2025-00009',
    propertyNo: 'GP-012',
    amountPaid: new Prisma.Decimal('1800.00'),
    taxType: 'house_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-04-10T08:50:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00009.pdf',
    gatewayRef: 'RZP_PQR678STU901',
    recordedBy: null,
    notes: 'घरपट्टी भरणा – ऑनलाइन',
  },
  {
    transactionId: 'TXN-2025-00010',
    propertyNo: 'GP-013',
    amountPaid: new Prisma.Decimal('500.00'),
    taxType: 'water_tax',
    paymentMethod: 'UPI',
    paymentDate: new Date('2025-05-20T13:10:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00010.pdf',
    gatewayRef: 'UPI_REF_20250520003',
    recordedBy: null,
    notes: 'पाणीपट्टी भरणा – UPI',
  },
  {
    transactionId: 'TXN-2025-00011',
    propertyNo: 'GP-014',
    amountPaid: new Prisma.Decimal('700.00'),
    taxType: 'sanitary_tax',
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-06-05T10:45:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00011.pdf',
    gatewayRef: null,
    recordedBy: 'ग्रामसेवक',
    notes: 'सॅनिटरी कर भरणा – रोख',
  },
  {
    transactionId: 'TXN-2025-00012',
    propertyNo: 'GP-017',
    amountPaid: new Prisma.Decimal('1700.00'),
    taxType: 'house_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-05-25T15:30:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00012.pdf',
    gatewayRef: 'RZP_VWX234YZA567',
    recordedBy: null,
    notes: 'घरपट्टी संपूर्ण भरणा – ऑनलाइन',
  },
  {
    transactionId: 'TXN-2025-00013',
    propertyNo: 'GP-018',
    amountPaid: new Prisma.Decimal('2800.00'),
    taxType: 'house_tax',
    paymentMethod: 'UPI',
    paymentDate: new Date('2025-04-12T09:20:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00013.pdf',
    gatewayRef: 'UPI_REF_20250412004',
    recordedBy: null,
    notes: 'सर्व कर भरणा – UPI द्वारे',
  },
  {
    transactionId: 'TXN-2025-00014',
    propertyNo: 'GP-019',
    amountPaid: new Prisma.Decimal('1050.00'),
    taxType: 'water_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-06-10T11:15:00'),
    financialYear: '2025-26',
    status: 'FAILED',
    receiptUrl: null,
    gatewayRef: 'RZP_FAIL_BCD890',
    recordedBy: null,
    notes: 'बँक सर्व्हर त्रुटी – पेमेंट अयशस्वी',
  },
  {
    transactionId: 'TXN-2025-00015',
    propertyNo: 'GP-021',
    amountPaid: new Prisma.Decimal('1400.00'),
    taxType: 'house_tax',
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-05-08T10:00:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00015.pdf',
    gatewayRef: null,
    recordedBy: 'ग्रामसेवक',
    notes: 'घरपट्टी संपूर्ण भरणा – रोख',
  },
  {
    transactionId: 'TXN-2025-00016',
    propertyNo: 'GP-022',
    amountPaid: new Prisma.Decimal('2100.00'),
    taxType: 'house_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-04-18T14:00:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00016.pdf',
    gatewayRef: 'RZP_EFG123HIJ456',
    recordedBy: null,
    notes: 'घरपट्टी व पाणीपट्टी एकत्रित – ऑनलाइन',
  },
  {
    transactionId: 'TXN-2025-00017',
    propertyNo: 'GP-023',
    amountPaid: new Prisma.Decimal('650.00'),
    taxType: 'sanitary_tax',
    paymentMethod: 'UPI',
    paymentDate: new Date('2025-06-12T12:45:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00017.pdf',
    gatewayRef: 'UPI_REF_20250612005',
    recordedBy: null,
    notes: 'सॅनिटरी कर भरणा – UPI',
  },
  {
    transactionId: 'TXN-2025-00018',
    propertyNo: 'GP-026',
    amountPaid: new Prisma.Decimal('950.00'),
    taxType: 'water_tax',
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-05-30T09:30:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00018.pdf',
    gatewayRef: null,
    recordedBy: 'ग्रामसेवक',
    notes: 'पाणीपट्टी भरणा – रोख स्वीकार',
  },
  {
    transactionId: 'TXN-2025-00019',
    propertyNo: 'GP-028',
    amountPaid: new Prisma.Decimal('2300.00'),
    taxType: 'house_tax',
    paymentMethod: 'ONLINE',
    paymentDate: new Date('2025-06-15T16:00:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00019.pdf',
    gatewayRef: 'RZP_KLM789NOP012',
    recordedBy: null,
    notes: 'घरपट्टी संपूर्ण भरणा – ऑनलाइन',
  },
  {
    transactionId: 'TXN-2025-00020',
    propertyNo: 'GP-029',
    amountPaid: new Prisma.Decimal('180.00'),
    taxType: 'light_tax',
    paymentMethod: 'UPI',
    paymentDate: new Date('2025-06-18T08:15:00'),
    financialYear: '2025-26',
    status: 'SUCCESS',
    receiptUrl: '/receipts/TXN-2025-00020.pdf',
    gatewayRef: 'UPI_REF_20250618006',
    recordedBy: null,
    notes: 'दिवाबत्ती कर भरणा – UPI',
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 धामणेर ग्रामपंचायत – डेटाबेस सीडिंग सुरू...');
  console.log('──────────────────────────────────────────────');

  // 1. Clean existing data (order matters due to FK constraints)
  console.log('🗑️  विद्यमान व्यवहार (transactions) हटवत आहे...');
  const deletedTxns = await prisma.transaction.deleteMany();
  console.log(`   ✔ ${deletedTxns.count} व्यवहार हटवले`);

  console.log('🗑️  विद्यमान मालमत्ता (properties) हटवत आहे...');
  const deletedProps = await prisma.property.deleteMany();
  console.log(`   ✔ ${deletedProps.count} मालमत्ता हटवल्या`);

  console.log('──────────────────────────────────────────────');

  // 2. Seed properties
  console.log('🏠 मालमत्ता (properties) जोडत आहे...');
  for (const prop of properties) {
    const created = await prisma.property.create({ data: prop });
    console.log(`   ✔ ${created.propertyNo} – ${created.ownerName}`);
  }
  console.log(`   📊 एकूण ${properties.length} मालमत्ता जोडल्या`);

  console.log('──────────────────────────────────────────────');

  // 3. Seed transactions
  console.log('💰 व्यवहार (transactions) जोडत आहे...');
  for (const txn of transactions) {
    const created = await prisma.transaction.create({ data: txn });
    console.log(
      `   ✔ ${created.transactionId} – ₹${created.amountPaid} (${created.taxType}, ${created.paymentMethod}) [${created.status}]`
    );
  }
  console.log(`   📊 एकूण ${transactions.length} व्यवहार जोडले`);

  console.log('──────────────────────────────────────────────');
  console.log('✅ सीडिंग यशस्वीरित्या पूर्ण झाले!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ सीडिंग अयशस्वी:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
