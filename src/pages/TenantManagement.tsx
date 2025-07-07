import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';

import { useRentContext } from "../context/RentContext";
import { ShopData } from "../types";

const TenantManagement: React.FC = () => {
  // Update: get data from new structure
  const {
    state,
  } = useRentContext();
  const { data } = state;
  const years = Object.keys(data.years).sort().reverse();
  const defaultYear = years.includes(new Date().getFullYear().toString())
    ? new Date().getFullYear().toString()
    : years[0];
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  const shops = data.years[selectedYear]?.shops || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));


  



  // const getAdvanceDeposit = (shopNumber: string, shop: ShopData): number => {
  //   const transactions = Array.isArray(data.advanceTransactions[shopNumber])
  //     ? data.advanceTransactions[shopNumber]
  //     : [];
  //   if (!transactions.length)
  //     return typeof shop.advanceAmount === "number" ? shop.advanceAmount : 0;
  //   return transactions
  //     .filter((t: any) => t.type === "Deposit")
  //     .reduce((acc: number, t: any) => acc + t.amount, 0);
  // };

  // Advance: always show original advanceAmount from shop data
  // Advance Remaining: advanceAmount minus sum of all 'Advance Deduction' transactions
  const getAdvanceRemaining = (shopNumber: string, shop: ShopData): number => {
    const transactions = Array.isArray(data.advanceTransactions[shopNumber])
      ? data.advanceTransactions[shopNumber]
      : [];
    if (!shop || typeof shop.advanceAmount !== "number") return 0;
    const totalAdvanceDeducted = transactions
      .filter((t: any) => t.type === "Advance Deduction")
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    return shop.advanceAmount - totalAdvanceDeducted;
  };

  // Helper to get dues breakdown for a shop
  const getDuesTooltip = (shopNumber: string, shop: ShopData) => {
    let totalPendingMonths = 0;
    let totalDueAmount = 0;
    const yearBreakdown: Record<string, { months: string[]; amount: number }> =
      {};
    Object.entries(data.years).forEach(([year, yearData]) => {
      const s = yearData.shops[shopNumber];
      if (s && s.monthlyData) {
        const months: string[] = [];
        let yearDue = 0;
        Object.entries(s.monthlyData).forEach(
          ([month, mdata]: [string, any]) => {
            if (mdata.status === "Pending" || mdata.status === "Partial") {
              months.push(month);
              yearDue += (mdata.rent || 0) - (mdata.paid || 0);
            }
          }
        );
        if (months.length) {
          yearBreakdown[year] = { months, amount: yearDue };
          totalPendingMonths += months.length;
          totalDueAmount += yearDue;
        }
      }
    });
    return (
      <Box>
        <Typography variant="subtitle2">{shop.tenant.name}</Typography>
        <Typography variant="body2">
          Pending Months: <b>{totalPendingMonths}</b>
        </Typography>
        <Typography variant="body2">
          Total Due: <b>₹{totalDueAmount.toLocaleString()}</b>
        </Typography>
        {Object.entries(yearBreakdown).map(([year, info]) => (
          <Box key={year} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {year}:
            </Typography>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {info.months.join(", ")}
              {info.amount > 0 && ` (₹${info.amount.toLocaleString()})`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h4">Tenant Management</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

      </Box>
      <Card>
        <CardContent>
          {isMobile ? (
            <Grid container spacing={2}>
              {Object.entries(shops).map(([shopNumber, shopData]) => {
                const shop = shopData as ShopData;
                // const advanceDeposit = getAdvanceDeposit(shopNumber, shop);
                const advanceRemaining = getAdvanceRemaining(shopNumber, shop);
                return (
                  <Grid item xs={12} key={shopNumber}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6">{shop.tenant.name}</Typography>
                        <Chip
                          label={shop.tenant.status}
                          color={
                            shop.tenant.status === "Active"
                              ? "success"
                              : "default"
                          }
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Shop: {shopNumber}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Rent: ₹{shop.rentAmount.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Mobile: {shop.tenant.phoneNumber}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Advance: ₹{shop.advanceAmount.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Advance Remaining: ₹{advanceRemaining.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        Agreement:{" "}
                        {new Date(
                          shop.tenant.agreementDate
                        ).toLocaleDateString()}
                      </Typography>

                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Shop Number</TableCell>
                    <TableCell align="right">Rent Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align="right">Advance</TableCell>
                    <TableCell align="right">Advance Remaining</TableCell>
                    <TableCell>Agreement Date</TableCell>
                    
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(shops).map(([shopNumber, shopData]) => {
                    const shop = shopData as ShopData;
                    // const advanceDeposit = getAdvanceDeposit(shopNumber, shop);
                    const advanceRemaining = getAdvanceRemaining(
                      shopNumber,
                      shop
                    );
                    return (
                      <TableRow key={shopNumber}>
                        <TableCell>
                          <Tooltip
                            title={getDuesTooltip(shopNumber, shop)}
                            arrow
                            placement="right"
                            enterDelay={300}
                          >
                            <span
                              style={{
                                cursor: "pointer",
                                textDecoration: "underline",
                                color: "#1976d2",
                              }}
                            >
                              {shop.tenant.name}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{shopNumber}</TableCell>
                        <TableCell align="right">
                          ₹{shop.rentAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={shop.tenant.status}
                            color={
                              shop.tenant.status === "Active"
                                ? "success"
                                : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{shop.tenant.phoneNumber}</TableCell>
                        <TableCell align="right">
                          ₹{shop.advanceAmount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ₹{advanceRemaining.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            shop.tenant.agreementDate
                          ).toLocaleDateString()}
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

    </Box>
  );
};

export default TenantManagement;