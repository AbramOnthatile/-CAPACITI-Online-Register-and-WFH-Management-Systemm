import { useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, WorkMode } from '../../api/types';
import { Search, UserPlus, Shield, Award, GraduationCap, Users } from 'lucide-react';
import StatusBadge, { ActiveBadge } from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { ApiError, canRetryError, getFieldError, getUserErrorMessage } from '../../api/client';

const blankUser = { fullName: '', email: '', role: UserRole.CANDIDATE, defaultMode: WorkMode.ON_SITE, campusId: '', championId: '' };
const roles = Object.values(UserRole);
const roleLabel = (role) => (role === UserRole.TECH_CHAMP ? 'Tech Champion' : role === UserRole.ADMIN ? 'Administrator' : 'Candidate');
const roleStyles = {
  [UserRole.ADMIN]: { className: 'border-salmon/20 bg-salmon/10 text-salmon', icon: Shield },
  [UserRole.TECH_CHAMP]: { className: 'border-navy/20 bg-navy/10 text-navy', icon: Award },
  [UserRole.CANDIDATE]: { className: 'border-primary-600/20 bg-primary-600/10 text-primary-600', icon: GraduationCap },
};

const RoleBadge = ({ role }) => {
  const { className, icon: Icon } = roleStyles[role] ?? roleStyles[UserRole.CANDIDATE];
  return <span className={`pill ${className}`}><Icon className="h-3 w-3" />{roleLabel(role)}</span>;
};

