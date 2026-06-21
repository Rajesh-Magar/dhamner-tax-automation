import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runWithFallback, mockDb } from '@/lib/dbFallback'

/**
 * GET /api/admin/stats
 * 
 * Dashboard statistics for the admin panel.
 * Provides ward-wise tax collection data, defaulter counts, and summaries.
 * 
 * Query Parameters:
 *   - ward: Filter by ward number (1, 2, 3, or 'all' for all wards)
 *   - year: Financial year filter (e.g., "2025-26")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ward = searchParams.get('ward')
    const year = searchParams.get('year') || getCurrentFinancialYear()

    const prismaQuery = async () => {
      // Build property filter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const propertyWhere: any = { isActive: true, financialYear: year }
      if (ward && ward !== 'all' && ['1', '2', '3'].includes(ward)) {
        propertyWhere.wardNo = parseInt(ward, 10)
      }

      // ---- Property & Tax Summary ----
      const properties = await prisma.property.findMany({
        where: propertyWhere,
        select: {
          propertyNo: true,
          ownerName: true,
          ownerNameEn: true,
          wardNo: true,
          mobileNumber: true,
          houseTaxDue: true,
          waterTaxDue: true,
        },
      })

      // Calculate totals
      let totalHouseTaxDue = 0
      let totalWaterTaxDue = 0
      let defaulterCount = 0
      const defaulters: Array<{
        propertyNo: string
        ownerName: string
        ownerNameEn: string | null
        wardNo: number
        mobileNumber: string
        totalDue: number
      }> = []

      for (const p of properties) {
        const houseTax = Number(p.houseTaxDue)
        const waterTax = Number(p.waterTaxDue)
        const totalDue = houseTax + waterTax

        totalHouseTaxDue += houseTax
        totalWaterTaxDue += waterTax

        if (totalDue > 0) {
          defaulterCount++
          defaulters.push({
            propertyNo: p.propertyNo,
            ownerName: p.ownerName,
            ownerNameEn: p.ownerNameEn,
            wardNo: p.wardNo,
            mobileNumber: p.mobileNumber,
            totalDue,
          })
        }
      }

      // Sort defaulters by highest dues
      defaulters.sort((a, b) => b.totalDue - a.totalDue)

      // ---- Transaction Summary (collections for the year) ----
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txnWhere: any = {
        financialYear: year,
        status: 'SUCCESS',
      }

      // If ward filter, need to join through property
      if (ward && ward !== 'all' && ['1', '2', '3'].includes(ward)) {
        txnWhere.property = { wardNo: parseInt(ward, 10), financialYear: year }
      }

      const transactions = await prisma.transaction.findMany({
        where: txnWhere,
        select: {
          amountPaid: true,
          taxType: true,
          paymentMethod: true,
        },
      })

      let totalCollected = 0
      let houseTaxCollected = 0
      let waterTaxCollected = 0
      let onlinePayments = 0
      let cashPayments = 0
      let upiPayments = 0

      for (const t of transactions) {
        const amount = Number(t.amountPaid)
        totalCollected += amount

        switch (t.taxType) {
          case 'house_tax':
            houseTaxCollected += amount
            break
          case 'water_tax':
            waterTaxCollected += amount
            break
        }

        switch (t.paymentMethod) {
          case 'ONLINE':
            onlinePayments++
            break
          case 'CASH':
            cashPayments++
            break
          case 'UPI':
            upiPayments++
            break
        }
      }

      // ---- Ward-wise Breakdown ----
      const wardStats = await getWardWiseStats(year)

      // ---- Total Expected (dues + already collected) ----
      const totalExpected =
        totalHouseTaxDue +
        totalWaterTaxDue +
        totalCollected

      return NextResponse.json({
        success: true,
        data: {
          financialYear: year,
          overview: {
            totalProperties: properties.length,
            totalExpected: Math.round(totalExpected * 100) / 100,
            totalCollected: Math.round(totalCollected * 100) / 100,
            totalPending:
              Math.round(
                (totalHouseTaxDue + totalWaterTaxDue) * 100
              ) / 100,
            collectionPercentage:
              totalExpected > 0
                ? Math.round((totalCollected / totalExpected) * 10000) / 100
                : 0,
          },
          taxBreakdown: {
            houseTax: {
              collected: Math.round(houseTaxCollected * 100) / 100,
              pending: Math.round(totalHouseTaxDue * 100) / 100,
            },
            waterTax: {
              collected: Math.round(waterTaxCollected * 100) / 100,
              pending: Math.round(totalWaterTaxDue * 100) / 100,
            },
          },
          paymentMethods: {
            online: onlinePayments,
            cash: cashPayments,
            upi: upiPayments,
            totalTransactions: transactions.length,
          },
          defaulters: {
            count: defaulterCount,
            paidUpCount: properties.length - defaulterCount,
            list: defaulters.slice(0, 50),
          },
          wardStats,
        },
      })
    }

    const fallbackQuery = () => {
      const stats = mockDb.getAdminStats(ward || undefined, year)
      return NextResponse.json({
        success: true,
        data: stats,
      })
    }

    return await runWithFallback(prismaQuery, fallbackQuery)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, message: 'डॅशबोर्ड आकडेवारी मिळवताना त्रुटी आली.' },
      { status: 500 }
    )
  }
}

/**
 * Get ward-wise statistics for all 3 wards
 */
async function getWardWiseStats(year: string) {
  const wards = [1, 2, 3]
  const stats = []

  for (const wardNo of wards) {
    const properties = await prisma.property.findMany({
      where: { wardNo, isActive: true, financialYear: year },
      select: {
        houseTaxDue: true,
        waterTaxDue: true,
      },
    })

    let totalDue = 0
    let propertiesWithDues = 0

    for (const p of properties) {
      const due =
        Number(p.houseTaxDue) +
        Number(p.waterTaxDue)
      totalDue += due
      if (due > 0) propertiesWithDues++
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        property: { wardNo, financialYear: year },
        status: 'SUCCESS',
        financialYear: year,
      },
      select: { amountPaid: true },
    })

    const totalCollected = transactions.reduce((sum, t) => sum + Number(t.amountPaid), 0)

    stats.push({
      wardNo,
      totalProperties: properties.length,
      propertiesWithDues,
      paidUpProperties: properties.length - propertiesWithDues,
      totalDue: Math.round(totalDue * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
    })
  }

  return stats
}

/**
 * Get current financial year (April to March)
 */
function getCurrentFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth() // 0-indexed, so March = 2
  if (month >= 3) {
    // April onwards
    return `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
  } else {
    return `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`
  }
}
