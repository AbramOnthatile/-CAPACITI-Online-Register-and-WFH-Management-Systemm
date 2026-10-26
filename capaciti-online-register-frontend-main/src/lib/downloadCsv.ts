type CsvValue = string | number | boolean | null | undefined;

export function downloadCsv(filename: string, rows: Record<string, CsvValue>[], headers?: string[]) {
  const columns = headers ?? Object.keys(rows[0] ?? {});
  if (!columns.length) throw new Error('CSV export requires at least one column.');
  const escape = (value: CsvValue) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const contents = [
    columns.map(escape).join(','),
    ...rows.map((row) => columns.map((header) => escape(row[header])).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
