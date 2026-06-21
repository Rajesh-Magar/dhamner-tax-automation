import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runWithFallback, mockDb } from '@/lib/dbFallback'

// Simple admin authentication check via API key
function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  return adminKey === process.env.ADMIN_API_KEY
}

/**
 * GET /api/admin/properties
 * 
 * List all properties (for admin panel).
 * Requires admin authentication via x-admin-key header.
 */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized — अधिकृत नाही' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const wardParam = searchParams.get('ward')
    const showDefaultersOnly = searchParams.get('defaulters') === 'true'
    const yearParam = searchParams.get('year')

    const years = yearParam ? yearParam.split(',').map(y => y.trim()).filter(Boolean) : ['2025-26']
    let wards: number[] = []
    if (wardParam && wardParam !== 'all') {
      wards = wardParam.split(',').map(w => parseInt(w.trim(), 10)).filter(w => !isNaN(w))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true, financialYear: { in: years } }

    if (wards.length > 0) {
      where.wardNo = { in: wards }
    }

    const properties = await runWithFallback(
      () => prisma.property.findMany({
        where,
        orderBy: { propertyNo: 'asc' },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      }),
      () => {
        const res = mockDb.searchProperties(undefined, wardParam || undefined, 0, 1000, yearParam || undefined);
        return res.properties.map(p => ({
          ...p,
          _count: {
            transactions: mockDb.transactions.filter(t => t.propertyNo === p.propertyNo && years.includes(t.financialYear) && t.status === 'SUCCESS').length
          }
        })) as any;
      }
    )

    // Consolidate properties by propertyNo
    const propertyMap = new Map<string, {
      propertyNo: string
      ownerName: string
      ownerNameEn: string | null
      wardNo: number
      mobileNumber: string
      address: string | null
      houseTaxDue: number
      waterTaxDue: number
      transactionCount: number
    }>()

    for (const p of properties) {
      const houseTax = Number(p.houseTaxDue)
      const waterTax = Number(p.waterTaxDue)
      const txnsCount = p._count?.transactions || p.transactionCount || 0

      const existing = propertyMap.get(p.propertyNo)
      if (existing) {
        existing.houseTaxDue += houseTax
        existing.waterTaxDue += waterTax
        existing.transactionCount += txnsCount
      } else {
        propertyMap.set(p.propertyNo, {
          propertyNo: p.propertyNo,
          ownerName: p.ownerName,
          ownerNameEn: p.ownerNameEn,
          wardNo: p.wardNo,
          mobileNumber: p.mobileNumber,
          address: p.address,
          houseTaxDue: houseTax,
          waterTaxDue: waterTax,
          transactionCount: txnsCount
        })
      }
    }

    let result = Array.from(propertyMap.values()).map((p: any) => ({
      ...p,
      houseTaxDue: p.houseTaxDue,
      waterTaxDue: p.waterTaxDue,
      totalDue: p.houseTaxDue + p.waterTaxDue,
      transactionCount: p.transactionCount,
    }))

    if (showDefaultersOnly) {
      result = result.filter((p: any) => p.totalDue > 0)
    }

    // Sort by propertyNo asc
    result.sort((a, b) => a.propertyNo.localeCompare(b.propertyNo))

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
    })
  } catch (error) {
    console.error('Error fetching admin properties:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/properties
 * 
 * Create a new property (admin only).
 * Requires admin authentication via x-admin-key header.
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

    const {
      propertyNo,
      ownerName,
      ownerNameEn,
      mobileNumber,
      wardNo,
      address,
      houseTaxDue,
      waterTaxDue,
      financialYear,
    } = body

    // Validate required fields
    if (!propertyNo || !ownerName || !mobileNumber || !wardNo) {
      return NextResponse.json(
        {
          success: false,
          message:
            'कृपया आवश्यक माहिती भरा: मालमत्ता क्रमांक, मालकाचे नाव, मोबाईल, प्रभाग क्रमांक',
        },
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
    const fy = financialYear || currentFy

    // Check if property number already exists for this financial year
    const existing = await runWithFallback(
      () => prisma.property.findUnique({
        where: {
          propertyNo_financialYear: {
            propertyNo: propertyNo.toUpperCase(),
            financialYear: fy,
          },
        },
      }),
      () => {
        return mockDb.properties.find(
          (p) =>
            p.propertyNo.toUpperCase() === propertyNo.toUpperCase() &&
            p.financialYear === fy
        ) as any;
      }
    )

    let property;
    const houseDue = parseFloat(houseTaxDue || '0')
    const waterDue = parseFloat(waterTaxDue || '0')

    if (existing) {
      const oldHouseDue = Number(existing.houseTaxDue)
      const oldWaterDue = Number(existing.waterTaxDue)
      const oldHouseAssessed = Number(existing.houseTaxAssessed)
      const oldWaterAssessed = Number(existing.waterTaxAssessed)

      const diffHouse = houseDue - oldHouseDue
      const diffWater = waterDue - oldWaterDue

      property = await runWithFallback(
        () => prisma.property.update({
          where: {
            propertyNo_financialYear: {
              propertyNo: propertyNo.toUpperCase(),
              financialYear: fy,
            },
          },
          data: {
            ownerName,
            ownerNameEn: ownerNameEn || null,
            mobileNumber,
            wardNo: parseInt(wardNo, 10),
            address: address || null,
            houseTaxDue: houseDue,
            waterTaxDue: waterDue,
            houseTaxAssessed: oldHouseAssessed + diffHouse,
            waterTaxAssessed: oldWaterAssessed + diffWater,
            isActive: true,
          },
        }),
        () => {
          const idx = mockDb.properties.findIndex(
            (p) =>
              p.propertyNo.toUpperCase() === propertyNo.toUpperCase() &&
              p.financialYear === fy
          )
          if (idx === -1) throw new Error("Property not found");

          const p = mockDb.properties[idx]

          p.houseTaxDue = houseDue
          p.houseTaxAssessed += diffHouse
          p.waterTaxDue = waterDue
          p.waterTaxAssessed += diffWater

          p.ownerName = ownerName
          p.ownerNameEn = ownerNameEn || null
          p.mobileNumber = mobileNumber
          p.wardNo = parseInt(wardNo, 10)
          p.address = address || null
          p.isActive = true
          p.updatedAt = new Date()

          return p as any;
        }
      )
    } else {
      property = await runWithFallback(
        () => prisma.property.create({
          data: {
            propertyNo: propertyNo.toUpperCase(),
            financialYear: fy,
            ownerName,
            ownerNameEn: ownerNameEn || null,
            mobileNumber,
            wardNo: parseInt(wardNo, 10),
            address: address || null,
            houseTaxAssessed: houseDue,
            waterTaxAssessed: waterDue,
            houseTaxPaid: 0,
            waterTaxPaid: 0,
            houseTaxDue: houseDue,
            waterTaxDue: waterDue,
          },
        }),
        () => {
          const res = mockDb.createProperty({
            propertyNo: propertyNo.toUpperCase(),
            ownerName,
            ownerNameEn,
            mobileNumber,
            wardNo: parseInt(wardNo, 10),
            address,
            houseTaxDue: houseDue,
            waterTaxDue: waterDue,
            financialYear: fy,
          });
          if (!res.success) throw new Error(res.message);
          return res.data as any;
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: existing
        ? `मालमत्ता '${property.propertyNo}' यशस्वीरित्या अपडेट केली.`
        : `मालमत्ता '${property.propertyNo}' यशस्वीरित्या जोडली.`,
      data: property,
    })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { success: false, message: 'मालमत्ता जोडताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/properties
 * 
 * Update an existing property (admin only).
 * Requires propertyNo in the request body.
 */
export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized — अधिकृत नाही' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { propertyNo, financialYear, ...updateData } = body

    if (!propertyNo) {
      return NextResponse.json(
        { success: false, message: 'मालमत्ता क्रमांक आवश्यक आहे.' },
        { status: 400 }
      )
    }

    // Determine financial year (April to March)
    const now = new Date()
    const month = now.getMonth() // 0-indexed
    const currentFy =
      month >= 3 // April onwards
        ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
        : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`
    const fy = financialYear || currentFy

    // Build update object (only include provided fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (updateData.ownerName) data.ownerName = updateData.ownerName
    if (updateData.ownerNameEn !== undefined) data.ownerNameEn = updateData.ownerNameEn
    if (updateData.mobileNumber) data.mobileNumber = updateData.mobileNumber
    if (updateData.wardNo) data.wardNo = parseInt(updateData.wardNo, 10)
    if (updateData.address !== undefined) data.address = updateData.address
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive

    const property = await runWithFallback(
      () => prisma.$transaction(async (tx) => {
        // Fetch existing property to check dues and calculate diff
        const existingProperty = await tx.property.findUnique({
          where: {
            propertyNo_financialYear: {
              propertyNo: propertyNo.toUpperCase(),
              financialYear: fy,
            },
          },
        })

        if (!existingProperty) {
          throw new Error(`मालमत्ता क्रमांक '${propertyNo}' आणि आर्थिक वर्ष '${fy}' साठी रेकॉर्ड सापडला नाही.`)
        }

        const oldHouseDue = Number(existingProperty.houseTaxDue)
        const oldWaterDue = Number(existingProperty.waterTaxDue)
        const oldHouseAssessed = Number(existingProperty.houseTaxAssessed)
        const oldWaterAssessed = Number(existingProperty.waterTaxAssessed)

        if (updateData.houseTaxDue !== undefined) {
          const newDue = parseFloat(updateData.houseTaxDue)
          const diff = newDue - oldHouseDue
          data.houseTaxDue = newDue
          data.houseTaxAssessed = oldHouseAssessed + diff
        }
        if (updateData.waterTaxDue !== undefined) {
          const newDue = parseFloat(updateData.waterTaxDue)
          const diff = newDue - oldWaterDue
          data.waterTaxDue = newDue
          data.waterTaxAssessed = oldWaterAssessed + diff
        }

        // Update the property details
        const prop = await tx.property.update({
          where: {
            propertyNo_financialYear: {
              propertyNo: propertyNo.toUpperCase(),
              financialYear: fy,
            },
          },
          data,
        })

        return prop
      }),
      () => {
        const idx = mockDb.properties.findIndex(
          (p) =>
            p.propertyNo.toUpperCase() === propertyNo.toUpperCase() &&
            p.financialYear === fy
        )
        if (idx === -1) throw new Error("Property not found");

        const p = mockDb.properties[idx]

        if (updateData.houseTaxDue !== undefined) {
          const newDue = parseFloat(updateData.houseTaxDue)
          const diff = newDue - p.houseTaxDue
          p.houseTaxDue = newDue
          p.houseTaxAssessed += diff
        }
        if (updateData.waterTaxDue !== undefined) {
          const newDue = parseFloat(updateData.waterTaxDue)
          const diff = newDue - p.waterTaxDue
          p.waterTaxDue = newDue
          p.waterTaxAssessed += diff
        }

        if (updateData.ownerName) p.ownerName = updateData.ownerName
        if (updateData.ownerNameEn !== undefined) p.ownerNameEn = updateData.ownerNameEn
        if (updateData.mobileNumber) p.mobileNumber = updateData.mobileNumber
        if (updateData.wardNo) p.wardNo = parseInt(updateData.wardNo, 10)
        if (updateData.address !== undefined) p.address = updateData.address
        if (updateData.isActive !== undefined) p.isActive = updateData.isActive

        p.updatedAt = new Date()
        return p as any
      }
    )

    return NextResponse.json({
      success: true,
      message: `मालमत्ता '${propertyNo}' यशस्वीरित्या अपडेट केली.`,
      data: property,
    })
  } catch (error: any) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'मालमत्ता अपडेट करताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}
