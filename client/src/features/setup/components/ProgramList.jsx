import { Button, Card, Stack, Typography } from "@mui/material";
import DataTable from "../../../components/shared/DataTable";
import StatusChip from "../../../components/shared/StatusChip";
export default function ProgramList({ programs, loading, onNew, onEdit }) {
  const columns = [
    {
      key: "code",
      header: "Code",
      render: (p) => <Typography fontWeight={700}>{p.code}</Typography>,
    },    { key: "name", header: "Program" },
    {
      key: "timings",
      header: "Timings",
      render: (p) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {p.timings
            .filter((t) => t.isActive)
            .map((t) => (
              <StatusChip key={t.id} size="small" tone="primary" label={t.timing} />
            ))}
        </Stack>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      render: (p) => (
        <StatusChip size="small" label={p.isActive ? "Yes" : "No"} tone={p.isActive ? "success" : "neutral"} />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <Button size="small" onClick={() => onEdit(p)}>
          Edit
        </Button>
      ),
    },
  ];
  return (
    <Card sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 0 }}>
        <Typography fontSize={18} fontWeight={700}>
          Programs
        </Typography>
        <Button variant="contained" size="small" onClick={onNew} sx={{textTransform: "none", fontWeight: 700 }}>
          + New program
</Button>
</Stack>
<DataTable columns={columns} rows={programs} loading={loading} emptyText="No programs yet." />
</Card>
);
}