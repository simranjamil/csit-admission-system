import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
export default function RuleCard({ rule, readOnly, onEdit, onHistory }) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography fontWeight={700}>{rule.title}</Typography>
        <Typography color="text.secondary" fontSize={13} sx={{ mb: 1.5 }}>
          {rule.description}
        </Typography>
        <Typography fontSize={22} fontWeight={800} lineHeight={1.3}>
          {rule.summary}
        </Typography>
        <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.5 }}>
          {"Version " + rule.version}
          {rule.updatedBy ? " by " + rule.updatedBy : ""}
          {" on " + new Date(rule.updatedAt).toLocaleDateString()}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={readOnly}
            onClick={() => onEdit(rule)}
          >
            Edit
          </Button>
          <Button size="small" onClick={() => onHistory(rule)}>
            History
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
