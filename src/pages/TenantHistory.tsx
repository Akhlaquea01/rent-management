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

const TenantHistory: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data } = state;
  const [selectedShopNumber, setSelectedShopNumber] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("2020");

  // Available years to fetch (2019 to 2020 - will expand to 2025 later)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= 2020; year++) {
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
  const getYearlyData = (shopNumber: string, year: string) => {
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

  // Helper: get color for status
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

  // For All Years: aggregate data
  const allYearsData = React.useMemo(() => {
    if (!selectedShopNumber || selectedYear !== "All Years") return null;
    let totalRent = 0,
      totalPaid = 0,
      totalPending = 0,
      advanceBalance = 0;
    const yearSections: Array<{ year: string; data: any }> = [];
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
          .filter((m: any) => m.status !== "Paid")
          .map((m: any) => m.month);
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
        {(selectedYear === "All Years"
          ? allYearsData
          : getYearlyData(selectedShopNumber, selectedYear)) && (
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

              {(selectedYear === "All Years"
                ? allYearsData
                : getYearlyData(selectedShopNumber, selectedYear)) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Rent
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        ₹
                        {(selectedYear === "All Years"
                          ? allYearsData?.totalRent
                          : getYearlyData(selectedShopNumber, selectedYear)
                              ?.totalRent
                        )?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Paid
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", color: "success.main" }}
                      >
                        ₹
                        {(selectedYear === "All Years"
                          ? allYearsData?.totalPaid
                          : getYearlyData(selectedShopNumber, selectedYear)
                              ?.totalPaid
                        )?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Pending
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", color: "warning.main" }}
                      >
                        ₹
                        {(selectedYear === "All Years"
                          ? allYearsData?.totalPending
                          : getYearlyData(selectedShopNumber, selectedYear)
                              ?.totalPending
                        )?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Advance Balance
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        ₹
                        {(selectedYear === "All Years"
                          ? allYearsData?.advanceBalance
                          : getYearlyData(selectedShopNumber, selectedYear)
                              ?.advanceBalance
                        )?.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {selectedYear === "All Years" && allYearsData ? (
                <>
                  {allYearsData.yearSections.map(({ year, data }) => (
                    <Box key={year} sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Monthly Rent History1 - {year}
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table>
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
                          <TableBody>
                            {data.monthlyData.map(
                              (monthData: any, index: number) => (
                                <TableRow key={monthData.month}>
                                  <TableCell>{monthData.month}</TableCell>
                                  <TableCell align="right">
                                    ₹{monthData.rentAmount.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right">
                                    ₹{monthData.paidAmount.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right">
                                    ₹
                                    {monthData.advanceDeduction.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={monthData.status}
                                      color={
                                        getStatusColor(monthData.status) as any
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {monthData.paymentDate &&
                                    !isNaN(
                                      new Date(monthData.paymentDate).getTime()
                                    )
                                      ? new Date(
                                          monthData.paymentDate
                                        ).toLocaleDateString()
                                      : "-"}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ))}
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Monthly Rent History2 - {selectedYear}
                  </Typography>
                  {getYearlyData(selectedShopNumber, selectedYear) ? (
                    <TableContainer component={Paper}>
                      <Table>
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
                        <TableBody>
                          {getYearlyData(
                            selectedShopNumber,
                            selectedYear
                          )?.monthlyData.map(
                            (monthData: any, index: number) => (
                              <TableRow key={monthData.month}>
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
                                  <Chip
                                    label={monthData.status}
                                    color={
                                      getStatusColor(monthData.status) as any
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {monthData.paymentDate &&
                                  !isNaN(
                                    new Date(monthData.paymentDate).getTime()
                                  )
                                    ? new Date(
                                        monthData.paymentDate
                                      ).toLocaleDateString()
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="textSecondary" align="center">
                      Select a shop and year to view history
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Printable Summary */}
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
            <Grid item xs={6}>
              <Typography variant="h6">
                Total Rent: ₹
                {(selectedYear === "All Years"
                  ? allYearsData?.totalRent
                  : getYearlyData(selectedShopNumber, selectedYear)?.totalRent
                )?.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Total Paid: ₹
                {(selectedYear === "All Years"
                  ? allYearsData?.totalPaid
                  : getYearlyData(selectedShopNumber, selectedYear)?.totalPaid
                )?.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Pending: ₹
                {(selectedYear === "All Years"
                  ? allYearsData?.totalPending
                  : getYearlyData(selectedShopNumber, selectedYear)
                      ?.totalPending
                )?.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">
                Advance Balance: ₹
                {(selectedYear === "All Years"
                  ? allYearsData?.advanceBalance
                  : getYearlyData(selectedShopNumber, selectedYear)
                      ?.advanceBalance
                )?.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
          {selectedYear === "All Years" && allYearsData ? (
            allYearsData.yearSections.map(({ year, data }) => (
              <Box key={year} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Rent History3 - {year}
                </Typography>
                <TableContainer>
                  <Table size="small">
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
                    <TableBody>
                      {data.monthlyData.map((monthData: any) => (
                        <TableRow key={monthData.month}>
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
                          <TableCell>{monthData.status}</TableCell>
                          <TableCell>
                            {monthData.paymentDate &&
                            !isNaN(new Date(monthData.paymentDate).getTime())
                              ? new Date(
                                  monthData.paymentDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Monthly Rent History4 - {selectedYear}
              </Typography>
              {getYearlyData(selectedShopNumber, selectedYear) && (
                <TableContainer>
                  <Table size="small">
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
                    <TableBody>
                      {getYearlyData(
                        selectedShopNumber,
                        selectedYear
                      )?.monthlyData.map((monthData: any) => (
                        <TableRow key={monthData.month}>
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
                          <TableCell>{monthData.status}</TableCell>
                          <TableCell>
                            {monthData.paymentDate &&
                            !isNaN(new Date(monthData.paymentDate).getTime())
                              ? new Date(
                                  monthData.paymentDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>
      </Box>
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
