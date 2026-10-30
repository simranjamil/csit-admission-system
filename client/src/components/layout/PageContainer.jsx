import { Box, Stack, Typography } from "@mui/material";

export default function PageContainer({ title, actions, children }) {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {actions}
      </Stack>
      {children}
    </Box>
  );
}


