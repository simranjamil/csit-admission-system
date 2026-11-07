import { Card, Typography } from "@mui/material";
import DataTable from "../../../components/shared/DataTable";
import StatusChip from "../../../components/shared/StatusChip";
 
const columns = [
  { key: "batchName", header: "Batch", render: (b) => <Typography fontWeight={700}>{b.batchName}</Typography> },
  { key: "fileName", header: "File" },
  { key: "description", header: "Description" },
  { key: "status", header: "Status", render: () => <StatusChip size="small" tone="success" label="Imported" /> },
  { key: "rowsImported", header: "Imported" },
  { key: "rowsDuplicate", header: "Already existed" },
  { key: "rowsFailed", header: "Wrong rows" },
  { key: "importedBy", header: "By" },
  { key: "createdAt", header: "When", render: (b) => new Date(b.createdAt).toLocaleString() },
];
 
export default function ImportHistory({ batches, loading }) {
  return (
    <Card>
      <Typography fontSize={18} fontWeight={700} sx={{ p: 2.5, pb: 0 }}>
        Import history
      </Typography>
      <DataTable columns={columns} rows={batches} loading={loading} getRowKey={(b) => b.id} emptyText="Nothing imported yet." />
    </Card>
  );
}
