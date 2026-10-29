import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";


export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <Box>
        <Typography variant="h3" fontWeight={800}>404</Typography>
        <Typography color="text.secondary" mb={2}>Page not found.</Typography>
        <Button variant="contained" component={RouterLink} to="/">Go Home</Button>
      </Box>
    </Box>
  );
}
