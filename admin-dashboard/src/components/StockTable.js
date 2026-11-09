import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Pagination,
  Stack,
  Card,
  CardContent,
  Chip,
  Button,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

export default function StockTable({ data = [], header = [], setItem, onPrint }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const startIdx = (page - 1) * rowsPerPage;
  const currentRows = data.slice(startIdx, startIdx + rowsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Card
      elevation={0}
      sx={{
        mt: 3,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {data.length === 0 ? (
          <Box
            sx={{
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <InboxRoundedIcon sx={{ fontSize: 52, color: "#cbd5e1", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              No inventory stock found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add new stock items using the form above.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    {header.map((col, idx) => (
                      <TableCell key={idx} sx={{ textTransform: "capitalize", fontWeight: 700, color: "#475569" }}>
                        {col}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRows.map((row, rIdx) => {
                    const cost = Number(row[7] || 0);
                    const sale = Number(row[8] || 0);
                    const quantity = Number(row[9] || 0);
                    const margin = sale > 0 ? Math.round(((sale - cost) / sale) * 100) : 0;

                    return (
                      <TableRow
                        key={rIdx}
                        hover
                        sx={{
                          transition: "background-color 0.15s ease",
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        {row.map((cell, cIdx) => (
                          <TableCell key={cIdx} sx={{ color: "text.primary", whiteSpace: "nowrap" }}>
                            {cIdx === 1 ? (
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#4f46e5" }}>
                                {String(cell || "-")}
                              </Typography>
                            ) : cIdx === 3 ? (
                              <Chip
                                label={String(cell || "-")}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: "#f1f5f9",
                                  color: "#0f172a",
                                  fontFamily: "monospace",
                                }}
                              />
                            ) : cIdx === 7 ? (
                              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                                PKR {cost.toLocaleString()}
                              </Typography>
                            ) : cIdx === 8 ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                  PKR {sale.toLocaleString()}
                                </Typography>
                                {margin > 0 && (
                                  <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700, display: "block" }}>
                                    +{margin}% margin
                                  </Typography>
                                )}
                              </Box>
                            ) : cIdx === 9 ? (
                              <Chip
                                label={`${quantity} tyres`}
                                size="small"
                                color={quantity <= 2 ? "error" : quantity <= 6 ? "warning" : "success"}
                                variant="outlined"
                                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                              />
                            ) : (
                              String(cell ?? "")
                            )}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Tyre Record">
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#4f46e5",
                                  bgcolor: "rgba(79, 70, 229, 0.08)",
                                  "&:hover": { bgcolor: "rgba(79, 70, 229, 0.18)" },
                                }}
                                onClick={() => {
                                  if (setItem) {
                                    setItem({
                                      id: row[0],
                                      brand: row[1],
                                      name: row[2],
                                      pattern: row[2],
                                      size: row[3],
                                      catagory: row[4],
                                      origin: row[5] === "-" ? "" : row[5],
                                      dot: row[6] === "-" ? "" : row[6],
                                      costPrice: row[7],
                                      price: row[8],
                                      quantity: row[9],
                                      action: "edit",
                                    });
                                  }
                                }}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Tyre Item">
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#ef4444",
                                  bgcolor: "rgba(239, 68, 68, 0.08)",
                                  "&:hover": { bgcolor: "rgba(239, 68, 68, 0.18)" },
                                }}
                                onClick={() => {
                                  if (setItem) {
                                    setItem({
                                      id: row[0],
                                      brand: row[1],
                                      name: row[2],
                                      pattern: row[2],
                                      size: row[3],
                                      catagory: row[4],
                                      origin: row[5],
                                      dot: row[6],
                                      costPrice: row[7],
                                      price: row[8],
                                      quantity: row[9],
                                      action: "delete",
                                    });
                                  }
                                }}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 3,
                py: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Showing {data.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + rowsPerPage, data.length)} of {data.length} entries
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {onPrint && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<PrintRoundedIcon />}
                    onClick={onPrint}
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#0284c7",
                      fontSize: "0.8rem",
                    }}
                  >
                    Print Stock Report ({data.length})
                  </Button>
                )}
                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
