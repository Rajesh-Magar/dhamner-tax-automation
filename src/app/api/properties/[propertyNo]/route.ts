import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/properties/[propertyNo]
 * 
 * Get full details for a specific property including transaction history.
 * 
 * URL Parameters:
 *   - propertyNo: The property number (e.g., "GP-001")
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyNo: string }> }
) {
  try {
    const { propertyNo } = await params

    const property = await prisma.property.findUnique({
      where: { propertyNo: propertyNo.toUpperCase() },
      include: {
        transactions: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!property) {
      return NextResponse.json(
        { success: false, message: `मालमत्ता क्रमांक '${propertyNo}' सापडला नाही.` },
        { status: 404 }
      )
    }

    // Calculate totals
    const totalDue =
      Number(property.houseTaxDue) +
      Number(property.waterTaxDue) +
      Number(property.sanitaryTaxDue) +
      Number(property.lightTaxDue)

    const totalPaid = property.transactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + Number(t.amountPaid), 0)

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        houseTaxDue: Number(property.houseTaxDue),
        waterTaxDue: Number(property.waterTaxDue),
        sanitaryTaxDue: Number(property.sanitaryTaxDue),
        lightTaxDue: Number(property.lightTaxDue),
        totalDue,
        totalPaid,
        transactions: property.transactions.map((t) => ({
          ...t,
          amountPaid: Number(t.amountPaid),
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { success: false, message: 'मालमत्ता माहिती मिळवताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}
