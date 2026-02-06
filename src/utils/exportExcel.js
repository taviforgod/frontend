import * as XLSX from "xlsx";
export function exportGroupsToExcel(groups) {
  const data = groups.map(g => ({
    Name: g.name,
    Zone: g.zone_name,
    Status: g.status_name,
    Leader: `${g.leader_first_name || ''} ${g.leader_surname || ''}`,
    Members: g.member_count,
    MeetingDay: g.meeting_day,
    MeetingTime: g.meeting_time,
    Location: g.meeting_location,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CellGroups');
  XLSX.writeFile(wb, 'cell_groups.xlsx');
}