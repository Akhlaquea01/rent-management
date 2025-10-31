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
import html2canvas from 'html2canvas';

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
      <TableCell>Month</TableCell>
      <TableCell align="right">Rent Amount</TableCell>
      <TableCell align="right">Paid Amount</TableCell>
      <TableCell align="right">Advance Used</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Comments</TableCell>
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
      <TableCell>{formatComments(monthData.comment)}</TableCell>
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
        '@media print': {
          maxHeight: 'none !important',
          overflow: 'visible !important',
        }
      }}
    >
      <Table
        size={size}
        sx={{
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
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        Summary
        {selectedShopNumber && (() => {
          const yearlyData = selectedYear === "All Years"
            ? allYearsData?.yearSections?.[0]?.data // use first year's status if "All Years"
            : getYearlyData(selectedShopNumber, selectedYear);
          const status = yearlyData?.status || "Inactive";
          const color = status === "Active" ? "green" : "red";
          return (
            <Typography
              variant="body2"
              sx={{
                color,
                fontWeight: 600,
                border: `1px solid ${color}`,
                borderRadius: "8px",
                px: 1.5,
                py: 0.2,
                fontSize: "0.8rem",
              }}
            >
              {status}
            </Typography>
          );
        })()}
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
    .filter((shop) => shop.tenant.status === "Active" || shop.tenant.status === "Inactive")
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
              try {
                const tempDiv = document.createElement("div");
                tempDiv.style.position = "absolute";
                tempDiv.style.left = "-9999px";
                tempDiv.style.top = "-9999px";
                tempDiv.style.width = "210mm"; // A4 width
                tempDiv.style.backgroundColor = "white";
                tempDiv.style.padding = "15px";
                tempDiv.style.fontFamily = "Arial, sans-serif";

                const selectedShop = activeShops.find(
                  (s) => s.shopNumber === selectedShopNumber
                );
                const tenantName = selectedShop?.tenant.tenant_name_hindi || selectedShop?.tenant.name || "Unknown";

                const summaryItems = [
                  { label: "Total Rent", value: currentData.totalRent },
                  { label: "Total Paid", value: currentData.totalPaid },
                  { label: "Dues", value: currentData.totalPending },
                  {
                    label: "Advance Balance",
                    value: currentData.advanceBalance,
                  },
                ];

                const tableHeaderHtml = `
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="border: 1px solid #333; padding: 4px; text-align: left;">Month</th>
                      <th style="border: 1px solid #333; padding: 4px; text-align: right;">Rent Amount</th>
                      <th style="border: 1px solid #333; padding: 4px; text-align: right;">Paid Amount</th>
                      <th style="border: 1px solid #333; padding: 4px; text-align: right;">Advance Used</th>
                      <th style="border: 1px solid #333; padding: 4px; text-align: center;">Status</th>
                      <th style="border: 1px solid #333; padding: 4px; text-align: left;">Comments</th>
                    </tr>
                  </thead>`;

                let tablesHtml = "";
                const monthsEnglishToHindi = {
                  "January": "जनवरी",
                  "February": "फरवरी",
                  "March": "मार्च",
                  "April": "अप्रैल",
                  "May": "मई",
                  "June": "जून",
                  "July": "जुलाई",
                  "August": "अगस्त",
                  "September": "सितंबर",
                  "October": "अक्टूबर",
                  "November": "नवंबर",
                  "December": "दिसंबर"
                };
                if (selectedYear === "All Years" && allYearsData) {
                  allYearsData.yearSections.forEach((yearSection) => {
                    tablesHtml += `
                      <div style="page-break-inside: avoid;">
                        <h3 style="margin: 15px 0 5px 0; font-size: 12px; font-weight: bold;">Monthly Rent History - ${yearSection.year
                      }</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 10px;">
                          ${tableHeaderHtml}
                          <tbody>
                            ${yearSection.data.monthlyData
                        .map(
                          (monthData: any) => `
                              <tr>
                                <td style="border: 1px solid #333; padding: 3px;">${monthsEnglishToHindi[monthData.month] || monthData.month
                            }</td>
                                <td style="border: 1px solid #333; padding: 3px; text-align: right;">₹${(
                              monthData.rentAmount || 0
                            ).toLocaleString()}</td>
                                <td style="border: 1px solid #333; padding: 3px; text-align: right;">₹${(
                              monthData.paidAmount || 0
                            ).toLocaleString()}</td>
                                <td style="border: 1px solid #333; padding: 3px; text-align: right;">₹${(
                              monthData.advanceDeduction || 0
                            ).toLocaleString()}</td>
                                <td style="border: 1px solid #333; padding: 3px; text-align: center;">${monthData.status
                            }</td>
                                <td style="border: 1px solid #333; padding: 3px;">${monthData.comment || "-"
                            }</td>
                              </tr>
                            `
                        )
                        .join("")}
                          </tbody>
                        </table>
                      </div>
                    `;
                  });
                } else {
                  let monthlyData: MonthlyData[] = [];
                  if (currentData && "monthlyData" in currentData) {
                    monthlyData =
                      (currentData as YearlyData).monthlyData || [];
                  }
                  tablesHtml = `
                    <h3 style="margin: 5px 0; font-size: 12px;">Monthly Rent History - ${selectedYear}</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin: 5px 0;">
                      ${tableHeaderHtml}
                      <tbody>
                        ${monthlyData
                      .map(
                        (monthData: any) => `
                          <tr>
                            <td style="border: 1px solid #333; padding: 3px;">${monthsEnglishToHindi[monthData.month] || monthData.month
                          }</td>
                            <td style="border: 1px solid #333; padding: 3px; text-align: right;">₹${(
                            monthData.rentAmount || 0
                          ).toLocaleString()}</td>
                            <td style="border: 1px solid #333; padding: 3px; text-align: right;">₹${(
                            monthData.paidAmount || 0
                          ).toLocaleString()}</td>
                            <td style="border: 1px solid #333; padding: 3px; text-align: right;">₹${(
                            monthData.advanceDeduction || 0
                          ).toLocaleString()}</td>
                            <td style="border: 1px solid #333; padding: 3px; text-align: center;">${monthData.status
                          }</td>
                            <td style="border: 1px solid #333; padding: 3px;">${monthData.comment || "-"
                          }</td>
                          </tr>
                        `
                      )
                      .join("")}
                      </tbody>
                    </table>
                  `;
                }

                const htmlContent = `
                  <div style="text-align: center; margin-bottom: 15px;">
                    <h2 style="margin: 0; font-size: 16px; font-weight: bold;">Rent Summary Report</h2>
                    <p style="margin: 3px 0; font-size: 12px;">${tenantName} - Shop ${selectedShopNumber}</p>
                    <p style="margin: 2px 0; font-size: 10px;">${selectedYear === "All Years"
                    ? "All Years"
                    : `Year: ${selectedYear}`
                  }</p>
                  </div>
                  
                  <div style="margin-bottom: 10px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                      ${summaryItems
                    .map(
                      (item) => `
                        <div style="flex: 1; min-width: 45%;">
                          <span style="font-size: 10px; font-weight: bold;">${item.label
                        }: ₹${(item.value || 0).toLocaleString()}</span>
                        </div>
                      `
                    )
                    .join("")}
                    </div>
                  </div>
                  
                  <hr style="margin: 8px 0; border: 1px solid #ccc;">
                  
                  <div>
                    ${tablesHtml}
                  </div>
                `;

                tempDiv.innerHTML = htmlContent;
                document.body.appendChild(tempDiv);

                // Generate PDF
                const canvas = await html2canvas(tempDiv, {
                  scale: 2,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: "#ffffff",
                });

                const imgData = canvas.toDataURL("image/png", 1.0);
                const pdf = new jsPDF("portrait", "mm", "a4");
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;

                const ratio = canvasWidth / pdfWidth;
                const imgHeight = canvasHeight / ratio;

                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                  position = -heightLeft;
                  pdf.addPage();
                  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
                  heightLeft -= pdfHeight;
                }

                // Clean up
                document.body.removeChild(tempDiv);

                // Download the PDF
                const fileName = `RentSummary_${selectedShopNumber}_${selectedYear}_${new Date().toISOString().split("T")[0]
                  }.pdf`;
                pdf.save(fileName);
              } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Error generating PDF. Please try again.");
              }
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
