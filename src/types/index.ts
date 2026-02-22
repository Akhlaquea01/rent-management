export interface Tenant {
  name: string;
  tenant_name_hindi: string;
  phoneNumber: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
  agreementDate: string;
  total_due?: number;
  due_months?: string;
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
  comment?: string;
  advanceUsed: number;
}

export interface ShopData {
  tenant: Tenant;
  rentAmount: number;
  advanceAmount: number;
  previousYearDues: DuesInfo;
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
  name?: string;
  type: 'Deposit' | 'Deduction' | 'Advance Deduction';
  amount: number;
  date: string;
  description: string;
  phoneNumber?: string;
  email?: string;
  status?: string;
}

export interface RentManagementData {
  years: {
    [year: string]: YearData;
  };
  advanceTransactions: {
    [shopNumber: string]: AdvanceTransaction[];
  };
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

// New API data interfaces
export interface ApiTenant {
  email: string;
  status: 'Active' | 'Inactive';
  address: string;
  comment: string | null;
  id_number: string;
  total_due: number | null;
  due_months: string | null;
  tenant_name: string;
  tenant_name_hindi: string;
  advance_paid: number | null;
  fathers_name: string;
  monthly_rent: number;
  mobile_number: string;
  agreement_status: string;
  advance_remaining: number | null;
}

export interface ApiTenantData {
  tenant: ApiTenant;
  shop_no: string;
}

// Expenditure Tracking Interfaces
export interface Expense {
  id?: number;
  date: string;
  amount: number;
  category: string;
  description: string;
  sub_category: string;
  paymentMethod: string;
  tags?: string[];
}

export interface MonthlySummary {
  month: string;
  total: number;
  byCategory: {
    [category: string]: number;
  };
  expenseCount: number;
  averageExpense: number;
}

export interface YearlySummary {
  year: string;
  total: number;
  byCategory: {
    [category: string]: number;
  };
  byMonth: {
    [month: string]: number;
  };
  expenseCount: number;
  averageExpense: number;
}

export interface ExpenditureData {
  expenses: Expense[];
  categories: string[];
  monthlySummaries: MonthlySummary[];
  yearlySummaries: YearlySummary[];
}

export type ViewMode = 'monthly' | 'yearly';

export interface CategoryColor {
  [category: string]: string;
}
