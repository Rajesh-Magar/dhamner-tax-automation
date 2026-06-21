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
    const wardParam = searchParams.get('ward')
    const yearParam = searchParams.get('year')

    const years = yearParam ? yearParam.split(',').map(y => y.trim()).filter(Boolean) : [getCurrentFinancialYear()]
    const wards = wardParam && wardParam !== 'all' ? wardParam.split(',').map(w => parseInt(w.trim(), 10)).filter(w => !isNaN(w)) : []

    const prismaQuery = async () => {
      // Build property filter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const propertyWhere: any = { isActive: true, financialYear: { in: years } }
      if (wards.length > 0) {
        propertyWhere.wardNo = { in: wards }
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

      // Group by propertyNo to calculate unique defaulters
      const propertyMap = new Map<string, {
        propertyNo: string
        ownerName: string
        ownerNameEn: string | null
        wardNo: number
        mobileNumber: string
        houseTaxDue: number
        waterTaxDue: number
        totalDue: number
      }>()

      for (const p of properties) {
        const houseTax = Number(p.houseTaxDue)
        const waterTax = Number(p.waterTaxDue)

        totalHouseTaxDue += houseTax
        totalWaterTaxDue += waterTax

        const existing = propertyMap.get(p.propertyNo)
        if (existing) {
          existing.houseTaxDue += houseTax
          existing.waterTaxDue += waterTax
          existing.totalDue += (houseTax + waterTax)
        } else {
          propertyMap.set(p.propertyNo, {
            propertyNo: p.propertyNo,
            ownerName: p.ownerName,
            ownerNameEn: p.ownerNameEn,
            wardNo: p.wardNo,
            mobileNumber: p.mobileNumber,
            houseTaxDue: houseTax,
            waterTaxDue: waterTax,
            totalDue: houseTax + waterTax,
          })
        }
      }

      const defaulters: Array<{
        propertyNo: string
        ownerName: string
        ownerNameEn: string | null
        wardNo: number
        mobileNumber: string
        totalDue: number
      }> = []

      for (const p of propertyMap.values()) {
        if (p.totalDue > 0) {
          defaulterCount++
          defaulters.push({
            propertyNo: p.propertyNo,
            ownerName: p.ownerName,
            ownerNameEn: p.ownerNameEn,
            wardNo: p.wardNo,
            mobileNumber: p.mobileNumber,
            totalDue: p.totalDue,
          })
        }
      }

      // Sort defaulters by highest dues
      defaulters.sort((a, b) => b.totalDue - a.totalDue)

      // ---- Transaction Summary (collections for the years) ----
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txnWhere: any = {
        financialYear: { in: years },
        status: 'SUCCESS',
      }

      // If ward filter, need to join through property
      if (wards.length > 0) {
        txnWhere.property = { 
          wardNo: { in: wards },
          financialYear: { in: years },
          isActive: true
        }
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
      const wardStats = await getWardWiseStats(years)

      // ---- Total Expected (dues + already collected) ----
      const totalExpected =
        totalHouseTaxDue +
        totalWaterTaxDue +
        totalCollected

      return NextResponse.json({
        success: true,
        data: {
          financialYear: yearParam || getCurrentFinancialYear(),
          overview: {
            totalProperties: propertyMap.size,
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
            paidUpCount: propertyMap.size - defaulterCount,
            list: defaulters.slice(0, 50),
          },
          wardStats,
        },
      })
    }

    const fallbackQuery = () => {
      const stats = mockDb.getAdminStats(wardParam || undefined, yearParam || undefined)
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
async function getWardWiseStats(years: string[]) {
  const wards = [1, 2, 3]
  const stats = []

  for (const wardNo of wards) {
    const properties = await prisma.property.findMany({
      where: { wardNo, isActive: true, financialYear: { in: years } },
      select: {
        propertyNo: true,
        houseTaxDue: true,
        waterTaxDue: true,
      },
    })

    // Group properties by propertyNo to count unique properties
    const propertyMap = new Map<string, number>()
    let totalDue = 0
    let propertiesWithDues = 0

    for (const p of properties) {
      const due =
        Number(p.houseTaxDue) +
        Number(p.waterTaxDue)
      totalDue += due
      propertyMap.set(p.propertyNo, (propertyMap.get(p.propertyNo) || 0) + due)
    }

    for (const due of propertyMap.values()) {
      if (due > 0) {
        propertiesWithDues++
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        property: { wardNo, financialYear: { in: years }, isActive: true },
        status: 'SUCCESS',
        financialYear: { in: years },
      },
      select: { amountPaid: true },
    })

    const totalCollected = transactions.reduce((sum, t) => sum + Number(t.amountPaid), 0)

    stats.push({
      wardNo,
      totalProperties: propertyMap.size,
      propertiesWithDues,
      paidUpProperties: propertyMap.size - propertiesWithDues,
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
