import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummary(query?: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        totalStock: number;
        totalPurchases: number;
        totalSales: number;
        totalPurchaseAmount: number;
        totalSalesAmount: number;
        totalAdditionalCosts: number;
        grossProfit: number;
        netProfit: number;
        recentPurchases: ({
            iphoneUnit: {
                createdAt: Date;
                updatedAt: Date;
                id: number;
                model: string;
                capacity: string;
                color: string;
                imei: string;
                purchasePrice: number;
                sellingPrice: number | null;
                quantity: number;
                status: string;
            };
        } & {
            createdAt: Date;
            id: number;
            quantity: number;
            iphoneUnitId: number;
            supplier: string | null;
            purchaseDate: Date;
            notes: string | null;
        })[];
        recentSales: ({
            additionalCosts: {
                createdAt: Date;
                id: number;
                saleId: number | null;
                description: string;
                amount: number;
                category: string;
                date: Date;
            }[];
            iphoneUnit: {
                createdAt: Date;
                updatedAt: Date;
                id: number;
                model: string;
                capacity: string;
                color: string;
                imei: string;
                purchasePrice: number;
                sellingPrice: number | null;
                quantity: number;
                status: string;
            };
        } & {
            createdAt: Date;
            id: number;
            sellingPrice: number;
            quantity: number;
            iphoneUnitId: number;
            notes: string | null;
            buyerName: string | null;
            buyerPhone: string | null;
            saleDate: Date;
        })[];
    }>;
    getProfitPerUnit(query?: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        id: number;
        saleDate: Date;
        model: string;
        capacity: string;
        color: string;
        imei: string;
        quantity: number;
        purchasePrice: number;
        totalPurchasePrice: number;
        sellingPrice: number;
        additionalCosts: {
            createdAt: Date;
            id: number;
            saleId: number | null;
            description: string;
            amount: number;
            category: string;
            date: Date;
        }[];
        totalAdditionalCosts: number;
        grossProfit: number;
        netProfit: number;
    }[]>;
}
