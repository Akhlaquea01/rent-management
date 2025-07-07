export interface Tenant {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
  agreementDate: string;
}

export interface DuesInfo {
  totalDues: number;
  dueMonths: string[];
  description: string;
}

export interface MonthlyData {
  rent: number;
  paid: number;
  status: 'Paid' | 'Pending' | 'Partial';
  date: string;
  advanceUsed: number;
}

export interface ShopData {
  tenant: Tenant;
  rentAmount: number;
  advanceAmount: number;
  previousYearDues: DuesInfo;
  currentYearDues: DuesInfo;
  totalDuesBalance: number;
  monthlyData: {
    [key: string]: MonthlyData;
  };
}

export interface YearData {
  shops: {
    [shopNumber: string]: ShopData;
  };
}

export interface AdvanceTransaction {
  type: 'Deposit' | 'Deduction';
  amount: number;
  date: string;
  description: string;
}

export interface RentManagementData {
  years: {
    [year: string]: YearData;
  };
  advanceTransactions: {
    [shopNumber: string]: AdvanceTransaction[];
  };
}

// Legacy interfaces for backward compatibility
export interface TenantLegacy {
  id: string;
  name: string;
  shopNumber: string;
  rentAmount: number;
  status: string;
  advanceAmount: number;
  agreementDate: string;
  phoneNumber: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}



export interface AdvanceTransactionLegacy {
  id: string;
  tenantId: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  totalShops: number;
  activeShops: number;
  inactiveShops: number;
  totalRentCollected: number;
  totalDues: number;
  totalAdvance: number;
  monthlyCollection: {
    month: string;
    amount: number;
  }[];
}



export interface BulkAdvanceEntry {
  shopNumber: string;
  type: 'Deposit' | 'Deduction';
  amount: number;
  date: string;
  description: string;
} 