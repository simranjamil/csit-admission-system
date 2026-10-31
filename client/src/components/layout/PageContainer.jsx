import { Box, Stack, Typography } from "@mui/material";
 
export default function PageContainer({ title, actions, children }) {
  return (
    <Box sx={{ p: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography fontSize={28} fontWeight={800}>
          {title}
        </Typography>
        {actions}
      </Stack>
      {children}
    </Box>
  );
}



