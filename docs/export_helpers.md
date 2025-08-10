# Export Helpers

The client-side export utilities live in `src/lib/export/exportHelpers.js`.
They allow exporting arrays of records in different formats.

## exportToPDF

```js
exportToPDF(data, {
  filename = 'export.pdf',
  columns = [],
  orientation = 'portrait',
});
```

`orientation` controls the PDF page layout and can be either `'portrait'` or `'landscape'`.
The `columns` option allows mapping field keys to column labels.

## exportToExcel

```js
exportToExcel(data, {
  filename = 'export.xlsx',
  sheet = 'Sheet1',
  columns = [],
});
```

The Excel export uses the [xlsx](https://www.npmjs.com/package/xlsx)
package. When `columns` is provided, object keys are renamed to the specified labels.
## exportToCSV

```js
exportToCSV(data, {
  filename = 'export.csv',
  columns = [],
  delimiter = ',',
  quoteValues = false,
});
```

Works similarly to the Excel export but produces a `text/csv` file.
Use `delimiter` to customize the separator between fields (default `,`).
If the delimiter is not a string, the default comma is used. Set `quoteValues` to `true` to wrap each field in double quotes.
## exportToTSV

```js
exportToTSV(data, {
  filename = 'export.tsv',
  columns = [],
});
```

Convenience wrapper around `exportToCSV` that uses a tab character as the
delimiter and sets the default filename to `export.tsv`.

## exportToJSON

```js
exportToJSON(data, {
  filename = 'export.json',
  pretty = true,
});
```

Exports the records as a JSON file. When `pretty` is `true`, the output is formatted with two-space indentation.

## exportToXML

```js
exportToXML(data, {
  filename = 'export.xml',
  root = 'items',
  row = 'item',
});
```

Creates a simple XML file. Use `root` and `row` to customize the element names.
Generates an HTML table. Column labels are mapped through `columns` just like the other exports.
## exportToHTML
Outputs a Markdown table using pipes as separators.
```js
exportToHTML(data, {
  filename = 'export.html',
  columns = [],
});
```
Creates a YAML file with the records nested under a `data` key.

## exportToMarkdown

```js
exportToMarkdown(data, {
  filename = 'export.md',
  columns = [],
});
```


## exportToYAML

```js
exportToYAML(data, {
  filename = 'export.yaml',
});
```


## exportToTXT

```js
exportToTXT(data, {
  filename = 'export.txt',
  columns = [],
});
```

Writes a plain text file listing `key: value` pairs for each record.

## exportToClipboard

```js
exportToClipboard(data, {
  columns = [],
});
```

Copies the formatted records to the clipboard if `navigator.clipboard` is
available. When not supported, the function resolves with the plain text string
so callers can handle it manually. The output format matches `exportToTXT`.
## printView

`printView` opens a new window and prints the given HTML content.
