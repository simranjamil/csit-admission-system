import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SessionProvider } from "../../context/SessionContext";
import { TOPBAR_HEIGHT } from "../../utils/constants";

export default function AppShell() {
  return (
    <SessionProvider>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Topbar />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
          <Toolbar
            sx={{ minHeight: { xs: TOPBAR_HEIGHT, sm: TOPBAR_HEIGHT } }}
          />
          <Outlet />{" "}
        </Box>
      </Box>
    </SessionProvider>
  );
}
