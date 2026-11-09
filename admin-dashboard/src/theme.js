import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5", // Indigo 600
      light: "#6366f1", // Indigo 500
      dark: "#3730a3", // Indigo 800
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#7c3aed", // Violet 600
      light: "#8b5cf6",
      dark: "#5b21b6",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981", // Emerald 500
      light: "#34d399",
      dark: "#059669",
    },
    warning: {
      main: "#f59e0b", // Amber 500
      light: "#fbbf24",
      dark: "#d97706",
    },
    error: {
      main: "#ef4444", // Rose/Red 500
      light: "#f87171",
      dark: "#dc2626",
    },
    background: {
      default: "#f8fafc", // Slate 50
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#64748b", // Slate 500
    },
    divider: "rgba(226, 232, 240, 0.8)",
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ].join(","),
    h1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 20px",
          boxShadow: "none",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            transform: "translateY(-1px)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
        },
        containedSecondary: {
          background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "all 0.2s ease",
            "&:hover fieldset": {
              borderColor: "#6366f1",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#4f46e5",
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: "#f8fafc",
          color: "#475569",
          borderBottom: "2px solid #e2e8f0",
        },
        root: {
          borderBottom: "1px solid #f1f5f9",
          padding: "14px 16px",
        },
      },
    },
  },
});

export default theme;
