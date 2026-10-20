export interface IPhoneUnit {
  id: number;
  model: string;
  capacity: string;
  color: string;
  imei: string;
  purchasePrice: number;
  sellingPrice: number | null;
  quantity: number;
  status: 'available' | 'sold';
  createdAt: string;
  updatedAt: string;
  purchase?: Purchase;
  sale?: Sale;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Purchase {
  id: number;
  iphoneUnitId: number;
  quantity: number;
  supplier: string | null;
  purchaseDate: string;
  notes: string | null;
  createdAt: string;
  iphoneUnit?: IPhoneUnit;
}

export interface Sale {
  id: number;
  iphoneUnitId: number;
  quantity: number;
  sellingPrice: number;
  buyerName: string | null;
  buyerPhone: string | null;
  saleDate: string;
  notes: string | null;
  createdAt: string;
  iphoneUnit?: IPhoneUnit;
  additionalCosts?: AdditionalCost[];
}

export interface AdditionalCost {
  id: number;
  saleId: number | null;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalStock: number;
  totalPurchases: number;
  totalSales: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
  totalAdditionalCosts: number;
  grossProfit: number;
  netProfit: number;
  recentPurchases: Purchase[];
  recentSales: Sale[];
}

export interface ProfitPerUnit {
  id: number;
  model: string;
  capacity: string;
  color: string;
  imei: string;
  quantity: number;
  purchasePrice: number;
  totalPurchasePrice?: number;
  sellingPrice: number;
  additionalCosts: AdditionalCost[];
  totalAdditionalCosts: number;
  grossProfit: number;
  netProfit: number;
  saleDate: string;
}
