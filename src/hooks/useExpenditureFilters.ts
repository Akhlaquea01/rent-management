import { useState, useMemo } from 'react';
import { ExpenditureFilters, Expense } from '../types';

interface UseExpenditureFiltersProps {
  expenses: Expense[];
  initialFilters?: Partial<ExpenditureFilters>;
}

export const useExpenditureFilters = ({ expenses, initialFilters }: UseExpenditureFiltersProps) => {
  // Get min/max amounts from data
  const amountRange = useMemo(() => {
    const amounts = expenses.map(exp => exp.amount);
    return { min: Math.min(...amounts), max: Math.max(...amounts) };
  }, [expenses]);

  // Get unique categories and payment methods
  const availableCategories = useMemo(() => {
    const uniqueCategories = new Set(expenses.map(exp => exp.category));
    return Array.from(uniqueCategories).sort();
  }, [expenses]);

  const availablePaymentMethods = useMemo(() => {
    const uniquePaymentMethods = new Set(expenses.map(exp => exp.paymentMethod));
    return Array.from(uniquePaymentMethods).sort();
  }, [expenses]);

  // Initialize filters
  const [filters, setFilters] = useState<ExpenditureFilters>({
    amountRange: { min: amountRange.min, max: amountRange.max },
    selectedCategories: [],
    dateRange: { start: '', end: '' },
    searchQuery: '',
    paymentMethods: [],
    ...initialFilters
  });

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Amount filter
      if (expense.amount < filters.amountRange.min || expense.amount > filters.amountRange.max) {
        return false;
      }
      
      // Category filter
      if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(expense.category)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange.start && expense.date < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && expense.date > filters.dateRange.end) {
        return false;
      }
      
      // Search query
      if (filters.searchQuery && !expense.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      // Payment method filter
      if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(expense.paymentMethod)) {
        return false;
      }
      
      return true;
    });
  }, [expenses, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const average = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;
    const categoryTotals = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key: string]: number });
    
    return { total, average, categoryTotals, count: filteredExpenses.length };
  }, [filteredExpenses]);

  // Reset filters to default
  const resetFilters = () => {
    setFilters({
      amountRange: { min: amountRange.min, max: amountRange.max },
      selectedCategories: [],
      dateRange: { start: '', end: '' },
      searchQuery: '',
      paymentMethods: []
    });
  };

  // Update specific filter
  const updateFilter = <K extends keyof ExpenditureFilters>(
    key: K,
    value: ExpenditureFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filteredExpenses,
    summaryStats,
    amountRange,
    availableCategories,
    availablePaymentMethods
  };
};
