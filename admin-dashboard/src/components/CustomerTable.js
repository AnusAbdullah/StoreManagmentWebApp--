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
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { useSelector, useDispatch } from "react-redux";
import { getAllAccRecRecord } from "../features/Data/AccSlice";

export default function CustomerTable({ data = [], header = [], setCustomer }) {
  const dispatch = useDispatch();
  const accRecRecords = useSelector((state) => state.accRec?.data || []);
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  useEffect(() => {
    dispatch(getAllAccRecRecord());
  }, [dispatch]);

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
              No customers found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new customer using the form above.
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
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Khata Balance</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", pr: 3 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRows.map((row, rIdx) => {
                    const custId = row[0];
                    const custName = String(row[1] || "").trim();
                    const khata = accRecRecords.find(
                      (a) => (custId && a.customerId === custId) || (custName && a.cname?.toLowerCase() === custName.toLowerCase())
                    );
                    const remaining = Number(khata?.remainingAmount || 0);

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
                          <TableCell key={cIdx} sx={{ color: "text.primary" }}>
                            {typeof cell === "object" ? JSON.stringify(cell) : String(cell ?? "")}
                          </TableCell>
                        ))}
                        <TableCell>
                          {khata ? (
                            <Chip
                              label={remaining > 0 ? `PKR ${remaining.toLocaleString()} Due` : "Settled (PKR 0)"}
                              size="small"
                              color={remaining > 0 ? "error" : "success"}
                              variant={remaining > 0 ? "filled" : "outlined"}
                              sx={{ fontWeight: 800, fontSize: "0.75rem" }}
                            />
                          ) : (
                            <Chip label="No Khata" size="small" sx={{ fontSize: "0.72rem", color: "text.secondary", bgcolor: "rgba(0,0,0,0.04)" }} />
                          )}
                        </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Customer">
                            <IconButton
                              size="small"
                              sx={{
                                color: "#4f46e5",
                                bgcolor: "rgba(79, 70, 229, 0.08)",
                                "&:hover": { bgcolor: "rgba(79, 70, 229, 0.18)" },
                              }}
                              onClick={() => {
                                if (setCustomer) {
                                  setCustomer({
                                    id: row[0],
                                    name: row[1],
                                    phone: row[2],
                                    address: row[3],
                                    cnic: row[4],
                                    action: "edit",
                                  });
                                }
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Customer">
                            <IconButton
                              size="small"
                              sx={{
                                color: "#ef4444",
                                bgcolor: "rgba(239, 68, 68, 0.08)",
                                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.18)" },
                              }}
                              onClick={() => {
                                if (setCustomer) {
                                  setCustomer({
                                    id: row[0],
                                    name: row[1],
                                    phone: row[2],
                                    address: row[3],
                                    cnic: row[4],
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
