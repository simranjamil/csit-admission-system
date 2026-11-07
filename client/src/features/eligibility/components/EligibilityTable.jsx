import { Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import DataTable from "../../../components/shared/DataTable";
import StatusChip from "../../../components/shared/StatusChip";
 
const TONE = { ELIGIBLE: "success", NOT_ELIGIBLE: "error", NEEDS_REVIEW: "warning", NOT_EVALUATED: "neutral" };
const LABEL = {
  ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Not eligible",
  NEEDS_REVIEW: "Needs review",
  NOT_EVALUATED: "Not evaluated",
};
 
const columns = [
  { key: "rollNo", header: "Roll no" },
  { key: "cnic", header: "CNIC" },
  { key: "name", header: "Name" },
  { key: "marks", header: "Marks" },
  { key: "program", header: "Program" },
  { key: "timing", header: "Timing" },
  { key: "status", header: "Status", render: (r) => <StatusChip size="small" tone={TONE[r.status]} label={LABEL[r.status]} /> },
  { key: "reason", header: "Reason" },
  { key: "ruleVersion", header: "Rule", render: (r) => (r.ruleVersion ? "v" + r.ruleVersion : "-") },
];
 
function Filter({ label, value, onChange, options }) {
  return (
    <TextField select size="small" label={label} value={value} onChange={(e) => onChange(e.target.value)} sx={{ minWidth: 150 }}>
      <MenuItem value="">All</MenuItem>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
 
export default function EligibilityTable({ data, loading, filters, onFilters, onDownload, downloading }) {
  const timings = (data?.timings ?? []).map((t) => ({ value: t, label: t }));
  const programs = (data?.programs ?? []).map((p) => ({ value: p, label: p }));
  const statuses = Object.keys(LABEL).map((s) => ({ value: s, label: LABEL[s] }));
  const counts = data?.counts;
 
  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1 }}>
        <Typography fontSize={18} fontWeight={700}>
          Students
        </Typography>
        <Button
          variant="outlined"
          size="small"
          disabled={!data || data.rows.length === 0 || downloading}
          onClick={onDownload}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Download CSV
        </Button>
      </Stack>
 
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ px: 2.5, pb: 1.5 }}>
        <Filter label="Timing" value={filters.timing} options={timings} onChange={(v) => onFilters({ ...filters, timing: v })} />
        <Filter label="Program" value={filters.program} options={programs} onChange={(v) => onFilters({ ...filters, program: v })} />
        <Filter label="Status" value={filters.status} options={statuses} onChange={(v) => onFilters({ ...filters, status: v })} />
      </Stack>
 
      {counts && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ px: 2.5, pb: 1 }}>
          <StatusChip size="small" tone="primary" label={counts.total + " students"} />
          <StatusChip size="small" tone="success" label={counts.eligible + " eligible"} />
          <StatusChip size="small" tone="error" label={counts.notEligible + " not eligible"} />
          <StatusChip size="small" tone="warning" label={counts.needsReview + " need review"} />
          <StatusChip size="small" tone="neutral" label={counts.notEvaluated + " not evaluated"} />
        </Stack>
      )}
 
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        loading={loading}
        getRowKey={(r) => r.applicationId}
        emptyText="No students found. Import the forms first, or change the filters."
      />
    </Card>
  );
}
