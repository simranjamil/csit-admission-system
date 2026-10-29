import { Card, CardContent, Typography, Stack, Chip, Box, Divider } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";

export default function ProgramsCard({ programs }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <SchoolIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Available Programs
          </Typography>
        </Stack>

        {programs.length === 0 && (
          <Typography color="text.secondary">No programs are open right now.</Typography>
        )}


        {programs.map((p, i) => (
          <Box key={p.id}>
            {i > 0 && <Divider sx={{ my: 1.5 }} />}
            <Typography fontWeight={600}>{p.name}</Typography>
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
              {p.timings.map((t) => (
                <Chip
                  key={t.timingId}
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${t.timing} · ${t.seats} seats`}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
