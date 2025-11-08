import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Drawer,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Slider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  AttachMoney,
  Category,
  FilterList,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Close,
  Refresh,
  ViewList,
  BarChart,
  PieChart,
  ShowChart,
  CalendarToday,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Brush,
  ComposedChart
} from 'recharts';
// API endpoint for expenditure data
const EXPENDITURE_API_URL = 'https://akhlaquea01.github.io/records_siwaipatti/expenses.json';

// Types
interface Transaction {
  date: string;
  amount: number;
  category: string;
  description: string;
  sub_category: string;
  paymentMethod: string;
}

interface MonthData {
  incomeDetails: { totalIncome: number };
  expense_details: Transaction[];
}

interface SpendingData {
  [year: string]: {
    [month: string]: MonthData;
  };
}

interface FilterState {
  dateRange: { from: string; to: string };
  year: string;
  categories: string[];
  amountRange: [number, number];
}

type ChartView = 'timeline' | 'yearly' | 'category' | 'cumulative' | 'pareto';


const COLORS = [
  '#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0',
  '#FF5722', '#F44336', '#607D8B', '#795548', '#3F51B5',
  '#009688', '#FFC107', '#00BCD4', '#8BC34A', '#673AB7'
];

const ExpenditureDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartView>('timeline');
  const [currentMonth, setCurrentMonth] = useState<{ year: string; month: string } | null>(null);
  const [yearlyMode, setYearlyMode] = useState(false);
  const [showAllData, setShowAllData] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // API data states
  const [spendingData, setSpendingData] = useState<SpendingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filter states (temp vs applied)
  const [tempFilters, setTempFilters] = useState<FilterState>({
    dateRange: { from: '', to: '' },
    year: '',
    categories: [],
    amountRange: [0, 1000000]
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    dateRange: { from: '', to: '' },
    year: '',
    categories: [],
    amountRange: [0, 1000000]
  });

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const response = await fetch(EXPENDITURE_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSpendingData(data as SpendingData);
    } catch (error) {
      console.error('Error fetching expenditure data:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract all transactions and available data
  const { allTransactions, availableYears, availableMonths, allCategories } = useMemo(() => {
    const transactions: Transaction[] = [];
    const years = new Set<string>();
    const months: { year: string; month: string }[] = [];
    const categories = new Set<string>();

    Object.entries(spendingData).forEach(([year, monthsData]) => {
      years.add(year);
      Object.entries(monthsData).forEach(([month, monthData]) => {
        months.push({ year, month });
        monthData.expense_details.forEach((tx: Transaction) => {
          transactions.push(tx);
          categories.add(tx.category);
        });
      });
    });

    months.sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      allTransactions: transactions,
      availableYears: Array.from(years).sort(),
      availableMonths: months,
      allCategories: Array.from(categories).sort()
    };
  }, [spendingData]);

  // Set initial month and sync with year filter
  useEffect(() => {
    if (availableMonths.length > 0 && !currentMonth) {
      setCurrentMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, currentMonth]);

  // When year filter changes in yearly mode, update it
  useEffect(() => {
    if (yearlyMode && !appliedFilters.year && availableYears.length > 0) {
      setAppliedFilters({ ...appliedFilters, year: availableYears[availableYears.length - 1] });
      setTempFilters({ ...tempFilters, year: availableYears[availableYears.length - 1] });
    }
  }, [yearlyMode, availableYears]);

  // When switching to monthly mode, ensure current month respects year filter
  useEffect(() => {
    if (!yearlyMode && appliedFilters.year && currentMonth) {
      // If year filter is set and current month doesn't match, find first month of that year
      if (currentMonth.year !== appliedFilters.year) {
        const firstMonthOfYear = availableMonths.find(m => m.year === appliedFilters.year);
        if (firstMonthOfYear) {
          setCurrentMonth(firstMonthOfYear);
        }
      }
    }
  }, [yearlyMode, appliedFilters.year, currentMonth, availableMonths]);

  // Get filtered transactions (without month/year filtering - that's done in currentViewTransactions)
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Apply date range filter
    if (appliedFilters.dateRange.from) {
      filtered = filtered.filter(tx => tx.date >= appliedFilters.dateRange.from);
    }
    if (appliedFilters.dateRange.to) {
      filtered = filtered.filter(tx => tx.date <= appliedFilters.dateRange.to);
    }

    // Apply year filter from sidebar
    // In showAllData mode, year filter should still work
    // In yearlyMode, year filter is handled by the year selector
    if (appliedFilters.year && !yearlyMode) {
      filtered = filtered.filter(tx => tx.date.startsWith(appliedFilters.year));
    }

    // Apply category filter
    if (appliedFilters.categories.length > 0) {
      filtered = filtered.filter(tx => appliedFilters.categories.includes(tx.category));
    }

    // Apply amount range filter
    filtered = filtered.filter(
      tx => tx.amount >= appliedFilters.amountRange[0] && tx.amount <= appliedFilters.amountRange[1]
    );

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tx =>
          tx.description.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query) ||
          tx.sub_category.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTransactions, appliedFilters, yearlyMode, searchQuery, sortField, sortOrder]);

  // Get transactions for current view
  const currentViewTransactions = useMemo(() => {
    let transactions = [...filteredTransactions];
    
    // If "Show All Data" is enabled, return all filtered transactions
    if (showAllData) {
      return transactions;
    }
    
    if (yearlyMode) {
      // In yearly mode, show all months of the selected year or all data
      if (appliedFilters.year) {
        transactions = transactions.filter(tx => tx.date.startsWith(appliedFilters.year));
      }
    } else {
      // In monthly mode, show only the current selected month
      if (currentMonth) {
        transactions = transactions.filter(tx => {
          const txDate = new Date(tx.date);
          const txMonth = txDate.toLocaleDateString('en-US', { month: 'long' });
          const txYear = txDate.getFullYear().toString();
          return txMonth === currentMonth.month && txYear === currentMonth.year;
        });
      }
    }
    
    return transactions;
  }, [filteredTransactions, yearlyMode, appliedFilters.year, currentMonth, showAllData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = currentViewTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const average = currentViewTransactions.length > 0 ? total / currentViewTransactions.length : 0;
    const categoryTotals = currentViewTransactions.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    // Detect anomalies (3x average)
    const avgAmount = average;
    const anomalies = currentViewTransactions.filter(tx => tx.amount >= avgAmount * 3);

    return { total, average, categoryTotals, count: currentViewTransactions.length, anomalies };
  }, [currentViewTransactions]);

  // Chart data preparation
  const timelineData = useMemo(() => {
    if (showAllData) {
      // When showing all data, aggregate by month with readable names
      const monthlyData: Record<string, { amount: number; sortKey: string }> = {};
      currentViewTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { amount: 0, sortKey };
        }
        monthlyData[monthName].amount += tx.amount;
      });
      
      return Object.entries(monthlyData)
        .map(([date, data]) => ({ date, amount: data.amount, sortKey: data.sortKey }))
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ date, amount }) => ({ date, amount }));
    } else if (yearlyMode) {
      // For yearly mode, show all 12 months
      const monthlyData: Record<string, number> = {};
      currentViewTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + tx.amount;
      });
      
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // Show all months, even if no data
      return monthOrder.map(month => ({ 
        date: month, 
        amount: monthlyData[month] || 0 
      }));
    } else {
      // For monthly mode, show all days of the month
      if (!currentMonth) return [];
      
      // Get the number of days in the current month
      const year = parseInt(currentMonth.year);
      const monthIndex = new Date(`${currentMonth.month} 1, ${year}`).getMonth();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      
      // Create data for all days
      const dailyData: Record<number, number> = {};
      currentViewTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const day = date.getDate();
        dailyData[day] = (dailyData[day] || 0) + tx.amount;
      });
      
      // Return all days, even if no transactions
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          date: day.toString(),
          amount: dailyData[day] || 0
        };
      });
    }
  }, [currentViewTransactions, yearlyMode, showAllData, currentMonth]);

  const yearlyData = useMemo(() => {
    const yearlyTotals: Record<string, number> = {};
    allTransactions.forEach(tx => {
      const year = tx.date.substring(0, 4);
      yearlyTotals[year] = (yearlyTotals[year] || 0) + tx.amount;
    });
    return Object.entries(yearlyTotals)
      .map(([year, total]) => ({ year, total }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [allTransactions]);

  const categoryData = useMemo(() => {
    return Object.entries(stats.categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats.categoryTotals]);


  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return timelineData.map(item => {
      cumulative += item.amount;
      return { ...item, cumulative };
    });
  }, [timelineData]);

  const paretoData = useMemo(() => {
    const sorted = [...categoryData].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    return sorted.map(item => {
      cumulative += item.value;
      return {
        ...item,
        cumulative,
        percentage: (cumulative / total) * 100
      };
    });
  }, [categoryData]);


  // Get filtered available months based on year filter
  const filteredAvailableMonths = useMemo(() => {
    if (appliedFilters.year) {
      return availableMonths.filter(m => m.year === appliedFilters.year);
    }
    return availableMonths;
  }, [availableMonths, appliedFilters.year]);

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!currentMonth) return;
    const monthsToUse = filteredAvailableMonths;
    const currentIndex = monthsToUse.findIndex(
      m => m.year === currentMonth.year && m.month === currentMonth.month
    );
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentMonth(monthsToUse[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < monthsToUse.length - 1) {
      setCurrentMonth(monthsToUse[currentIndex + 1]);
    }
  };

  const canNavigatePrev = currentMonth
    ? filteredAvailableMonths.findIndex(m => m.year === currentMonth.year && m.month === currentMonth.month) > 0
    : false;
  const canNavigateNext = currentMonth
    ? filteredAvailableMonths.findIndex(m => m.year === currentMonth.year && m.month === currentMonth.month) <
      filteredAvailableMonths.length - 1
    : false;

  // Filter functions
  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    
    // When applying year filter in monthly mode, navigate to first month of that year
    if (!yearlyMode && tempFilters.year && tempFilters.year !== appliedFilters.year) {
      const firstMonthOfYear = availableMonths.find(m => m.year === tempFilters.year);
      if (firstMonthOfYear) {
        setCurrentMonth(firstMonthOfYear);
      }
    }
    
    setDrawerOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      dateRange: { from: '', to: '' },
      year: '',
      categories: [],
      amountRange: [0, 1000000]
    };
    setTempFilters(resetFilters);
    setAppliedFilters(resetFilters);
    
    // Reset to latest month when clearing filters
    if (!yearlyMode && availableMonths.length > 0) {
      setCurrentMonth(availableMonths[availableMonths.length - 1]);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.dateRange.from || appliedFilters.dateRange.to) count++;
    // Don't count year filter if in yearly mode (it's part of the view selector)
    if (appliedFilters.year && (!yearlyMode || showAllData)) count++;
    if (appliedFilters.categories.length > 0) count++;
    if (appliedFilters.amountRange[0] > 0 || appliedFilters.amountRange[1] < 1000000) count++;
    return count;
  }, [appliedFilters, yearlyMode, showAllData]);

  // Export functions
  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Subcategory', 'Payment Method'];
    const rows = currentViewTransactions.map(tx => [
      tx.date,
      tx.description,
      tx.amount.toString(),
      tx.category,
      tx.sub_category,
      tx.paymentMethod
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpendTimeline_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = {
      export_timestamp: new Date().toISOString(),
      transaction_count: currentViewTransactions.length,
      total_spent: stats.total,
      filters: appliedFilters,
      transactions: currentViewTransactions
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SpendTimeline_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTransaction = (tx: Transaction, format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csv = `Date,Description,Amount,Category,Subcategory,Payment Method\n${tx.date},${tx.description},${tx.amount},${tx.category},${tx.sub_category},${tx.paymentMethod}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SpendTimeline_Transaction_${tx.date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(tx, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SpendTimeline_Transaction_${tx.date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Render charts
  const renderChart = () => {
    switch (selectedChart) {
      case 'timeline':
    return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ 
                  value: showAllData ? 'Month' : (yearlyMode ? 'Month' : 'Day'), 
                  position: 'insideBottom', 
                  offset: -5 
                }}
                angle={showAllData ? -45 : 0}
                textAnchor={showAllData ? 'end' : 'middle'}
                height={showAllData ? 80 : 60}
              />
              <YAxis label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip 
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']}
                labelFormatter={(label) => 
                  showAllData ? `Period: ${label}` : (yearlyMode ? `Month: ${label}` : `Day: ${label}`)
                }
              />
              <RechartsLegend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#2196F3" 
                strokeWidth={2}
                name={showAllData ? "Period Total" : (yearlyMode ? "Monthly Total" : "Daily Total")}
              />
              {(showAllData || !yearlyMode) && <Brush />}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'yearly':
    return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip />
              <RechartsLegend />
              <Bar dataKey="total" fill="#4CAF50" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'category':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const percent = entry.percent || 0;
                  return `${entry.name} ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'cumulative':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <RechartsLegend />
              <Line type="monotone" dataKey="cumulative" stroke="#9C27B0" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pareto':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={paretoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <RechartsTooltip />
              <RechartsLegend />
              <Bar yAxisId="left" dataKey="value" fill="#2196F3" />
              <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#FF5722" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Pagination for transactions
  const paginatedTransactions = useMemo(() => {
    const start = page * rowsPerPage;
    return currentViewTransactions.slice(start, start + rowsPerPage);
  }, [currentViewTransactions, page, rowsPerPage]);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading expenditure data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (apiError) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<Refresh />}
              onClick={fetchData}
              disabled={isLoading}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Failed to load expenditure data
          </Typography>
          <Typography variant="body2">
            {apiError}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Empty data state
  if (Object.keys(spendingData).length === 0) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            No expenditure data available
          </Typography>
          <Typography variant="body2">
            The API returned no data. Please check the data source.
          </Typography>
        </Alert>
      </Box>
    );
  }

    return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
              <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" gutterBottom>
                SpendTimeline
                </Typography>
              <Typography variant="body2" color="textSecondary">
                Personal Finance Dashboard
          </Typography>
                </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
        <Badge badgeContent={activeFilterCount > 0 ? activeFilterCount : undefined} color="primary">
              <Button 
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setDrawerOpen(true)}
              >
                Filters
              </Button>
        </Badge>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={fetchData}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button variant="outlined" startIcon={<Download />} onClick={exportToCSV}>
                Export CSV
              </Button>
              <Button variant="outlined" startIcon={<Download />} onClick={exportToJSON}>
                Export JSON
        </Button>
      </Box>
      </Box>

          {/* Period Indicator */}
          {!showAllData && (
            <Box sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
              <Chip 
                label={
                  yearlyMode 
                    ? `Viewing: ${appliedFilters.year || availableYears[availableYears.length - 1]}`
                    : currentMonth 
                      ? `Viewing: ${currentMonth.month} ${currentMonth.year}`
                      : 'Select a period'
                }
                color="info"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
                </Box>
          )}

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Total Spent
              </Typography>
                  <Typography variant="h5">₹{stats.total.toFixed(2)}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {showAllData 
                      ? (appliedFilters.year ? `in ${appliedFilters.year}` : 'All time')
                      : yearlyMode 
                        ? `in ${appliedFilters.year || availableYears[availableYears.length - 1]}`
                        : currentMonth 
                          ? `in ${currentMonth.month}`
                          : ''}
                  </Typography>
            </CardContent>
          </Card>
        </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Transactions
              </Typography>
                  <Typography variant="h5">{stats.count}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {showAllData 
                      ? (appliedFilters.year ? `in ${appliedFilters.year}` : 'All time')
                      : yearlyMode 
                        ? 'this year'
                        : 'this month'}
                    </Typography>
            </CardContent>
          </Card>
        </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Average
              </Typography>
                  <Typography variant="h5">₹{stats.average.toFixed(2)}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    per transaction
                  </Typography>
            </CardContent>
          </Card>
        </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Anomalies
              </Typography>
                  <Typography variant="h5">{stats.anomalies.length}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    high spending
                    </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Month/Year Navigation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" gap={2} mb={2} flexWrap="wrap">
            <Button
              variant={!yearlyMode && !showAllData ? 'contained' : 'outlined'}
              onClick={() => {
                setYearlyMode(false);
                setShowAllData(false);
              }}
              size="small"
            >
              Monthly View
            </Button>
            <Button
              variant={yearlyMode && !showAllData ? 'contained' : 'outlined'}
              onClick={() => {
                setYearlyMode(true);
                setShowAllData(false);
              }}
              size="small"
            >
              Yearly View
            </Button>
            <Button
              variant={showAllData ? 'contained' : 'outlined'}
              onClick={() => setShowAllData(!showAllData)}
              size="small"
              color="secondary"
            >
              Show All Data
            </Button>
          </Box>
          
          {showAllData ? (
            <Box display="flex" flexDirection="column" alignItems="center" mt={2} gap={1}>
              <Typography variant="h6" color="secondary">
                Viewing All Data
                          </Typography>
              {appliedFilters.year && (
                <Chip 
                  label={`Filtered: ${appliedFilters.year}`}
                  onDelete={() => {
                    setAppliedFilters({ ...appliedFilters, year: '' });
                    setTempFilters({ ...tempFilters, year: '' });
                  }}
                  color="primary"
                  size="small"
                />
              )}
              {!appliedFilters.year && (
                <Typography variant="caption" color="textSecondary">
                  ({availableYears.join(', ')})
                </Typography>
              )}
            </Box>
          ) : !yearlyMode && currentMonth ? (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <IconButton onClick={() => navigateMonth('prev')} disabled={!canNavigatePrev}>
                  <ChevronLeft />
                </IconButton>
                <Typography variant="h6">
                  {currentMonth.month} {currentMonth.year}
                </Typography>
                <IconButton onClick={() => navigateMonth('next')} disabled={!canNavigateNext}>
                  <ChevronRight />
                </IconButton>
              </Box>
              {appliedFilters.year && (
                <Box display="flex" justifyContent="center" mt={1}>
                                            <Chip
                    label={`Filtered: ${appliedFilters.year}`}
                    onDelete={() => {
                      setAppliedFilters({ ...appliedFilters, year: '' });
                      setTempFilters({ ...tempFilters, year: '' });
                      setCurrentMonth(availableMonths[availableMonths.length - 1]);
                    }}
                    color="primary"
                                              size="small"
                  />
                </Box>
                          )}
                        </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Year</InputLabel>
                <Select
                  value={appliedFilters.year || availableYears[availableYears.length - 1]}
                  onChange={e => {
                    setAppliedFilters({ ...appliedFilters, year: e.target.value });
                    setTempFilters({ ...tempFilters, year: e.target.value });
                  }}
                  label="Select Year"
                >
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
            </CardContent>
          </Card>

      {/* Chart Selection Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {selectedChart === 'timeline' 
                ? (showAllData ? 'All Time Timeline' : yearlyMode ? 'Yearly Timeline' : 'Monthly Timeline')
                : selectedChart === 'yearly' 
                  ? 'Year Comparison'
                  : selectedChart === 'category'
                    ? 'Category Breakdown'
                    : selectedChart === 'cumulative'
                      ? 'Cumulative Spending'
                      : 'Top Categories (Pareto)'}
            </Typography>
            {!showAllData && currentMonth && !yearlyMode && (
              <Typography variant="caption" color="textSecondary">
                {currentMonth.month} {currentMonth.year}
              </Typography>
                    )}
                  </Box>
          <Tabs
            value={selectedChart}
            onChange={(_, newValue) => setSelectedChart(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<ShowChart />} label="Timeline" value="timeline" />
            <Tab icon={<BarChart />} label="Yearly" value="yearly" />
            <Tab icon={<PieChart />} label="Category" value="category" />
            <Tab icon={<ShowChart />} label="Cumulative" value="cumulative" />
            <Tab icon={<BarChart />} label="Pareto" value="pareto" />
          </Tabs>
          <Box sx={{ mt: 3 }}>{renderChart()}</Box>
            </CardContent>
          </Card>

      {/* Anomalies Panel */}
      {stats.anomalies.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: '#fff3e0' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
                High Spending Anomalies
              </Typography>
              <Tooltip title="Transactions that are 3x or more above the average for this view">
                <Chip 
                  label={`Threshold: ₹${(stats.average * 3).toFixed(2)}`} 
                  size="small" 
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            </Box>
            <Typography variant="caption" color="textSecondary" display="block" mb={2}>
              Average transaction: ₹{stats.average.toFixed(2)} | Anomaly threshold: ₹{(stats.average * 3).toFixed(2)} (3x average)
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats.anomalies.slice(0, 5).map((tx, idx) => (
                <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #ffb74d' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {tx.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(tx.date).toLocaleDateString()} • {tx.category}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`₹${tx.amount.toFixed(2)}`} 
                      color="warning" 
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
              {stats.anomalies.length > 5 && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  +{stats.anomalies.length - 5} more anomalies
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Transactions</Typography>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ width: { xs: '100%', sm: 300 } }}
            />
      </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
        <Button 
                size="small" 
                onClick={() => {
                        if (sortField === 'date') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('date');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </Button>
                  </TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Subcategory</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        if (sortField === 'amount') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('amount');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.map((tx, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      <Chip label={tx.category} size="small" />
                    </TableCell>
                    <TableCell>{tx.sub_category}</TableCell>
                    <TableCell>₹{tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setTransactionModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={currentViewTransactions.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      {/* Filter Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 400 }, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Year</InputLabel>
                  <Select
              value={tempFilters.year}
              onChange={e => setTempFilters({ ...tempFilters, year: e.target.value })}
              label="Year"
                  >
                    <MenuItem value="">All Years</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

          <TextField
            fullWidth
            type="date"
            label="From Date"
            value={tempFilters.dateRange.from}
            onChange={e =>
              setTempFilters({
                ...tempFilters,
                dateRange: { ...tempFilters.dateRange, from: e.target.value }
              })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="date"
            label="To Date"
            value={tempFilters.dateRange.to}
            onChange={e =>
              setTempFilters({
                ...tempFilters,
                dateRange: { ...tempFilters.dateRange, to: e.target.value }
              })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Amount Range: ₹{tempFilters.amountRange[0].toLocaleString()} - ₹{tempFilters.amountRange[1].toLocaleString()}
              </Typography>
          <Slider
            value={tempFilters.amountRange}
            onChange={(_, newValue) =>
              setTempFilters({ ...tempFilters, amountRange: newValue as [number, number] })
            }
            min={0}
            max={1000000}
            step={1000}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `₹${(value / 1000).toFixed(0)}k`}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Categories
              </Typography>
          <FormGroup sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
            {allCategories.map(category => (
              <FormControlLabel
                      key={category}
                control={
                  <Checkbox
                    checked={tempFilters.categories.includes(category)}
                    onChange={e => {
                      if (e.target.checked) {
                        setTempFilters({
                          ...tempFilters,
                          categories: [...tempFilters.categories, category]
                        });
                      } else {
                        setTempFilters({
                          ...tempFilters,
                          categories: tempFilters.categories.filter(c => c !== category)
                        });
                      }
                    }}
                  />
                }
                label={category}
              />
            ))}
          </FormGroup>

          <Box display="flex" gap={2}>
            <Button variant="contained" onClick={handleApplyFilters} fullWidth>
              Apply
            </Button>
            <Button variant="outlined" onClick={handleResetFilters} fullWidth>
              Reset
            </Button>
              </Box>
        </Box>
      </Drawer>

      {/* Transaction Detail Modal */}
      <Dialog open={transactionModalOpen} onClose={() => setTransactionModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Transaction Details
          <IconButton
            onClick={() => setTransactionModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Typography variant="body2" color="textSecondary">
                Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {new Date(selectedTransaction.date).toLocaleDateString()}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedTransaction.description}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Amount
              </Typography>
              <Typography variant="h6" gutterBottom>
                ₹{selectedTransaction.amount.toFixed(2)}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Category
              </Typography>
              <Chip label={selectedTransaction.category} sx={{ mt: 0.5 }} />

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Subcategory
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedTransaction.sub_category}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Payment Method
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedTransaction.paymentMethod}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => selectedTransaction && exportTransaction(selectedTransaction, 'csv')}>
            Export CSV
          </Button>
          <Button onClick={() => selectedTransaction && exportTransaction(selectedTransaction, 'json')}>
            Export JSON
          </Button>
          <Button onClick={() => setTransactionModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenditureDashboard;
