import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Divider,
  Tooltip,
} from "@mui/material";
import { Print as PrintIcon } from "@mui/icons-material";
import { useRentContext } from "../context/RentContext";

// Types for better type safety
interface MonthlyData {
  month: string;
  rentAmount: number;
  paidAmount: number;
  advanceDeduction: number;
  status: string;
  paymentDate: string;
}

interface YearlyData {
  totalRent: number;
  totalPaid: number;
  totalPending: number;
  advanceBalance: number;
  monthlyData: MonthlyData[];
  status: string;
}

interface YearSection {
  year: string;
  data: YearlyData;
}

interface AllYearsData {
  totalRent: number;
  totalPaid: number;
  totalPending: number;
  advanceBalance: number;
  yearSections: YearSection[];
}

// Reusable function to generate table title
const getTableTitle = (year: string) => `Monthly Rent History - ${year}`;

// Comprehensive component to handle all table rendering scenarios
const RentHistoryTables: React.FC<{
  selectedYear: string;
  selectedShopNumber: string;
  allYearsData: AllYearsData | null;
  getYearlyData: (shopNumber: string, year: string) => YearlyData | null;
  isPrintView?: boolean;
}> = ({ selectedYear, selectedShopNumber, allYearsData, getYearlyData, isPrintView = false }) => {
  const tableProps = {
    showChip: !isPrintView,
    size: isPrintView ? "small" as const : "medium" as const,
    component: isPrintView ? Box : Paper,
  };

  if (selectedYear === "All Years" && allYearsData) {
    return (
      <>
        {allYearsData.yearSections.map(({ year, data }) => (
          <Box key={year} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {getTableTitle(year)}
            </Typography>
            <RentTable 
              monthlyData={data.monthlyData} 
              {...tableProps}
            />
          </Box>
        ))}
      </>
    );
  }

  const yearlyData = getYearlyData(selectedShopNumber, selectedYear);
  
  return (
    <>
      <Typography variant="h6" gutterBottom>
        {getTableTitle(selectedYear)}
      </Typography>
      {yearlyData ? (
        <RentTable 
          monthlyData={yearlyData.monthlyData} 
          {...tableProps}
        />
      ) : (
        <Typography color="textSecondary" align="center">
          Select a shop and year to view history
        </Typography>
      )}
    </>
  );
};

// Reusable table header component
const RentTableHeader: React.FC = () => (
  <TableHead>
    <TableRow>
      <TableCell>Month</TableCell>
      <TableCell align="right">Rent Amount</TableCell>
      <TableCell align="right">Paid Amount</TableCell>
      <TableCell align="right">Advance Used</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Payment Date</TableCell>
    </TableRow>
  </TableHead>
);

// Reusable table row component
const RentTableRow: React.FC<{ monthData: MonthlyData; showChip?: boolean }> = ({ 
  monthData, 
  showChip = true 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Pending":
        return "warning";
      case "Partial":
        return "info";
      case "Overdue":
        return "error";
      default:
        return "default";
    }
  };

  const formatPaymentDate = (date: string) => {
    if (date && !isNaN(new Date(date).getTime())) {
      return new Date(date).toLocaleDateString();
    }
    return "-";
  };

  return (
    <TableRow
      key={monthData.month}
      sx={
        monthData.paidAmount + monthData.advanceDeduction > monthData.rentAmount
          ? { backgroundColor: '#fff9c4' } // light yellow
          : undefined
      }
    >
      <TableCell>{monthData.month}</TableCell>
      <TableCell align="right">
        ₹{monthData.rentAmount.toLocaleString()}
      </TableCell>
      <TableCell align="right">
        ₹{monthData.paidAmount.toLocaleString()}
      </TableCell>
      <TableCell align="right">
        ₹{monthData.advanceDeduction.toLocaleString()}
      </TableCell>
      <TableCell>
        {showChip ? (
          <Chip
            label={monthData.status}
            color={getStatusColor(monthData.status) as any}
            size="small"
          />
        ) : (
          monthData.status
        )}
      </TableCell>
      <TableCell>{formatPaymentDate(monthData.paymentDate)}</TableCell>
    </TableRow>
  );
};

