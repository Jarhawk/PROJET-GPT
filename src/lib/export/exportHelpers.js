// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { dump } from 'js-yaml';
import { watermark } from '@/license';

export function exportToPDF(data = [], config = {}) {
  const {
    filename = 'export.pdf',
    columns = [],
    orientation = 'portrait',
    includeWatermark = true,
  } = config;
  const orient = ['portrait', 'landscape'].includes(String(orientation).toLowerCase())
    ? String(orientation).toLowerCase()
    : 'portrait';
  const doc = new jsPDF({ orientation: orient });
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
  if (includeWatermark) {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      watermark(import.meta.env.VITE_LICENSE_KEY),
      10,
      doc.internal.pageSize.getHeight() - 10,
    );
  }
  doc.save(filename);
}

export function exportToExcel(data = [], config = {}) {
  const {
    filename = 'export.xlsx',
    sheet = 'Sheet1',
    columns = [],
    includeWatermark = true,
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
  if (includeWatermark) {
    XLSX.utils.sheet_add_aoa(ws, [[watermark(import.meta.env.VITE_LICENSE_KEY)]], {
      origin: -1,
    });
  }
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf]), filename);
}

export function exportToCSV(data = [], config = {}) {
  const {
    filename = 'export.csv',
    columns = [],
    delimiter = ',',
    quoteValues = false,
    includeWatermark = true,
  } = config;
  const delim = typeof delimiter === 'string' && delimiter.length ? delimiter : ',';
  if (!Array.isArray(data)) data = [data];
  const quote = (v) => (quoteValues ? `"${v}"` : v);
  const header = columns.length
    ? columns.map((c) => quote(c.label)).join(delim)
    : Object.keys(data[0] || {}).map(quote).join(delim);
  const rows = data.map((item) =>
    columns.length
      ? columns.map((c) => quote(item[c.key])).join(delim)
      : Object.values(item).map(quote).join(delim)
  );
  const lines = [header, ...rows];
  if (includeWatermark) lines.push(watermark(import.meta.env.VITE_LICENSE_KEY));
  const csv = lines.join('\n');
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportToTSV(data = [], config = {}) {
  const { filename = 'export.tsv', columns = [], includeWatermark = true } = config;
  return exportToCSV(data, {
    filename,
    columns,
    delimiter: '\t',
    quoteValues: false,
    includeWatermark,
  });
}

export function exportToJSON(data = [], config = {}) {
  const { filename = 'export.json', pretty = true, includeWatermark = true } = config;
  if (!Array.isArray(data)) data = [data];
  const payload = { data };
  if (includeWatermark) payload.watermark = watermark(import.meta.env.VITE_LICENSE_KEY);
  const json = JSON.stringify(payload, null, pretty ? 2 : 0);
  saveAs(new Blob([json], { type: 'application/json;charset=utf-8;' }), filename);
}

export function exportToXML(data = [], config = {}) {
  const {
    filename = 'export.xml',
    root = 'items',
    row = 'item',
    includeWatermark = true,
  } = config;
  if (!Array.isArray(data)) data = [data];
  const rows = data.map((item) => {
    const cells = Object.entries(item)
      .map(([k, v]) => `<${k}>${v}</${k}>`)
      .join('');
    return `<${row}>${cells}</${row}>`;
  });
  if (includeWatermark) {
    rows.push(
      `<watermark>${watermark(import.meta.env.VITE_LICENSE_KEY)}</watermark>`,
    );
  }
  const xml = `<${root}>${rows.join('')}</${root}>`;
  saveAs(new Blob([xml], { type: 'application/xml;charset=utf-8;' }), filename);
}

export function exportToHTML(data = [], config = {}) {
  const { filename = 'export.html', columns = [], includeWatermark = true } = config;
  if (!Array.isArray(data)) data = [data];
  const labels = columns.length ? columns.map((c) => c.label) : Object.keys(data[0] || {});
  const header = labels.map((l) => `<th>${l}</th>`).join('');
  const rows = data.map((item) => {
    const cells = columns.length
      ? columns.map((c) => `<td>${item[c.key]}</td>`)
      : Object.values(item).map((v) => `<td>${v}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  });
  if (includeWatermark) {
    rows.push(
      `<tr><td colspan="${labels.length}">${watermark(import.meta.env.VITE_LICENSE_KEY)}</td></tr>`,
    );
  }
  const html = `<table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  saveAs(new Blob([html], { type: 'text/html;charset=utf-8;' }), filename);
}

export function exportToMarkdown(data = [], config = {}) {
  const { filename = 'export.md', columns = [], includeWatermark = true } = config;
  if (!Array.isArray(data)) data = [data];
  const labels = columns.length ? columns.map((c) => c.label) : Object.keys(data[0] || {});
  const header = `|${labels.join('|')}|`;
  const divider = `|${labels.map(() => '---').join('|')}|`;
  const rows = data.map((item) => {
    const cells = columns.length ? columns.map((c) => item[c.key]) : labels.map((k) => item[k]);
    return `|${cells.join('|')}|`;
  });
  if (includeWatermark) {
    rows.push(`|${watermark(import.meta.env.VITE_LICENSE_KEY)}|`);
  }
  const md = [header, divider, ...rows].join('\n');
  saveAs(new Blob([md], { type: 'text/markdown;charset=utf-8;' }), filename);
}

export function exportToYAML(data = [], config = {}) {
  const { filename = 'export.yaml', includeWatermark = true } = config;
  if (!Array.isArray(data)) data = [data];
  const payload = { data };
  if (includeWatermark) payload.watermark = watermark(import.meta.env.VITE_LICENSE_KEY);
  const yml = dump(payload);
  saveAs(new Blob([yml], { type: 'text/yaml;charset=utf-8;' }), filename);
}

export function exportToTXT(data = [], config = {}) {
  const { filename = 'export.txt', columns = [], includeWatermark = true } = config;
  if (!Array.isArray(data)) data = [data];
  const lines = data.map((item) => {
    const obj = columns.length
      ? columns.reduce((acc, c) => ({ ...acc, [c.label]: item[c.key] }), {})
      : item;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  });
  if (includeWatermark) {
    lines.push(watermark(import.meta.env.VITE_LICENSE_KEY));
  }
  const txt = lines.join('\n\n');
  saveAs(new Blob([txt], { type: 'text/plain;charset=utf-8;' }), filename);
}

export function exportToClipboard(data = [], config = {}) {
  const { columns = [], includeWatermark = true } = config;
  if (!Array.isArray(data)) data = [data];
  const lines = data.map((item) => {
    const obj = columns.length
      ? columns.reduce((acc, c) => ({ ...acc, [c.label]: item[c.key] }), {})
      : item;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  });
  if (includeWatermark) lines.push(watermark(import.meta.env.VITE_LICENSE_KEY));
  const txt = lines.join('\n\n');
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(txt);
  }
  return Promise.resolve(txt);
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
