import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField as MuiTextField,
  Typography,
} from "@mui/material";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import EmptyState from "../../../components/shared/EmptyState";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import StatusChip from "../../../components/shared/StatusChip";
import {
  useSessionOptions,
  useSaveSessionOptions,
} from "../../../hooks/useSessions";
import { getErrorMessage } from "../../../utils/getErrorMessage";
const toRows = (options) =>
  options.map((o) => ({
    ...o,
    seats: o.seats ?? "",
    rollPrefix: o.rollPrefix ?? "",
  }));
export default function SessionProgramsTable({ session, onSaved }) {
  const { data, isLoading, isError } = useSessionOptions(session?.id);
  const save = useSaveSessionOptions();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (data) {
      setRows(toRows(data.options));
      setError(null);
    }
  }, [data]);
  if (!session) {
    return (
      <Card>
        <EmptyState message="Create a session first." />
      </Card>
    );
  }
  const readOnly = data?.readOnly ?? true;
  const change = (id, patch) =>
    setRows((list) =>
      list.map((r) => (r.programTimingId === id ? { ...r, ...patch } : r)),
    );
  const handleSave = async () => {
    setError(null);
    const open = rows.filter((r) => r.isOpen);
    const bad = open.find(
      (r) => !Number.isInteger(Number(r.seats)) || Number(r.seats) < 1,
    );
    if (bad) {
      setError(
        "Enter seats (1 or more) for " + bad.programCode + " " + bad.timing,
      );
      return;
    }
    try {
      await save.mutateAsync({
        id: session.id,
        options: open.map((r) => ({
          programTimingId: r.programTimingId,
          seats: Number(r.seats),
          rollPrefix: r.rollPrefix.trim() || undefined,
        })),
      });
      onSaved("Open programs saved");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  return (
    <Card>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 2.5, pb: 1 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography fontSize={18} fontWeight={700}>
            Open in {session.name}
          </Typography>
          {readOnly && (
            <StatusChip size="small" label="Read only" tone="neutral" />
          )}
        </Stack>
        <Button
          variant="contained"
          size="small"
          disabled={readOnly || save.isPending}
          onClick={handleSave}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Save
        </Button>
      </Stack>
      {error && (
        <Stack sx={{ px: 2.5, pb: 1 }}>
          <ErrorMessage message={error} />
        </Stack>
      )}
      {isError && <ErrorMessage message="Could not load the options." />}
      {isLoading && <LoadingSpinner />}
      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState message="No active programs. Add a program above." />
      )}
      {rows.length > 0 && (
        <TableContainer>
          <Table>
            <TableHead>
              {" "}
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Open</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Timing</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>
                  Seats
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 160 }}>
                  Roll prefix
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Applications
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => {
                const locked = r.applications > 0;
                return (
                  <TableRow key={r.programTimingId} hover>
                    <TableCell>
                      <Checkbox
                        checked={r.isOpen}
                        disabled={readOnly || (r.isOpen && locked)}
                        onChange={(e) =>
                          change(r.programTimingId, {
                            isOpen: e.target.checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {r.programCode + " - " + r.programName}
                    </TableCell>
                    <TableCell>{r.timing}</TableCell>
                    <TableCell>
                      <MuiTextField
                        size="small"
                        type="number"
                        value={r.seats}
                        disabled={readOnly || !r.isOpen}
                        inputProps={{ min: 1 }}
                        onChange={(e) =>
                          change(r.programTimingId, { seats: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <MuiTextField
                        size="small"
                        value={r.rollPrefix}
                        placeholder={r.defaultPrefix}
                        disabled={readOnly || !r.isOpen || locked}
                        onChange={(e) =>
                          change(r.programTimingId, {
                            rollPrefix: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{r.applications}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
