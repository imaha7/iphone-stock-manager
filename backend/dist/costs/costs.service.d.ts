import { PrismaService } from '../prisma/prisma.service';
import { CreateCostDto } from './dto/create-cost.dto';
export declare class CostsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(startDate?: string, endDate?: string): Promise<({
        sale: {
            id: number;
            createdAt: Date;
            iphoneUnitId: number;
            quantity: number;
            sellingPrice: number;
            buyerName: string | null;
            buyerPhone: string | null;
            saleDate: Date;
            notes: string | null;
        } | null;
    } & {
        id: number;
        saleId: number | null;
        description: string;
        amount: number;
        category: string;
        date: Date;
        createdAt: Date;
    })[]>;
    findOne(id: number): Promise<{
        sale: {
            id: number;
            createdAt: Date;
            iphoneUnitId: number;
            quantity: number;
            sellingPrice: number;
            buyerName: string | null;
            buyerPhone: string | null;
            saleDate: Date;
            notes: string | null;
        } | null;
    } & {
        id: number;
        saleId: number | null;
        description: string;
        amount: number;
        category: string;
        date: Date;
        createdAt: Date;
    }>;
    create(dto: CreateCostDto): Promise<{
        sale: {
            id: number;
            createdAt: Date;
            iphoneUnitId: number;
            quantity: number;
            sellingPrice: number;
            buyerName: string | null;
            buyerPhone: string | null;
            saleDate: Date;
            notes: string | null;
        } | null;
    } & {
        id: number;
        saleId: number | null;
        description: string;
        amount: number;
        category: string;
        date: Date;
        createdAt: Date;
    }>;
    update(id: number, dto: Partial<CreateCostDto>): Promise<{
        sale: {
            id: number;
            createdAt: Date;
            iphoneUnitId: number;
            quantity: number;
            sellingPrice: number;
            buyerName: string | null;
            buyerPhone: string | null;
            saleDate: Date;
            notes: string | null;
        } | null;
    } & {
        id: number;
        saleId: number | null;
        description: string;
        amount: number;
        category: string;
        date: Date;
        createdAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        saleId: number | null;
        description: string;
        amount: number;
        category: string;
        date: Date;
        createdAt: Date;
    }>;
}
