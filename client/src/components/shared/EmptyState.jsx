import { Box, Typography } from "@mui/material";
 
export default function EmptyState({ message = "No records found." }) {
  return (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
