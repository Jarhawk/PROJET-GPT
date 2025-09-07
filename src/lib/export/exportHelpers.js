// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import JSPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { dump } from 'js-yaml';
import { getConfig, defaultExportDir } from '@/lib/config';

function isTauri() {
  // @ts-ignore
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

async function saveFile(blob, filename) {
  if (isTauri()) {
    const fs = await import('@tauri-apps/plugin-fs');
    const { join } = await import('@tauri-apps/api/path');
    const cfg = await getConfig();
    const dir = cfg.exportDir || (await defaultExportDir());
    await fs.mkdir(dir, { recursive: true });
    const filePath = await join(dir, filename);
    await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
    return filePath;
  }
  if (typeof window !== 'undefined') {
    const { saveAs } = await import('file-saver');
    saveAs(blob, filename);
    return filename;
  }
  return filename;
}

export async function exportToPDF(data = [], config = {}) {
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
  const headers = columns.length
    ? [columns.map((c) => c.label)]
    : [Object.keys(data[0] || {})];
  const rows = data.map((item) =>
    columns.length
      ? columns.map((c) => item[c.key])
      : Object.values(item)
  );
  autoTable(doc, { head: headers, body: rows, styles: { fontSize: 9 } });
  const buf = doc.output('arraybuffer');
  await saveFile(new Blob([buf], { type: 'application/pdf' }), filename);
}

export async function exportToExcel(data = [], config = {}) {
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
  await saveFile(new Blob([buf]), filename);
}

export async function exportToCSV(data = [], config = {}) {
  const {
    filename = 'export.csv',
    columns = [],
    delimiter = ',',
    quoteValues = false,
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
  const csv = [header, ...rows].join('\n');
  await saveFile(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportToTSV(data = [], config = {}) {
  const { filename = 'export.tsv', columns = [] } = config;
  return exportToCSV(data, {
    filename,
    columns,
    delimiter: '\t',
    quoteValues: false,
  });
}

export async function exportToJSON(data = [], config = {}) {
  const { filename = 'export.json', pretty = true } = config;
  if (!Array.isArray(data)) data = [data];
  const json = JSON.stringify({ data }, null, pretty ? 2 : 0);
  await saveFile(
    new Blob([json], { type: 'application/json;charset=utf-8;' }),
    filename
  );
}

export async function exportToXML(data = [], config = {}) {
  const {
    filename = 'export.xml',
    root = 'items',
    row = 'item',
  } = config;
  if (!Array.isArray(data)) data = [data];
  const rows = data.map((item) => {
    const cells = Object.entries(item)
      .map(([k, v]) => `<${k}>${v}</${k}>`)
      .join('');
    return `<${row}>${cells}</${row}>`;
  });
  const xml = `<${root}>${rows.join('')}</${root}>`;
  await saveFile(
    new Blob([xml], { type: 'application/xml;charset=utf-8;' }),
    filename
  );
}

export async function exportToHTML(data = [], config = {}) {
  const { filename = 'export.html', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const labels = columns.length ? columns.map((c) => c.label) : Object.keys(data[0] || {});
  const header = labels.map((l) => `<th>${l}</th>`).join('');
  const rows = data.map((item) => {
    const cells = columns.length
      ? columns.map((c) => `<td>${item[c.key]}</td>`)
      : Object.values(item).map((v) => `<td>${v}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  });
  const html = `<table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  await saveFile(
    new Blob([html], { type: 'text/html;charset=utf-8;' }),
    filename
  );
}

export async function exportToMarkdown(data = [], config = {}) {
  const { filename = 'export.md', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const labels = columns.length ? columns.map((c) => c.label) : Object.keys(data[0] || {});
  const header = `|${labels.join('|')}|`;
  const divider = `|${labels.map(() => '---').join('|')}|`;
  const rows = data.map((item) => {
    const cells = columns.length ? columns.map((c) => item[c.key]) : labels.map((k) => item[k]);
    return `|${cells.join('|')}|`;
  });
  const md = [header, divider, ...rows].join('\n');
  await saveFile(
    new Blob([md], { type: 'text/markdown;charset=utf-8;' }),
    filename
  );
}

export async function exportToYAML(data = [], config = {}) {
  const { filename = 'export.yaml' } = config;
  if (!Array.isArray(data)) data = [data];
  const yml = dump({ data });
  await saveFile(
    new Blob([yml], { type: 'text/yaml;charset=utf-8;' }),
    filename
  );
}

export async function exportToTXT(data = [], config = {}) {
  const { filename = 'export.txt', columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const lines = data.map((item) => {
    const obj = columns.length
      ? columns.reduce((acc, c) => ({ ...acc, [c.label]: item[c.key] }), {})
      : item;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  });
  const txt = lines.join('\n\n');
  await saveFile(
    new Blob([txt], { type: 'text/plain;charset=utf-8;' }),
    filename
  );
}

export function exportToClipboard(data = [], config = {}) {
  const { columns = [] } = config;
  if (!Array.isArray(data)) data = [data];
  const lines = data.map((item) => {
    const obj = columns.length
      ? columns.reduce((acc, c) => ({ ...acc, [c.label]: item[c.key] }), {})
      : item;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  });
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