// Reusable rent table component
const RentTable: React.FC<{ 
  monthlyData: MonthlyData[]; 
  showChip?: boolean;
  size?: "small" | "medium";
  component?: React.ElementType;
}> = ({ 
  monthlyData, 
  showChip = true, 
  size = "medium",
  component = Paper 
}) => (
  <TableContainer component={component}>
    <Table size={size}>
      <RentTableHeader />
      <TableBody>
        {monthlyData.map((monthData) => (
          <RentTableRow 
            key={monthData.month} 
            monthData={monthData} 
            showChip={showChip} 
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Reusable summary component
const SummarySection: React.FC<{ 
  data: YearlyData | AllYearsData | null;
  selectedYear: string;
  selectedShopNumber: string;
  getYearlyData: (shopNumber: string, year: string) => YearlyData | null;
  allYearsData: AllYearsData | null;
}> = ({ data, selectedYear, selectedShopNumber, getYearlyData, allYearsData }) => {
  const getValue = (key: keyof YearlyData) => {
    if (selectedYear === "All Years") {
      return allYearsData?.[key];
    }
    return getYearlyData(selectedShopNumber, selectedYear)?.[key];
  };

  const summaryItems = [
    { label: "Total Rent", value: getValue("totalRent"), color: "text.primary" },
    { label: "Total Paid", value: getValue("totalPaid"), color: "success.main" },
    { label: "Pending", value: getValue("totalPending"), color: "warning.main" },
    { label: "Advance Balance", value: getValue("advanceBalance"), color: "primary.main" },
  ];

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Summary
      </Typography>
      <Grid container spacing={1}>
        {summaryItems.map((item) => (
          <Grid item xs={6} key={item.label}>
            <Typography variant="body2" color="textSecondary">
              {item.label}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ fontWeight: "bold", color: item.color }}
            >
              ₹{item.value?.toLocaleString()}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Reusable print summary component
const PrintSummary: React.FC<{
  selectedShopNumber: string;
  selectedYear: string;
  activeShops: Array<{ shopNumber: string; tenant: any; year: string }>;
  allYearsData: AllYearsData | null;
  getYearlyData: (shopNumber: string, year: string) => YearlyData | null;
}> = ({ selectedShopNumber, selectedYear, activeShops, allYearsData, getYearlyData }) => {
  const getValue = (key: keyof YearlyData) => {
    if (selectedYear === "All Years") {
      return allYearsData?.[key];
    }
    return getYearlyData(selectedShopNumber, selectedYear)?.[key];
  };

  const summaryItems = [
    { label: "Total Rent", value: getValue("totalRent") },
    { label: "Total Paid", value: getValue("totalPaid") },
    { label: "Pending", value: getValue("totalPending") },
    { label: "Advance Balance", value: getValue("advanceBalance") },
  ];

  return (
    <Box
      className="print-summary"
      sx={{
        display: "none",
        "@media print": {
          display: "block",
          background: "white",
          color: "black",
          p: 4,
        },
      }}
    >
      <Paper elevation={0} sx={{ boxShadow: "none", p: 4, m: 0 }}>
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ fontWeight: "bold" }}
        >
          Rent Summary Report
        </Typography>
        {selectedShopNumber && (
          <Typography variant="h6" gutterBottom align="center">
            {
              activeShops.find((s) => s.shopNumber === selectedShopNumber)
                ?.tenant.name
            }{" "}
            - Shop {selectedShopNumber}
          </Typography>
        )}
        <Typography variant="body1" gutterBottom align="center">
          {selectedYear === "All Years"
            ? "All Years"
            : `Year: ${selectedYear}`}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryItems.map((item) => (
            <Grid item xs={6} key={item.label}>
              <Typography variant="h6">
                {item.label}: ₹{item.value?.toLocaleString()}
              </Typography>
            </Grid>
          ))}
        </Grid>
        
                <RentHistoryTables
          selectedYear={selectedYear}
          selectedShopNumber={selectedShopNumber}
          allYearsData={allYearsData}
          getYearlyData={getYearlyData}
          isPrintView={true}
        />
      </Paper>
    </Box>
  );
};

const TenantHistory: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data } = state;
  const [selectedShopNumber, setSelectedShopNumber] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Available years to fetch (2019 to current year)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= new Date().getFullYear(); year++) {
      years.push(year.toString());
    }
    return years.sort((a, b) => b.localeCompare(a));
  }, []);

  // Get loaded years from data
  const loadedYears = Object.keys(data.years)
    .map(String)
    .sort((a, b) => b.localeCompare(a));
  const allYearOptions = ["All Years", ...availableYears];

  // Fetch year data when selected year changes (if not "All Years")
  React.useEffect(() => {
    if (selectedYear && selectedYear !== "All Years" && !data.years[selectedYear] && !isYearLoading(selectedYear)) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, data.years, fetchYearData, isYearLoading]);

  // Get all shops from all years
  const allShops: Array<{ shopNumber: string; tenant: any; year: string }> = [];
  Object.entries(data.years).forEach(([year, yearData]: [string, any]) => {
    Object.entries(yearData.shops).forEach(
      ([shopNumber, shop]: [string, any]) => {
        allShops.push({
          shopNumber,
          tenant: shop.tenant,
          year,
        });
      }
    );
  });

  // Get unique active shops
  const activeShops = allShops
    .filter((shop) => shop.tenant.status === "Active")
    .filter(
      (shop, index, self) =>
        index === self.findIndex((s) => s.shopNumber === shop.shopNumber)
    );

  // Helper: months up to today for a given year
  const getMonthsUpToToday = (year: string) => {
    // const now = new Date();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    // if (Number(year) < now.getFullYear()) return months;
    // if (Number(year) > now.getFullYear()) return [];
    return months;
  };

  // Helper: get rent data for a shop and year, only up to today
  const getYearlyData = (shopNumber: string, year: string): YearlyData | null => {
    const shop = data.years[year]?.shops[shopNumber];
    if (!shop) return null;
    const months = getMonthsUpToToday(year);
    let totalRent = 0;
    let totalPaid = 0;
    const monthlyDataArray = months.map((month) => {
      // Get the specific month's data
      const monthData = shop.monthlyData?.[month];
      
      // Determine the rent amount for this specific month
      // If monthData exists and has a rent amount, use it
      // Otherwise, fall back to the shop's default rent amount
      const rentAmount = monthData?.rent !== undefined ? monthData.rent : shop.rentAmount;
      
      // Use the month data if it exists, otherwise create default data
      const finalMonthData = monthData || {
        rent: shop.rentAmount,
        paid: 0,
        status: "Pending",
        advanceUsed: 0,
      };
      
      totalRent += rentAmount;
      totalPaid += finalMonthData.paid || 0;
      
      return {
        month,
        rentAmount: rentAmount,
        paidAmount: finalMonthData.paid || 0,
        advanceDeduction: finalMonthData.advanceUsed || 0,
        status: finalMonthData.status || "Pending",
        paymentDate: (finalMonthData as any).date || "-",
      };
    });
    // Calculate advance balance from transactions
    const transactions = data.advanceTransactions[shopNumber] || [];
    const advanceBalance = transactions.reduce(
      (acc: number, t: any) =>
        t.type === "Deposit" ? acc + t.amount : acc - t.amount,
      0
    );
    return {
      totalRent,
      totalPaid,
      totalPending: totalRent - totalPaid,
      advanceBalance,
      monthlyData: monthlyDataArray,
      status: shop.tenant.status,
    };
  };

  // For All Years: aggregate data
  const allYearsData = React.useMemo((): AllYearsData | null => {
    if (!selectedShopNumber || selectedYear !== "All Years") return null;
    let totalRent = 0,
      totalPaid = 0,
      totalPending = 0,
      advanceBalance = 0;
    const yearSections: Array<{ year: string; data: YearlyData }> = [];
    availableYears
      .slice()
      .reverse()
      .forEach((year) => {
        const yd = getYearlyData(selectedShopNumber, year);
        if (yd) {
          totalRent += yd.totalRent;
          totalPaid += yd.totalPaid;
          totalPending += yd.totalPending;
          advanceBalance = yd.advanceBalance; // last year wins
          yearSections.push({ year, data: yd });
        }
      });
    return { totalRent, totalPaid, totalPending, advanceBalance, yearSections };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShopNumber, selectedYear, data, availableYears, getYearlyData]);

  // Tooltip: pending months grouped by year
  const getPendingTooltip = () => {
    if (!selectedShopNumber) return "";
    const pendingByYear: Record<string, string[]> = {};
    let totalPending = 0;
    availableYears.forEach((year) => {
      const yd = getYearlyData(selectedShopNumber, year);
      if (yd) {
        const months = yd.monthlyData
          .filter((m: MonthlyData) => m.status !== "Paid")
          .map((m: MonthlyData) => m.month);
        if (months.length) {
          pendingByYear[year] = months;
          totalPending += yd.totalPending;
        }
      }
    });
    let tooltip = `Total pending months: ${Object.values(pendingByYear).reduce(
      (a, b) => a + b.length,
      0
    )}\n`;
    Object.entries(pendingByYear).forEach(([year, months]) => {
      tooltip += `${year}: ${months.join(", ")}\n`;
    });
    tooltip += `Total pending amount: ₹${totalPending.toLocaleString()}`;
    return tooltip;
  };

  // Get current data for display
  const currentData = selectedYear === "All Years" 
    ? allYearsData 
    : getYearlyData(selectedShopNumber, selectedYear);

  // Render
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Tooltip title={getPendingTooltip()} arrow placement="bottom">
          <Typography variant="h4" sx={{ cursor: "pointer" }}>
            Shop History
          </Typography>
        </Tooltip>
        {currentData && (
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print Summary
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Shop & Year
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Choose Shop</InputLabel>
                <Select
                  value={selectedShopNumber}
                  label="Choose Shop"
                  onChange={(e) =>
                    setSelectedShopNumber(e.target.value as string)
                  }
                >
                  {activeShops.map((shop) => (
                    <MenuItem key={shop.shopNumber} value={shop.shopNumber}>
                      {shop.tenant.name} - Shop {shop.shopNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Select Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Select Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {allYearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentData && (
                <SummarySection
                  data={currentData}
                  selectedYear={selectedYear}
                  selectedShopNumber={selectedShopNumber}
                  getYearlyData={getYearlyData}
                  allYearsData={allYearsData}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <RentHistoryTables
                selectedYear={selectedYear}
                selectedShopNumber={selectedShopNumber}
                allYearsData={allYearsData}
                getYearlyData={getYearlyData}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Printable Summary */}
      <PrintSummary
        selectedShopNumber={selectedShopNumber}
        selectedYear={selectedYear}
        activeShops={activeShops}
        allYearsData={allYearsData}
        getYearlyData={getYearlyData}
      />

      {/* Hide all non-essential UI in print mode */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-summary, .print-summary * { visibility: visible !important; }
          .print-summary {
            display: block !important;
            position: absolute !important;
            left: 0; top: 0; width: 100vw;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            padding: 32px !important;
            margin: 0 !important;
            z-index: 9999;
            page-break-after: avoid;
          }
          table, tr, td, th {
            page-break-inside: avoid !important;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default TenantHistory;
