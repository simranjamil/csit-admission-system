import { useState } from "react";
import { Alert } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { useTestResults } from "../../hooks/useTestResults";
import { downloadTestResults } from "../../api/testResultsApi";
import RulePassCard from "./components/RulePassCard";
import TestResultsTable from "./components/TestResultsTable";

const EMPTY = { timing: "", program: "", status: "" };
const clean = (f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v));

export default function TestResultsPage() {
  const { selected, isLoading: sessionsLoading } = useSession();
  const [filters, setFilters] = useState(EMPTY);
  const { data, isLoading, isError } = useTestResults(
    selected?.id,
    clean(filters),
  );
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const notify = (message, severity = "success") =>
    setToast({ message, severity });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadTestResults({
        sessionId: selected.id,
        ...clean(filters),
      });
      const url = URL.createObjectURL(blob);
      const part = (s) =>
        s ? "-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
      const link = document.createElement("a");
      link.href = url;
      link.download =
        "test-results-" +
        selected.year +
        part(filters.program) +
        part(filters.timing) +
        part(filters.status) +
        ".csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notify("Could not download the list", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageContainer
      title={selected ? "Test Results - " + selected.name : "Test Results"}
    >
      {!selected && !sessionsLoading && (
        <Alert severity="info">Create a session on the Setup page first.</Alert>
      )}
      {isError && <ErrorMessage message="Could not load the test results." />}
      {selected && (
        <>
          <RulePassCard
            session={selected}
            readOnly={selected.status === "CLOSED"}
            onNotify={notify}
          />
          <TestResultsTable
            data={data}
            loading={isLoading}
            filters={filters}
            onFilters={setFilters}
            onDownload={handleDownload}
            downloading={downloading}
          />
        </>
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        severity={toast?.severity ?? "success"}
        onClose={() => setToast(null)}
      />
    </PageContainer>
  );
}
