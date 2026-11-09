import * as React from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  ThemeProvider,
} from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { useNavigate } from "react-router-dom";
import theme from "../theme";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4001";

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    const data = new FormData(event.currentTarget);
    const firstName = data.get("firstName") || "";
    const lastName = data.get("lastName") || "";
    const email = data.get("email");
    const password = data.get("password");

    const name = `${firstName} ${lastName}`.trim();

    if (!name || !email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (res.ok) {
        if (json.token) {
          localStorage.setItem("token", json.token);
        }
        if (json.user) {
          localStorage.setItem("user", JSON.stringify(json.user));
        }
        navigate("/home");
      } else {
        setErrorMsg(json.message || "Registration failed. Please check your details.");
      }
    } catch (err) {
      setErrorMsg("Could not connect to API server. Please verify backend container is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 6,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        }}
      >
        <Card
          sx={{
            maxWidth: 480,
            width: "100%",
            borderRadius: 4,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(16px)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            <Avatar
              sx={{
                mx: "auto",
                mb: 1.5,
                bgcolor: "rgba(255, 255, 255, 0.2)",
                width: 52,
                height: 52,
              }}
            >
              <StorefrontRoundedIcon sx={{ fontSize: 30, color: "#fff" }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Create Manager Account
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", mt: 0.5 }}>
              Register as an administrator for Usama Saeed Tyre Shop
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    autoComplete="given-name"
                    name="firstName"
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    placeholder="manager@store.com"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    helperText="Minimum 6 characters"
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.4,
                  fontSize: "1rem",
                  fontWeight: 700,
                  mt: 3,
                  mb: 2.5,
                  borderRadius: 2.5,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Registration"}
              </Button>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate("/login")}
                    sx={{ color: "#4f46e5", fontWeight: 700, textDecoration: "none" }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
