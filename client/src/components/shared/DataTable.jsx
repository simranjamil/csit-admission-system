import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
 
export default function DataTable({
  columns,
  rows,
  loading = false,
  emptyText = "No records found.",
  getRowKey = (row) => row.id,
  rowsPerPage = 10,
}) {
  const [page, setPage] = useState(0);
 
  if (loading) return <LoadingSpinner />;
  if (!rows.length) return <EmptyState message={emptyText} />;
 
  const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
  const current = Math.min(page, lastPage);
  const visible = rows.slice(current * rowsPerPage, (current + 1) * rowsPerPage);
 
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align} sx={{ fontWeight: 700 }}>
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((row) => (
            <TableRow key={getRowKey(row)} hover>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align}>
                  {col.render ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={rows.length}
          page={current}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
          onPageChange={(_, newPage) => setPage(newPage)}
        />
      )}
    </TableContainer>
  );
}
