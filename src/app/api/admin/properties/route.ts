import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const ward = searchParams.get('ward')
    const showDefaultersOnly = searchParams.get('defaulters') === 'true'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true }

    if (ward && ['1', '2', '3'].includes(ward)) {
      where.wardNo = parseInt(ward, 10)
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { propertyNo: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })

    let result = properties.map((p) => ({
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
      transactionCount: p._count.transactions,
    }))

    if (showDefaultersOnly) {
      result = result.filter((p) => p.totalDue > 0)
    }

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
      sanitaryTaxDue,
      lightTaxDue,
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

    // Check if property number already exists
    const existing = await prisma.property.findUnique({
      where: { propertyNo: propertyNo.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: `मालमत्ता क्रमांक '${propertyNo}' आधीपासून अस्तित्वात आहे.` },
        { status: 409 }
      )
    }

    const property = await prisma.property.create({
      data: {
        propertyNo: propertyNo.toUpperCase(),
        ownerName,
        ownerNameEn: ownerNameEn || null,
        mobileNumber,
        wardNo: parseInt(wardNo, 10),
        address: address || null,
        houseTaxDue: parseFloat(houseTaxDue || '0'),
        waterTaxDue: parseFloat(waterTaxDue || '0'),
        sanitaryTaxDue: parseFloat(sanitaryTaxDue || '0'),
        lightTaxDue: parseFloat(lightTaxDue || '0'),
      },
    })

    return NextResponse.json({
      success: true,
      message: `मालमत्ता '${property.propertyNo}' यशस्वीरित्या जोडली.`,
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
    const { propertyNo, ...updateData } = body

    if (!propertyNo) {
      return NextResponse.json(
        { success: false, message: 'मालमत्ता क्रमांक आवश्यक आहे.' },
        { status: 400 }
      )
    }

    // Build update object (only include provided fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (updateData.ownerName) data.ownerName = updateData.ownerName
    if (updateData.ownerNameEn !== undefined) data.ownerNameEn = updateData.ownerNameEn
    if (updateData.mobileNumber) data.mobileNumber = updateData.mobileNumber
    if (updateData.wardNo) data.wardNo = parseInt(updateData.wardNo, 10)
    if (updateData.address !== undefined) data.address = updateData.address
    if (updateData.houseTaxDue !== undefined)
      data.houseTaxDue = parseFloat(updateData.houseTaxDue)
    if (updateData.waterTaxDue !== undefined)
      data.waterTaxDue = parseFloat(updateData.waterTaxDue)
    if (updateData.sanitaryTaxDue !== undefined)
      data.sanitaryTaxDue = parseFloat(updateData.sanitaryTaxDue)
    if (updateData.lightTaxDue !== undefined)
      data.lightTaxDue = parseFloat(updateData.lightTaxDue)
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive

    const property = await prisma.property.update({
      where: { propertyNo: propertyNo.toUpperCase() },
      data,
    })

    return NextResponse.json({
      success: true,
      message: `मालमत्ता '${propertyNo}' यशस्वीरित्या अपडेट केली.`,
      data: property,
    })
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { success: false, message: 'मालमत्ता अपडेट करताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}
