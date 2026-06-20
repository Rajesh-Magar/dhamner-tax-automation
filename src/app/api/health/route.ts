import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring.
 * Verifies database connectivity and returns system status.
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    const propertyCount = await prisma.property.count()
    const transactionCount = await prisma.transaction.count()

    return NextResponse.json({
      success: true,
      status: 'healthy',
      message: '🏘️ धामणेर कर व्यवस्थापन प्रणाली चालू आहे ✅',
      database: 'connected',
      stats: {
        properties: propertyCount,
        transactions: transactionCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
