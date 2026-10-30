import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "../../hooks/useAuth";


export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          CSIT Admission System
        </Typography>
        {/* Session selector yahan baad mein aayega */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography>{user.fullName}</Typography>
          <Chip
            size="small"
            label={user.roles.join(", ")}
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "inherit" }}
          />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
