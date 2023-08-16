import React, { useState, useEffect } from "react";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Title from "./Title";
import IconButton from "@mui/material/IconButton";
import EditSharpIcon from "@mui/icons-material/EditSharp";
import DeleteSharpIcon from "@mui/icons-material/DeleteSharp";

export default function ResourceInfo({ data, header, setItem }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 4;
  console.log(
    `Data in table = ${data.itemName},${data.size},${data.quantity},${data.price},${data.recamount},${data.status}`
  );

  const handleNextPage = () => {
    setPage((prevPage) =>
      Math.min(prevPage + 1, Math.ceil(data.length / rowsPerPage))
    );
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const startIdx = (page - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;

  return (
    <React.Fragment>
      <Title>Resource Data</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            {header.map((element, index) => (
              <TableCell key={index}>{element}</TableCell>
            ))}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.slice(startIdx, endIdx).map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
              <TableCell align="center">
                <IconButton
                  color="primary"
                  onClick={() => {
                    setItem({
                      itemName: row[0],
                      size: row[1],
                      price: row[2],
                      quantity: row[3],
                      recamount: row[4],
                      status: row[5],
                      action: "edit",
                    });
                  }}
                >
                  <EditSharpIcon />
                </IconButton>
                <IconButton
                  color="warning"
                  onClick={() => {
                    setItem({
                      itemName: row[0],
                      size: row[1],
                      price: row[2],
                      quantity: row[3],
                      recamount: row[4],
                      status: row[5],
                      action: "delete",
                    });
                  }}
                >
                  <DeleteSharpIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div>
        <button disabled={page === 1} onClick={handlePrevPage}>
          Prev
        </button>
        <button disabled={endIdx >= data.length} onClick={handleNextPage}>
          Next
        </button>
      </div>
    </React.Fragment>
  );
}
