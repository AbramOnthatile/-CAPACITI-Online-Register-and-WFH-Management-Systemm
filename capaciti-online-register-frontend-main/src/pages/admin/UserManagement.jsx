import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, WorkMode } from '../../api/types';
import { Search, UserPlus, Shield, Award, GraduationCap } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const blankUser = { fullName: '', email: '', role: UserRole.CANDIDATE, defaultMode: WorkMode.ON_SITE, campusId: '', championId: '' };
const roles = Object.values(UserRole);

const UserManagement = () => {
  const { users, usersLoading, usersError, campuses, campusesError, createUser, setUserActive } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [addUserModal, setAddUserModal] = useState(false);
  const [form, setForm] = useState(blankUser);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = !search || user.fullName.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (roleFilter === 'ALL' || user.role === roleFilter);
  }), [users, search, roleFilter]);

  const submitUser = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        defaultMode: form.defaultMode,
        campusId: form.campusId || null,
        campusName: campuses.find((campus) => campus.id === form.campusId)?.name ?? null,
        championId: form.championId || null,
        active: true,
      });
      setForm(blankUser);
      setAddUserModal(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The user could not be created.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, active) => {
    setError('');
    try {
      await setUserActive(id, !active);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The account status could not be updated.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F25251]">Directory Governance</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">Access Management</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">User Directory &amp; Roles</h2>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">Manage user access, default work mode, and campus assignment.</p>
        </div>
        <button type="button" onClick={() => { setError(''); setAddUserModal(true); }} className="flex items-center gap-2 self-start rounded-xl bg-[#6115D0] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#4F11AA] sm:self-auto">
          <UserPlus className="h-4 w-4" /><span>Provision New User</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Search name or email..." value={search} onChange={(event) => setSearch(event.target.value)} className="input py-1.5 pl-8 text-xs" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', ...roles].map((role) => (
            <button key={role} type="button" onClick={() => setRoleFilter(role)} className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all ${roleFilter === role ? 'bg-[#1D2951] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
              {role === 'ALL' ? 'All Roles' : role === UserRole.TECH_CHAMP ? 'Tech Champion' : role === UserRole.ADMIN ? 'Administrator' : 'Candidate'}
            </button>
          ))}
        </div>
      </div>

      {(usersError || campusesError || error) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error || usersError?.message || campusesError?.message}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3.5">User</th><th className="px-4 py-3.5">System Role</th><th className="px-4 py-3.5">Campus</th><th className="px-4 py-3.5">Default Mode</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D2951] text-[10px] font-bold text-white">{user.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</div><div><p className="font-bold text-[#1D2951]">{user.fullName}</p><p className="font-mono text-[10px] text-slate-400">{user.email}</p></div></div></td>
                  <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold ${user.role === UserRole.ADMIN ? 'bg-[#F25251]/10 text-[#F25251]' : user.role === UserRole.TECH_CHAMP ? 'bg-[#1D2951]/10 text-[#1D2951]' : 'bg-[#6115D0]/10 text-[#6115D0]'}`}>{user.role === UserRole.ADMIN ? <Shield className="h-3 w-3" /> : user.role === UserRole.TECH_CHAMP ? <Award className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}{user.role === UserRole.TECH_CHAMP ? 'Tech Champion' : user.role === UserRole.ADMIN ? 'Administrator' : 'Candidate'}</span></td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{user.campusName || '—'}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-600"><StatusBadge status={user.defaultMode} /></td>
                  <td className="px-4 py-3.5"><span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${user.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{user.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3.5 text-right"><button type="button" onClick={() => void toggleActive(user.id, user.active)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-[#6115D0] hover:text-[#6115D0]">{user.active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
              {!usersLoading && filteredUsers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users match your filters.</td></tr>}
              {usersLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading users...</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {addUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2951]/40 p-4 backdrop-blur-sm">
          <form onSubmit={(event) => void submitUser(event)} className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#1D2951]">Provision New User</h3>
            <p className="mt-1 text-xs text-slate-500">Create an account using backend-supported user fields.</p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Full name<input required type="text" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="input mt-1 text-xs" /></label>
              <label className="block text-xs font-semibold text-slate-600">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input mt-1 text-xs" /></label>
              <label className="block text-xs font-semibold text-slate-600">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="input mt-1 text-xs">{roles.map((role) => <option key={role} value={role}>{role === UserRole.TECH_CHAMP ? 'Tech Champion' : role === UserRole.ADMIN ? 'Administrator' : 'Candidate'}</option>)}</select></label>
              <label className="block text-xs font-semibold text-slate-600">Default work mode<select value={form.defaultMode} onChange={(event) => setForm({ ...form, defaultMode: event.target.value })} className="input mt-1 text-xs">{Object.values(WorkMode).map((mode) => <option key={mode} value={mode}>{mode === WorkMode.ON_SITE ? 'On-site' : 'Work from home'}</option>)}</select></label>
              <label className="block text-xs font-semibold text-slate-600">Campus<select value={form.campusId} onChange={(event) => setForm({ ...form, campusId: event.target.value })} className="input mt-1 text-xs"><option value="">No campus assigned</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label>
              <label className="block text-xs font-semibold text-slate-600">Champion ID (optional)<input type="text" value={form.championId} onChange={(event) => setForm({ ...form, championId: event.target.value })} className="input mt-1 text-xs" /></label>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-rose-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setAddUserModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#6115D0] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA] disabled:opacity-60">{saving ? 'Creating...' : 'Create Account'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
