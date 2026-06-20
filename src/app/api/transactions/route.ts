import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const status = searchParams.get('status')
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
      where.financialYear = year
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [transactions, total] = await Promise.all([
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
    ])

    return NextResponse.json({
      success: true,
      data: transactions.map((t) => ({
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

    const { propertyNo, amountPaid, taxType, paymentMethod, recordedBy, notes, gatewayRef } = body

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
    const validTaxTypes = ['house_tax', 'water_tax', 'sanitary_tax', 'light_tax']
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

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { propertyNo: propertyNo.toUpperCase() },
    })

    if (!property) {
      return NextResponse.json(
        { success: false, message: `मालमत्ता क्रमांक '${propertyNo}' सापडला नाही.` },
        { status: 404 }
      )
    }

    // Generate transaction ID: TXN-YYYY-XXXXX
    const year = new Date().getFullYear()
    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        transactionId: { startsWith: `TXN-${year}` },
      },
      orderBy: { transactionId: 'desc' },
    })

    let nextSeq = 1
    if (lastTransaction) {
      const lastSeq = parseInt(lastTransaction.transactionId.split('-')[2], 10)
      nextSeq = lastSeq + 1
    }
    const transactionId = `TXN-${year}-${String(nextSeq).padStart(5, '0')}`

    // Determine financial year (April to March)
    const now = new Date()
    const month = now.getMonth() // 0-indexed
    const fy =
      month >= 3 // April onwards
        ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
        : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`

    // Map tax type to property due field
    const taxDueFieldMap: Record<string, string> = {
      house_tax: 'houseTaxDue',
      water_tax: 'waterTaxDue',
      sanitary_tax: 'sanitaryTaxDue',
      light_tax: 'lightTaxDue',
    }

    const dueField = taxDueFieldMap[taxType]

    // Create transaction and update property dues in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionId,
          propertyNo: propertyNo.toUpperCase(),
          amountPaid: parseFloat(amountPaid),
          taxType,
          paymentMethod: paymentMethod.toUpperCase(),
          financialYear: fy,
          status: 'SUCCESS',
          gatewayRef: gatewayRef || null,
          recordedBy: recordedBy || null,
          notes: notes || null,
        },
      })

      // Update the property dues (reduce by the amount paid)
      const currentDue = Number(property[dueField as keyof typeof property] || 0)
      const newDue = Math.max(0, currentDue - parseFloat(amountPaid))

      await tx.property.update({
        where: { propertyNo: propertyNo.toUpperCase() },
        data: {
          [dueField]: newDue,
        },
      })

      return transaction
    })

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
