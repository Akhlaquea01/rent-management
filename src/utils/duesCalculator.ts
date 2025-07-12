import { MonthlyData } from '../types';

// Utility function to calculate current year dues from monthlyData
export const calculateCurrentYearDues = (monthlyData: { [month: string]: MonthlyData }): number => {
  if (!monthlyData) return 0;
  
  const monthOrder = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  let totalRent = 0;
  let totalPaid = 0;
  
  monthOrder.forEach((month) => {
    const monthData = monthlyData[month];
    if (monthData) {
      totalRent += monthData.rent || 0;
      totalPaid += (monthData.paid || 0) + (monthData.advanceUsed || 0);
    }
  });
  
  return Math.max(0, totalRent - totalPaid);
};

// Utility function to get dues information for a shop
export const getDuesInfo = (shopNumber: string, data: any, selectedYear?: string) => {
  let totalPendingMonths = 0;
  let totalDueAmount = 0;
  const yearBreakdown: Record<string, { months: string[]; amount: number }> = {};
  
  // Only process the selected year
  if (!selectedYear) return { totalPendingMonths, totalDueAmount, yearBreakdown };
  
  const yearData = data.years[selectedYear];
  if (!yearData) return { totalPendingMonths, totalDueAmount, yearBreakdown };
  
  const shop = yearData.shops[shopNumber];
  if (!shop || !shop.monthlyData) return { totalPendingMonths, totalDueAmount, yearBreakdown };
  
  const months: string[] = [];
  let yearDue = 0;
  
  // Add previous year dues if any
  const previousYearDues = shop.previousYearDues?.totalDues || 0;
  if (previousYearDues > 0) {
    yearDue += previousYearDues;
    totalDueAmount += previousYearDues;
    // Add previous year months if available
    if (shop.previousYearDues?.dueMonths && shop.previousYearDues.dueMonths.length > 0) {
      months.push(...shop.previousYearDues.dueMonths.map(month => `Previous Year: ${month}`));
      totalPendingMonths += shop.previousYearDues.dueMonths.length;
    }
  }
  
  // Calculate current year dues from monthlyData
  const currentYearDues = calculateCurrentYearDues(shop.monthlyData);
  if (currentYearDues > 0) {
    yearDue += currentYearDues;
    totalDueAmount += currentYearDues;
    
    // Find months with dues
    const monthOrder = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthOrder.forEach((month) => {
      const monthData = shop.monthlyData[month];
      if (monthData) {
        const monthlyRent = monthData.rent || 0;
        const monthlyPaid = (monthData.paid || 0) + (monthData.advanceUsed || 0);
        const monthlyDue = monthlyRent - monthlyPaid;
        
        if (monthlyDue > 0) {
          months.push(month);
          totalPendingMonths += 1;
        }
      }
    });
  }
  
  if (months.length > 0) {
    yearBreakdown[selectedYear] = { months, amount: yearDue };
  }
  
  return { totalPendingMonths, totalDueAmount, yearBreakdown };
};

// Utility function to calculate total dues for a shop (including previous year)
export const calculateTotalDues = (shop: any): number => {
  const currentYearDues = calculateCurrentYearDues(shop.monthlyData || {});
  const previousYearDues = shop.previousYearDues?.totalDues || 0;
  return currentYearDues + previousYearDues;
}; 