const UserManagement = () => {
  const { users, usersLoading, usersError, campuses, campusesLoading, campusesError, createUser, setUserActive, refreshUsers, refreshCampuses } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [addUserModal, setAddUserModal] = useState(false);
  const [form, setForm] = useState(blankUser);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState('');
  const inFlight = useRef(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [retryError, setRetryError] = useState(null);
  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = !search || user.fullName.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (roleFilter === 'ALL' || user.role === roleFilter);
  }), [users, search, roleFilter]);

  const submitUser = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }
    setError('');
    setFieldErrors({});
    inFlight.current = true;
    setSaving(true);
    try {
      const temporaryPassword = window.prompt(`Enter a temporary password for ${form.email.trim()}.`);
      if (!temporaryPassword?.trim()) {
        setError('A temporary password is required to create the account.');
        return;
      }
      await createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        temporaryPassword,
        role: form.role,
        defaultMode: form.defaultMode,
        campusId: form.campusId || null,
        championId: form.championId || null,
      });
      setForm(blankUser);
      setAddUserModal(false);
    } catch (caught) {
      setError(getUserErrorMessage(caught, 'The user could not be created.'));
      setRetryError(caught);
      if (caught instanceof ApiError) setFieldErrors(caught.fieldErrors);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const toggleActive = async (id, active) => {
    if (updatingUserId === id) return;
    setError('');
    setUpdatingUserId(id);
    try {
      await setUserActive(id, !active);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The account status could not be updated.');
    } finally {
      setUpdatingUserId('');
    }
  };

  const emptyMessage = usersLoading ? 'Loading users...' : 'No users match your filters.';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Access management"
        eyebrowClassName="text-salmon"
        title="User directory & roles"
        description="Manage user access, default work mode, and campus assignment."
        actions={<button type="button" onClick={() => { setError(''); setAddUserModal(true); }} className="btn btn-primary"><UserPlus className="h-4 w-4" />New user</button>}
      />

      <div className="surface surface-pad space-y-3">
        <label className="relative block">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search name or email..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" />
        </label>
        <div className="chip-row" role="group" aria-label="Filter by role">
          {['ALL', ...roles].map((role) => (
            <button key={role} type="button" aria-pressed={roleFilter === role} onClick={() => setRoleFilter(role)} className="chip">
              {role === 'ALL' ? 'All roles' : roleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      {!addUserModal && <ErrorState message={error || usersError?.message || campusesError?.message} />}
      {!addUserModal && (canRetryError(usersError) || canRetryError(campusesError)) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void Promise.all([refreshUsers(), refreshCampuses()])}>Retry</button>}
      {(usersLoading || campusesLoading) && <Skeleton label="Loading users and campuses" />}

      {/* Phones */}
      <ul className="list md:hidden">
        {filteredUsers.map((user) => (
          <li key={user.id} className="surface p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.fullName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{user.fullName}</p>
                <p className="truncate font-mono text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.defaultMode} />
              <ActiveBadge active={user.active} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="truncate text-xs text-slate-500">{user.campusName || 'No campus'}</span>
              <button type="button" disabled={updatingUserId === user.id} onClick={() => void toggleActive(user.id, user.active)} className="btn btn-secondary btn-sm">{updatingUserId === user.id ? 'Saving...' : user.active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </li>
        ))}
        {!filteredUsers.length && <li><EmptyState icon={Users} description={emptyMessage} /></li>}
      </ul>

      {/* Tablet & desktop */}
      <div className="surface hidden overflow-hidden md:block">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Campus</th><th>Default mode</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName} size="sm" />
                      <div className="min-w-0"><p className="font-bold text-navy">{user.fullName}</p><p className="font-mono text-xs text-slate-400">{user.email}</p></div>
                    </div>
                  </td>
                  <td><RoleBadge role={user.role} /></td>
                  <td className="text-slate-600">{user.campusName || '—'}</td>
                  <td><StatusBadge status={user.defaultMode} /></td>
                  <td><ActiveBadge active={user.active} /></td>
                  <td className="text-right"><button type="button" disabled={updatingUserId === user.id} onClick={() => void toggleActive(user.id, user.active)} className="btn btn-secondary btn-sm">{updatingUserId === user.id ? 'Saving...' : user.active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
              {!filteredUsers.length && <tr><td colSpan={6} className="table-empty">{emptyMessage}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {addUserModal && (
        <Modal
          as="form"
          onSubmit={(event) => void submitUser(event)}
          title="Provision new user"
          description="Create an account using backend-supported user fields."
          onClose={() => setAddUserModal(false)}
          closeDisabled={saving}
          footer={(
            <>
              <button type="button" onClick={() => setAddUserModal(false)} disabled={saving} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Creating...' : 'Create account'}</button>
            </>
          )}
        >
          <div className="space-y-4">
            <Alert>{error}</Alert>
            {canRetryError(retryError) && <button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={() => void submitUser({ preventDefault: () => {} })}>Retry</button>}
            <label className="field"><span className="field-label">Full name</span><input required type="text" value={form.fullName} onChange={(event) => { setFieldErrors({}); setForm({ ...form, fullName: event.target.value }); }} className="input" />{getFieldError(fieldErrors, 'fullName') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'fullName')}</span>}</label>
            <label className="field"><span className="field-label">Email</span><input required type="email" value={form.email} onChange={(event) => { setFieldErrors({}); setForm({ ...form, email: event.target.value }); }} className="input" />{getFieldError(fieldErrors, 'email') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'email')}</span>}</label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field"><span className="field-label">Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="input">{roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select>{getFieldError(fieldErrors, 'role') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'role')}</span>}</label>
              <label className="field"><span className="field-label">Default work mode</span><select value={form.defaultMode} onChange={(event) => setForm({ ...form, defaultMode: event.target.value })} className="input">{Object.values(WorkMode).map((mode) => <option key={mode} value={mode}>{mode === WorkMode.ON_SITE ? 'On-site' : 'Work from home'}</option>)}</select>{getFieldError(fieldErrors, 'defaultMode') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'defaultMode')}</span>}</label>
            </div>
            <label className="field"><span className="field-label">Campus</span><select value={form.campusId} onChange={(event) => setForm({ ...form, campusId: event.target.value })} className="input"><option value="">No campus assigned</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select>{getFieldError(fieldErrors, 'campusId') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'campusId')}</span>}</label>
            <label className="field"><span className="field-label">Champion ID <span className="font-normal text-slate-400">(optional)</span></span><input type="text" value={form.championId} onChange={(event) => setForm({ ...form, championId: event.target.value })} className="input" />{getFieldError(fieldErrors, 'championId') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'championId')}</span>}</label>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
