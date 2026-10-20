const palette = {
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Late: 'bg-amber-50 text-amber-700 border-amber-200',
  'No Clock-In': 'bg-red-50 text-red-700 border-red-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-primary-50 text-primary-700 border-primary-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  'Early Checkout': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Partial: 'bg-sky-50 text-sky-700 border-sky-200',
  Absent: 'bg-slate-100 text-slate-700 border-slate-200',
  Working: 'bg-primary-50 text-primary-700 border-primary-200',
  'On Break': 'bg-pink text-navy border-pink',
  'Checked Out': 'bg-slate-100 text-slate-700 border-slate-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Away: 'bg-amber-50 text-amber-700 border-amber-200',
  Open: 'bg-red-50 text-red-700 border-red-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const StatusBadge = ({ children, status }) => {
  const tone = palette[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`badge border ${tone}`}>{children || status}</span>;
};

export default StatusBadge;
