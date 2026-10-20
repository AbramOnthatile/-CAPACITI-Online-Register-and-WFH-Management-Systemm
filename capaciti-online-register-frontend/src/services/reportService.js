export const generateCSVReport = async (rows, filename = 'report.csv') => {
  const headers = Object.keys(rows[0] || {});
  const body = rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...body].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, filename };
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const printReport = ({ title, subtitle, columns, rows }) => {
  const preview = document.createElement('section');
  preview.className = 'report-print-preview';
  preview.innerHTML = `
    <header class="report-print-header">
      <img src="/images/capaciti-logo1.png" alt="CAPACITI" class="report-print-logo" />
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
    </header>
    <table>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;

  const cleanup = () => preview.remove();
  const handleAfterPrint = () => {
    window.removeEventListener('afterprint', handleAfterPrint);
    cleanup();
  };

  document.body.appendChild(preview);
  window.addEventListener('afterprint', handleAfterPrint);
  window.print();
};
