"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(query) {
        const purchaseDateFilter = {};
        const saleDateFilter = {};
        const costDateFilter = {};
        if (query?.startDate || query?.endDate) {
            const dateRange = {};
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
        const [stockAgg, totalPurchases, totalSales, purchaseAgg, salesAgg, costsAgg, soldUnitsAgg, recentPurchases, recentSales,] = await Promise.all([
            this.prisma.iPhoneUnit.aggregate({
                where: { status: 'available' },
                _sum: { quantity: true },
            }),
            this.prisma.purchase.count({
                where: purchaseDateFilter,
            }),
            this.prisma.sale.count({
                where: saleDateFilter,
            }),
            this.prisma.purchase.findMany({
                where: purchaseDateFilter,
                include: { iphoneUnit: true },
            }),
            this.prisma.sale.aggregate({
                where: saleDateFilter,
                _sum: { sellingPrice: true },
            }),
            this.prisma.additionalCost.aggregate({
                where: costDateFilter,
                _sum: { amount: true },
            }),
            this.prisma.sale.findMany({
                where: saleDateFilter,
                include: { iphoneUnit: true },
            }),
            this.prisma.purchase.findMany({
                include: { iphoneUnit: true },
                orderBy: { purchaseDate: 'desc' },
                take: 5,
            }),
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
        const totalPurchaseAmount = purchaseAgg.reduce((sum, p) => sum + p.iphoneUnit.purchasePrice * (p.quantity ?? p.iphoneUnit.quantity ?? 1), 0);
        const totalSalesAmount = salesAgg._sum.sellingPrice ?? 0;
        const totalAdditionalCosts = costsAgg._sum.amount ?? 0;
        const grossProfit = soldUnitsAgg.reduce((sum, sale) => sum +
            (sale.sellingPrice -
                sale.iphoneUnit.purchasePrice * (sale.quantity ?? 1)), 0);
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
    async getProfitPerUnit(query) {
        const saleDateFilter = {};
        if (query?.startDate || query?.endDate) {
            const dateRange = {};
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
            const totalAdditionalCosts = sale.additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map