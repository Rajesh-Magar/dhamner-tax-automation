import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runWithFallback, mockDb } from '@/lib/dbFallback'

/**
 * GET /api/properties/[propertyNo]/notifications
 * Retrieve notification history for a specific property.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyNo: string }> }
) {
  try {
    const { propertyNo } = await params

    const logs = await runWithFallback(
      () => (prisma as any).communicationLog.findMany({
        where: { propertyNo: propertyNo.toUpperCase() },
        orderBy: { sentAt: 'desc' },
      }),
      () => mockDb.getCommunicationLogs(propertyNo)
    )

    return NextResponse.json({
      success: true,
      data: logs || [],
    })
  } catch (error) {
    console.error('Error fetching notification logs:', error)
    return NextResponse.json(
      { success: false, message: 'नोटीस इतिहास मिळवताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/properties/[propertyNo]/notifications
 * Record a new notification log.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyNo: string }> }
) {
  try {
    const { propertyNo } = await params
    const body = await request.json()
    const { type, recipient, message, sentBy } = body

    if (!type || !recipient || !message) {
      return NextResponse.json(
        { success: false, message: 'कृपया सर्व आवश्यक माहिती भरा (type, recipient, message).' },
        { status: 400 }
      )
    }

    const newLog = await runWithFallback(
      () => (prisma as any).communicationLog.create({
        data: {
          propertyNo: propertyNo.toUpperCase(),
          type: type.toUpperCase(),
          recipient,
          message,
          sentBy: sentBy || 'ग्रामसेवक',
        },
      }),
      () => mockDb.recordCommunicationLog({
        propertyNo: propertyNo.toUpperCase(),
        type: type.toUpperCase(),
        recipient,
        message,
        sentBy: sentBy || 'ग्रामसेवक',
      })
    )

    return NextResponse.json({
      success: true,
      message: 'नोटीस रेकॉर्ड यशस्वीरित्या जतन केला.',
      data: newLog,
    })
  } catch (error) {
    console.error('Error recording notification log:', error)
    return NextResponse.json(
      { success: false, message: 'नोटीस रेकॉर्ड जतन करताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}
