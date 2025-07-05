# Export Helpers

The client-side export utilities live in `src/lib/export/exportHelpers.js`.
They allow exporting arrays of records in different formats.

## exportToPDF

```js
exportToPDF(data, {
  filename = 'export.pdf',
  columns = [],
  orientation = 'portrait',
  includeWatermark = true
});
```

`orientation` controls the PDF page layout and can be either
`'portrait'` or `'landscape'`.
The `columns` option allows mapping field keys to column labels.
The value is case-insensitive. If an invalid orientation is provided, the helper
falls back to `'portrait'`. Set `includeWatermark` to `false` to skip the
copyright footer.

## exportToExcel

```js
exportToExcel(data, {
  filename = 'export.xlsx',
  sheet = 'Sheet1',
  columns = [],
  includeWatermark = true
});
```

The Excel export uses the [xlsx](https://www.npmjs.com/package/xlsx)
package. When `columns` is provided, object keys are renamed to the
specified labels. A small watermark is added to the last row by default. Set
`includeWatermark` to `false` to omit it.

## exportToCSV

```js
exportToCSV(data, {
  filename = 'export.csv',
  columns = [],
  delimiter = ',',
  quoteValues = false,
  includeWatermark = true
});
```

Works similarly to the Excel export but produces a `text/csv` file.
Use `delimiter` to customize the separator between fields (default `,`).
If the delimiter is not a string, the default comma is used. Set `quoteValues`
to `true` to wrap each field in double quotes. The watermark footer can be
disabled with `includeWatermark: false`.

## exportToTSV

```js
exportToTSV(data, {
  filename = 'export.tsv',
  columns = [],
  includeWatermark = true
});
```

Convenience wrapper around `exportToCSV` that uses a tab character as the
delimiter and sets the default filename to `export.tsv`.

## exportToJSON

```js
exportToJSON(data, {
  filename = 'export.json',
  pretty = true,
  includeWatermark = true
});
```

Exports the records as a JSON file. When `pretty` is `true`, the output is
formatted with two-space indentation. The `includeWatermark` flag controls the
footer.

## exportToXML

```js
exportToXML(data, {
  filename = 'export.xml',
  root = 'items',
  row = 'item',
  includeWatermark = true
});
```

Creates a simple XML file. Use `root` and `row` to customize the element names.
The watermark element can be skipped by setting `includeWatermark` to `false`.

## exportToHTML

```js
exportToHTML(data, {
  filename = 'export.html',
  columns = [],
  includeWatermark = true
});
```

Generates an HTML table. Column labels are mapped through `columns` just like the other exports. When `includeWatermark` is `true`, a footer row is appended with the watermark text.

## exportToMarkdown

```js
exportToMarkdown(data, {
  filename = 'export.md',
  columns = [],
  includeWatermark = true
});
```

Outputs a Markdown table using pipes as separators. When `includeWatermark`
is `true`, a footer row containing the watermark is added.

## exportToYAML

```js
exportToYAML(data, {
  filename = 'export.yaml',
  includeWatermark = true
});
```

Creates a YAML file with the records nested under a `data` key. A `watermark`
field is appended when `includeWatermark` is enabled.

## exportToTXT

```js
exportToTXT(data, {
  filename = 'export.txt',
  columns = [],
  includeWatermark = true
});
```

Writes a plain text file listing `key: value` pairs for each record. When
`includeWatermark` is `true`, the watermark text is appended at the end.

## exportToClipboard

```js
exportToClipboard(data, {
  columns = [],
  includeWatermark = true
});
```

Copies the formatted records to the clipboard if `navigator.clipboard` is
available. When not supported, the function resolves with the plain text string
so callers can handle it manually. The output format matches `exportToTXT` and
includes the watermark unless `includeWatermark` is set to `false`.

## printView

`printView` opens a new window and prints the given HTML content.
