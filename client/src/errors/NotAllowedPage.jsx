import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";


export default function NotAllowedPage() {
  const { user } = useAuth();
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", p: 2 }}>
      <Box>
        <Typography variant="h3" fontWeight={800}>403</Typography>
        <Typography color="text.secondary" mb={2}>
          You do not have permission to open this page.
        </Typography>
        <Button variant="contained" component={RouterLink} to={user ? user.redirectTo : "/"}>
          {user ? "Go to my home" : "Go Home"}
        </Button>
      </Box>
    </Box>
  );
}
