import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

// PDF (landscape document) as the main export, CSV for spreadsheets.
const ExportButtons = ({ onPdf, onCsv, disabled = false }) => {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const exportPdf = async () => {
    setWorking(true);
    setError('');
    try {
      await onPdf();
    } catch {
      setError('The PDF could not be created. Try again.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => void exportPdf()} disabled={disabled || working} className="btn btn-primary">
          <FileText className="h-4 w-4" />{working ? 'Preparing PDF...' : 'Download PDF'}
        </button>
        <button type="button" onClick={onCsv} disabled={disabled} className="btn btn-secondary">
          <Download className="h-4 w-4" />CSV
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    </div>
  );
};

export default ExportButtons;
