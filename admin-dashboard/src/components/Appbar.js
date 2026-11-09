import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { useNavigate, useLocation } from "react-router-dom";

export default function ButtonAppBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isRegister = location.pathname === "/register";

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "none",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <StorefrontRoundedIcon fontSize="small" />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Usama Saeed Tyre Shop
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant={isRegister ? "text" : "contained"}
              color="inherit"
              onClick={() => navigate("/login")}
              sx={{
                color: "#ffffff",
                bgcolor: isRegister ? "transparent" : "#4f46e5",
                "&:hover": {
                  bgcolor: isRegister ? "rgba(255, 255, 255, 0.1)" : "#4338ca",
                },
                px: 2.5,
              }}
            >
              Sign In
            </Button>
            <Button
              variant={isRegister ? "contained" : "outlined"}
              onClick={() => navigate("/register")}
              sx={{
                color: "#ffffff",
                borderColor: "rgba(255, 255, 255, 0.25)",
                bgcolor: isRegister ? "#4f46e5" : "transparent",
                "&:hover": {
                  bgcolor: isRegister ? "#4338ca" : "rgba(255, 255, 255, 0.08)",
                  borderColor: "#ffffff",
                },
                px: 2.5,
              }}
            >
              Register
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
