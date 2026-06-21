import { Prisma } from '@prisma/client';

// Helper to determine if we should fall back to mock data
export async function runWithFallback<T>(
  prismaQuery: () => Promise<T>,
  fallbackQuery: () => T | Promise<T>
): Promise<T> {
  try {
    // If DATABASE_URL is not set or is the default placeholder, immediately use fallback to save time
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl || dbUrl.includes('localhost:5432/dbname') || dbUrl.includes('postgres://user:password')) {
      return await fallbackQuery();
    }
    
    return await prismaQuery();
  } catch (error: any) {
    const errorMsg = error.message || '';
    const errorCode = error.code || '';
    
    const isConnError =
      errorCode === 'ECONNREFUSED' ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('Can\'t reach database server') ||
      errorMsg.includes('P1001') ||
      errorMsg.includes('P1003') ||
      errorMsg.includes('P2024') ||
      errorMsg.includes('connection refused') ||
      errorMsg.includes('failed to connect');

    if (isConnError) {
      console.warn("⚠️ Database connection failed. Falling back to mock memory database.");
      return await fallbackQuery();
    }
    
    throw error;
  }
}

// In-Memory Database Structure
export interface MockProperty {
  id: number;
  propertyNo: string;
  financialYear: string;
  ownerName: string;
  ownerNameEn: string | null;
  mobileNumber: string;
  wardNo: number;
  address: string | null;
  houseTaxAssessed: number;
  waterTaxAssessed: number;
  houseTaxPaid: number;
  waterTaxPaid: number;
  houseTaxDue: number;
  waterTaxDue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTransaction {
  id: number;
  transactionId: string;
  propertyNo: string;
  amountPaid: number;
  taxType: string;
  paymentMethod: string;
  paymentDate: Date;
  financialYear: string;
  status: string;
  receiptUrl: string | null;
  gatewayRef: string | null;
  recordedBy: string | null;
  notes: string | null;
  createdAt: Date;
}

class MockDatabase {
  properties: MockProperty[] = [];
  transactions: MockTransaction[] = [];
  private propIdCounter = 1;
  private txnIdCounter = 21;

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed 30 properties
    const rawProps = [
      { propertyNo: 'GP-001', ownerName: 'श्री. रामचंद्र पाटील', ownerNameEn: 'Shri. Ramchandra Patil', mobileNumber: '9823456701', wardNo: 1, address: 'मुख्य बाजारपेठ, वॉर्ड १, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 0, lightTaxDue: 0 },
      { propertyNo: 'GP-002', ownerName: 'श्रीमती. सुनीता देशमुख', ownerNameEn: 'Smt. Sunita Deshmukh', mobileNumber: '8976543210', wardNo: 1, address: 'बाजारपेठ गल्ली नं. २, वॉर्ड १, धामणेर', houseTaxDue: 1500, waterTaxDue: 800, sanitaryTaxDue: 400, lightTaxDue: 200 },
      { propertyNo: 'GP-003', ownerName: 'श्री. विकास जाधव', ownerNameEn: 'Shri. Vikas Jadhav', mobileNumber: '7738291045', wardNo: 1, address: 'दत्त मंदिराजवळ, वॉर्ड १, धामणेर', houseTaxDue: 2500, waterTaxDue: 1200, sanitaryTaxDue: 600, lightTaxDue: 350 },
      { propertyNo: 'GP-004', ownerName: 'श्री. प्रकाश शिंदे', ownerNameEn: 'Shri. Prakash Shinde', mobileNumber: '9011234567', wardNo: 1, address: 'ग्रामपंचायत कार्यालयाजवळ, वॉर्ड १, धामणेर', houseTaxDue: 800, waterTaxDue: 300, sanitaryTaxDue: 200, lightTaxDue: 100 },
      { propertyNo: 'GP-005', ownerName: 'श्रीमती. अनिता कुलकर्णी', ownerNameEn: 'Smt. Anita Kulkarni', mobileNumber: '8459012345', wardNo: 1, address: 'शाळेजवळ, वॉर्ड १, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 0, lightTaxDue: 0 },
      { propertyNo: 'GP-006', ownerName: 'श्री. सुरेश गायकवाड', ownerNameEn: 'Shri. Suresh Gaikwad', mobileNumber: '7028765432', wardNo: 1, address: 'पोस्ट ऑफिस समोर, वॉर्ड १, धामणेर', houseTaxDue: 3000, waterTaxDue: 1500, sanitaryTaxDue: 800, lightTaxDue: 500 },
      { propertyNo: 'GP-007', ownerName: 'श्री. महेश भोसले', ownerNameEn: 'Shri. Mahesh Bhosale', mobileNumber: '9765432109', wardNo: 1, address: 'गणपती मंदिराजवळ, वॉर्ड १, धामणेर', houseTaxDue: 1200, waterTaxDue: 600, sanitaryTaxDue: 300, lightTaxDue: 150 },
      { propertyNo: 'GP-008', ownerName: 'श्रीमती. वंदना मोरे', ownerNameEn: 'Smt. Vandana More', mobileNumber: '8329876543', wardNo: 1, address: 'नगरपालिका रस्ता, वॉर्ड १, धामणेर', houseTaxDue: 500, waterTaxDue: 300, sanitaryTaxDue: 200, lightTaxDue: 100 },
      { propertyNo: 'GP-009', ownerName: 'श्री. दीपक सोनवणे', ownerNameEn: 'Shri. Deepak Sonawane', mobileNumber: '9156789012', wardNo: 1, address: 'एस.टी. स्टँडजवळ, वॉर्ड १, धामणेर', houseTaxDue: 0, waterTaxDue: 500, sanitaryTaxDue: 0, lightTaxDue: 250 },
      { propertyNo: 'GP-010', ownerName: 'श्री. अमोल चव्हाण', ownerNameEn: 'Shri. Amol Chavhan', mobileNumber: '7987654321', wardNo: 1, address: 'जुना बाजार, वॉर्ड १, धामणेर', houseTaxDue: 1800, waterTaxDue: 900, sanitaryTaxDue: 450, lightTaxDue: 200 },
      { propertyNo: 'GP-011', ownerName: 'श्री. संजय निकम', ownerNameEn: 'Shri. Sanjay Nikam', mobileNumber: '9876012345', wardNo: 2, address: 'शिवाजी नगर, वॉर्ड २, धामणेर', houseTaxDue: 2200, waterTaxDue: 1100, sanitaryTaxDue: 550, lightTaxDue: 300 },
      { propertyNo: 'GP-012', ownerName: 'श्रीमती. रेखा पवार', ownerNameEn: 'Smt. Rekha Pawar', mobileNumber: '8123456789', wardNo: 2, address: 'आंबेडकर चौक, वॉर्ड २, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 0, lightTaxDue: 0 },
      { propertyNo: 'GP-013', ownerName: 'श्री. राजेश वाघ', ownerNameEn: 'Shri. Rajesh Wagh', mobileNumber: '7654321098', wardNo: 2, address: 'विठ्ठल मंदिराजवळ, वॉर्ड २, धामणेर', houseTaxDue: 1000, waterTaxDue: 500, sanitaryTaxDue: 250, lightTaxDue: 150 },
      { propertyNo: 'GP-014', ownerName: 'श्री. गणेश लोखंडे', ownerNameEn: 'Shri. Ganesh Lokhande', mobileNumber: '9234567890', wardNo: 2, address: 'प्राथमिक आरोग्य केंद्राजवळ, वॉर्ड २, धामणेर', houseTaxDue: 2800, waterTaxDue: 1400, sanitaryTaxDue: 700, lightTaxDue: 450 },
      { propertyNo: 'GP-015', ownerName: 'श्रीमती. मंगल काळे', ownerNameEn: 'Smt. Mangal Kale', mobileNumber: '8567890123', wardNo: 2, address: 'शिवाजी नगर गल्ली नं. ३, वॉर्ड २, धामणेर', houseTaxDue: 600, waterTaxDue: 0, sanitaryTaxDue: 300, lightTaxDue: 0 },
      { propertyNo: 'GP-016', ownerName: 'श्री. नितिन ढोले', ownerNameEn: 'Shri. Nitin Dhole', mobileNumber: '7890123456', wardNo: 2, address: 'जिल्हा परिषद शाळेजवळ, वॉर्ड २, धामणेर', houseTaxDue: 0, waterTaxDue: 700, sanitaryTaxDue: 0, lightTaxDue: 300 },
      { propertyNo: 'GP-017', ownerName: 'श्री. किशोर साळुंके', ownerNameEn: 'Shri. Kishor Salunke', mobileNumber: '9345678901', wardNo: 2, address: 'हनुमान मंदिराजवळ, वॉर्ड २, धामणेर', houseTaxDue: 1700, waterTaxDue: 850, sanitaryTaxDue: 400, lightTaxDue: 250 },
      { propertyNo: 'GP-018', ownerName: 'श्रीमती. स्वाती थोरात', ownerNameEn: 'Smt. Swati Thorat', mobileNumber: '8901234567', wardNo: 2, address: 'नवीन वसाहत, वॉर्ड २, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 0, lightTaxDue: 0 },
      { propertyNo: 'GP-019', ownerName: 'श्री. अशोक गोरे', ownerNameEn: 'Shri. Ashok Gore', mobileNumber: '7456789012', wardNo: 2, address: 'पाणी टाकीजवळ, वॉर्ड २, धामणेर', houseTaxDue: 2100, waterTaxDue: 1050, sanitaryTaxDue: 500, lightTaxDue: 350 },
      { propertyNo: 'GP-020', ownerName: 'श्री. भरत कदम', ownerNameEn: 'Shri. Bharat Kadam', mobileNumber: '9678901234', wardNo: 2, address: 'शिवाजी नगर मुख्य रस्ता, वॉर्ड २, धामणेर', houseTaxDue: 900, waterTaxDue: 450, sanitaryTaxDue: 200, lightTaxDue: 100 },
      { propertyNo: 'GP-021', ownerName: 'श्री. तुकाराम माळी', ownerNameEn: 'Shri. Tukaram Mali', mobileNumber: '9512345678', wardNo: 3, address: 'नदीपात्र परिसर, वॉर्ड ३, धामणेर', houseTaxDue: 1400, waterTaxDue: 700, sanitaryTaxDue: 350, lightTaxDue: 200 },
      { propertyNo: 'GP-022', ownerName: 'श्रीमती. लता इंगळे', ownerNameEn: 'Smt. Lata Ingale', mobileNumber: '8234567890', wardNo: 3, address: 'नदीकाठ गल्ली, वॉर्ड ३, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 0, lightTaxDue: 0 },
      { propertyNo: 'GP-023', ownerName: 'श्री. ज्ञानेश्वर बागुल', ownerNameEn: 'Shri. Dnyaneshwar Bagul', mobileNumber: '7345678901', wardNo: 3, address: 'पुलाजवळ, वॉर्ड ३, धामणेर', houseTaxDue: 2600, waterTaxDue: 1300, sanitaryTaxDue: 650, lightTaxDue: 400 },
      { propertyNo: 'GP-024', ownerName: 'श्री. सतीश बोरसे', ownerNameEn: 'Shri. Satish Borse', mobileNumber: '9087654321', wardNo: 3, address: 'स्मशानभूमीजवळ, वॉर्ड ३, धामणेर', houseTaxDue: 700, waterTaxDue: 400, sanitaryTaxDue: 200, lightTaxDue: 100 },
      { propertyNo: 'GP-025', ownerName: 'श्रीमती. शोभा नेहते', ownerNameEn: 'Smt. Shobha Nehte', mobileNumber: '8765432109', wardNo: 3, address: 'वडाचे झाड चौक, वॉर्ड ३, धामणेर', houseTaxDue: 0, waterTaxDue: 600, sanitaryTaxDue: 0, lightTaxDue: 150 },
      { propertyNo: 'GP-026', ownerName: 'श्री. पांडुरंग वाघमारे', ownerNameEn: 'Shri. Pandurang Waghmare', mobileNumber: '7012345678', wardNo: 3, address: 'शेतकरी नगर, वॉर्ड ३, धामणेर', houseTaxDue: 1900, waterTaxDue: 950, sanitaryTaxDue: 500, lightTaxDue: 300 },
      { propertyNo: 'GP-027', ownerName: 'श्री. विजय ढवळे', ownerNameEn: 'Shri. Vijay Dhawale', mobileNumber: '9456789012', wardNo: 3, address: 'महादेव मंदिराजवळ, वॉर्ड ३, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 0, lightTaxDue: 0 },
      { propertyNo: 'GP-028', ownerName: 'श्रीमती. माधवी घाडगे', ownerNameEn: 'Smt. Madhavi Ghadge', mobileNumber: '8678901234', wardNo: 3, address: 'विहीर गल्ली, वॉर्ड ३, धामणेर', houseTaxDue: 2300, waterTaxDue: 1150, sanitaryTaxDue: 580, lightTaxDue: 380 },
      { propertyNo: 'GP-029', ownerName: 'श्री. नामदेव खैरनार', ownerNameEn: 'Shri. Namdev Khairnar', mobileNumber: '7789012345', wardNo: 3, address: 'तलावाजवळ, वॉर्ड ३, धामणेर', houseTaxDue: 1100, waterTaxDue: 550, sanitaryTaxDue: 280, lightTaxDue: 180 },
      { propertyNo: 'GP-030', ownerName: 'श्री. बालाजी सूर्यवंशी', ownerNameEn: 'Shri. Balaji Suryavanshi', mobileNumber: '9890123456', wardNo: 3, address: 'ग्रामदैवत मंदिराजवळ, वॉर्ड ३, धामणेर', houseTaxDue: 0, waterTaxDue: 0, sanitaryTaxDue: 350, lightTaxDue: 0 }
    ];

    // Seed 20 transactions
    const rawTxns = [
      { transactionId: 'TXN-2025-00001', propertyNo: 'GP-001', amountPaid: 2500, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-05-10T10:30:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00001.pdf', gatewayRef: 'pay_Ndk185Ljsd91', recordedBy: null, notes: 'वार्षिक घरपट्टी भरणा - Gateway' },
      { transactionId: 'TXN-2025-00002', propertyNo: 'GP-001', amountPaid: 1000, taxType: 'water_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-05-10T10:35:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00002.pdf', gatewayRef: 'pay_Ndk290Kjsd92', recordedBy: null, notes: 'वार्षिक पाणीपट्टी भरणा - Gateway' },
      { transactionId: 'TXN-2025-00003', propertyNo: 'GP-002', amountPaid: 1500, taxType: 'house_tax', paymentMethod: 'CASH', paymentDate: new Date('2025-06-15T11:00:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00003.pdf', gatewayRef: null, recordedBy: 'ग्रामसेवक', notes: 'थकबाकी रोख भरणा' },
      { transactionId: 'TXN-2025-00004', propertyNo: 'GP-003', amountPaid: 2000, taxType: 'house_tax', paymentMethod: 'UPI', paymentDate: new Date('2025-07-20T14:15:00Z'), status: 'SUCCESS', receiptUrl: null, gatewayRef: 'upi_ref_8123908123', recordedBy: null, notes: 'UPI QR कोडद्वारे कर भरणा' },
      { transactionId: 'TXN-2025-00005', propertyNo: 'GP-005', amountPaid: 1500, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-12T09:00:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00005.pdf', gatewayRef: 'pay_Mkd720Sdh921', recordedBy: null, notes: 'Online full tax clearance' },
      { transactionId: 'TXN-2025-00006', propertyNo: 'GP-005', amountPaid: 800, taxType: 'water_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-12T09:05:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00006.pdf', gatewayRef: 'pay_Mkd721Sdh922', recordedBy: null, notes: 'Online full water tax' },
      { transactionId: 'TXN-2025-00007', propertyNo: 'GP-005', amountPaid: 300, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-12T09:10:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00007.pdf', gatewayRef: 'pay_Mkd722Sdh923', recordedBy: null, notes: 'Online full house tax (incl. sanitary)' },
      { transactionId: 'TXN-2025-00008', propertyNo: 'GP-005', amountPaid: 150, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-12T09:12:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00008.pdf', gatewayRef: 'pay_Mkd723Sdh924', recordedBy: null, notes: 'Online full house tax (incl. street light)' },
      { transactionId: 'TXN-2025-00009', propertyNo: 'GP-009', amountPaid: 800, taxType: 'house_tax', paymentMethod: 'CASH', paymentDate: new Date('2025-08-05T12:30:00Z'), status: 'SUCCESS', receiptUrl: '/receipts/TXN-2025-00009.pdf', gatewayRef: null, recordedBy: 'ग्रामसेवक', notes: 'Partial house tax' },
      { transactionId: 'TXN-2025-00010', propertyNo: 'GP-010', amountPaid: 1000, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-09-18T16:45:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Okd912Jns718', recordedBy: null, notes: 'Partial payment' },
      { transactionId: 'TXN-2025-00011', propertyNo: 'GP-012', amountPaid: 2000, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-15T11:20:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Aks821Kdh821', recordedBy: null, notes: 'Clearance' },
      { transactionId: 'TXN-2025-00012', propertyNo: 'GP-012', amountPaid: 1000, taxType: 'water_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-15T11:25:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Aks822Kdh822', recordedBy: null, notes: 'Clearance' },
      { transactionId: 'TXN-2025-00013', propertyNo: 'GP-012', amountPaid: 500, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-15T11:30:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Aks823Kdh823', recordedBy: null, notes: 'Clearance (house tax)' },
      { transactionId: 'TXN-2025-00014', propertyNo: 'GP-012', amountPaid: 200, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-04-15T11:32:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Aks824Kdh824', recordedBy: null, notes: 'Clearance (house tax)' },
      { transactionId: 'TXN-2025-00018', propertyNo: 'GP-018', amountPaid: 1800, taxType: 'house_tax', paymentMethod: 'UPI', paymentDate: new Date('2025-05-22T10:15:00Z'), status: 'SUCCESS', gatewayRef: 'upi_ref_7812908129', recordedBy: null, notes: 'Full clearance' },
      { transactionId: 'TXN-2025-00019', propertyNo: 'GP-018', amountPaid: 900, taxType: 'water_tax', paymentMethod: 'UPI', paymentDate: new Date('2025-05-22T10:20:00Z'), status: 'SUCCESS', gatewayRef: 'upi_ref_7812908130', recordedBy: null, notes: 'Full water tax' },
      { transactionId: 'TXN-2025-00020', propertyNo: 'GP-018', amountPaid: 450, taxType: 'house_tax', paymentMethod: 'UPI', paymentDate: new Date('2025-05-22T10:22:00Z'), status: 'SUCCESS', gatewayRef: 'upi_ref_7812908131', recordedBy: null, notes: 'Full house tax (incl. sanitary)' },
      { transactionId: 'TXN-2025-00021', propertyNo: 'GP-018', amountPaid: 200, taxType: 'house_tax', paymentMethod: 'UPI', paymentDate: new Date('2025-05-22T10:24:00Z'), status: 'SUCCESS', gatewayRef: 'upi_ref_7812908132', recordedBy: null, notes: 'Full house tax (incl. street light)' },
      { transactionId: 'TXN-2025-00022', propertyNo: 'GP-022', amountPaid: 1500, taxType: 'house_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-06-01T15:30:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Nks291Hkd012', recordedBy: null, notes: 'Full clearance' },
      { transactionId: 'TXN-2025-00023', propertyNo: 'GP-022', amountPaid: 800, taxType: 'water_tax', paymentMethod: 'ONLINE', paymentDate: new Date('2025-06-01T15:32:00Z'), status: 'SUCCESS', gatewayRef: 'pay_Nks292Hkd013', recordedBy: null, notes: 'Full water' }
    ];

    this.transactions = rawTxns.map((t, idx) => {
      const receiptUrl = t.receiptUrl || null;
      const recordedBy = t.recordedBy || null;
      const notes = t.notes || null;
      const gatewayRef = t.gatewayRef || null;
      const taxType = (t.taxType === 'sanitary_tax' || t.taxType === 'light_tax') ? 'house_tax' : t.taxType;
      return {
        id: idx + 1,
        transactionId: t.transactionId,
        propertyNo: t.propertyNo,
        amountPaid: t.amountPaid,
        taxType,
        paymentMethod: t.paymentMethod,
        paymentDate: t.paymentDate,
        financialYear: '2025-26',
        status: t.status,
        receiptUrl,
        gatewayRef,
        recordedBy,
        notes,
        createdAt: t.paymentDate
      };
    });

    const txnSummaries: Record<string, { housePaid: number; waterPaid: number }> = {};
    this.transactions.forEach(t => {
      if (t.status !== 'SUCCESS' || t.financialYear !== '2025-26') return;
      if (!txnSummaries[t.propertyNo]) {
        txnSummaries[t.propertyNo] = { housePaid: 0, waterPaid: 0 };
      }
      if (t.taxType === 'house_tax') {
        txnSummaries[t.propertyNo].housePaid += t.amountPaid;
      } else if (t.taxType === 'water_tax') {
        txnSummaries[t.propertyNo].waterPaid += t.amountPaid;
      }
    });

    this.properties = [];

    // Seed 2025-26 Dues & Paid Stats
    rawProps.forEach((p) => {
      const { propertyNo, sanitaryTaxDue, lightTaxDue, ...rest } = p;
      const houseDueVal = p.houseTaxDue + sanitaryTaxDue + lightTaxDue;
      const waterDueVal = p.waterTaxDue;

      const summary = txnSummaries[propertyNo] || { housePaid: 0, waterPaid: 0 };
      const houseTaxPaidVal = summary.housePaid;
      const waterTaxPaidVal = summary.waterPaid;
      const houseTaxAssessedVal = houseDueVal + houseTaxPaidVal;
      const waterTaxAssessedVal = waterDueVal + waterTaxPaidVal;

      this.properties.push({
        id: this.propIdCounter++,
        propertyNo,
        financialYear: '2025-26',
        ...rest,
        houseTaxAssessed: houseTaxAssessedVal,
        waterTaxAssessed: waterTaxAssessedVal,
        houseTaxPaid: houseTaxPaidVal,
        waterTaxPaid: waterTaxPaidVal,
        houseTaxDue: houseDueVal,
        waterTaxDue: waterDueVal,
        isActive: propertyNo !== 'GP-030',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z')
      });
    });

    // Seed 2026-27 Rolled-over Dues
    rawProps.forEach((p) => {
      const { propertyNo, sanitaryTaxDue, lightTaxDue, ...rest } = p;
      const houseDueVal = p.houseTaxDue + sanitaryTaxDue + lightTaxDue;
      const waterDueVal = p.waterTaxDue;

      const houseAssessed = houseDueVal > 0 ? houseDueVal : 1200;
      const waterAssessed = waterDueVal > 0 ? waterDueVal : 600;

      this.properties.push({
        id: this.propIdCounter++,
        propertyNo,
        financialYear: '2026-27',
        ...rest,
        houseTaxAssessed: houseAssessed,
        waterTaxAssessed: waterAssessed,
        houseTaxPaid: 0,
        waterTaxPaid: 0,
        houseTaxDue: houseAssessed,
        waterTaxDue: waterAssessed,
        isActive: propertyNo !== 'GP-030',
        createdAt: new Date('2026-04-01T00:00:00Z'),
        updatedAt: new Date('2026-04-01T00:00:00Z')
      });
    });
  }

  // --- QUERY IMPLEMENTATIONS ---

  searchProperties(search?: string, ward?: string, skip = 0, limit = 20, financialYear?: string) {
    let list = this.properties.filter(p => p.isActive);

    if (financialYear && financialYear !== 'all') {
      list = list.filter(p => p.financialYear === financialYear);
    }

    if (ward && ['1', '2', '3'].includes(ward)) {
      list = list.filter(p => p.wardNo === parseInt(ward, 10));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.propertyNo.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        (p.ownerNameEn && p.ownerNameEn.toLowerCase().includes(q)) ||
        p.mobileNumber.includes(q)
      );
    }

    if (!financialYear || financialYear === 'all') {
      // Group by propertyNo and pick the one with the latest financialYear
      const latestMap = new Map<string, MockProperty>();
      list.forEach(p => {
        const existing = latestMap.get(p.propertyNo);
        if (!existing || p.financialYear.localeCompare(existing.financialYear) > 0) {
          latestMap.set(p.propertyNo, p);
        }
      });
      list = Array.from(latestMap.values());
    }

    const total = list.length;
    const paginated = list.slice(skip, skip + limit).map(p => this.calculateTotalDue(p));

    return {
      properties: paginated,
      total
    };
  }

  getPropertyDetails(propertyNo: string) {
    const allYears = this.properties.filter(p => p.propertyNo.toUpperCase() === propertyNo.toUpperCase() && p.isActive);
    if (allYears.length === 0) return null;

    // Sort descending by financial year
    allYears.sort((a, b) => b.financialYear.localeCompare(a.financialYear));
    const latest = allYears[0];

    const txns = this.transactions
      .filter(t => t.propertyNo.toUpperCase() === propertyNo.toUpperCase() && t.status === 'SUCCESS')
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    const totalPaid = txns.reduce((sum, t) => sum + t.amountPaid, 0);

    const yearDues = allYears.map(p => ({
      id: p.id,
      propertyNo: p.propertyNo,
      financialYear: p.financialYear,
      houseTaxAssessed: p.houseTaxAssessed,
      waterTaxAssessed: p.waterTaxAssessed,
      houseTaxPaid: p.houseTaxPaid,
      waterTaxPaid: p.waterTaxPaid,
      houseTaxDue: p.houseTaxDue,
      waterTaxDue: p.waterTaxDue,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    const totalHouseTaxDue = allYears.reduce((sum, p) => sum + p.houseTaxDue, 0);
    const totalWaterTaxDue = allYears.reduce((sum, p) => sum + p.waterTaxDue, 0);

    return {
      ...latest,
      houseTaxDue: totalHouseTaxDue,
      waterTaxDue: totalWaterTaxDue,
      totalDue: totalHouseTaxDue + totalWaterTaxDue,
      totalPaid,
      transactions: txns,
      yearDues
    };
  }

  getAdminStats(ward?: string, year = '2025-26') {
    const activeProps = this.properties.filter(p => p.isActive && p.financialYear === year && (ward && ward !== 'all' ? p.wardNo === parseInt(ward, 10) : true));
    
    let totalHouseTaxDue = 0;
    let totalWaterTaxDue = 0;
    let defaulterCount = 0;
    const defaulterList: any[] = [];

    activeProps.forEach(p => {
      const totalDue = p.houseTaxDue + p.waterTaxDue;
      totalHouseTaxDue += p.houseTaxDue;
      totalWaterTaxDue += p.waterTaxDue;

      if (totalDue > 0) {
        defaulterCount++;
        defaulterList.push({
          propertyNo: p.propertyNo,
          ownerName: p.ownerName,
          ownerNameEn: p.ownerNameEn,
          wardNo: p.wardNo,
          mobileNumber: p.mobileNumber,
          totalDue
        });
      }
    });

    defaulterList.sort((a, b) => b.totalDue - a.totalDue);

    // Filter txns by ward and year
    let txns = this.transactions.filter(t => t.status === 'SUCCESS' && t.financialYear === year);
    if (ward && ward !== 'all') {
      const propsInWard = new Set(this.properties.filter(p => p.wardNo === parseInt(ward, 10)).map(p => p.propertyNo));
      txns = txns.filter(t => propsInWard.has(t.propertyNo));
    }

    let totalCollected = 0;
    let houseTaxCollected = 0;
    let waterTaxCollected = 0;
    let onlinePayments = 0;
    let cashPayments = 0;
    let upiPayments = 0;

    txns.forEach(t => {
      totalCollected += t.amountPaid;
      if (t.taxType === 'house_tax') houseTaxCollected += t.amountPaid;
      else if (t.taxType === 'water_tax') waterTaxCollected += t.amountPaid;

      if (t.paymentMethod === 'ONLINE') onlinePayments++;
      else if (t.paymentMethod === 'CASH') cashPayments++;
      else if (t.paymentMethod === 'UPI') upiPayments++;
    });

    const totalExpected = totalHouseTaxDue + totalWaterTaxDue + totalCollected;
    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 10000) / 100 : 0;

    // Ward Stats
    const wardStats = [1, 2, 3].map(wNo => {
      const wProps = this.properties.filter(p => p.isActive && p.financialYear === year && p.wardNo === wNo);
      let wDue = 0;
      let wDefaulters = 0;
      wProps.forEach(p => {
        const d = p.houseTaxDue + p.waterTaxDue;
        wDue += d;
        if (d > 0) wDefaulters++;
      });

      const wTxns = this.transactions.filter(t => {
        if (t.status !== 'SUCCESS' || t.financialYear !== year) return false;
        const p = this.properties.find(prop => prop.propertyNo === t.propertyNo && prop.financialYear === year);
        return p && p.wardNo === wNo;
      });
      const wCollected = wTxns.reduce((sum, t) => sum + t.amountPaid, 0);

      return {
        wardNo: wNo,
        totalProperties: wProps.length,
        propertiesWithDues: wDefaulters,
        paidUpProperties: wProps.length - wDefaulters,
        totalDue: wDue,
        totalCollected: wCollected
      };
    });

    return {
      financialYear: year,
      overview: {
        totalProperties: activeProps.length,
        totalExpected,
        totalCollected,
        totalPending: totalHouseTaxDue + totalWaterTaxDue,
        collectionPercentage
      },
      taxBreakdown: {
        houseTax: { collected: houseTaxCollected, pending: totalHouseTaxDue },
        waterTax: { collected: waterTaxCollected, pending: totalWaterTaxDue }
      },
      paymentMethods: {
        online: onlinePayments,
        cash: cashPayments,
        upi: upiPayments,
        totalTransactions: txns.length
      },
      defaulters: {
        count: defaulterCount,
        paidUpCount: activeProps.length - defaulterCount,
        list: defaulterList.slice(0, 50)
      },
      wardStats
    };
  }

  recordTransaction(data: {
    propertyNo: string;
    amountPaid: number;
    taxType: string;
    paymentMethod: string;
    recordedBy?: string | null;
    notes?: string | null;
    financialYear?: string;
  }) {
    // Determine target financial year
    const now = new Date();
    const month = now.getMonth();
    const currentFy = month >= 3
      ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
      : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`;

    const year = data.financialYear || currentFy;

    const propIndex = this.properties.findIndex(p => p.propertyNo.toUpperCase() === data.propertyNo.toUpperCase() && p.financialYear === year);
    if (propIndex === -1) {
      return { success: false, message: `मालमत्ता क्रमांक '${data.propertyNo}' आणि आर्थिक वर्ष '${year}' साठी रेकॉर्ड सापडला नाही.` };
    }

    const prop = this.properties[propIndex];
    
    // Deduct due and record payment
    if (data.taxType === 'house_tax') {
      prop.houseTaxDue = Math.max(0, prop.houseTaxDue - data.amountPaid);
      prop.houseTaxPaid += data.amountPaid;
    } else if (data.taxType === 'water_tax') {
      prop.waterTaxDue = Math.max(0, prop.waterTaxDue - data.amountPaid);
      prop.waterTaxPaid += data.amountPaid;
    }
    
    prop.updatedAt = new Date();

    const txnId = `TXN-${year.split('-')[0]}-${this.txnIdCounter++}`;
    const newTxn: MockTransaction = {
      id: this.transactions.length + 1,
      transactionId: txnId,
      propertyNo: prop.propertyNo,
      amountPaid: data.amountPaid,
      taxType: data.taxType,
      paymentMethod: data.paymentMethod,
      paymentDate: new Date(),
      financialYear: year,
      status: 'SUCCESS',
      receiptUrl: `/receipts/${txnId}.pdf`,
      gatewayRef: data.paymentMethod === 'ONLINE' ? 'pay_gateway_ref_' + Math.random().toString(36).substr(2, 9) : null,
      recordedBy: data.recordedBy || null,
      notes: data.notes || null,
      createdAt: new Date()
    };

    this.transactions.push(newTxn);
    return { success: true, data: newTxn };
  }

  createProperty(data: any) {
    const year = data.financialYear || '2025-26';
    const exists = this.properties.find(p => p.propertyNo.toUpperCase() === data.propertyNo.toUpperCase() && p.financialYear === year);
    if (exists) return { success: false, message: `मालमत्ता क्र. '${data.propertyNo}' आधीपासून आर्थिक वर्ष '${year}' साठी अस्तित्वात आहे.` };

    const newProp: MockProperty = {
      id: this.properties.length + 1,
      propertyNo: data.propertyNo,
      financialYear: year,
      ownerName: data.ownerName,
      ownerNameEn: data.ownerNameEn || null,
      mobileNumber: data.mobileNumber,
      wardNo: parseInt(data.wardNo || '1', 10),
      address: data.address || null,
      houseTaxAssessed: parseFloat(data.houseTaxDue || '0'),
      waterTaxAssessed: parseFloat(data.waterTaxDue || '0'),
      houseTaxPaid: 0,
      waterTaxPaid: 0,
      houseTaxDue: parseFloat(data.houseTaxDue || '0'),
      waterTaxDue: parseFloat(data.waterTaxDue || '0'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.properties.push(newProp);
    return { success: true, data: this.calculateTotalDue(newProp) };
  }

  assessNewFinancialYear(targetFy: string, propertyNo?: string) {
    const parts = targetFy.split('-');
    const startYear = parseInt(parts[0], 10);
    const prevFy = `${startYear - 1}-${String(startYear).slice(2)}`;

    const sourceProps = this.properties.filter(p => p.isActive && p.financialYear === prevFy && (!propertyNo || p.propertyNo.toUpperCase() === propertyNo.toUpperCase()));
    
    if (sourceProps.length === 0) {
      return { success: false, message: `मागील वर्ष '${prevFy}' साठी कोणतीही मालमत्ता सापडली नाही.` };
    }

    let assessedCount = 0;

    sourceProps.forEach(p => {
      const existing = this.properties.find(prop => prop.propertyNo === p.propertyNo && prop.financialYear === targetFy);
      if (existing) return; // Already assessed for this year

      this.properties.push({
        id: this.properties.length + 1,
        propertyNo: p.propertyNo,
        financialYear: targetFy,
        ownerName: p.ownerName,
        ownerNameEn: p.ownerNameEn,
        mobileNumber: p.mobileNumber,
        wardNo: p.wardNo,
        address: p.address,
        houseTaxAssessed: p.houseTaxAssessed,
        waterTaxAssessed: p.waterTaxAssessed,
        houseTaxPaid: 0,
        waterTaxPaid: 0,
        houseTaxDue: p.houseTaxAssessed,
        waterTaxDue: p.waterTaxAssessed,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      assessedCount++;
    });

    return { success: true, assessedCount };
  }

  private calculateTotalDue(p: MockProperty) {
    return {
      ...p,
      totalDue: p.houseTaxDue + p.waterTaxDue
    };
  }
}

// Global Singleton for mock DB in development
const globalForMockDb = globalThis as unknown as {
  mockDb: MockDatabase | undefined;
};

export const mockDb = globalForMockDb.mockDb ?? new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMockDb.mockDb = mockDb;
