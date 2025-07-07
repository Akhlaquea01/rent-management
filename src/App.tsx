import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { Toaster } from "react-hot-toast";

// Components
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TenantManagement from "./pages/TenantManagement";

import AdvanceTracker from "./pages/AdvanceTracker";
import TenantHistory from "./pages/TenantHistory";
import Reports from "./pages/Reports";
import { RentProvider, useRentContext } from "./context/RentContext";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#dc004e",
      light: "#ff5983",
      dark: "#9a0036",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 6,
        },
      },
    },
  },
});

function AppContent() {
  const { state } = useRentContext();
  const { loading, error } = state;

  if (loading)
    return <div style={{ padding: 40, fontSize: 20 }}>Loading data...</div>;
  if (error)
    return (
      <div style={{ padding: 40, fontSize: 20, color: "red" }}>{error}</div>
    );

  return (
    <Router>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tenants" element={<TenantManagement />} />

            <Route path="/advance-tracker" element={<AdvanceTracker />} />
            <Route path="/tenant-history" element={<TenantHistory />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RentProvider>
        <AppContent />
      </RentProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
