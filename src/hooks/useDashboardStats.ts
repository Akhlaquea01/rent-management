import { useState, useMemo, useEffect } from 'react';
import { useRentContext } from "../context/RentContext";

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  inactiveShops: number;
  totalRentCollected: number;
  totalDues: number;
  totalAdvance: number;
}

export const useDashboardStats = () => {
  const { state, fetchYearData, isYearLoading, getAvailableYears } = useRentContext();
  const { data, loading, error } = state;

  const availableYears = useMemo(() => getAvailableYears(), [getAvailableYears]);
  const loadedYears = data && data.years ? Object.keys(data.years).sort().reverse() : [];

  const currentYearStr = new Date().getFullYear().toString();
  const defaultYear = loadedYears.includes(currentYearStr)
    ? currentYearStr
    : loadedYears[0] || currentYearStr;

  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const [showInactiveShops, setShowInactiveShops] = useState<boolean>(false);

  // Fetch year data when selected year changes
  useEffect(() => {
    if (selectedYear && !data.years[selectedYear] && !isYearLoading(selectedYear)) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, data.years, fetchYearData, isYearLoading]);

  const shops = useMemo(() => {
    return data.years[selectedYear]?.shops || {};
  }, [data.years, selectedYear]);

  // Compute dashboard stats from new data structure
  const shopsArray = useMemo(() => {
    return Object.entries(shops).map(
      ([shopNumber, shop]: [string, any]) => ({
        shopNumber,
        ...shop,
        totalDues: shop.previousYearDues?.totalDues || 0,
        tenantName: shop.tenant?.name || "Unknown",
        tenantStatus: shop.tenant?.status || "Unknown",
        dueMonths: shop.previousYearDues?.dueMonths || [],
      })
    );
  }, [shops]);

  const stats: DashboardStats = useMemo(() => {
    const totalShops = shopsArray.length;
    const activeShops = shopsArray.filter(
      (shop: any) => shop.tenant.status === "Active"
    ).length;
    const inactiveShops = totalShops - activeShops;

    const totalRentCollected = shopsArray.reduce((sum: number, shop: any) => {
      const monthlyData = shop.monthlyData || {};
      return sum + (Object.values(monthlyData) as any[]).reduce(
        (monthSum: number, month: any) => monthSum + (Number(month.paid) || 0),
        0
      );
    }, 0);

    const totalDues = shopsArray.reduce(
      (sum: number, shop: any) => sum + (shop.previousYearDues?.totalDues || 0),
      0
    );

    const totalAdvance = shopsArray.reduce((sum: number, shop: any) => {
      return sum + (shop.advanceAmount || 0);
    }, 0);

    return {
      totalShops,
      activeShops,
      inactiveShops,
      totalRentCollected,
      totalDues,
      totalAdvance,
    };
  }, [shopsArray]);

  const overdueShops = useMemo(() => {
    return shopsArray
      .filter((shop: any) => {
        const hasDues = shop.totalDues > 0;
        const isActive = shop.tenant.status === "Active";

        if (showInactiveShops) {
          return hasDues; // Show both active and inactive shops with dues
        } else {
          return hasDues && isActive; // Show only active shops with dues
        }
      })
      .sort(
        (a: any, b: any) => b.totalDues - a.totalDues
      );
  }, [shopsArray, showInactiveShops]);

  return {
    loading,
    error,
    selectedYear,
    setSelectedYear,
    availableYears,
    loadedYears,
    showInactiveShops,
    setShowInactiveShops,
    shopsArray,
    stats,
    overdueShops,
    isYearLoading,
  };
};
