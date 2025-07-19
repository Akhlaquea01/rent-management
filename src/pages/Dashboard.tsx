import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  AccountBalance as AccountBalanceIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useRentContext } from "../context/RentContext";
import * as XLSX from "xlsx";
import ContextDebugger from "../components/ContextDebugger";
import { calculateTotalDues } from "../utils/duesCalculator";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              color="textSecondary"
              gutterBottom
              variant={isMobile ? "caption" : "body2"}
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? "h6" : "h4"}
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant={isMobile ? "caption" : "body2"}
                color="textSecondary"
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: "50%",
              p: isMobile ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: isMobile ? 20 : 24, color: "white" },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { state, fetchYearData, isYearLoading } = useRentContext();
  const { data, loading, error } = state;
  
  // Available years to fetch (2019 to 2022 - will expand to 2025 later)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= 2022; year++) {
      years.push(year.toString());
    }
    return years.sort().reverse();
  }, []);

  const loadedYears = data && data.years ? Object.keys(data.years).sort().reverse() : [];
  const defaultYear = loadedYears.includes("2022")
    ? "2022"
    : loadedYears[0] || "2022";
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch year data when selected year changes
  React.useEffect(() => {
    if (selectedYear && !data.years[selectedYear] && !isYearLoading(selectedYear)) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, data.years, fetchYearData, isYearLoading]);

  if (loading && loadedYears.length === 0) return <div>Loading...</div>;
  if (error && error.includes(selectedYear)) return <div style={{ color: "red" }}>{error}</div>;
  if (!data || !data.years) return <div>No data available.</div>;
  const shops = data.years[selectedYear]?.shops || {};

  // Compute dashboard stats from new data structure
  const shopsArray = Object.entries(shops).map(
    ([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      ...shop,
      totalDuesWithPrevious: calculateTotalDues(shop),
    })
  );

  const totalShops = shopsArray.length;
  const activeShops = shopsArray.filter(
    (shop: any) => shop.tenant.status === "Active"
  ).length;
  const inactiveShops = totalShops - activeShops;

  const totalRentCollected = shopsArray.reduce((sum: number, shop: any) => {
    const monthlyData = shop.monthlyData || {};
    const monthlySum: number = (Object.values(monthlyData) as any[]).reduce(
      (monthSum: number, month: any) => monthSum + (Number(month.paid) || 0),
      0
    );
    return sum + monthlySum;
  }, 0);

  const totalDues = shopsArray.reduce(
    (sum: number, shop: any) => sum + calculateTotalDues(shop),
    0
  );

  const totalAdvance = shopsArray.reduce((sum: number, shop: any) => {
    // Calculate current advance balance from transactions
    const transactions = data.advanceTransactions[shop.shopNumber] || [];
    const currentBalance = transactions.reduce(
      (acc: number, t: any) => {
        if (t.type === "Deposit") {
          return acc + t.amount;
        } else if (t.type === "Advance Deduction" || t.type === "Deduction") {
          return acc - t.amount;
        }
        return acc;
      },
      0
    );
    return sum + currentBalance;
  }, 0);

  const monthlyCollection = Object.entries(shops).map(
    ([shopNumber, shop]: [string, any]) => {
      const monthlyData = shop.monthlyData || {};
      const currentMonth = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const currentMonthData = monthlyData[currentMonth.split(" ")[0]] || {
        paid: 0,
      };
      return {
        month: currentMonth,
        amount: currentMonthData.paid,
      };
    }
  );

  const stats = {
    totalShops,
    activeShops,
    inactiveShops,
    totalRentCollected,
    totalDues,
    totalAdvance,
    monthlyCollection,
  };

  const recentShops = shopsArray.sort(
    (a: any, b: any) =>
      new Date(b.tenant.agreementDate).getTime() -
      new Date(a.tenant.agreementDate).getTime()
  );

  const overdueShops = shopsArray
    .filter((shop: any) => shop.totalDuesWithPrevious > 0)
    .sort(
      (a: any, b: any) => b.totalDuesWithPrevious - a.totalDuesWithPrevious
    );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Dashboard Overview
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year} {loadedYears.includes(year) ? '(Loaded)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4, width: "100%" }}>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Shops"
            value={stats.totalShops}
            icon={<PeopleIcon sx={{ color: "white" }} />}
            color="#1976d2"
            subtitle={`${stats.activeShops} Active, ${stats.inactiveShops} Inactive`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Rent Collected"
            value={`₹${stats.totalRentCollected.toLocaleString()}`}
            icon={<PaymentIcon sx={{ color: "white" }} />}
            color="#2e7d32"
            subtitle="Total collected this year"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Total Dues"
            value={`₹${stats.totalDues.toLocaleString()}`}
            icon={<WarningIcon sx={{ color: "white" }} />}
            color="#ed6c02"
            subtitle="Pending payments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
          <StatCard
            title="Advance Balance"
            value={`₹${stats.totalAdvance.toLocaleString()}`}
            icon={<AccountBalanceIcon sx={{ color: "white" }} />}
            color="#9c27b0"
            subtitle="Total advance deposits"
          />
        </Grid>
      </Grid>

      {/* Recent Activity and Overdue Tenants */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={6} sx={{ width: "100%" }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Shops
              </Typography>
              {isMobile ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {recentShops.map((shop: any) => (
                    <Card
                      key={shop.shopNumber}
                      variant="outlined"
                      sx={{ p: 1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {shop.tenant.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Shop {shop.shopNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Chip
                            label={shop.tenant.status}
                            size="small"
                            color={
                              shop.tenant.status === "Active"
                                ? "success"
                                : "default"
                            }
                          />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            ₹{shop.rentAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer
                  sx={{ height: 300, overflow: "auto", width: "100%" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Shop</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentShops.map((shop: any) => (
                        <TableRow key={shop.shopNumber}>
                          <TableCell>{shop.tenant.name}</TableCell>
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell>
                            <Chip
                              label={shop.tenant.status}
                              size="small"
                              color={
                                shop.tenant.status === "Active"
                                  ? "success"
                                  : "default"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            ₹{shop.rentAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} sx={{ width: "100%" }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Shops with Dues</span>
                <Box>
                  <FileDownloadIcon
                    sx={{ cursor: "pointer", ml: 1 }}
                    titleAccess="Export to Excel"
                    onClick={() => {
                      // Prepare data for export
                      const exportData = overdueShops.map((shop: any) => {
                        // Find due months (from monthlyData where status is Pending or Partial)
                        const currentYearDueMonths = Object.entries(
                          shop.monthlyData || {}
                        )
                          .filter(
                            ([month, data]: [string, any]) =>
                              data.status === "Pending" ||
                              data.status === "Partial"
                          )
                          .map(([month]) => `${month} ${selectedYear}`);
                        const previousYearDueMonths =
                          shop.previousYearDues?.dueMonths || [];
                        const dueMonths = [
                          ...previousYearDueMonths,
                          ...currentYearDueMonths,
                        ].join(", ");
                        return {
                          Name: shop.tenant.name,
                          Shop: shop.shopNumber,
                          "Due Amount": shop.totalDuesWithPrevious,
                          "Due Months": dueMonths,
                          "Previous Year Dues":
                            shop.previousYearDues?.totalDues || 0,
                          Phone: shop.tenant.phoneNumber,
                        };
                      });
                      const ws = XLSX.utils.json_to_sheet(exportData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "ShopsWithDues");
                      // Add date and time to filename
                      const now = new Date();
                      const pad = (n: number) => n.toString().padStart(2, "0");
                      const dateStr = `${now.getFullYear()}-${pad(
                        now.getMonth() + 1
                      )}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(
                        now.getMinutes()
                      )}-${pad(now.getSeconds())}`;
                      XLSX.writeFile(wb, `ShopsWithDues_${dateStr}.xlsx`);
                    }}
                  />
                </Box>
              </Typography>
              {isMobile ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {overdueShops.map((shop: any) => (
                    <Card
                      key={shop.shopNumber}
                      variant="outlined"
                      sx={{ p: 1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {shop.tenant.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Shop {shop.shopNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ fontWeight: "bold" }}
                          >
                            ₹{shop.totalDuesWithPrevious.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Due Amount
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer
                  sx={{ height: 300, overflow: "auto", width: "100%" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Shop</TableCell>
                        <TableCell align="right">Due Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueShops.map((shop: any) => (
                        <TableRow key={shop.shopNumber}>
                          <TableCell>{shop.tenant.name}</TableCell>
                          <TableCell>{shop.shopNumber}</TableCell>
                          <TableCell align="right">
                            <Typography
                              color="error.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              ₹{shop.totalDuesWithPrevious.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;