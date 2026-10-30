import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
 
export default function InterviewerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
 
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <Box>
        <Typography variant="h5" gutterBottom>My interviews (next step)</Typography>
        <Typography color="text.secondary" mb={2}>Logged in as {user?.fullName}</Typography>
        <Button variant="outlined" onClick={handleLogout}>Logout</Button>
      </Box>
    </Box>
  );
}
