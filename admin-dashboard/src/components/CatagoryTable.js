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
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

export default function CategoryTable({ data = [], header = [], setCategory }) {
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
              No categories found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create an item category using the form above.
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
                  {currentRows.map((row, rIdx) => (
                    <TableRow
                      key={rIdx}
                      hover
                      sx={{
                        transition: "background-color 0.15s ease",
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <TableCell key={cIdx} sx={{ color: "text.primary" }}>
                          {typeof cell === "object" ? JSON.stringify(cell) : String(cell ?? "")}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Category">
                            <IconButton
                              size="small"
                              sx={{
                                color: "#4f46e5",
                                bgcolor: "rgba(79, 70, 229, 0.08)",
                                "&:hover": { bgcolor: "rgba(79, 70, 229, 0.18)" },
                              }}
                              onClick={() => {
                                if (setCategory) {
                                  setCategory({
                                    id: row[0],
                                    name: row[1],
                                    action: "edit",
                                  });
                                }
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Category">
                            <IconButton
                              size="small"
                              sx={{
                                color: "#ef4444",
                                bgcolor: "rgba(239, 68, 68, 0.08)",
                                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.18)" },
                              }}
                              onClick={() => {
                                if (setCategory) {
                                  setCategory({
                                    id: row[0],
                                    name: row[1],
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
                  ))}
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
                  Showing {startIdx + 1} to {Math.min(startIdx + rowsPerPage, data.length)} of {data.length} entries
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
