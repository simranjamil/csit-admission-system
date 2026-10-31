import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Stack, Box } from "@mui/material";
import useAuth from "../../hooks/useAuth";
import usePublicSummary from "../../hooks/usePublicSummary";
import { TOPBAR_HEIGHT } from "../../utils/constants";
 
export default function Topbar() {
  const { user, logout } = useAuth();
  const { data } = usePublicSummary();
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
      <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT, sm: TOPBAR_HEIGHT }, px: 3 }}>
        <Typography fontSize={18} fontWeight={700}>
          CSIT Admission
        </Typography>
        {data?.session && (
          <Typography fontSize={14} sx={{ ml: 3.5 }}>
            Session: {data.session.year}
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography fontSize={14}>{user.fullName}</Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleLogout}
            sx={{
              borderColor: "rgba(255,255,255,0.7)",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
