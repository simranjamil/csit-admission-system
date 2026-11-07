import { useState } from "react";
import { Alert, Box } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { useRules } from "../../hooks/useRules";
import RuleCard from "./components/RuleCard";
import RuleEditDialog from "./components/RuleEditDialog";
import RuleVersionHistory from "./components/RuleVersionHistory";
export default function RulesPage() {
  const { selected, isLoading: sessionsLoading } = useSession();
  const { data, isLoading, isError } = useRules(selected?.id);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [toast, setToast] = useState(null);
  const readOnly = data?.readOnly ?? true;
  return (
    <PageContainer title={selected ? "Rules - " + selected.name : "Rules"}>
      {!selected && !sessionsLoading && (
        <Alert severity="info">Create a session on the Setup page first.</Alert>
      )}
      {isError && <ErrorMessage message="Could not load rules." />}{" "}
      {data && readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This session is closed, so its rules are read-only.
        </Alert>
      )}
      {data && !readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Saving a change creates a new version. Results that were already
          calculated keep the old version; run the evaluation again to use the
          new one.
        </Alert>
      )}
      {isLoading && <LoadingSpinner />}
      {data && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {data.rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              readOnly={readOnly}
              onEdit={setEditing}
              onHistory={setHistory}
            />
          ))}
        </Box>
      )}
      {editing && (
        <RuleEditDialog
          key={editing.id + "-" + editing.version}
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setToast({ message, severity: "success" });
          }}
        />
      )}
      <RuleVersionHistory rule={history} onClose={() => setHistory(null)} />
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        severity={toast?.severity ?? "success"}
        onClose={() => setToast(null)}
      />
    </PageContainer>
  );
}
