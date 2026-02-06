import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportGroupsToPDF(groups) {
  const doc = new jsPDF();
  doc.autoTable({
    head: [['Name', 'Zone', 'Status', 'Leader', 'Members', 'Day', 'Time', 'Location']],
    body: groups.map(g => [
      g.name,
      g.zone_name,
      g.status_name,
      `${g.leader_first_name || ''} ${g.leader_surname || ''}`,
      g.member_count,
      g.meeting_day,
      g.meeting_time,
      g.meeting_location,
    ]),
    styles: { fontSize: 9 }
  });
  doc.save('cell_groups.pdf');
}