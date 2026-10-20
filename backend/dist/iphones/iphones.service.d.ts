import { PrismaService } from '../prisma/prisma.service';
import { CreateIphoneDto } from './dto/create-iphone.dto';
import { UpdateIphoneDto } from './dto/update-iphone.dto';
export declare class IphonesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query?: {
        status?: string;
        search?: string;
    }): Promise<{
        id: number;
        model: string;
        capacity: string;
        color: string;
        imei: string;
        purchasePrice: number;
        sellingPrice: number | null;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        purchase: {
            id: number;
            quantity: number;
            createdAt: Date;
            iphoneUnitId: number;
            supplier: string | null;
            purchaseDate: Date;
            notes: string | null;
        } | null;
        sales: ({
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
            sellingPrice: number;
            quantity: number;
            createdAt: Date;
            iphoneUnitId: number;
            notes: string | null;
            buyerName: string | null;
            buyerPhone: string | null;
            saleDate: Date;
        })[];
    } & {
        id: number;
        model: string;
        capacity: string;
        color: string;
        imei: string;
        purchasePrice: number;
        sellingPrice: number | null;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateIphoneDto): Promise<{
        id: number;
        model: string;
        capacity: string;
        color: string;
        imei: string;
        purchasePrice: number;
        sellingPrice: number | null;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, dto: UpdateIphoneDto): Promise<{
        id: number;
        model: string;
        capacity: string;
        color: string;
        imei: string;
        purchasePrice: number;
        sellingPrice: number | null;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        model: string;
        capacity: string;
        color: string;
        imei: string;
        purchasePrice: number;
        sellingPrice: number | null;
        quantity: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
