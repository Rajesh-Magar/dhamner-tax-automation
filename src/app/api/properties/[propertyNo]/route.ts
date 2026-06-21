import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runWithFallback, mockDb } from '@/lib/dbFallback'

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

    const properties = await runWithFallback(
      () => prisma.property.findMany({
        where: { propertyNo: propertyNo.toUpperCase(), isActive: true },
        include: {
          transactions: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      }),
      () => {
        const years = mockDb.properties.filter(p => p.propertyNo.toUpperCase() === propertyNo.toUpperCase() && p.isActive);
        return years.map(y => ({
          ...y,
          transactions: mockDb.transactions.filter(t => t.propertyNo === y.propertyNo && t.financialYear === y.financialYear && t.status === 'SUCCESS')
        })) as any;
      }
    )

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        { success: false, message: `मालमत्ता क्रमांक '${propertyNo}' सापडला नाही.` },
        { status: 404 }
      )
    }

    // Sort descending by financial year
    properties.sort((a: any, b: any) => b.financialYear.localeCompare(a.financialYear))
    const latestProperty = properties[0]

    // Consolidate transactions
    const allTransactions: any[] = []
    properties.forEach((p: any) => {
      if (p.transactions) {
        allTransactions.push(...p.transactions)
      }
    })
    allTransactions.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

    // Calculate totals
    const totalDue = properties.reduce((sum: number, p: any) => sum + Number(p.houseTaxDue) + Number(p.waterTaxDue), 0)
    const totalPaid = allTransactions
      .filter((t: any) => t.status === 'SUCCESS')
      .reduce((sum: number, t: any) => sum + Number(t.amountPaid), 0)

    // Map yearDues breakdown from properties list
    const yearDues = properties.map((p: any) => ({
      id: p.id,
      propertyNo: p.propertyNo,
      financialYear: p.financialYear,
      houseTaxAssessed: Number(p.houseTaxAssessed),
      waterTaxAssessed: Number(p.waterTaxAssessed),
      houseTaxPaid: Number(p.houseTaxPaid),
      waterTaxPaid: Number(p.waterTaxPaid),
      houseTaxDue: Number(p.houseTaxDue),
      waterTaxDue: Number(p.waterTaxDue),
    }))

    return NextResponse.json({
      success: true,
      data: {
        ...latestProperty,
        houseTaxDue: Number(latestProperty.houseTaxDue),
        waterTaxDue: Number(latestProperty.waterTaxDue),
        totalDue,
        totalPaid,
        transactions: allTransactions.map((t: any) => ({
          ...t,
          amountPaid: Number(t.amountPaid),
        })),
        yearDues,
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
