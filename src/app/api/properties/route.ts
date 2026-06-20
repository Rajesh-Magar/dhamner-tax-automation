import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/properties
 * 
 * Search properties by property number or owner name.
 * Supports Marathi name search using ILIKE (case-insensitive).
 * 
 * Query Parameters:
 *   - search: Property number or owner name (partial match)
 *   - ward: Ward number filter (1, 2, or 3)
 *   - page: Page number (default: 1)
 *   - limit: Results per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const ward = searchParams.get('ward')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
    }

    // Ward filter
    if (ward && ['1', '2', '3'].includes(ward)) {
      where.wardNo = parseInt(ward, 10)
    }

    // Search filter — search by property number OR owner name (Marathi or English)
    if (search) {
      where.OR = [
        { propertyNo: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { ownerNameEn: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
      ]
    }

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { propertyNo: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          propertyNo: true,
          ownerName: true,
          ownerNameEn: true,
          mobileNumber: true,
          wardNo: true,
          address: true,
          houseTaxDue: true,
          waterTaxDue: true,
          sanitaryTaxDue: true,
          lightTaxDue: true,
        },
      }),
      prisma.property.count({ where }),
    ])

    // Calculate total_due for each property
    const propertiesWithTotal = properties.map((p) => ({
      ...p,
      houseTaxDue: Number(p.houseTaxDue),
      waterTaxDue: Number(p.waterTaxDue),
      sanitaryTaxDue: Number(p.sanitaryTaxDue),
      lightTaxDue: Number(p.lightTaxDue),
      totalDue:
        Number(p.houseTaxDue) +
        Number(p.waterTaxDue) +
        Number(p.sanitaryTaxDue) +
        Number(p.lightTaxDue),
    }))

    return NextResponse.json({
      success: true,
      data: propertiesWithTotal,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { success: false, message: 'मालमत्ता शोधताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' },
      { status: 500 }
    )
  }
}
