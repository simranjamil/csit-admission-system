import { Alert, Button, Card, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import StatusChip from "../../../components/shared/StatusChip";
 
export default function ProgramStatus({ programs, unresolvedDummies }) {
  return (
    <Card sx={{ mb: 3, p: 2.5 }}>
      <Typography fontSize={18} fontWeight={700} sx={{ mb: 1.5 }}>
        Programs in this session
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {programs.map((p) => (
          <StatusChip
            key={p.id}
            size="small"
            tone={p.imported ? "success" : "neutral"}
            label={p.code + ": " + (p.imported ? p.results + " results" : "not imported")}
          />
        ))}
      </Stack>
      {unresolvedDummies > 0 && (
        <Alert
          severity="warning"
          sx={{ mt: 2 }}
          action={
            <Button component={RouterLink} to="/admin/late-admissions" size="small" sx={{ textTransform: "none" }}>
              Open Late Admissions
            </Button>
          }
        >
          {unresolvedDummies + " late students are unresolved. Add their real details before building the interview schedule."}
        </Alert>
      )}
    </Card>
  );
}
