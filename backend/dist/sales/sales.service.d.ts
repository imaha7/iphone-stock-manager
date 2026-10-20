import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query?: {
        startDate?: string;
        endDate?: string;
    }): Promise<({
        iphoneUnit: {
            id: number;
            quantity: number;
            sellingPrice: number | null;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            status: string;
            updatedAt: Date;
        };
        additionalCosts: {
            id: number;
            createdAt: Date;
            saleId: number | null;
            description: string;
            amount: number;
            category: string;
            date: Date;
        }[];
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        sellingPrice: number;
        buyerName: string | null;
        buyerPhone: string | null;
        saleDate: Date;
        notes: string | null;
        createdAt: Date;
    })[]>;
    findOne(id: number): Promise<{
        iphoneUnit: {
            id: number;
            quantity: number;
            sellingPrice: number | null;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            status: string;
            updatedAt: Date;
        };
        additionalCosts: {
            id: number;
            createdAt: Date;
            saleId: number | null;
            description: string;
            amount: number;
            category: string;
            date: Date;
        }[];
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        sellingPrice: number;
        buyerName: string | null;
        buyerPhone: string | null;
        saleDate: Date;
        notes: string | null;
        createdAt: Date;
    }>;
    create(dto: CreateSaleDto): Promise<({
        iphoneUnit: {
            id: number;
            quantity: number;
            sellingPrice: number | null;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            status: string;
            updatedAt: Date;
        };
        additionalCosts: {
            id: number;
            createdAt: Date;
            saleId: number | null;
            description: string;
            amount: number;
            category: string;
            date: Date;
        }[];
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        sellingPrice: number;
        buyerName: string | null;
        buyerPhone: string | null;
        saleDate: Date;
        notes: string | null;
        createdAt: Date;
    }) | null>;
    remove(id: number): Promise<{
        iphoneUnit: {
            id: number;
            quantity: number;
            sellingPrice: number | null;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            status: string;
            updatedAt: Date;
        };
        additionalCosts: {
            id: number;
            createdAt: Date;
            saleId: number | null;
            description: string;
            amount: number;
            category: string;
            date: Date;
        }[];
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        sellingPrice: number;
        buyerName: string | null;
        buyerPhone: string | null;
        saleDate: Date;
        notes: string | null;
        createdAt: Date;
    }>;
}
