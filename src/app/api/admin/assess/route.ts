import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runWithFallback, mockDb } from '@/lib/dbFallback'

function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  return adminKey === process.env.ADMIN_API_KEY
}

/**
 * POST /api/admin/assess
 * 
 * Assess taxes for a new financial year and roll over properties.
 * Admin-only endpoint.
 * 
 * Request Body:
 *   - targetFy: Target financial year (e.g. "2026-27") (required)
 *   - propertyNo: Specific property number to roll over (optional)
 */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized — अधिकृत नाही' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { targetFy, propertyNo } = body

    if (!targetFy || !targetFy.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { success: false, message: 'कृपया वैध आर्थिक वर्ष द्या (उदा. 2026-27).' },
        { status: 400 }
      )
    }

    const result = await runWithFallback(
      async () => {
        return await prisma.$transaction(async (tx) => {
          // Calculate previous financial year
          const parts = targetFy.split('-')
          const startYear = parseInt(parts[0], 10)
          const prevFy = `${startYear - 1}-${String(startYear).slice(2)}`

          // Find active properties from previous financial year
          const whereClause = propertyNo
            ? { propertyNo: propertyNo.toUpperCase(), financialYear: prevFy, isActive: true }
            : { financialYear: prevFy, isActive: true }

          const prevProperties = await tx.property.findMany({
            where: whereClause,
          })

          if (prevProperties.length === 0) {
            return { count: 0 }
          }

          let assessedCount = 0

          for (const prevProp of prevProperties) {
            // Check if property record for targetFy already exists
            const existing = await tx.property.findUnique({
              where: {
                propertyNo_financialYear: {
                  propertyNo: prevProp.propertyNo,
                  financialYear: targetFy,
                },
              },
            })

            if (existing) continue

            // Assessed baseline defaults to previous year values, or 1200/600
            const houseAssessed = Number(prevProp.houseTaxAssessed) || 1200
            const waterAssessed = Number(prevProp.waterTaxAssessed) || 600

            // Create new record for the target year
            await tx.property.create({
              data: {
                propertyNo: prevProp.propertyNo,
                financialYear: targetFy,
                ownerName: prevProp.ownerName,
                ownerNameEn: prevProp.ownerNameEn,
                mobileNumber: prevProp.mobileNumber,
                wardNo: prevProp.wardNo,
                address: prevProp.address,
                houseTaxAssessed: houseAssessed,
                waterTaxAssessed: waterAssessed,
                houseTaxPaid: 0,
                waterTaxPaid: 0,
                houseTaxDue: houseAssessed,
                waterTaxDue: waterAssessed,
                isActive: true,
              },
            })

            assessedCount++
          }

          return { count: assessedCount }
        })
      },
      () => {
        const res = mockDb.assessNewFinancialYear(targetFy, propertyNo)
        if (!res.success) throw new Error(res.message || 'Error in fallback rollover')
        return { count: res.assessedCount || 0 }
      }
    )

    return NextResponse.json({
      success: true,
      message: `${result.count} मालमत्तांचे नवीन आर्थिक वर्ष ${targetFy} साठी आकारणी यशस्वी झाली.`,
      data: result,
    })
  } catch (error: any) {
    console.error('Error in rollover assessment:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'वार्षिक आकारणी करताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}
