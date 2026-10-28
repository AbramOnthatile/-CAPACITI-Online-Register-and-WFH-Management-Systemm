import { useState } from 'react';
import { MapPin, Plus, Trash2, Wifi } from 'lucide-react';
import { useCampusesApi } from '../../api/hooks';
import { getFieldError, getUserErrorMessage, canRetryError, ApiError } from '../../api/client';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';

// On-site clock-in passes when the device is within the radius OR on a whitelisted network.
const CampusCard = ({ campus, update, whitelistCurrentIp, removeWhitelist }) => {
  const [form, setForm] = useState({
    name: campus.name,
    latitude: String(campus.latitude),
    longitude: String(campus.longitude),
    radiusM: String(campus.radiusM),
  });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [feedback, setFeedback] = useState('');

  const run = async (key, action, success) => {
    setBusy(key);
    setError('');
    setFeedback('');
    setFieldErrors({});
    try {
      await action();
      setFeedback(success);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, 'The campus could not be updated.'));
      if (requestError instanceof ApiError) setFieldErrors(requestError.fieldErrors);
    } finally {
      setBusy('');
    }
  };

  const save = (event) => {
    event.preventDefault();
    void run('save', () => update(campus.id, {
      name: form.name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radiusM: Number(form.radiusM),
    }), 'Campus details saved.');
  };

  return (
    <Card title={campus.name} subtitle="Location and network used to verify on-site clock-ins">
      <div className="space-y-5">
        <Alert>{error}</Alert>
        <Alert tone="success">{feedback}</Alert>

        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field sm:col-span-2">
              <span className="field-label">Campus name</span>
              <input required className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              {getFieldError(fieldErrors, 'name') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'name')}</span>}
            </label>
            <label className="field">
              <span className="field-label">Latitude</span>
              <input required type="number" step="any" min="-90" max="90" className="input" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Longitude</span>
              <input required type="number" step="any" min="-180" max="180" className="input" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Clock-in radius (metres)</span>
              <input required type="number" min="1" className="input" value={form.radiusM} onChange={(event) => setForm({ ...form, radiusM: event.target.value })} />
            </label>
            <div className="field justify-end">
              <a
                href={`https://www.google.com/maps?q=${campus.latitude},${campus.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />View saved location on a map
              </a>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={Boolean(busy)}>
              {busy === 'save' ? 'Saving...' : 'Save details'}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-navy"><Wifi className="h-4 w-4 text-primary-600" />Trusted networks</h4>
              <p className="mt-0.5 text-xs text-slate-500">Candidates on these networks can clock in on-site even without location access.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary w-full sm:w-auto"
              disabled={Boolean(busy)}
              onClick={() => void run('add', () => whitelistCurrentIp(campus.id), 'This network was added.')}
            >
              <Plus className="h-4 w-4" />
              {busy === 'add' ? 'Adding...' : 'Add the network I am on'}
            </button>
          </div>

          {campus.whitelistedCidrs.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No trusted networks yet. Only the location check applies.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {campus.whitelistedCidrs.map((cidr) => (
                <li key={cidr} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="font-mono text-xs text-slate-700">{cidr}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    disabled={Boolean(busy)}
                    onClick={() => void run(`remove-${cidr}`, () => removeWhitelist(campus.id, cidr), `${cidr} was removed.`)}
                    aria-label={`Remove ${cidr}`}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
};

const CampusSettings = () => {
  const campuses = useCampusesApi(true);

  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Configuration" eyebrowClassName="text-salmon" title="Campus settings" description="Where candidates can clock in on-site, by location or by network." />
      {campuses.error && <ErrorState message={campuses.error.message} />}
      {canRetryError(campuses.error) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void campuses.refetch()}>Retry</button>}
      {campuses.loading ? <Skeleton label="Loading campuses" /> : !campuses.error && (
        campuses.data.length === 0
          ? <EmptyState title="No campus configured" description="Add a campus in the database first." />
          : campuses.data.map((campus) => (
            <CampusCard
              key={campus.id}
              campus={campus}
              update={campuses.update}
              whitelistCurrentIp={campuses.whitelistCurrentIp}
              removeWhitelist={campuses.removeWhitelist}
            />
          ))
      )}
    </div>
  );
};

export default CampusSettings;
