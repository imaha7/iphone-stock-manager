import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query?: { startDate?: string; endDate?: string }) {
    const purchaseDateFilter: Prisma.PurchaseWhereInput = {};
    const saleDateFilter: Prisma.SaleWhereInput = {};
    const costDateFilter: Prisma.AdditionalCostWhereInput = {};

    if (query?.startDate || query?.endDate) {
      const dateRange: { gte?: Date; lte?: Date } = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        dateRange.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        dateRange.lte = end;
      }

      purchaseDateFilter.purchaseDate = dateRange;
      saleDateFilter.saleDate = { ...dateRange };
      costDateFilter.date = { ...dateRange };
    }

    const [
      stockAgg,
      totalPurchases,
      totalSales,
      purchaseAgg,
      salesAgg,
      costsAgg,
      soldUnitsAgg,
      recentPurchases,
      recentSales,
    ] = await Promise.all([
      // Total available stock quantity (always current, sum of available quantities)
      this.prisma.iPhoneUnit.aggregate({
        where: { status: 'available' },
        _sum: { quantity: true },
      }),

      // Total purchases in period
      this.prisma.purchase.count({
        where: purchaseDateFilter,
      }),

      // Total sales in period
      this.prisma.sale.count({
        where: saleDateFilter,
      }),

      // Total purchase records in period
      this.prisma.purchase.findMany({
        where: purchaseDateFilter,
        include: { iphoneUnit: true },
      }),

      // Total sales amount in period
      this.prisma.sale.aggregate({
        where: saleDateFilter,
        _sum: { sellingPrice: true },
      }),

      // Total additional costs in period
      this.prisma.additionalCost.aggregate({
        where: costDateFilter,
        _sum: { amount: true },
      }),

      // For gross profit: get purchase prices of sold units in the period
      this.prisma.sale.findMany({
        where: saleDateFilter,
        include: { iphoneUnit: true },
      }),

      // Recent 5 purchases
      this.prisma.purchase.findMany({
        include: { iphoneUnit: true },
        orderBy: { purchaseDate: 'desc' },
        take: 5,
      }),

      // Recent 5 sales
      this.prisma.sale.findMany({
        include: {
          iphoneUnit: true,
          additionalCosts: true,
        },
        orderBy: { saleDate: 'desc' },
        take: 5,
      }),
    ]);

    const totalStock = stockAgg._sum.quantity ?? 0;

    const totalPurchaseAmount = purchaseAgg.reduce(
      (sum, p) =>
        sum + p.iphoneUnit.purchasePrice * (p.quantity ?? p.iphoneUnit.quantity ?? 1),
      0,
    );

    const totalSalesAmount = salesAgg._sum.sellingPrice ?? 0;
    const totalAdditionalCosts = costsAgg._sum.amount ?? 0;

    // Gross profit: sum of (sellingPrice - purchasePrice * quantity) for sold units
    const grossProfit = soldUnitsAgg.reduce(
      (sum, sale) =>
        sum +
        (sale.sellingPrice -
          sale.iphoneUnit.purchasePrice * (sale.quantity ?? 1)),
      0,
    );

    const netProfit = grossProfit - totalAdditionalCosts;

    return {
      totalStock,
      totalPurchases,
      totalSales,
      totalPurchaseAmount,
      totalSalesAmount,
      totalAdditionalCosts,
      grossProfit,
      netProfit,
      recentPurchases,
      recentSales,
    };
  }

  async getProfitPerUnit(query?: { startDate?: string; endDate?: string }) {
    const saleDateFilter: Prisma.SaleWhereInput = {};

    if (query?.startDate || query?.endDate) {
      const dateRange: { gte?: Date; lte?: Date } = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        dateRange.gte = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        dateRange.lte = end;
      }
      saleDateFilter.saleDate = dateRange;
    }

    const sales = await this.prisma.sale.findMany({
      where: saleDateFilter,
      include: {
        iphoneUnit: true,
        additionalCosts: true,
      },
      orderBy: { saleDate: 'desc' },
    });

    return sales.map((sale) => {
      const totalAdditionalCosts = sale.additionalCosts.reduce(
        (sum, cost) => sum + cost.amount,
        0,
      );
      const qty = sale.quantity ?? sale.iphoneUnit.quantity ?? 1;
      const totalPurchasePrice = sale.iphoneUnit.purchasePrice * qty;
      const grossProfit = sale.sellingPrice - totalPurchasePrice;
      const netProfit = grossProfit - totalAdditionalCosts;

      return {
        id: sale.id,
        saleDate: sale.saleDate,
        model: sale.iphoneUnit.model,
        capacity: sale.iphoneUnit.capacity,
        color: sale.iphoneUnit.color,
        imei: sale.iphoneUnit.imei,
        quantity: qty,
        purchasePrice: sale.iphoneUnit.purchasePrice,
        totalPurchasePrice,
        sellingPrice: sale.sellingPrice,
        additionalCosts: sale.additionalCosts,
        totalAdditionalCosts,
        grossProfit,
        netProfit,
      };
    });
  }
}
