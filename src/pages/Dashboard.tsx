import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
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
import CollectionGraphs from "../components/CollectionGraphs";



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

  // Available years to fetch (2019 to current year)
  const availableYears = React.useMemo(() => {
    const years = [];
    for (let year = 2019; year <= new Date().getFullYear(); year++) {
      years.push(year.toString());
    }
    return years.sort().reverse();
  }, []);

  const loadedYears = data && data.years ? Object.keys(data.years).sort().reverse() : [];
  const defaultYear = loadedYears.includes(new Date().getFullYear().toString())
    ? new Date().getFullYear().toString()
    : loadedYears[0] || new Date().getFullYear().toString();
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
      totalDues: shop.previousYearDues?.totalDues || 0,
    })
  );

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

  const stats = {
    totalShops,
    activeShops,
    inactiveShops,
    totalRentCollected,
    totalDues,
    totalAdvance,
  };



  const overdueShops = shopsArray
    .filter((shop: any) => shop.totalDues > 0)
    .sort(
      (a: any, b: any) => b.totalDues - a.totalDues
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

      {/* Collection Analytics and Overdue Tenants */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} sx={{ width: "100%" }}>
          <CollectionGraphs shopsArray={shopsArray} selectedYear={selectedYear} />
        </Grid>

        <Grid item xs={12} sx={{ width: "100%" }}>
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
                <span>Shops with Dues ({overdueShops.length})</span>
                <Box>
                  <FileDownloadIcon
                    sx={{ cursor: "pointer", ml: 1 }}
                    titleAccess="Export to Excel"
                    onClick={() => {
                      // Prepare data for export
                      const exportData = overdueShops.map((shop: any) => {
                        const previousYearDueMonths =
                          shop.previousYearDues?.dueMonths || [];
                        const dueMonths = previousYearDueMonths.join(", ");
                        return {
                          Name: shop.tenant.tenant_name_hindi,
                          Shop: shop.shopNumber,
                          "Due Amount": shop.totalDues,
                          "Due Months": dueMonths,
                          // Phone: shop.tenant.phoneNumber,
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
                            ₹{shop.totalDues.toLocaleString()}
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
                              ₹{shop.totalDues.toLocaleString()}
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