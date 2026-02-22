import React, { useState } from "react";
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import * as authService from "../services/authService";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.login(password);
      if (result.success) {
        localStorage.setItem("rentManagementAuth", "true");
        localStorage.setItem("rentManagementAuthTime", Date.now().toString());
        onLogin();
      } else {
        setError(result.message || "Incorrect password. Please try again.");
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Unable to reach the server. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 400,
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            p: 3,
            textAlign: "center",
          }}
        >
          <LockOutlined sx={{ fontSize: 48, color: "white", mb: 2 }} />
          <Typography variant="h4" color="white" fontWeight="bold">
            Rent Management
          </Typography>
          <Typography variant="body1" color="white" sx={{ opacity: 0.9 }}>
            Please login to continue
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Enter Password
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
            </Button>
          </form>

        </CardContent>
      </Paper>
    </Box>
  );
};

export default Login;
