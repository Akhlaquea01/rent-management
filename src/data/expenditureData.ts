import { ExpenditureData, Expense, MonthlySummary, YearlySummary } from '../types';

// Sample expense data
const sampleExpenses: Expense[] = [
  {
    date: "2024-01-15",
    amount: 150.75,
    category: "Groceries",
    description: "Weekly grocery shopping at FreshMart",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-01-20",
    amount: 89.99,
    category: "Entertainment",
    description: "Movie tickets for family",
    paymentMethod: "Debit Card"
  },
  {
    date: "2024-01-22",
    amount: 45.50,
    category: "Transportation",
    description: "Gas for car",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-01-25",
    amount: 120.00,
    category: "Utilities",
    description: "Electricity bill",
    paymentMethod: "Bank Transfer"
  },
  {
    date: "2024-01-28",
    amount: 75.30,
    category: "Dining",
    description: "Dinner at restaurant",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-02-02",
    amount: 200.00,
    category: "Shopping",
    description: "Clothing purchase",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-02-05",
    amount: 85.00,
    category: "Healthcare",
    description: "Doctor visit",
    paymentMethod: "Cash"
  },
  {
    date: "2024-02-08",
    amount: 65.25,
    category: "Groceries",
    description: "Organic vegetables",
    paymentMethod: "Debit Card"
  },
  {
    date: "2024-02-12",
    amount: 35.00,
    category: "Transportation",
    description: "Public transport pass",
    paymentMethod: "Cash"
  },
  {
    date: "2024-02-15",
    amount: 150.00,
    category: "Utilities",
    description: "Internet bill",
    paymentMethod: "Bank Transfer"
  },
  {
    date: "2024-02-18",
    amount: 95.50,
    category: "Entertainment",
    description: "Concert tickets",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-02-22",
    amount: 180.75,
    category: "Shopping",
    description: "Electronics purchase",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-02-25",
    amount: 55.00,
    category: "Dining",
    description: "Lunch with colleagues",
    paymentMethod: "Debit Card"
  },
  {
    date: "2024-02-28",
    amount: 110.00,
    category: "Healthcare",
    description: "Pharmacy purchase",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-03-03",
    amount: 125.30,
    category: "Groceries",
    description: "Monthly grocery shopping",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-03-07",
    amount: 70.00,
    category: "Transportation",
    description: "Car maintenance",
    paymentMethod: "Cash"
  },
  {
    date: "2024-03-10",
    amount: 90.00,
    category: "Entertainment",
    description: "Streaming services subscription",
    paymentMethod: "Bank Transfer"
  },
  {
    date: "2024-03-15",
    amount: 140.00,
    category: "Utilities",
    description: "Water bill",
    paymentMethod: "Bank Transfer"
  },
  {
    date: "2024-03-18",
    amount: 85.50,
    category: "Dining",
    description: "Coffee shop visits",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-03-22",
    amount: 220.00,
    category: "Shopping",
    description: "Home improvement items",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-03-25",
    amount: 60.00,
    category: "Healthcare",
    description: "Gym membership",
    paymentMethod: "Bank Transfer"
  },
  {
    date: "2024-03-28",
    amount: 95.75,
    category: "Other",
    description: "Miscellaneous expenses",
    paymentMethod: "Cash"
  },
  {
    date: "2024-04-02",
    amount: 160.25,
    category: "Groceries",
    description: "Specialty food items",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-04-05",
    amount: 45.00,
    category: "Transportation",
    description: "Taxi fare",
    paymentMethod: "Credit Card"
  },
  {
    date: "2024-04-08",
    amount: 75.00,
    category: "Entertainment",
    description: "Book purchase",
    paymentMethod: "Debit Card"
  }
];

// Categories
const categories = [
  "Groceries", "Entertainment", "Utilities", "Dining", 
  "Transportation", "Shopping", "Healthcare", "Other"
];

// Payment methods
const paymentMethods = [
  "Credit Card", "Debit Card", "Cash", "Bank Transfer"
];

// Generate monthly summaries
const generateMonthlySummaries = (expenses: Expense[]): MonthlySummary[] => {
  const monthlyData: { [key: string]: { total: number; byCategory: { [key: string]: number }; count: number } } = {};
  
  expenses.forEach(expense => {
    const month = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = { total: 0, byCategory: {}, count: 0 };
    }
    
    monthlyData[month].total += expense.amount;
    monthlyData[month].count += 1;
    
    if (!monthlyData[month].byCategory[expense.category]) {
      monthlyData[month].byCategory[expense.category] = 0;
    }
    monthlyData[month].byCategory[expense.category] += expense.amount;
  });
  
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    total: data.total,
    byCategory: data.byCategory,
    expenseCount: data.count,
    averageExpense: data.total / data.count
  }));
};

// Generate yearly summaries
const generateYearlySummaries = (expenses: Expense[]): YearlySummary[] => {
  const yearlyData: { [key: string]: { total: number; byCategory: { [key: string]: number }; byMonth: { [key: string]: number }; count: number } } = {};
  
  expenses.forEach(expense => {
    const year = new Date(expense.date).getFullYear().toString();
    const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'long' });
    
    if (!yearlyData[year]) {
      yearlyData[year] = { total: 0, byCategory: {}, byMonth: {}, count: 0 };
    }
    
    yearlyData[year].total += expense.amount;
    yearlyData[year].count += 1;
    
    if (!yearlyData[year].byCategory[expense.category]) {
      yearlyData[year].byCategory[expense.category] = 0;
    }
    yearlyData[year].byCategory[expense.category] += expense.amount;
    
    if (!yearlyData[year].byMonth[month]) {
      yearlyData[year].byMonth[month] = 0;
    }
    yearlyData[year].byMonth[month] += expense.amount;
  });
  
  return Object.entries(yearlyData).map(([year, data]) => ({
    year,
    total: data.total,
    byCategory: data.byCategory,
    byMonth: data.byMonth,
    expenseCount: data.count,
    averageExpense: data.total / data.count
  }));
};

// Export the complete expenditure data
export const expenditureData: ExpenditureData = {
  expenses: sampleExpenses,
  categories,
  monthlySummaries: generateMonthlySummaries(sampleExpenses),
  yearlySummaries: generateYearlySummaries(sampleExpenses)
};

// Category colors for consistent theming
export const categoryColors: { [key: string]: string } = {
  "Groceries": "#4CAF50",
  "Entertainment": "#FF9800",
  "Utilities": "#2196F3",
  "Dining": "#E91E63",
  "Transportation": "#9C27B0",
  "Shopping": "#FF5722",
  "Healthcare": "#F44336",
  "Other": "#607D8B"
};
