// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToPDF(data = [], config = {}) {
  const { filename = 'export.pdf', columns = [] } = config;
  const doc = new jsPDF();
  if (!Array.isArray(data)) data = [data];
  const headers = columns.length
    ? [columns.map((c) => c.label)]
    : [Object.keys(data[0] || {})];
  const rows = data.map((item) =>
    columns.length
      ? columns.map((c) => item[c.key])
      : Object.values(item)
  );
  doc.autoTable({ head: headers, body: rows, styles: { fontSize: 9 } });
  doc.save(filename);
}

export function exportToExcel(data = [], config = {}) {
  const {
    filename = 'export.xlsx',
    sheet = 'Sheet1',
    columns = [],
  } = config;
  if (!Array.isArray(data)) data = [data];
  const arr = data.map((item) => {
    if (columns.length) {
      const obj = {};
      columns.forEach((c) => {
        obj[c.label] = item[c.key];
      });
      return obj;
    }
    return item;
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(arr);
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf]), filename);
}

export function exportToCSV(data = [], config = {}) {
  const { filename = 'export.csv', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const header = columns.length
    ? columns.map((c) => c.label).join(',')
    : Object.keys(data[0] || {}).join(',');
  const rows = data.map((item) =>
    columns.length
      ? columns.map((c) => item[c.key]).join(',')
      : Object.values(item).join(',')
  );
  const csv = [header, ...rows].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function printView(content) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(typeof content === 'string' ? content : content.outerHTML);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}
