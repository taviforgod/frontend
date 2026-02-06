import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

export default function TopGroupsTable({ groups = [], count = 5, onGroupClick }) {
  const top = [...groups].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, count);
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Group</TableCell>
          <TableCell>Members</TableCell>
          <TableCell>Zone</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {top.map(g =>
            <TableRow key={g.id} hover onClick={() => onGroupClick?.(g.id)} style={{cursor:'pointer'}}>
              <TableCell>{g.name}</TableCell>
              <TableCell>{g.member_count}</TableCell>
              <TableCell>{g.zone_name}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}