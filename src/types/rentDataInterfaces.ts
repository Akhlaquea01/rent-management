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
    [month: string]: MonthlyData;
  };
}

export interface YearData {
  shops: {
    [shopNumber: string]: ShopData;
  };
}

export interface AdvanceTransaction {
  name?: string;
  type: 'Deposit' | 'Deduction' | 'Advance Deduction';
  amount: number;
  date: string;
  description: string;
  phoneNumber?: string;
  email?: string;
  status?: string;
}

export interface RootData {
  years: {
    [year: string]: YearData;
  };
  advanceTransactions: {
    [shopNumber: string]: AdvanceTransaction[];
  };
} 