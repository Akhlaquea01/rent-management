import { MonthlyData } from '../types';

// Utility function to get dues information for a shop.
// This now directly uses the `previousYearDues` object as the single source of truth for all dues.
export const getDuesInfo = (shopNumber: string, data: any, selectedYear?: string) => {
  let totalPendingMonths = 0;
  let totalDueAmount = 0;
  const yearBreakdown: Record<string, { months: string[]; amount: number }> = {};

  if (!selectedYear) return { totalPendingMonths, totalDueAmount, yearBreakdown };

  const yearData = data.years[selectedYear];
  if (!yearData) return { totalPendingMonths, totalDueAmount, yearBreakdown };

  const shop = yearData.shops[shopNumber];
  if (!shop) return { totalPendingMonths, totalDueAmount, yearBreakdown };

  // Total due amount is sourced directly from the data.
  totalDueAmount = shop.previousYearDues?.totalDues || 0;

  // Get due months from previous years.
  const previousYearDueMonths: string[] = shop.previousYearDues?.dueMonths || [];

  // Get due months from the current selected year by checking for non-paid statuses.
  const currentYearDueMonths = Object.entries(shop.monthlyData || {})
    .filter(([, monthData]: [string, any]) => monthData.status && monthData.status !== 'Paid')
    .map(([month]) => `${month} ${selectedYear}`);

  const allDueMonths = [...previousYearDueMonths, ...currentYearDueMonths];
  totalPendingMonths = allDueMonths.length;

  // Group due months by year for display in the tooltip
  const duesByYear = allDueMonths.reduce<Record<string, string[]>>((acc, monthStr) => {
    const parts = monthStr.split(' ');
    const year = parts.length > 1 ? parts[1] : 'Misc';
    const month = parts[0];
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(month);
    return acc;
  }, {});

  // Populate yearBreakdown for the tooltip display
  for (const year in duesByYear) {
    yearBreakdown[year] = {
      months: duesByYear[year],
      amount: 0, // Individual amounts per year are not available from the total
    };
  }
  return { totalPendingMonths, totalDueAmount, yearBreakdown };
};

// Utility function to get total dues for a shop.
// Assumes `shop.previousYearDues.totalDues` is the single source of truth for all pending dues.
export const calculateTotalDues = (shop: any): number => {
  return shop.previousYearDues?.totalDues || 0;
}; 