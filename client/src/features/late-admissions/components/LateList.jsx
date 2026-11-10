import { Card, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import StatusChip from "../../../components/shared/StatusChip";
 
export default function LateList({ rows, loading, selectedId, onSelect }) {
  return (
    <Card sx={{ flex: 1.4 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Dummy roll no</TableCell>
            <TableCell>Test marks</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const selected = r.applicationId === selectedId;
            return (
              <TableRow
                key={r.applicationId}
                hover={!r.resolved}
                selected={selected}
                onClick={() => !r.resolved && onSelect(r)}
                sx={{ cursor: r.resolved ? "default" : "pointer" }}
              >
                <TableCell sx={{ fontWeight: selected ? 700 : 400 }}>{r.dummyRoll}</TableCell>
                <TableCell>{r.marks}</TableCell>
                <TableCell>{r.result}</TableCell>
                <TableCell>
                  {r.resolved ? (
                    <StatusChip size="small" tone="success" label={"Resolved: " + r.realRoll} />
                  ) : selected ? (
                    <StatusChip size="small" tone="primary" label="Selected" />
                  ) : (
                    <StatusChip size="small" tone="warning" label="Unresolved" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary" fontSize={14} sx={{ py: 1 }}>
                  {loading ? "Loading..." : "No late (dummy) students. They appear here after results are imported."}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
