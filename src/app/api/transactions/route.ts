import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runWithFallback, mockDb } from '@/lib/dbFallback'

/**
 * GET /api/transactions
 * 
 * Get transaction history, optionally filtered by property and financial year.
 * 
 * Query Parameters:
 *   - propertyNo: Filter by property number
 *   - year: Filter by financial year (e.g., "2025-26")
 *   - status: Filter by status (SUCCESS, FAILED, PENDING)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyNo = searchParams.get('propertyNo')
    const year = searchParams.get('year')
    const ward = searchParams.get('ward')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (propertyNo) {
      where.propertyNo = propertyNo.toUpperCase()
    }

    if (year) {
      const years = year.split(',').map(y => y.trim()).filter(Boolean)
      if (years.length > 0) {
        where.financialYear = { in: years }
      }
    }

    if (ward) {
      const wards = ward.split(',').map(w => parseInt(w.trim(), 10)).filter(w => !isNaN(w))
      if (wards.length > 0) {
        where.property = {
          wardNo: { in: wards }
        }
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (date) {
      const start = new Date(date)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      where.paymentDate = {
        gte: start,
        lt: end
      }
    }

    const [transactions, total] = await runWithFallback(
      () => Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: { paymentDate: 'desc' },
          skip,
          take: limit,
          include: {
            property: {
              select: {
                ownerName: true,
                ownerNameEn: true,
                wardNo: true,
              },
            },
          },
        }),
        prisma.transaction.count({ where }),
      ]),
      () => {
        let list = mockDb.transactions;
        if (propertyNo) {
          list = list.filter(t => t.propertyNo.toUpperCase() === propertyNo.toUpperCase());
        }
        if (year) {
          const years = year.split(',').map(y => y.trim()).filter(Boolean);
          if (years.length > 0) {
            list = list.filter(t => years.includes(t.financialYear));
          }
        }
        if (ward) {
          const wards = ward.split(',').map(w => parseInt(w.trim(), 10)).filter(w => !isNaN(w));
          if (wards.length > 0) {
            list = list.filter(t => {
              const prop = mockDb.properties.find(
                p => p.propertyNo.toUpperCase() === t.propertyNo.toUpperCase() && p.financialYear === t.financialYear
              );
              return prop ? wards.includes(prop.wardNo) : false;
            });
          }
        }
        if (status) {
          list = list.filter(t => t.status === status.toUpperCase());
        }
        if (date) {
          list = list.filter(t => {
            const yr = t.paymentDate.getFullYear();
            const mo = String(t.paymentDate.getMonth() + 1).padStart(2, '0');
            const dy = String(t.paymentDate.getDate()).padStart(2, '0');
            return `${yr}-${mo}-${dy}` === date;
          });
        }
        list.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
        
        const total = list.length;
        const pageList = list.slice(skip, skip + limit).map(t => {
          const prop = mockDb.properties.find(
            p => p.propertyNo.toUpperCase() === t.propertyNo.toUpperCase() && p.financialYear === t.financialYear
          );
          return {
            ...t,
            property: {
              ownerName: prop?.ownerName || '',
              ownerNameEn: prop?.ownerNameEn || '',
              wardNo: prop?.wardNo || 1
            }
          };
        });
        
        return [pageList, total] as any;
      }
    )

    return NextResponse.json({
      success: true,
      data: transactions.map((t: any) => ({
        ...t,
        amountPaid: Number(t.amountPaid),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, message: 'व्यवहार इतिहास मिळवताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * 
 * Record a new tax payment transaction.
 * Automatically generates a transaction ID and updates property dues.
 * 
 * Request Body:
 *   - propertyNo: Property number (required)
 *   - amountPaid: Amount paid (required)
 *   - taxType: Type of tax - house_tax, water_tax, sanitary_tax, light_tax (required)
 *   - paymentMethod: ONLINE, CASH, UPI (required)
 *   - recordedBy: Admin name for cash payments (optional)
 *   - notes: Additional notes (optional)
 *   - gatewayRef: Payment gateway reference (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { propertyNo, amountPaid, taxType, paymentMethod, recordedBy, notes, gatewayRef, financialYear } = body

    // Validate required fields
    if (!propertyNo || !amountPaid || !taxType || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message: 'कृपया सर्व आवश्यक माहिती भरा (मालमत्ता क्रमांक, रक्कम, कर प्रकार, भरणा पद्धत)',
        },
        { status: 400 }
      )
    }

    // Validate tax type
    const validTaxTypes = ['house_tax', 'water_tax']
    if (!validTaxTypes.includes(taxType)) {
      return NextResponse.json(
        { success: false, message: `अवैध कर प्रकार. वैध प्रकार: ${validTaxTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['ONLINE', 'CASH', 'UPI']
    if (!validMethods.includes(paymentMethod.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: `अवैध भरणा पद्धत. वैध पद्धती: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // Determine target financial year (April to March)
    const now = new Date()
    const month = now.getMonth() // 0-indexed
    const currentFy =
      month >= 3 // April onwards
        ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
        : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`
    const targetFy = financialYear || currentFy

    // Verify property exists for the target financial year
    const property = await runWithFallback(
      () => prisma.property.findUnique({
        where: {
          propertyNo_financialYear: {
            propertyNo: propertyNo.toUpperCase(),
            financialYear: targetFy,
          },
        },
      }),
      () => {
        return mockDb.properties.find(
          (p) =>
            p.propertyNo.toUpperCase() === propertyNo.toUpperCase() &&
            p.financialYear === targetFy
        ) as any;
      }
    )

    if (!property) {
      return NextResponse.json(
        { success: false, message: `मालमत्ता क्रमांक '${propertyNo}' आणि आर्थिक वर्ष '${targetFy}' साठी रेकॉर्ड सापडला नाही.` },
        { status: 404 }
      )
    }

    // Generate transaction ID: TXN-YYYY-XXXXX
    const year = new Date().getFullYear()
    const lastTransaction = await runWithFallback(
      () => prisma.transaction.findFirst({
        where: {
          transactionId: { startsWith: `TXN-${year}` },
        },
        orderBy: { transactionId: 'desc' },
      }),
      () => {
        const list = mockDb.transactions.filter(t => t.transactionId.startsWith(`TXN-${year}`));
        list.sort((a, b) => b.transactionId.localeCompare(a.transactionId));
        return list[0] as any;
      }
    )

    let nextSeq = 1
    if (lastTransaction) {
      const lastSeq = parseInt(lastTransaction.transactionId.split('-')[2], 10)
      nextSeq = lastSeq + 1
    }
    const transactionId = `TXN-${year}-${String(nextSeq).padStart(5, '0')}`

    // Map tax type to property due/paid fields
    const taxFieldsMap: Record<string, { due: string; paid: string }> = {
      house_tax: { due: 'houseTaxDue', paid: 'houseTaxPaid' },
      water_tax: { due: 'waterTaxDue', paid: 'waterTaxPaid' },
    }

    const { due: dueField, paid: paidField } = taxFieldsMap[taxType]

    // Create transaction and update property dues in a single transaction
    const result = await runWithFallback(
      () => prisma.$transaction(async (tx) => {
        // Create the transaction record
        const transaction = await tx.transaction.create({
          data: {
            transactionId,
            propertyNo: propertyNo.toUpperCase(),
            amountPaid: parseFloat(amountPaid),
            taxType,
            paymentMethod: paymentMethod.toUpperCase(),
            financialYear: targetFy,
            status: 'SUCCESS',
            gatewayRef: gatewayRef || null,
            recordedBy: recordedBy || null,
            notes: notes || null,
          },
        })

        // Update the property record for the specific financial year
        const pay = parseFloat(amountPaid)
        const currentDue = Number(property[dueField as keyof typeof property] || 0)
        const currentPaid = Number(property[paidField as keyof typeof property] || 0)

        await tx.property.update({
          where: {
            propertyNo_financialYear: {
              propertyNo: propertyNo.toUpperCase(),
              financialYear: targetFy,
            },
          },
          data: {
            [dueField]: Math.max(0, currentDue - pay),
            [paidField]: currentPaid + pay,
          },
        })

        return transaction
      }),
      () => {
        const res = mockDb.recordTransaction({
          propertyNo: propertyNo.toUpperCase(),
          amountPaid: parseFloat(amountPaid),
          taxType,
          paymentMethod: paymentMethod.toUpperCase(),
          recordedBy: recordedBy || null,
          notes: notes || null,
          financialYear: targetFy,
        });
        if (!res.success) throw new Error(res.message);
        return res.data as any;
      }
    )

    return NextResponse.json({
      success: true,
      message: `कर भरणा यशस्वी! पावती क्रमांक: ${transactionId}`,
      data: {
        ...result,
        amountPaid: Number(result.amountPaid),
      },
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, message: 'कर भरणा करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' },
      { status: 500 }
    )
  }
}
