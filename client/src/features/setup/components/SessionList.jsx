import { Button, Card, Stack, Typography } from "@mui/material";
import DataTable from "../../../components/shared/DataTable";
import StatusChip from "../../../components/shared/StatusChip";
const TONE = { ACTIVE: "success", DRAFT: "warning", CLOSED: "neutral" };
const LABEL = { ACTIVE: "Active", DRAFT: "Draft", CLOSED: "Closed" };
export default function SessionList({
  sessions,
  loading,
  selectedId,
  onNew,
  onSelect,
  onEdit,
  onStatus,
}) {
  const columns = [
    {
      key: "name",
      header: "Name",
      render: (s) => (
        <Typography fontWeight={s.id === selectedId ? 700 : 400}>
          {s.name}
        </Typography>
      ),
    },
    { key: "year", header: "Year" },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <StatusChip
          size="small"
          label={LABEL[s.status] ?? s.status}
          tone={TONE[s.status] ?? "neutral"}
        />
      ),
    },
    { key: "options", header: "Open options" },
    { key: "applications", header: "Applications" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            disabled={s.id === selectedId}
            onClick={() => onSelect(s.id)}
          >
            {s.status === "CLOSED" ? "View" : "Select"}
          </Button>
          {s.status !== "CLOSED" && (
            <Button size="small" onClick={() => onEdit(s)}>
              Edit
            </Button>
          )}
          {s.status !== "ACTIVE" && (
            <Button size="small" onClick={() => onStatus(s, "ACTIVE")}>
              Make active
            </Button>
          )}
          {s.status === "ACTIVE" && (
            <Button
              size="small"
              color="error"
              onClick={() => onStatus(s, "CLOSED")}
            >
              Close
            </Button>
          )}
        </Stack>
      ),
    },
  ];
  return (
    <Card sx={{ mb: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 2.5, pb: 0 }}
      >
        <Typography fontSize={18} fontWeight={700}>
          Sessions
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={onNew}
          sx={{
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          + New session
        </Button>
      </Stack>
      <DataTable
        columns={columns}
        rows={sessions}
        loading={loading}
        emptyText="No sessions yet."
      />
    </Card>
  );
}
