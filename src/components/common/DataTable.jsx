import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, Box, TextField, InputAdornment,
} from '@mui/material';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  searchable = true,
  searchPlaceholder = 'Search…',
  searchFilter,
  onRowClick,
  initialRowsPerPage = 10,
  emptyTitle,
  emptyDescription,
  dense = true,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return rows;
    if (searchFilter) return rows.filter((r) => searchFilter(r, query.toLowerCase()));
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const val = typeof c.accessor === 'function' ? c.accessor(r) : r[c.accessor];
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns, searchFilter]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'visible',
        borderRadius: 2.5,
        maxWidth: '100%',
      }}
    >
      {searchable && (
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: { xs: 480, sm: 560 } }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id || col.header}
                  align={col.align || 'left'}
                  sx={{ whiteSpace: 'nowrap', width: col.width }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <EmptyState title={emptyTitle || 'No records'} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow
                  key={row[rowKey]}
                  hover={Boolean(onRowClick)}
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id || col.header} align={col.align || 'left'}>
                      {col.render
                        ? col.render(row)
                        : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Rows"
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
          '.MuiTablePagination-toolbar': {
            minHeight: 48,
            px: { xs: 0.5, sm: 2 },
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-end' },
            gap: 0.5,
          },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: { xs: '0.7rem', sm: '0.8125rem' },
          },
          '.MuiTablePagination-actions': { ml: { xs: 0, sm: 1 } },
        }}
      />
    </Paper>
  );
}
