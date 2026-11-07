import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import DataTable from "../../../components/shared/DataTable";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import StatusChip from "../../../components/shared/StatusChip";
import { useRuleVersions } from "../../../hooks/useRules";
export default function RuleVersionHistory({ rule, onClose }) {
  const { data, isLoading, isError } = useRuleVersions(rule?.id);
  const columns = [
    {
      key: "version",
      header: "Version",
      render: (v) => (
        <>
          {"v" + v.version + " "}
          {v.version === rule?.version && (
            <StatusChip size="small" tone="success" label="Current" />
          )}
        </>
      ),
    },
    { key: "summary", header: "Value" },
    { key: "reason", header: "Reason" },
    { key: "by", header: "Changed by" },
    {
      key: "createdAt",
      header: "When",
      render: (v) => new Date(v.createdAt).toLocaleString(),
    },
  ];
  return (
    <Dialog open={Boolean(rule)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {"History: " + (rule?.title ?? "")}
      </DialogTitle>
      <DialogContent>
        {isError ? (
          <ErrorMessage message="Could not load the history." />
        ) : (
          <DataTable
            columns={columns}
            rows={data?.versions ?? []}
            loading={isLoading}
            getRowKey={(v) => v.version}
            rowsPerPage={8}
            emptyText="No history yet."
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
