export declare class AdditionalCostItem {
    description: string;
    amount: number;
    category: string;
}
export declare class CreateSaleDto {
    iphoneUnitId: number;
    sellingPrice: number;
    quantity?: number;
    buyerName?: string;
    buyerPhone?: string;
    saleDate?: string;
    notes?: string;
    additionalCosts?: AdditionalCostItem[];
}
