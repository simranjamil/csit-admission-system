import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Box,
  Select,
  MenuItem,
} from "@mui/material";
import useAuth from "../../hooks/useAuth";
import usePublicSummary from "../../hooks/usePublicSummary";
import { useSession } from "../../context/SessionContext";
import { TOPBAR_HEIGHT } from "../../utils/constants";

const STATUS_TEXT = {
  ACTIVE: " (active)",
  DRAFT: " (draft)",
  CLOSED: " (closed)",
};
export default function Topbar() {
  const { user, logout } = useAuth();
  const { data } = usePublicSummary();
  const { sessions, selected, selectSession } = useSession();
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
      <Toolbar
        sx={{ minHeight: { xs: TOPBAR_HEIGHT, sm: TOPBAR_HEIGHT }, px: 3 }}
      >
        <Typography fontSize={18} fontWeight={700}>
          CSIT Admission
        </Typography>
        {selected ? (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ ml: 3.5 }}
          >
            <Typography fontSize={14}>Session:</Typography>
            <Select
              variant="standard"
              disableUnderline
              value={selected.id}
              onChange={(e) => selectSession(e.target.value)}
              sx={{
                color: "inherit",
                fontSize: 14,
                fontWeight: 700,
                "& .MuiSelect-icon": { color: "inherit" },
              }}
            >
              {sessions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.year + (STATUS_TEXT[s.status] ?? "")}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        ) : (
          data?.session && (
            <Typography fontSize={14} sx={{ ml: 3.5 }}>
              Session: {data.session.year}
            </Typography>
          )
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
