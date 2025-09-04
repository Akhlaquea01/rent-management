import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface CollectionGraphsProps {
  shopsArray: any[];
  selectedYear: string;
}

const CollectionGraphs: React.FC<CollectionGraphsProps> = ({ shopsArray, selectedYear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  // Calculate monthly collection data
  const getMonthlyCollectionData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = Jan, 11 = Dec)

    // Use full month names as they are stored in the data
    const fullMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Abbreviated names for display
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const selectedYearNum = parseInt(selectedYear);
    const monthsToShow = selectedYearNum === currentYear
      ? fullMonths.slice(0, currentMonth + 1) // Show only up to current month
      : fullMonths; // Show all months for past years

    const monthlyData = monthsToShow.map((fullMonth, index) => {
      let totalCollected = 0;
      let totalExpected = 0;
      let totalDues = 0;

      shopsArray.forEach(shop => {
        const monthData = shop.monthlyData?.[fullMonth];
        const rentAmount = shop.rentAmount || 0;

        if (monthData) {
          const paid = monthData.paid || 0;
          const rent = monthData.rent || rentAmount;

          totalCollected += paid;
          totalExpected += rent;
          totalDues += Math.max(0, rent - paid);
        } else {
          // If no data for the month, assume rent is due
          totalExpected += rentAmount;
          totalDues += rentAmount;
        }
      });

      return {
        month: shortMonths[index], // Use short name for display
        fullMonth, // Keep full name for data lookup
        collected: totalCollected,
        expected: totalExpected,
        dues: Math.max(0, totalDues),
      };
    });

    return monthlyData;
  };

  // Calculate collection vs dues summary
  const getCollectionSummary = () => {
    // Use the same logic as Dashboard for consistency
    const totalCollected = shopsArray.reduce((sum: number, shop: any) => {
      const monthlyData = shop.monthlyData || {};
      return sum + (Object.values(monthlyData) as any[]).reduce(
        (monthSum: number, month: any) => monthSum + (Number(month.paid) || 0),
        0
      );
    }, 0);

    // Use the same dues calculation as Dashboard
    const totalDues = shopsArray.reduce(
      (sum: number, shop: any) => sum + (shop.previousYearDues?.totalDues || 0),
      0
    );

    return {
      totalCollected,
      totalDues,
      collectionRate: (totalCollected + totalDues) > 0 ? (totalCollected / (totalCollected + totalDues)) * 100 : 0,
    };
  };

  // Calculate shop status distribution
  const getShopStatusData = () => {
    const activeShops = shopsArray.filter(shop => shop.tenant.status === 'Active').length;
    const inactiveShops = shopsArray.length - activeShops;
    const shopsWithDues = shopsArray.filter(shop => (shop.previousYearDues?.totalDues || 0) > 0).length;
    const shopsWithoutDues = shopsArray.length - shopsWithDues;

    return {
      activeShops,
      inactiveShops,
      shopsWithDues,
      shopsWithoutDues,
    };
  };

  const monthlyData = getMonthlyCollectionData();
  const summary = getCollectionSummary();
  const statusData = getShopStatusData();

  // Chart configurations
  const monthlyCollectionConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Monthly Collection vs Expected - ${selectedYear}`,
        font: {
          size: isMobile ? 12 : 14,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '₹' + value.toLocaleString();
          },
        },
      },
    },
  };

  const monthlyCollectionChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Collected',
        data: monthlyData.map(d => d.collected),
        backgroundColor: 'rgba(46, 125, 50, 0.8)',
        borderColor: 'rgba(46, 125, 50, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expected',
        data: monthlyData.map(d => d.expected),
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 1,
      },
      {
        label: 'Dues',
        data: monthlyData.map(d => d.dues),
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 1,
      },
    ],
  };

  const collectionSummaryConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: `Collection Summary - ${selectedYear}`,
        font: {
          size: isMobile ? 12 : 14,
        },
      },
    },
  };

  const collectionSummaryData = {
    labels: ['Collected', 'Pending Dues'],
    datasets: [
      {
        data: [summary.totalCollected, summary.totalDues],
        backgroundColor: [
          'rgba(46, 125, 50, 0.8)',
          'rgba(244, 67, 54, 0.8)',
        ],
        borderColor: [
          'rgba(46, 125, 50, 1)',
          'rgba(244, 67, 54, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const shopStatusConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Shop Status Distribution',
        font: {
          size: isMobile ? 12 : 14,
        },
      },
    },
  };

  const shopStatusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [statusData.activeShops, statusData.inactiveShops],
        backgroundColor: [
          'rgba(46, 125, 50, 0.8)',
          'rgba(158, 158, 158, 0.8)',
        ],
        borderColor: [
          'rgba(46, 125, 50, 1)',
          'rgba(158, 158, 158, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Collection rate trend (cumulative)
  const getCollectionRateTrend = () => {
    let cumulativeCollected = 0;
    let cumulativeExpected = 0;

    return monthlyData.map(monthData => {
      cumulativeCollected += monthData.collected;
      cumulativeExpected += monthData.expected;

      return {
        month: monthData.month,
        rate: cumulativeExpected > 0 ? (cumulativeCollected / cumulativeExpected) * 100 : 0,
      };
    });
  };

  const collectionRateTrend = getCollectionRateTrend();

  const collectionRateConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Cumulative Collection Rate - ${selectedYear}`,
        font: {
          size: isMobile ? 12 : 14,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  const collectionRateData = {
    labels: collectionRateTrend.map(d => d.month),
    datasets: [
      {
        label: 'Collection Rate (%)',
        data: collectionRateTrend.map(d => d.rate),
        borderColor: 'rgba(156, 39, 176, 1)',
        backgroundColor: 'rgba(156, 39, 176, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <Box>
      {/* Charts */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} lg={12}>
          <Card>
            <CardContent>
              <Box sx={{ height: isMobile ? 300 : 400 }}>
                <Bar data={monthlyCollectionChartData} options={monthlyCollectionConfig} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ height: isMobile ? 300 : 400 }}>
                <Line data={collectionRateData} options={collectionRateConfig} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ height: isMobile ? 300 : 400 }}>
                <Doughnut data={collectionSummaryData} options={collectionSummaryConfig} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollectionGraphs;
