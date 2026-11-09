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
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";

export default function SalesTable({ data = [], header = [], setItem }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

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
              py: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <ShoppingBagRoundedIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              Cart is currently empty
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a customer and add items above to start a sales order.
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
                      Subtotal
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRows.map((row, rIdx) => {
                    const isArr = Array.isArray(row);
                    const itemName = isArr ? row[0] : (row.itemName || row.name || "");
                    const size = isArr ? row[1] : (row.size || "");
                    const price = Number((isArr ? row[2] : row.price) || 0);
                    const qty = Number((isArr ? row[3] : (row.quantity || row.qty)) || 0);
                    const itemId = isArr ? (row[4] || null) : (row.itemId || row.id || null);
                    const subtotal = price * qty;
                    const displayCells = [itemName, size, `PKR ${price.toLocaleString()}`, qty];

                    return (
                      <TableRow
                        key={rIdx}
                        hover
                        sx={{
                          transition: "background-color 0.15s ease",
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        {displayCells.map((cell, cIdx) => (
                          <TableCell key={cIdx} sx={{ color: "text.primary" }}>
                            {String(cell ?? "")}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#4f46e5" }}>
                          PKR {subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Item">
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
                                      itemId,
                                      itemName,
                                      size,
                                      price,
                                      quantity: qty,
                                      action: "edit",
                                    });
                                  }
                                }}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Item">
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
                                      itemId,
                                      itemName,
                                      size,
                                      price,
                                      quantity: qty,
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

            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 3,
                  py: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Showing {startIdx + 1} to {Math.min(startIdx + rowsPerPage, data.length)} of {data.length} items
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
