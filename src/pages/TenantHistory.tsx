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
  Tooltip,
} from "@mui/material";
import { Print as PrintIcon } from "@mui/icons-material";
import { useRentContext } from "../context/RentContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for better type safety
interface MonthlyData {
  month: string;
  rentAmount: number;
  paidAmount: number;
  advanceDeduction: number;
  status: string;
  comment: string;
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
      <TableCell sx={{ width: "15%" }}>Month</TableCell>
      <TableCell sx={{ width: "17%" }} align="right">Rent Amount</TableCell>
      <TableCell sx={{ width: "17%" }} align="right">Paid Amount</TableCell>
      <TableCell sx={{ width: "17%" }} align="right">Advance Used</TableCell>
      <TableCell sx={{ width: "14%" }}>Status</TableCell>
      <TableCell sx={{ width: "20%" }}>Comments</TableCell>
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
      case "Dues":
        return "warning";
      case "Partially Paid":
        return "info";
      case "Overdue":
        return "error";
      default:
        return "default";
    }
  };

  const formatComments = (comment: string) => {
    return comment && comment.trim() ? comment : "-";
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
      <TableCell sx={{ wordBreak: 'break-word' }}>{formatComments(monthData.comment)}</TableCell>
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
    <TableContainer
      component={component}
      sx={{
        overflowX: 'auto',
        '@media print': {
          maxHeight: 'none !important',
          overflow: 'visible !important',
        }
      }}
    >
      <Table
        size={size}
        sx={{
          width: '100%',
          tableLayout: 'fixed',
          '@media print': {
            fontSize: '10px !important',
            '& th, & td': {
              padding: '4px 6px !important',
              fontSize: '9px !important',
              lineHeight: '1.2 !important',
            }
          }
        }}
      >
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
    { label: "Dues", value: getValue("totalPending"), color: "warning.main" },
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

  // Parse shop number for sorting
  const parseShopNumber = (shopNum: string) => {
    const match = shopNum.match(/^(\d+)(?:-(\w+))?$/);
    return {
      number: match ? parseInt(match[1], 10) : 0,
      suffix: match?.[2] || ''
    };
  };

  // Get unique active shops and sort by shop number
  const activeShops = allShops
    .filter((shop) => shop.tenant.status === "Active")
    .filter(
      (shop, index, self) =>
        index === self.findIndex((s) => s.shopNumber === shop.shopNumber)
    )
    .sort((a, b) => {
      const shopA = parseShopNumber(a.shopNumber);
      const shopB = parseShopNumber(b.shopNumber);

      if (shopA.number !== shopB.number) {
        return shopA.number - shopB.number;
      }

      return shopA.suffix.localeCompare(shopB.suffix);
    });

  // Helper: get only months that exist in the JSON data
  const getMonthsFromData = (shop: any) => {
    if (!shop?.monthlyData) return [];
    return Object.keys(shop.monthlyData).sort((a, b) => {
      const monthOrder = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });
  };

  // Helper: get rent data for a shop and year, only from JSON data
  const getYearlyData = (shopNumber: string, year: string): YearlyData | null => {
    const shop = data.years[year]?.shops[shopNumber];
    if (!shop) return null;

    // Only get months that exist in the JSON data
    const months = getMonthsFromData(shop);
    let totalRent = 0;
    let totalPaid = 0;

    // Get dues amount directly from data - this is the single source of truth
    const totalDues = shop.previousYearDues?.totalDues || 0;

    const monthlyDataArray = months.map((month) => {
      // Get the specific month's data - this will always exist since we're only iterating over existing months
      const monthData = shop.monthlyData[month];

      // Use the rent amount from the month data
      const rentAmount = monthData.rent;

      totalRent += rentAmount;
      totalPaid += monthData.paid || 0;

      // Use status directly from JSON data - no manual calculation
      const status = monthData.status;

      return {
        month,
        rentAmount: rentAmount,
        paidAmount: monthData.paid || 0,
        advanceDeduction: monthData.advanceUsed || 0,
        status: status,
        comment: monthData.comment || "-",
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
      // Use dues amount directly from data - this is the correct pending amount
      totalPending: totalDues,
      // Advance balance from transactions
      advanceBalance: advanceBalance,
      monthlyData: monthlyDataArray,
      status: shop.tenant.status,
    };
  };

  // For All Years: aggregate Total Rent and Total Paid, but use latest year's dues
  const allYearsData = React.useMemo((): AllYearsData | null => {
    if (!selectedShopNumber || selectedYear !== "All Years") return null;

    let totalRent = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let advanceBalance = 0;
    const yearSections: Array<{ year: string; data: YearlyData }> = [];

    // Get the latest year for dues calculation
    const latestYear = availableYears[0]; // First year in the sorted array (most recent)
    const latestYearData = getYearlyData(selectedShopNumber, latestYear);

    // Aggregate all years for Total Rent and Total Paid
    availableYears
      .slice()
      .reverse()
      .forEach((year) => {
        const yd = getYearlyData(selectedShopNumber, year);
        if (yd) {
          totalRent += yd.totalRent;
          totalPaid += yd.totalPaid;
          advanceBalance = yd.advanceBalance; // last year wins
          yearSections.push({ year, data: yd });
        }
      });

    // Use latest year's dues only (not aggregated)
    if (latestYearData) {
      totalPending = latestYearData.totalPending;
    }

    return { totalRent, totalPaid, totalPending, advanceBalance, yearSections };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShopNumber, selectedYear, data, availableYears, getYearlyData]);

  // Tooltip: dues months grouped by year
  const getDuesTooltip = () => {
    if (!selectedShopNumber) return "";
    const duesByYear: Record<string, string[]> = {};
    let totalDues = 0;

    // The "All Years" data already has the correct final dues amount.
    if (selectedYear === "All Years" && allYearsData) {
      totalDues = allYearsData.totalPending;
    } else if (selectedYear !== "All Years") {
      totalDues = getYearlyData(selectedShopNumber, selectedYear)?.totalPending || 0;
    }

    availableYears.forEach((year) => {
      const yd = getYearlyData(selectedShopNumber, year);
      if (yd) {
        const months = yd.monthlyData
          .filter((m: MonthlyData) => m.status !== "Paid")
          .map((m: MonthlyData) => m.month);
        if (months.length) duesByYear[year] = months;
      }
    });
    let tooltip = `Total dues months: ${Object.values(duesByYear).reduce(
      (a, b) => a + b.length,
      0
    )}\n`;
    Object.entries(duesByYear).forEach(([year, months]) => {
      tooltip += `${year}: ${months.join(", ")}\n`;
    });
    tooltip += `Total dues amount: ₹${totalDues.toLocaleString()}`;
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
        <Tooltip title={getDuesTooltip()} arrow placement="bottom">
          <Typography variant="h4" sx={{ cursor: "pointer" }}>
            Shop History
          </Typography>
        </Tooltip>
        {currentData && (
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={async () => {
              const doc = new jsPDF();
              const selectedShop = activeShops.find(
                (s) => s.shopNumber === selectedShopNumber
              );
              const tenantName = selectedShop?.tenant.tenant_name_hindi || selectedShop?.tenant.name || "Unknown";
              const title = "Rent Summary Report";
              const subtitle = `${tenantName} - Shop ${selectedShopNumber}`;
              const yearInfo = selectedYear === "All Years" ? "All Years" : `Year: ${selectedYear}`;

              // Load the font
              const fontResponse = await fetch('/fonts/NotoSansDevanagari.ttf');
              const fontBuffer = await fontResponse.arrayBuffer();
              const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontBuffer)));

              doc.addFileToVFS('NotoSansDevanagari.ttf', fontBase64);
              doc.addFont('NotoSansDevanagari.ttf', 'NotoSansDevanagari', 'normal');
              doc.setFont('NotoSansDevanagari');

              const summaryData = [
                ["Total Rent", `₹${(currentData.totalRent || 0).toLocaleString()}`],
                ["Total Paid", `₹${(currentData.totalPaid || 0).toLocaleString()}`],
                ["Dues", `₹${(currentData.totalPending || 0).toLocaleString()}`],
                ["Advance Balance", `₹${(currentData.advanceBalance || 0).toLocaleString()}`],
              ];

              let startY = 20;
              doc.setFontSize(18);
              doc.text(title, 14, startY);
              startY += 8;
              doc.setFontSize(12);
              doc.text(subtitle, 14, startY);
              startY += 6;
              doc.setFontSize(10);
              doc.text(yearInfo, 14, startY);
              startY += 8;

              autoTable(doc, {
                body: summaryData,
                startY,
                theme: 'grid',
                styles: {
                  fontSize: 10,
                  cellPadding: 2,
                  font: 'NotoSansDevanagari',
                },
                columnStyles: {
                  0: { fontStyle: 'bold' },
                },
              });

              startY = (doc as any).lastAutoTable.finalY + 10;


              if (selectedYear === "All Years" && allYearsData) {
                const yearlySummaryColumns = ["Year", "Total Rent", "Paid Amount", "Dues"];
                const yearlySummaryRows = allYearsData.yearSections.map(section => [
                  section.year,
                  `₹${(section.data.totalRent || 0).toLocaleString()}`,
                  `₹${(section.data.totalPaid || 0).toLocaleString()}`,
                  `₹${(section.data.totalPending || 0).toLocaleString()}`,
                ]);

                doc.setFontSize(12);
                doc.text("Year-wise Summary", 14, startY);
                startY += 6;

                autoTable(doc, {
                  head: [yearlySummaryColumns],
                  body: yearlySummaryRows,
                  startY,
                  theme: 'striped',
                  headStyles: { fillColor: [22, 160, 133], font: 'NotoSansDevanagari' },
                  styles: { font: 'NotoSansDevanagari' },
                });

                startY = (doc as any).lastAutoTable.finalY + 10;

                allYearsData.yearSections.forEach(yearSection => {
                  doc.setFontSize(12);
                  doc.text(`Monthly Rent History - ${yearSection.year}`, 14, startY);
                  startY += 6;

                  const monthlyColumns = ["Month", "Rent Amount", "Paid Amount", "Advance Used", "Status", "Comments"];
                  const monthlyRows = yearSection.data.monthlyData.map(m => [
                    m.month,
                    `₹${(m.rentAmount || 0).toLocaleString()}`,
                    `₹${(m.paidAmount || 0).toLocaleString()}`,
                    `₹${(m.advanceDeduction || 0).toLocaleString()}`,
                    m.status,
                    m.comment,
                  ]);

                  autoTable(doc, {
                    head: [monthlyColumns],
                    body: monthlyRows,
                    startY,
                    theme: 'striped',
                    headStyles: { fillColor: [41, 128, 185], font: 'NotoSansDevanagari' },
                    styles: { font: 'NotoSansDevanagari' },
                    didDrawPage: (data) => {
                      // Header
                      doc.setFontSize(18);
                      doc.text(title, 14, 20);
                      // Footer
                      const pageCount = (doc as any).internal.getNumberOfPages();
                      doc.setFontSize(10);
                      doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, (doc as any).internal.pageSize.height - 10);
                    },
                  });
                  startY = (doc as any).lastAutoTable.finalY + 10;
                });
              } else if (currentData && "monthlyData" in currentData) {
                const monthlyColumns = ["Month", "Rent Amount", "Paid Amount", "Advance Used", "Status", "Comments"];
                const monthlyRows = (currentData as YearlyData).monthlyData.map(m => [
                  m.month,
                  `₹${(m.rentAmount || 0).toLocaleString()}`,
                  `₹${(m.paidAmount || 0).toLocaleString()}`,
                  `₹${(m.advanceDeduction || 0).toLocaleString()}`,
                  m.status,
                  m.comment,
                ]);

                doc.setFontSize(12);
                doc.text(`Monthly Rent History - ${selectedYear}`, 14, startY);
                startY += 6;

                autoTable(doc, {
                  head: [monthlyColumns],
                  body: monthlyRows,
                  startY,
                  theme: 'striped',
                  headStyles: { fillColor: [41, 128, 185], font: 'NotoSansDevanagari' },
                  styles: { font: 'NotoSansDevanagari' },
                  didDrawPage: (data) => {
                    // Header
                    doc.setFontSize(18);
                    doc.text(title, 14, 20);
                    // Footer
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(10);
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, (doc as any).internal.pageSize.height - 10);
                  },
                });
              }

              const fileName = `RentSummary_${selectedShopNumber}_${selectedYear}_${new Date().toISOString().split("T")[0]}.pdf`;
              doc.save(fileName);
            }}
          >
            Download PDF
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

    </Box>
  );
};

export default TenantHistory;
