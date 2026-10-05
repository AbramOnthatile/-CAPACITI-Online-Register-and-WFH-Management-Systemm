import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Profile</p>
        <h2 className="text-3xl font-bold text-slate-900">Candidate Profile</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card title="Profile picture">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
              {user?.avatar || 'CN'}
            </div>
            <button className="btn btn-secondary">Update photo</button>
          </div>
        </Card>

        <Card title="Account details">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-600">Full name</label>
              <input className="input" defaultValue={user?.fullName} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-600">Email</label>
              <input className="input" defaultValue={user?.email} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-600">Candidate ID</label>
              <input className="input" defaultValue={user?.candidateId || 'CAP-1001'} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-600">Cohort</label>
              <input className="input" defaultValue={user?.cohort || 'Cohort 8'} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-600">Programme</label>
              <input className="input" defaultValue="Software Development" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-600">Tech Champion</label>
              <input className="input" defaultValue="Lerato Dlamini" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-600">Status</label>
              <input className="input" defaultValue="Active" />
            </div>
          </div>
          <button className="btn btn-primary mt-5">Save changes</button>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
