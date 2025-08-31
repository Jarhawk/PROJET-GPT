// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import JSPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { dump } from 'js-yaml';

export function exportToPDF(data = [], config = {}) {
  const {
    filename = 'export.pdf',
    columns = [],
    orientation = 'portrait',
  } = config;
  const orient = ['portrait', 'landscape'].includes(String(orientation).toLowerCase())
    ? String(orientation).toLowerCase()
    : 'portrait';
  const doc = new JSPDF({ orientation: orient });
  if (!Array.isArray(data)) data = [data];
  const cols = Array.isArray(columns) ? columns : [];
  const headers = [];
  if (cols.length) {
    const h = [];
    for (const c of cols) h.push(c.label);
    headers.push(h);
  } else {
    const first = data[0] || {};
    const h = [];
    for (const k in first) h.push(k);
    headers.push(h);
  }
  const rows = [];
  for (const item of data) {
    if (cols.length) {
      const r = [];
      for (const c of cols) r.push(item[c.key]);
      rows.push(r);
    } else {
      const r = [];
      for (const k in item) r.push(item[k]);
      rows.push(r);
    }
  }
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
  const cols = Array.isArray(columns) ? columns : [];
  const arr = [];
  for (const item of data) {
    if (cols.length) {
      const obj = {};
      for (const c of cols) {
        obj[c.label] = item[c.key];
      }
      arr.push(obj);
    } else {
      arr.push(item);
    }
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(arr);
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
  } = config;
  const delim = typeof delimiter === 'string' && delimiter.length ? delimiter : ',';
  if (!Array.isArray(data)) data = [data];
  const cols = Array.isArray(columns) ? columns : [];
  const quote = (v) => (quoteValues ? `"${v}"` : v);
  const headerParts = [];
  if (cols.length) {
    for (const c of cols) headerParts.push(quote(c.label));
  } else {
    const first = data[0] || {};
    for (const k in first) headerParts.push(quote(k));
  }
  const header = headerParts.join(delim);
  const rows = [];
  for (const item of data) {
    const rowParts = [];
    if (cols.length) {
      for (const c of cols) rowParts.push(quote(item[c.key]));
    } else {
      for (const k in item) rowParts.push(quote(item[k]));
    }
    rows.push(rowParts.join(delim));
  }
  const csv = [header, ...rows].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportToTSV(data = [], config = {}) {
  const { filename = 'export.tsv', columns = [] } = config;
  const cols = Array.isArray(columns) ? columns : [];
  return exportToCSV(data, {
    filename,
    columns: cols,
    delimiter: '\t',
    quoteValues: false,
  });
}

export function exportToJSON(data = [], config = {}) {
  const { filename = 'export.json', pretty = true } = config;
  if (!Array.isArray(data)) data = [data];
  const json = JSON.stringify({ data }, null, pretty ? 2 : 0);
  saveAs(new Blob([json], { type: 'application/json;charset=utf-8;' }), filename);
}

export function exportToXML(data = [], config = {}) {
  const {
    filename = 'export.xml',
    root = 'items',
    row = 'item',
  } = config;
  if (!Array.isArray(data)) data = [data];
  const rows = [];
  for (const item of data) {
    const cells = [];
    for (const [k, v] of Object.entries(item)) {
      cells.push(`<${k}>${v}</${k}>`);
    }
    rows.push(`<${row}>${cells.join('')}</${row}>`);
  }
  const xml = `<${root}>${rows.join('')}</${root}>`;
  saveAs(new Blob([xml], { type: 'application/xml;charset=utf-8;' }), filename);
}

export function exportToHTML(data = [], config = {}) {
  const { filename = 'export.html', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const cols = Array.isArray(columns) ? columns : [];
  const labels = [];
  if (cols.length) {
    for (const c of cols) labels.push(c.label);
  } else {
    const first = data[0] || {};
    for (const k in first) labels.push(k);
  }
  const headerCells = [];
  for (const l of labels) headerCells.push(`<th>${l}</th>`);
  const header = headerCells.join('');
  const rows = [];
  for (const item of data) {
    const cells = [];
    if (cols.length) {
      for (const c of cols) cells.push(`<td>${item[c.key]}</td>`);
    } else {
      for (const k in item) cells.push(`<td>${item[k]}</td>`);
    }
    rows.push(`<tr>${cells.join('')}</tr>`);
  }
  const html = `<table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  saveAs(new Blob([html], { type: 'text/html;charset=utf-8;' }), filename);
}

export function exportToMarkdown(data = [], config = {}) {
  const { filename = 'export.md', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const cols = Array.isArray(columns) ? columns : [];
  const labels = [];
  if (cols.length) {
    for (const c of cols) labels.push(c.label);
  } else {
    const first = data[0] || {};
    for (const k in first) labels.push(k);
  }
  const header = `|${labels.join('|')}|`;
  const dividerArr = [];
  for (let i = 0; i < labels.length; i++) dividerArr.push('---');
  const divider = `|${dividerArr.join('|')}|`;
  const rows = [];
  for (const item of data) {
    const cells = [];
    if (cols.length) {
      for (const c of cols) cells.push(item[c.key]);
    } else {
      for (const label of labels) cells.push(item[label]);
    }
    rows.push(`|${cells.join('|')}|`);
  }
  const md = [header, divider, ...rows].join('\n');
  saveAs(new Blob([md], { type: 'text/markdown;charset=utf-8;' }), filename);
}

export function exportToYAML(data = [], config = {}) {
  const { filename = 'export.yaml' } = config;
  if (!Array.isArray(data)) data = [data];
  const yml = dump({ data });
  saveAs(new Blob([yml], { type: 'text/yaml;charset=utf-8;' }), filename);
}

export function exportToTXT(data = [], config = {}) {
  const { filename = 'export.txt', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const cols = Array.isArray(columns) ? columns : [];
  const lines = [];
  for (const item of data) {
    let obj;
    if (cols.length) {
      obj = {};
      for (const c of cols) obj[c.label] = item[c.key];
    } else {
      obj = item;
    }
    const parts = [];
    for (const [k, v] of Object.entries(obj)) parts.push(`${k}: ${v}`);
    lines.push(parts.join('\n'));
  }
  const txt = lines.join('\n\n');
  saveAs(new Blob([txt], { type: 'text/plain;charset=utf-8;' }), filename);
}

export function exportToClipboard(data = [], config = {}) {
  const { columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const cols = Array.isArray(columns) ? columns : [];
  const lines = [];
  for (const item of data) {
    let obj;
    if (cols.length) {
      obj = {};
      for (const c of cols) obj[c.label] = item[c.key];
    } else {
      obj = item;
    }
    const parts = [];
    for (const [k, v] of Object.entries(obj)) parts.push(`${k}: ${v}`);
    lines.push(parts.join('\n'));
  }
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
