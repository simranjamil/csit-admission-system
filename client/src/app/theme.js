import { createTheme } from "@mui/material/styles";


export const theme = createTheme({
  palette: {
    primary: { main: "#1e4fa3" },
    secondary: { main: "#0f766e" },
    background: { default: "#f5f7fb" },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "Inter, Roboto, Arial, sans-serif" },
});
