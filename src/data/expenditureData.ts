import { ExpenditureData, Expense, MonthlySummary, YearlySummary } from '../types';

// API endpoint for expenditure data
const EXPENDITURE_API_URL = 'https://akhlaquea01.github.io/records_siwaipatti/expenses.json';

// Interface for API response
interface ApiExpenseResponse {
  data: Expense[];
}

// Function to fetch expenditure data from API
export const fetchExpenditureData = async (): Promise<Expense[]> => {
  try {
    const response = await fetch(EXPENDITURE_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const apiData: ApiExpenseResponse = await response.json();
    return apiData.data;
  } catch (error) {
    console.error('Error fetching expenditure data:', error);
    // Return empty array as fallback
    return [];
  }
};

// Function to extract unique categories from expenses
const extractCategories = (expenses: Expense[]): string[] => {
  const categorySet = new Set(expenses.map(expense => expense.category));
  return Array.from(categorySet).sort();
};

// Function to extract unique payment methods from expenses
const extractPaymentMethods = (expenses: Expense[]): string[] => {
  const paymentMethodSet = new Set(expenses.map(expense => expense.paymentMethod));
  return Array.from(paymentMethodSet).sort();
};

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

// Function to create expenditure data from API data
export const createExpenditureData = async (): Promise<ExpenditureData> => {
  const expenses = await fetchExpenditureData();
  const categories = extractCategories(expenses);
  
  return {
    expenses,
    categories,
    monthlySummaries: generateMonthlySummaries(expenses),
    yearlySummaries: generateYearlySummaries(expenses)
  };
};

// Export the complete expenditure data (for backward compatibility)
export const expenditureData: ExpenditureData = {
  expenses: [],
  categories: [],
  monthlySummaries: [],
  yearlySummaries: []
};

// Function to generate category colors dynamically
export const generateCategoryColors = (categories: string[]): { [key: string]: string } => {
  const colorPalette = [
    "#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0", 
    "#FF5722", "#F44336", "#607D8B", "#795548", "#3F51B5",
    "#009688", "#FFC107", "#E91E63", "#673AB7", "#FF9800",
    "#4CAF50", "#F44336", "#00BCD4", "#8BC34A", "#FF5722"
  ];
  
  const colors: { [key: string]: string } = {};
  categories.forEach((category, index) => {
    colors[category] = colorPalette[index % colorPalette.length];
  });
  
  return colors;
};

// Default category colors for consistent theming
export const categoryColors: { [key: string]: string } = {
  "Groceries": "#4CAF50",
  "Entertainment": "#FF9800",
  "Utilities": "#2196F3",
  "Dining & Leisure": "#E91E63",
  "Fuel & Transportation": "#9C27B0",
  "Shopping": "#FF5722",
  "Healthcare": "#F44336",
  "Other / Miscellaneous": "#607D8B",
  "Loans & EMIs": "#795548",
  "Household Supplies": "#3F51B5",
  "Household Help": "#009688",
  "Gifts / Donations": "#FFC107",
  "Credit Card Payment": "#E91E63",
  "Personal Care": "#673AB7",
  "Household Cash": "#FF9800",
  "Home Maintenance": "#4CAF50",
  "Debt Repayment": "#F44336",
  "Fees & Legal": "#00BCD4",
  "Car Maintenance": "#8BC34A",
  "Fees & Services": "#FF5722",
  "Mobile Recharge": "#00BCD4",
  "Gifts": "#FFC107",
  "Gifts / Ceremonies": "#E91E63",
  "Family": "#673AB7",
  "Household Services": "#009688"
};
