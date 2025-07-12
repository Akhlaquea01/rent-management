import React, { useState } from 'react';
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
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useRentContext } from "../context/RentContext";

const Reports: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data } = state;
  const now = new Date();
  const currentYear = 2020; // Use 2020 as current year (latest available)
  const currentMonth = now.getMonth(); // 0-based
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
  );

  // Available years to fetch (2019 to 2020 - will expand to 2025 later)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= 2020; year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a);
  }, []);

  // Get loaded years from data
  const loadedYears = Object.keys(data.years)
    .map(Number)
    .sort((a, b) => b - a);

  // Fetch year data when selected year changes
  React.useEffect(() => {
    if (selectedYear && !data.years[selectedYear.toString()] && !isYearLoading(selectedYear.toString())) {
      fetchYearData(selectedYear.toString());
    }
  }, [selectedYear, data.years, fetchYearData, isYearLoading]);

  // Get shops for selected year
  const selectedYearShops = data.years[selectedYear.toString()]?.shops || {};

  // Compute stats from new data structure
  const shopsArray = Object.entries(selectedYearShops).map(
    ([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      ...shop,
    })
  );

  const totalShops = shopsArray.length;
  const activeShops = shopsArray.filter(
    (shop: any) => shop.tenant.status === "Active"
  ).length;
  const inactiveShops = totalShops - activeShops;

  const totalAdvance = shopsArray.reduce(
    (sum: number, shop: any) => sum + shop.advanceAmount,
    0
  );

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

  const getMonthlyStats = () => {
    const monthName = new Date(selectedMonth + "-01").toLocaleDateString(
      "en-US",
      { month: "long" }
    );
    let totalRent = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let partialCount = 0;

    shopsArray.forEach((shop: any) => {
      const monthlyData = shop.monthlyData || {};
      const monthData = monthlyData[monthName] || {
        rent: shop.rentAmount,
        paid: 0,
        status: "Pending",
      };
      totalRent += monthData.rent || shop.rentAmount;
      totalCollected += monthData.paid || 0;
      if (monthData.status === "Overdue") overdueCount++;
      if (monthData.status === "Partial") partialCount++;
    });

    const totalPending = totalRent - totalCollected;

    return {
      totalRent,
      totalCollected,
      totalPending,
      overdueCount,
      partialCount,
      collectionRate: totalRent > 0 ? (totalCollected / totalRent) * 100 : 0,
    };
  };

  const getYearlyStats = () => {
    let totalRent = 0;
    let totalCollected = 0;
    const now = new Date();
    const isCurrentYear = selectedYear === now.getFullYear();
    const monthsToInclude = isCurrentYear ? now.getMonth() + 1 : 12;
    shopsArray.forEach((shop: any) => {
      const monthlyData = shop.monthlyData || {};
      months.slice(0, monthsToInclude).forEach((month) => {
        const monthData = monthlyData[month] || {
          rent: shop.rentAmount,
          paid: 0,
        };
        totalRent += monthData.rent || shop.rentAmount;
        totalCollected += monthData.paid || 0;
      });
    });
    const totalPending = totalRent - totalCollected;
    return {
      totalRent,
      totalCollected,
      totalPending,
      collectionRate: totalRent > 0 ? (totalCollected / totalRent) * 100 : 0,
    };
  };

  const monthlyStats = getMonthlyStats();
  const yearlyStats = getYearlyStats();

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
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
            onClick={() => {
              // Export Monthly Report
              const monthName = new Date(
                selectedMonth + "-01"
              ).toLocaleDateString("en-US", { month: "long" });
              const exportData = shopsArray.map((shop: any) => {
                const monthData = shop.monthlyData?.[monthName] || {
                  rent: shop.rentAmount,
                  paid: 0,
                  status: "Pending",
                };
                return {
                  Shop: shop.shopNumber,
                  "Tenant Name": shop.tenant.name,
                  "Rent Amount": monthData.rent || shop.rentAmount,
                  "Paid Amount": monthData.paid || 0,
                  Status: monthData.status,
                };
              });
              const ws = XLSX.utils.json_to_sheet(exportData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "MonthlyReport");
              XLSX.writeFile(
                wb,
                `MonthlyReport_${selectedYear}_${monthName}.xlsx`
              );
            }}
          >
            Export Monthly Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Export Annual Report (tabular, styled)
              const now = new Date();
              const isCurrentYear = selectedYear === now.getFullYear();
              const monthsToInclude = isCurrentYear ? now.getMonth() + 1 : 12;
              const monthCols = months.slice(0, monthsToInclude);
              const wsRows: any[] = [];
              // Header
              const header = [
                "Shop",
                "Tenant Name",
                "Rent Amount",
                "Advance Remaining",
                "Previous Year Pending Months",
                "Current Year Pending Months",
                ...monthCols,
              ];
              wsRows.push(header);
              shopsArray.forEach((shop: any) => {
                // Advance Remaining
                const transactions =
                  data.advanceTransactions[shop.shopNumber] || [];
                const advanceRemaining = transactions.reduce(
                  (acc: number, t: any) =>
                    t.type === "Deposit" ? acc + t.amount : acc - t.amount,
                  0
                );
                // Previous Year Pending Months
                const prevPending = (
                  shop.previousYearDues?.dueMonths || []
                ).join(", ");
                // Current Year Pending Months
                const monthlyData = shop.monthlyData || {};
                const currPendingMonths = monthCols
                  .filter((month) => {
                    const m = monthlyData[month];
                    return !m || m.status !== "Paid";
                  })
                  .join(", ");
                // Row
                const row = [
                  shop.shopNumber,
                  shop.tenant.name,
                  shop.rentAmount,
                  advanceRemaining,
                  prevPending,
                  currPendingMonths,
                  ...monthCols.map((month) => {
                    const m = monthlyData[month];
                    return m && m.status === "Paid" ? m.paid : "";
                  }),
                ];
                wsRows.push(row);
              });
              // Create worksheet
              const ws = XLSX.utils.aoa_to_sheet(wsRows);
              // Style: highlight pending months and rows with dues
              shopsArray.forEach((shop: any, i: number) => {
                const rowIdx = i + 1; // header is row 0
                const monthlyData = shop.monthlyData || {};
                // Row highlight for dues
                if (
                  (shop.totalDuesBalance || 0) > 0 ||
                  (shop.previousYearDues?.totalDues || 0) > 0
                ) {
                  for (let c = 0; c < wsRows[0].length; c++) {
                    const cell = XLSX.utils.encode_cell({ r: rowIdx, c });
                    if (!ws[cell]) ws[cell] = { t: "s", v: "" };
                    ws[cell].s = { fill: { fgColor: { rgb: "FFEBEE" } } }; // light red
                  }
                }
                // Highlight pending months
                monthCols.forEach((month, mIdx) => {
                  const m = monthlyData[month];
                  if (!m || m.status !== "Paid") {
                    const cell = XLSX.utils.encode_cell({
                      r: rowIdx,
                      c: 6 + mIdx,
                    });
                    if (!ws[cell]) ws[cell] = { t: "s", v: "" };
                    ws[cell].s = { fill: { fgColor: { rgb: "FFF9C4" } } }; // yellow
                  }
                });
              });
              // Set column widths
              ws["!cols"] = [
                { wch: 10 }, // Shop
                { wch: 24 }, // Tenant Name
                { wch: 12 }, // Rent Amount
                { wch: 16 }, // Advance Remaining
                { wch: 28 }, // Prev Year Pending
                { wch: 28 }, // Curr Year Pending
                ...monthCols.map(() => ({ wch: 10 })),
              ];
              // Create workbook and export
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "AnnualReport");
              XLSX.writeFile(wb, `AnnualReport_${selectedYear}_tabular.xlsx`);
            }}
          >
            Export Annual Report
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Shops
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totalShops}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {activeShops} Active, {inactiveShops} Inactive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monthly Collection Rate
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "success.main" }}
              >
                {monthlyStats.collectionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{monthlyStats.totalCollected.toLocaleString()} / ₹
                {monthlyStats.totalRent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Yearly Collection Rate
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                {yearlyStats.collectionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ₹{yearlyStats.totalCollected.toLocaleString()} / ₹
                {yearlyStats.totalRent.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Advance Balance
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "info.main" }}
              >
                ₹{totalAdvance.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Across all shops
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Year</InputLabel>
            <Select
              value={selectedYear}
              label="Select Year"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year} {loadedYears.includes(year) ? '(Loaded)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Select Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month, index) => {
                const monthValue = `${selectedYear}-${String(
                  index + 1
                ).padStart(2, "0")}`;
                return (
                  <MenuItem key={monthValue} value={monthValue}>
                    {month} {selectedYear}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Detailed Reports */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Payment Status -{" "}
                {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                  month: "long",
                })}
              </Typography>
              <TableContainer
                component={Paper}
                sx={{ maxHeight: 400, overflow: "auto" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Shop</TableCell>
                      <TableCell align="right">Rent</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shopsArray.map((shop: any) => {
                      const monthName = new Date(
                        selectedMonth + "-01"
                      ).toLocaleDateString("en-US", { month: "long" });
                      const monthData = shop.monthlyData?.[monthName] || {
                        rent: shop.rentAmount,
                        paid: 0,
                        status: "Pending",
                      };
                      const status = monthData.status;
                      const paidAmount = monthData.paid;

                      return (
                        <TableRow
                          key={shop.shopNumber}
                          sx={{
                            backgroundColor:
                              shop.tenant.status === "Inactive"
                                ? "#ffebee"
                                : "inherit",
                          }}
                        >
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell align="right">
                            ₹{shop.rentAmount.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ₹{paidAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={status}
                              color={getStatusColor(status) as any}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Collection
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "success.main" }}
                  >
                    ₹{monthlyStats.totalCollected.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Monthly Pending
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "warning.main" }}
                  >
                    ₹{monthlyStats.totalPending.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Overdue Count
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "error.main" }}
                  >
                    {monthlyStats.overdueCount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Partial Payments
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "info.main" }}
                  >
                    {monthlyStats.partialCount}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Yearly Summary - {selectedYear}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Collected
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "success.main" }}
                  >
                    ₹{yearlyStats.totalCollected.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Total Pending
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "warning.main" }}
                  >
                    ₹{yearlyStats.totalPending.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Printable Report */}
      <Box sx={{ display: "none", "@media print": { display: "block" } }}>
        <Paper sx={{ p: 3, m: 2 }}>
          <Typography variant="h4" gutterBottom align="center">
            Rent Management Report
          </Typography>
          <Typography variant="h6" gutterBottom align="center">
            {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
              month: "long",
            })}{" "}
            - {selectedYear}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography variant="h6">Total Shops: {totalShops}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">Active Shops: {activeShops}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Monthly Collection: ₹
                {monthlyStats.totalCollected.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Collection Rate: {monthlyStats.collectionRate.toFixed(1)}%
              </Typography>
            </Grid>
          </Grid>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Shop</TableCell>
                  <TableCell align="right">Rent</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shopsArray.map((shop: any) => {
                  const monthName = new Date(
                    selectedMonth + "-01"
                  ).toLocaleDateString("en-US", { month: "long" });
                  const monthData = shop.monthlyData?.[monthName] || {
                    rent: shop.rentAmount,
                    paid: 0,
                    status: "Pending",
                  };
                  const status = monthData.status;
                  const paidAmount = monthData.paid;

                  return (
                    <TableRow key={shop.shopNumber}>
                      <TableCell>{shop.shopNumber}</TableCell>
                      <TableCell align="right">
                        ₹{shop.rentAmount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ₹{paidAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>{status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Reports;