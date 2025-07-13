import { MonthlyData } from '../types';

// Utility function to calculate current year dues from monthlyData with rolling overpayment allocation
export const calculateCurrentYearDues = (monthlyData: { [month: string]: MonthlyData }): number => {
  if (!monthlyData) return 0;

  const monthOrder = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let totalDue = 0;
  let rollingPaid = 0;

  monthOrder.forEach((month) => {
    const monthData = monthlyData[month];
    if (monthData) {
      const monthlyRent = monthData.rent || 0;
      const monthlyPaid = (monthData.paid || 0) + (monthData.advanceUsed || 0);
      rollingPaid += monthlyPaid;
      if (rollingPaid < monthlyRent) {
        totalDue += (monthlyRent - rollingPaid);
        rollingPaid = 0;
      } else {
        rollingPaid -= monthlyRent;
      }
    }
  });

  return Math.max(0, totalDue);
};

// Utility function to get dues information for a shop with proper clearing order and rolling payment allocation
export const getDuesInfo = (shopNumber: string, data: any, selectedYear?: string) => {
  let totalPendingMonths = 0;
  let totalDueAmount = 0;
  const yearBreakdown: Record<string, { months: string[]; amount: number }> = {};

  if (!selectedYear) return { totalPendingMonths, totalDueAmount, yearBreakdown };

  const yearData = data.years[selectedYear];
  if (!yearData) return { totalPendingMonths, totalDueAmount, yearBreakdown };

  const shop = yearData.shops[shopNumber];
  if (!shop) return { totalPendingMonths, totalDueAmount, yearBreakdown };

  const allDueMonths: Array<{ month: string; year: string; amount: number; isPreviousYear: boolean }> = [];
  let yearDue = 0;

  // Add previous year dues if any (these are the oldest and should be cleared first)
  const previousYearDues = shop.previousYearDues?.totalDues || 0;
  if (previousYearDues > 0) {
    yearDue += previousYearDues;
    totalDueAmount += previousYearDues;
    if (shop.previousYearDues?.dueMonths && shop.previousYearDues.dueMonths.length > 0) {
      shop.previousYearDues.dueMonths.forEach(month => {
        allDueMonths.push({
          month: `Previous Year: ${month}`,
          year: 'Previous',
          amount: 0, // Individual amounts not available for previous year
          isPreviousYear: true
        });
        totalPendingMonths += 1;
      });
    }
  }

  // Calculate current year dues from monthlyData with rolling payment allocation and pending queue
  if (shop.monthlyData) {
    const monthOrder = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let rollingPaid = 0;
    let currentYearDue = 0;
    // Queue of {month, dueAmount}
    const pendingQueue: { month: string; due: number }[] = [];

    monthOrder.forEach((month) => {
      const monthData = shop.monthlyData[month];
      if (monthData) {
        const monthlyRent = monthData.rent || 0;
        const monthlyPaid = (monthData.paid || 0) + (monthData.advanceUsed || 0);
        rollingPaid += monthlyPaid;
        if (monthlyRent > 0) {
          if (rollingPaid < monthlyRent) {
            // Not enough to cover this month, add to pending queue
            pendingQueue.push({ month, due: monthlyRent - rollingPaid });
            currentYearDue += (monthlyRent - rollingPaid);
            rollingPaid = 0;
          } else {
            // Cover this month
            rollingPaid -= monthlyRent;
            // If there is extra, use it to clear oldest pending months
            while (rollingPaid > 0 && pendingQueue.length > 0) {
              const oldest = pendingQueue[0];
              if (rollingPaid >= oldest.due) {
                rollingPaid -= oldest.due;
                currentYearDue -= oldest.due;
                pendingQueue.shift();
              } else {
                oldest.due -= rollingPaid;
                currentYearDue -= rollingPaid;
                rollingPaid = 0;
              }
            }
          }
        }
      }
    });

    // Only add months that are truly pending after rolling allocation
    if (pendingQueue.length > 0) {
      pendingQueue.forEach(item => {
        allDueMonths.push({
          month: item.month,
          year: selectedYear,
          amount: 0, // Amount is not shown per month in tooltip, only total
          isPreviousYear: false
        });
        totalPendingMonths += 1;
      });
      yearDue += currentYearDue;
      totalDueAmount += currentYearDue;
    }
  }

  // Group by year for display
  const previousYearMonths = allDueMonths.filter(m => m.isPreviousYear).map(m => m.month);
  const currentYearMonths = allDueMonths.filter(m => !m.isPreviousYear).map(m => m.month);

  if (previousYearMonths.length > 0) {
    yearBreakdown['Previous Year'] = {
      months: previousYearMonths,
      amount: previousYearDues
    };
  }
  if (currentYearMonths.length > 0) {
    yearBreakdown[selectedYear] = {
      months: currentYearMonths,
      amount: yearDue - previousYearDues
    };
  }

  return { totalPendingMonths, totalDueAmount, yearBreakdown };
};

// Utility function to calculate total dues for a shop (including previous year)
export const calculateTotalDues = (shop: any): number => {
  const currentYearDues = calculateCurrentYearDues(shop.monthlyData || {});
  const previousYearDues = shop.previousYearDues?.totalDues || 0;
  return currentYearDues + previousYearDues;
}; 