import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    findAll(startDate?: string, endDate?: string): Promise<({
        iphoneUnit: {
            id: number;
            quantity: number;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            sellingPrice: number | null;
            status: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        supplier: string | null;
        purchaseDate: Date;
        notes: string | null;
        createdAt: Date;
    })[]>;
    findOne(id: number): Promise<{
        iphoneUnit: {
            id: number;
            quantity: number;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            sellingPrice: number | null;
            status: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        supplier: string | null;
        purchaseDate: Date;
        notes: string | null;
        createdAt: Date;
    }>;
    create(dto: CreatePurchaseDto): Promise<{
        iphoneUnit: {
            id: number;
            quantity: number;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            sellingPrice: number | null;
            status: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        supplier: string | null;
        purchaseDate: Date;
        notes: string | null;
        createdAt: Date;
    }>;
    update(id: number, dto: UpdatePurchaseDto): Promise<{
        iphoneUnit: {
            id: number;
            quantity: number;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            sellingPrice: number | null;
            status: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        supplier: string | null;
        purchaseDate: Date;
        notes: string | null;
        createdAt: Date;
    }>;
    remove(id: number): Promise<{
        iphoneUnit: {
            id: number;
            quantity: number;
            createdAt: Date;
            model: string;
            capacity: string;
            color: string;
            imei: string;
            purchasePrice: number;
            sellingPrice: number | null;
            status: string;
            updatedAt: Date;
        };
    } & {
        id: number;
        iphoneUnitId: number;
        quantity: number;
        supplier: string | null;
        purchaseDate: Date;
        notes: string | null;
        createdAt: Date;
    }>;
}
