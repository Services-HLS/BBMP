import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, Box, TextField, InputAdornment, Stack, Typography, Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Search, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import EmptyState from './EmptyState';

function cellValue(col, row) {
  if (col.render) return col.render(row);
  if (typeof col.accessor === 'function') return col.accessor(row);
  return row[col.accessor];
}

function plainText(col, row) {
  const raw = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
  if (raw == null) return '';
  return String(raw);
}

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
  /** Force card list on phones; auto when many columns or hideOnMobile flags exist */
  mobileCards,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [query, setQuery] = useState('');

  const visibleColumns = useMemo(
    () => columns.filter((c) => !(isMobile && c.hideOnMobile)),
    [columns, isMobile],
  );

  const useCardList = isMobile && (
    mobileCards === true
    || (mobileCards !== false && (columns.some((c) => c.hideOnMobile) || columns.length >= 5))
  );

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

  const primaryCol = visibleColumns[0] || columns[0];
  const secondaryCols = visibleColumns.slice(1, 4);

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderRadius: 2.5,
        maxWidth: '100%',
        width: '100%',
      }}
    >
      {searchable && (
        <Box sx={{ p: { xs: 1.25, sm: 1.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
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

      {useCardList ? (
        <Box sx={{ px: 1.25, py: 1 }}>
          {paged.length === 0 ? (
            <EmptyState title={emptyTitle || 'No records'} description={emptyDescription} />
          ) : (
            <Stack spacing={1}>
              {paged.map((row) => (
                <Box
                  key={row[rowKey]}
                  onClick={() => onRowClick?.(row)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onRowClick(row); } : undefined}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:active': onRowClick ? { bgcolor: 'action.hover' } : undefined,
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ wordBreak: 'break-word', lineHeight: 1.35 }}
                      >
                        {cellValue(primaryCol, row)}
                      </Typography>
                      <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                        {secondaryCols.map((col) => (
                          <Stack
                            key={col.id || col.header}
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ minWidth: 0 }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ flexShrink: 0, minWidth: 64 }}
                            >
                              {col.header}
                            </Typography>
                            <Box sx={{ minWidth: 0, flex: 1, '& .MuiChip-root': { maxWidth: '100%' } }}>
                              {col.render ? col.render(row) : (
                                <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                                  {plainText(col, row)}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                    {onRowClick && (
                      <Box sx={{ color: 'text.secondary', pt: 0.25, flexShrink: 0 }}>
                        <ChevronRight size={16} />
                      </Box>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table
            size={dense ? 'small' : 'medium'}
            sx={{
              minWidth: visibleColumns.length <= 3 ? 0 : Math.min(visibleColumns.length * 110, 720),
              width: '100%',
            }}
          >
            <TableHead>
              <TableRow>
                {visibleColumns.map((col) => (
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
                  <TableCell colSpan={visibleColumns.length} sx={{ border: 0 }}>
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
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id || col.header}
                        align={col.align || 'left'}
                        sx={{
                          maxWidth: { xs: 160, sm: 280, md: 'none' },
                          wordBreak: 'break-word',
                        }}
                      >
                        {cellValue(col, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider />
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
