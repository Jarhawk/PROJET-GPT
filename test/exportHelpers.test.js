import { describe, it, expect, vi } from 'vitest';
import {
  exportToPDF,
  exportToCSV,
  exportToJSON,
  exportToTSV,
  exportToXML,
  exportToHTML,
  exportToMarkdown,
  exportToYAML,
  exportToTXT,
  exportToClipboard,
} from '../src/lib/export/exportHelpers.js';
import { Blob as NodeBlob } from 'buffer';

const saveAsMock = vi.fn();
vi.mock('file-saver', () => ({ saveAs: (...args) => saveAsMock(...args) }));

let constructorArgs;
const autoTable = vi.fn();
const text = vi.fn();
const save = vi.fn();
vi.mock('jspdf', () => ({
  default: vi.fn((opts) => {
    constructorArgs = opts;
    return {
      autoTable,
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text,
      save,
      internal: { pageSize: { getHeight: () => 100 } },
    };
  }),
}));
vi.mock('jspdf-autotable');

beforeEach(() => {
  saveAsMock.mockReset();
  autoTable.mockReset();
  text.mockReset();
  save.mockReset();
  constructorArgs = undefined;
});

describe('exportToPDF', () => {
  it('passes orientation option', () => {
    exportToPDF([{ a: 1 }], { orientation: 'landscape' });
    expect(constructorArgs).toEqual({ orientation: 'landscape' });
    expect(save).toHaveBeenCalled();
  });

  it('falls back to portrait for invalid orientation', () => {
    exportToPDF([{ a: 1 }], { orientation: 'invalid' });
    expect(constructorArgs).toEqual({ orientation: 'portrait' });
  });

  it('handles case insensitive orientation', () => {
    exportToPDF([{ a: 1 }], { orientation: 'LANDSCAPE' });
    expect(constructorArgs).toEqual({ orientation: 'landscape' });
  });

});

describe('exportToCSV', () => {
  it('uses custom delimiter', () => {
    exportToCSV([{ a: 1, b: 2 }], { delimiter: ';' });
    expect(saveAsMock).toHaveBeenCalled();
    const blobArg = saveAsMock.mock.calls[0][0];
    expect(blobArg instanceof Blob).toBe(true);
    expect(saveAsMock.mock.calls[0][1]).toBe('export.csv');
  });

  it('defaults delimiter when invalid', () => {
    exportToCSV([{ a: 1 }], { delimiter: 5 });
    const csv = saveAsMock.mock.calls[0][0];
    expect(csv instanceof Blob).toBe(true);
  });

  it('quotes values when option enabled', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToCSV([{ a: 'x', b: 'y' }], { quoteValues: true });
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.startsWith('"a","b"')).toBe(true);
  });

});

describe('exportToTSV', () => {
  it('uses tab delimiter', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToTSV([{ a: 1, b: 2 }]);
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.split('\n')[0]).toBe('a\tb');
    expect(saveAsMock.mock.calls[0][1]).toBe('export.tsv');
  });
});

describe('exportToJSON', () => {
  it('writes pretty JSON by default', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToJSON([{ a: 1 }]);
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.includes('\n')).toBe(true);
    expect(saveAsMock.mock.calls[0][1]).toBe('export.json');
  });

  it('produces compact JSON when pretty false', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToJSON([{ a: 1 }], { pretty: false });
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.includes('\n')).toBe(false);
  });

});

describe('exportToXML', () => {
  it('writes XML with custom names', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToXML([{ a: 1 }], { root: 'items', row: 'i' });
    const blob = saveAsMock.mock.calls[0][0];
    const xml = await blob.text();
    global.Blob = originalBlob;
    expect(xml.startsWith('<items>')).toBe(true);
    expect(xml.includes('<i>')).toBe(true);
  });
});

describe('exportToHTML', () => {
  it('writes HTML table', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToHTML([{ a: 1, b: 2 }]);
    const blob = saveAsMock.mock.calls[0][0];
    const html = await blob.text();
    global.Blob = originalBlob;
    expect(html.startsWith('<table>')).toBe(true);
    expect(saveAsMock.mock.calls[0][1]).toBe('export.html');
  });
});

describe('exportToMarkdown', () => {
  it('writes markdown table', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToMarkdown([{ a: 1, b: 2 }]);
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.startsWith('|a|b|')).toBe(true);
    expect(saveAsMock.mock.calls[0][1]).toBe('export.md');
  });
});

describe('exportToYAML', () => {
  it('writes YAML', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToYAML([{ a: 1 }]);
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.trim().startsWith('data:')).toBe(true);
    expect(saveAsMock.mock.calls[0][1]).toBe('export.yaml');
  });
});

describe('exportToTXT', () => {
  it('writes plain text', async () => {
    const originalBlob = global.Blob;
    global.Blob = NodeBlob;
    exportToTXT([{ a: 1, b: 2 }]);
    const blob = saveAsMock.mock.calls[0][0];
    const text = await blob.text();
    global.Blob = originalBlob;
    expect(text.includes('a: 1')).toBe(true);
    expect(saveAsMock.mock.calls[0][1]).toBe('export.txt');
  });
});

describe('exportToClipboard', () => {
  it('uses navigator.clipboard when available', async () => {
    const writeMock = vi.fn(() => Promise.resolve());
    global.navigator = { clipboard: { writeText: writeMock } };
    await exportToClipboard([{ a: 1 }]);
    expect(writeMock).toHaveBeenCalled();
  });

  it('returns text when clipboard missing', async () => {
    delete global.navigator;
    const result = await exportToClipboard([{ a: 1 }]);
    expect(result).toBe('a: 1');
  });
});
