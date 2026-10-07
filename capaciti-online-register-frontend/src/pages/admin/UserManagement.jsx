import { useApp } from '../../context/AppContext';

const UserManagement = () => {
  const { users } = useApp();
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900">User Management</h1>
      <p className="mb-4 text-sm text-slate-500">{users.length} users total. Full edit/role-management UI coming soon.</p>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
            <span>{u.fullName}</span>
            <span className="text-slate-500">{u.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
