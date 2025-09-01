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
} from '@mui/material';
import * as XLSX from 'xlsx';
import { useRentContext } from "../context/RentContext";

const AdvanceTracker: React.FC = () => {
  const { state } = useRentContext();
  const { data } = state;

  // Extract unique shops and their tenant info from advance transactions
  const shopTenantMap = new Map<string, { name: string; phoneNumber: string; email: string; status: string }>();
  
  Object.entries(data.advanceTransactions).forEach(([shopNumber, transactions]) => {
    if (Array.isArray(transactions) && transactions.length > 0) {
      // Get tenant info from the first transaction (assuming all transactions for a shop have the same tenant)
      const firstTransaction = transactions[0];
      shopTenantMap.set(shopNumber, {
        name: firstTransaction.name || 'Unknown Tenant',
        phoneNumber: firstTransaction.phoneNumber || 'N/A',
        email: firstTransaction.email || 'N/A',
        status: firstTransaction.status || 'Active'
      });
    }
  });

  // Parse shop number for sorting
  const parseShopNumber = (shopNum: string) => {
    const match = shopNum.match(/^(\d+)(?:-(\w+))?$/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      suffix: match?.[2] || ''
    };
  };

  const allShops = Array.from(shopTenantMap.entries())
    .map(([shopNumber, tenantInfo]) => ({
      shopNumber,
      name: tenantInfo.name,
      phoneNumber: tenantInfo.phoneNumber,
      email: tenantInfo.email,
      status: tenantInfo.status,
    }))
    .sort((a, b) => {
      const shopA = parseShopNumber(a.shopNumber);
      const shopB = parseShopNumber(b.shopNumber);

      if (shopA.number !== shopB.number) {
        return shopA.number - shopB.number;
      }

      return shopA.suffix.localeCompare(shopB.suffix);
    });

  // Set initial selectedShop only on mount
  const [selectedShop, setSelectedShop] = useState(() => allShops[0]?.shopNumber || "");

  // Get transactions for selected shop
  const transactions = selectedShop
    ? data.advanceTransactions[selectedShop] || []
    : [];

  // Compute current balance
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

  // Export to Excel
  const handleExport = () => {
    const exportData = allShops.map((shop) => {
      const advTrans = data.advanceTransactions[shop.shopNumber] || [];
      const totalDeposit = advTrans
        .filter((t: any) => t.type === "Deposit")
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalDeduct = advTrans
        .filter((t: any) => t.type === "Advance Deduction" || t.type === "Deduction")
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const remain = totalDeposit - totalDeduct;
      return {
        "Tenant Name": shop.name,
        "Shop Number": shop.shopNumber,
        "Phone": shop.phoneNumber,
        "Email": shop.email,
        "Status": shop.status,
        "Total Deposited Advance": totalDeposit,
        "Total Deducted Advance": totalDeduct,
        "Remaining Advance": remain,
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Advance Summary");
    XLSX.writeFile(wb, "advance_tracker.xlsx");
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Advance Tracker
        </Typography>
        <Button variant="contained" color="primary" onClick={handleExport}>
          Export to Excel
        </Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Tenant
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Choose Tenant</InputLabel>
                <Select
                  value={selectedShop}
                  label="Choose Tenant"
                  onChange={(e) => setSelectedShop(e.target.value)}
                >
                  {allShops.map((shop) => (
                    <MenuItem key={shop.shopNumber} value={shop.shopNumber}>
                      {shop.name} - Shop {shop.shopNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedShop && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Current Advance Balance
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "primary.main" }}
                  >
                    ₹{currentBalance.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>
              {selectedShop ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.type}
                                color={
                                  transaction.type === "Deposit"
                                    ? "success"
                                    : "warning"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                color={
                                  transaction.type === "Deposit"
                                    ? "success.main"
                                    : "warning.main"
                                }
                                sx={{ fontWeight: "bold" }}
                              >
                                {transaction.type === "Deposit" ? "+" : "-"}₹
                                {transaction.amount.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  Select a tenant to view transaction history
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvanceTracker;