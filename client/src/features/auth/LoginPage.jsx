import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";


export default function LoginPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Box textAlign="center">
        <Typography variant="h5" gutterBottom>Login page (next step)</Typography>
        <Button component={RouterLink} to="/">Back to home</Button>
      </Box>
    </Box>
  );
}
