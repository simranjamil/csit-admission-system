import { Button, Card, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DataTable from "../../../components/shared/DataTable";
import StatusChip from "../../../components/shared/StatusChip";
 
const columns = [
  { key: "rollNo", header: "Roll no" },
  {
    key: "name",
    header: "Name",
    render: (r) => (
      <Stack direction="row" spacing={1} alignItems="center">
        <span>{r.name}</span>
        {r.isDummy && <StatusChip size="small" tone="warning" label="Dummy" />}
      </Stack>
    ),
  },
  { key: "timing", header: "Timing" },
  { key: "marks", header: "Marks" },
  { key: "percentage", header: "Percentage", render: (r) => (r.percentage === null ? "-" : r.percentage + "%") },
];
 
export default function ResultsTable({ data, loading, programCode }) {
  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1 }}>
        <Typography fontSize={18} fontWeight={700}>
          {"Imported marks" + (programCode ? " - " + programCode : "")}
        </Typography>
        <Button component={RouterLink} to="/admin/test-results" size="small" sx={{ textTransform: "none" }}>
          Open Test Results
        </Button>
      </Stack>
      {data && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ px: 2.5, pb: 1 }}>
          <StatusChip size="small" tone="primary" label={data.total + " results"} />
          <StatusChip size="small" tone="warning" label={data.dummies + " late (dummy)"} />
        </Stack>
      )}
      <Typography color="text.secondary" fontSize={13} sx={{ px: 2.5, pb: 1 }}>
        Passed, Failed and Absent are decided on the Test Results page, with the rule you choose there.
      </Typography>
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        loading={loading}
        getRowKey={(r) => r.applicationId}
        emptyText="No results for this program yet. Import its file above."
      />
    </Card>
  );
}
