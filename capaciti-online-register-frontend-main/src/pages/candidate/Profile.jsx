import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { WorkMode } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { readMockValue, writeMockValue } from '../../mocks/storage';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import { ActiveBadge } from '../../components/common/StatusBadge';
import StatusBadge from '../../components/common/StatusBadge';
import { WfhStatus } from '../../api/types';
import { MapPin } from 'lucide-react';

const Profile = () => {
  const { user, updateCurrentUser } = useAuth();
  const { isDemoMode } = useApp();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
  });
  const [profileData, setProfileData] = useState(() => readMockValue(`profile:${user?.id}`, {
    phone: '',
    emergencyContact: '',
    location: '',
  }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user) return;
    setError('');
    if (!isDemoMode) {
      setError('Profile editing is demo-only because the backend does not expose a candidate profile update.');
      return;
    }
    try {
      updateCurrentUser({ fullName: formData.fullName, email: formData.email });
      writeMockValue(`profile:${user.id}`, profileData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profile could not be saved.');
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Account" title="My profile" actions={<StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>} />

      <Alert tone="success">{saved && 'Profile changes saved successfully.'}</Alert>
      <Alert>{error}</Alert>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <section className="surface surface-pad lg:col-span-4 lg:self-start">
          <div className="flex items-center gap-4 lg:flex-col lg:text-center">
            <Avatar name={user?.fullName} size="lg" className="ring-4 ring-primary-600/15 lg:h-24 lg:w-24 lg:text-2xl" />
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold text-navy">{user?.fullName}</h3>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
              <div className="mt-2"><ActiveBadge active={user?.active} /></div>
            </div>
          </div>
          <dl className="detail-list mt-5 border-t border-slate-100 pt-4">
            <div className="detail-row"><dt>Campus</dt><dd>{user?.campusName ?? 'Not assigned'}</dd></div>
            <div className="detail-row"><dt>Default mode</dt><dd>{user?.defaultMode === WorkMode.WFH ? 'WFH' : 'On-site'}</dd></div>
            <div className="detail-row"><dt>Role</dt><dd>{user ? getStatusMetadata(user.role).label : ''}</dd></div>
          </dl>
        </section>

        <div className="min-w-0 lg:col-span-8">
          <Card title="Account information" subtitle="Update your account and contact details">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span className="field-label">Full name</span>
                  <input type="text" required autoComplete="name" className="input" value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} disabled={!isDemoMode} />
                </label>
                <label className="field">
                  <span className="field-label">Email address</span>
                  <input type="email" required autoComplete="email" className="input" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} disabled={!isDemoMode} />
                </label>
                <label className="field">
                  <span className="field-label">Contact number</span>
                  <input type="tel" autoComplete="tel" value={profileData.phone} onChange={(event) => setProfileData({ ...profileData, phone: event.target.value })} className="input" disabled={!isDemoMode} />
                </label>
                <label className="field">
                  <span className="field-label">Emergency contact</span>
                  <input type="text" value={profileData.emergencyContact} onChange={(event) => setProfileData({ ...profileData, emergencyContact: event.target.value })} className="input" disabled={!isDemoMode} />
                </label>
              </div>

              <label className="field">
                <span className="field-label">Home location</span>
                <span className="relative block">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={profileData.location} onChange={(event) => setProfileData({ ...profileData, location: event.target.value })} className="input pl-10" disabled={!isDemoMode} />
                </span>
              </label>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button type="submit" disabled={!isDemoMode} className="btn btn-primary w-full sm:w-auto">Save changes</button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
