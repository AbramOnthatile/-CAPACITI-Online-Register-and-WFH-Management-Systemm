import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { WorkMode } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { readMockValue, writeMockValue } from '../../mocks/storage';
import Card from '../../components/common/Card';
import { MapPin, Building2, Award, CheckCircle2, Shield } from 'lucide-react';

const initials = (name = '') => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2);

const Profile = () => {
  const { user, updateCurrentUser } = useAuth();
  const { updateUser } = useApp();
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
    try {
      await updateUser(user.id, { fullName: formData.fullName, email: formData.email });
      updateCurrentUser({ fullName: formData.fullName, email: formData.email });
      writeMockValue(`profile:${user.id}`, profileData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profile could not be saved.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate Record</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">Account Profile</span>
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">My Profile</h2>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card title="CAPACITI User Profile">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#6115D0]/20 bg-[#1D2951] text-2xl font-black text-white shadow-lg">
                {initials(user?.fullName)}
              </div>
              <h3 className="mt-4 text-lg font-black text-[#1D2951]">{user?.fullName}</h3>
              <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
              <div className="mt-3">
                <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${user?.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                  {user?.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-6 w-full space-y-2 border-t border-slate-100 pt-4 text-left text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-[#F25251]" /> Campus:</span>
                  <span className="font-bold text-[#1D2951]">{user?.campusName ?? 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-amber-500" /> Default mode:</span>
                  <span className="font-bold text-[#1D2951]">{user?.defaultMode === WorkMode.WFH ? 'WFH' : 'On-site'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-slate-400" /> Role:</span>
                  <span className="font-bold text-[#1D2951]">{user ? getStatusMetadata(user.role).label : ''}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="Account Information" subtitle="Update your account and contact details">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input text-xs"
                    value={formData.fullName}
                    onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    className="input text-xs"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Contact Number</label>
                  <input type="tel" value={profileData.phone} onChange={(event) => setProfileData({ ...profileData, phone: event.target.value })} className="input text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Emergency Contact</label>
                  <input type="text" value={profileData.emergencyContact} onChange={(event) => setProfileData({ ...profileData, emergencyContact: event.target.value })} className="input text-xs" />
                </div>
              </div>

              <label className="block rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="ml-2">Home location</span>
                <input type="text" value={profileData.location} onChange={(event) => setProfileData({ ...profileData, location: event.target.value })} className="input mt-2 text-xs" />
              </label>

              <div className="flex justify-end pt-2">
                <button type="submit" className="rounded-xl bg-[#6115D0] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA] transition-all">
                  Save Profile Changes
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
