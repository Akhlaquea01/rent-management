import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useRentContext } from "../context/RentContext";
import toast from "react-hot-toast";

interface RentEntryFormData {
  shopNumber: string;
  month: string;
  year: number;
  rentAmount: number;
  paidAmount: number;
  paymentDate: string;
  paymentMode: string;
  useAdvance: boolean;
  advanceDeduction: number;
  remarks: string;
}

const RentEntry: React.FC = () => {
  const { state, updateMonthlyData, addAdvanceTransaction } = useRentContext();
  const { data } = state;
  const currentYear = new Date().getFullYear().toString();
  const shops = useMemo(
    () => data.years[currentYear]?.shops || {},
    [data.years, currentYear]
  );
  const [formData, setFormData] = useState<RentEntryFormData>({
    shopNumber: "",
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    rentAmount: 0,
    paidAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    useAdvance: false,
    advanceDeduction: 0,
    remarks: "",
  });
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");

  // Build active shops list
  const activeShops = useMemo(
    () =>
      Object.entries(shops)
        .filter(([_, shop]: [string, any]) => shop.tenant.status === "Active")
        .map(([shopNumber, shop]: [string, any]) => ({
          shopNumber,
          name: shop.tenant.name,
          rentAmount: shop.rentAmount,
        })),
    [shops]
  );

  useEffect(() => {
    if (formData.shopNumber) {
      const shop = shops[formData.shopNumber];
      if (shop) {
        setFormData((prev) => ({
          ...prev,
          rentAmount: shop.rentAmount,
          paidAmount: shop.rentAmount,
        }));
      }
    }
  }, [formData.shopNumber, shops]);

  const handleSubmit = () => {
    if (!formData.shopNumber || formData.paidAmount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      // Calculate total to allocate
      let totalToAllocate =
        formData.paidAmount +
        (formData.useAdvance ? formData.advanceDeduction : 0);
      const monthDate = new Date(formData.month + "-01");
      const monthName = monthDate.toLocaleDateString("en-US", {
        month: "long",
      });
      const year = monthDate.getFullYear().toString();

      // Simplified rent entry using context actions
      // For now, we'll update the current month's data
      const monthlyData = {
        rent: formData.rentAmount,
        paid: formData.paidAmount,
        status:
          formData.paidAmount >= formData.rentAmount
            ? "Paid"
            : formData.paidAmount > 0
            ? "Partial"
            : "Pending",
        date: formData.paymentDate,
        advanceUsed: formData.useAdvance ? formData.advanceDeduction : 0,
      };

      updateMonthlyData(year, formData.shopNumber, monthName, monthlyData);

      // Add advance transaction if advance is used
      if (formData.useAdvance && formData.advanceDeduction > 0) {
        addAdvanceTransaction(formData.shopNumber, {
          type: "Deduction",
          amount: formData.advanceDeduction,
          date: formData.paymentDate,
          description: `Rent payment for ${formData.month}`,
        });
      }

      toast.success("Rent entry added successfully");
      // Reset form
      setFormData({
        shopNumber: "",
        month: new Date().toISOString().slice(0, 7),
        year: new Date().getFullYear(),
        rentAmount: 0,
        paidAmount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: "Cash",
        useAdvance: false,
        advanceDeduction: 0,
        remarks: "",
      });
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleBulkUpdate = () => {
    let parsed;
    try {
      parsed = JSON.parse(bulkJson);
    } catch (e) {
      toast.error("Invalid JSON");
      return;
    }
    // Expecting format: [{ year, shopNumber, month, rentAmount, paidAmount, paymentDate, paymentMode, remarks }]
    if (!Array.isArray(parsed)) {
      toast.error("JSON must be an array");
      return;
    }
    // Simplified bulk update using context actions
    parsed.forEach((entry) => {
      const { year, shopNumber, month, rentAmount, paidAmount, paymentDate } =
        entry;
      const monthName = new Date(month + "-01").toLocaleDateString("en-US", {
        month: "long",
      });
      const monthlyData = {
        rent: rentAmount,
        paid: paidAmount,
        status:
          paidAmount >= rentAmount
            ? "Paid"
            : paidAmount > 0
            ? "Partial"
            : "Pending",
        date: paymentDate,
        advanceUsed: 0,
      };
      updateMonthlyData(year, shopNumber, monthName, monthlyData);
    });
    toast.success("Bulk rent update successful");
    setBulkDialogOpen(false);
    setBulkJson("");
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Rent Entry
      </Typography>
      <Button
        variant="outlined"
        sx={{ mb: 2 }}
        onClick={() => setBulkDialogOpen(true)}
      >
        Bulk Rent Update (JSON)
      </Button>
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bulk Rent Update (JSON)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Paste an array of rent entries. Example:
            <br />
            <pre
              style={{
                background: "#f5f5f5",
                padding: 8,
                borderRadius: 4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {`[
  {
    "year": "2024",
    "shopNumber": "101",
    "month": "2024-07",
    "rentAmount": 10000,
    "paidAmount": 10000,
    "paymentDate": "2024-07-05"
  }
]`}
            </pre>
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={8}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            placeholder="Paste JSON here"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkUpdate}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Shop *</InputLabel>
                    <Select
                      value={formData.shopNumber}
                      label="Select Shop *"
                      onChange={(e) =>
                        setFormData({ ...formData, shopNumber: e.target.value })
                      }
                    >
                      {activeShops.map((shop) => (
                        <MenuItem key={shop.shopNumber} value={shop.shopNumber}>
                          {shop.name} - Shop {shop.shopNumber}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Month"
                    type="month"
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({ ...formData, month: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rent Amount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentAmount: Number(e.target.value),
                      })
                    }
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Paid Amount *"
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paidAmount: Number(e.target.value),
                      })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Date"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select
                      value={formData.paymentMode}
                      label="Payment Mode"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMode: e.target.value as any,
                        })
                      }
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="Online">Online</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                  />
                </Grid>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  sx={{ mt: 2 }}
                  disabled={!formData.shopNumber || formData.paidAmount <= 0}
                >
                  Record Payment
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    // Test update to verify context is working
                    const testData = {
                      rent: 10000,
                      paid: 5000,
                      status: "Partial" as const,
                      date: new Date().toISOString().split("T")[0],
                      advanceUsed: 0,
                    };
                    updateMonthlyData("2024", "101", "January", testData);
                  }}
                  sx={{ mt: 1 }}
                >
                  Test Context Update (Shop 101, January)
                </Button>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* Bulk JSON update UI will be added here */}
      </Grid>
    </Box>
  );
};

export default RentEntry;