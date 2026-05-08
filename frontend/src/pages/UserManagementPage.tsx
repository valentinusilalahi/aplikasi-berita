import { useState } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  X,
  Eye,
  EyeOff,
  Search,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userService, UserInfo, CreateUserRequest } from '../api/userService';
import { useFetch, useMutation } from '../hooks/useFetch';

const ROLE_CONFIG: Record<string, { icon: any; bg: string; label: string }> = {
  ADMIN: { icon: ShieldAlert, bg: 'bg-red-50 text-red-700 border-red-200', label: 'Admin' },
  REVIEWER: { icon: ShieldCheck, bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Reviewer' },
  EDITOR: { icon: Shield, bg: 'bg-green-50 text-green-700 border-green-200', label: 'Editor' },
};

export const UserManagementPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [filterRole, setFilterRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Form state
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    role: 'EDITOR',
  });
  const [editForm, setEditForm] = useState({ email: '', role: '', active: true });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch users
  const { data: users, isLoading } = useFetch(
    () => userService.getAll(),
    [refreshKey]
  );

  // Create user mutation
  const createMutation = useMutation(
    (data: CreateUserRequest) => userService.create(data),
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        setShowCreateModal(false);
        resetCreateForm();
        refresh();
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to create user');
      },
    }
  );

  // Deactivate mutation
  const deactivateMutation = useMutation(
    (id: number) => userService.deactivate(id),
    {
      onSuccess: () => {
        toast.success('User deactivated!');
        refresh();
      },
    }
  );

  const resetCreateForm = () => {
    setCreateForm({ username: '', email: '', password: '', role: 'EDITOR' });
    setFormErrors({});
    setShowPassword(false);
  };

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.username.trim()) errors.username = 'Username is required';
    else if (createForm.username.length < 3) errors.username = 'Min 3 characters';
    if (!createForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(createForm.email)) errors.email = 'Invalid email';
    if (!createForm.password.trim()) errors.password = 'Password is required';
    else if (createForm.password.length < 6) errors.password = 'Min 6 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreateForm()) return;
    try {
      await createMutation.mutate(createForm);
    } catch {
      // handled by onError
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      await userService.update(selectedUser.id, {
        email: editForm.email || undefined,
        role: editForm.role || undefined,
        active: editForm.active,
      });
      toast.success('User updated!');
      setShowEditModal(false);
      refresh();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await userService.resetPassword(selectedUser.id, newPassword);
      toast.success('Password reset successfully!');
      setShowResetModal(false);
      setNewPassword('');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleDeactivate = async (user: UserInfo) => {
    if (!confirm(`Are you sure you want to deactivate "${user.username}"?`)) return;
    try {
      await deactivateMutation.mutate(user.id);
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const openEditModal = (user: UserInfo) => {
    setSelectedUser(user);
    setEditForm({ email: user.email, role: user.role, active: user.active });
    setShowEditModal(true);
  };

  const openResetModal = (user: UserInfo) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  // Filter users
  const allUsers: UserInfo[] = users || [];
  const filteredUsers = allUsers.filter((u) => {
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchSearch =
      !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-500 mt-1">{allUsers.length} user{allUsers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Role Filter */}
          <div className="flex gap-2">
            {['ALL', 'ADMIN', 'REVIEWER', 'EDITOR'].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterRole === role
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={allUsers.length} color="bg-blue-50 text-blue-600" />
        <StatCard label="Admins" value={allUsers.filter((u) => u.role === 'ADMIN').length} color="bg-red-50 text-red-600" />
        <StatCard label="Reviewers" value={allUsers.filter((u) => u.role === 'REVIEWER').length} color="bg-purple-50 text-purple-600" />
        <StatCard label="Editors" value={allUsers.filter((u) => u.role === 'EDITOR').length} color="bg-green-50 text-green-600" />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.EDITOR;
                  const RoleIcon = roleCfg.icon;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{user.username}</p>
                            <p className="text-gray-400 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleCfg.bg}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                            <UserCheck className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-semibold">
                            <UserX className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openResetModal(user)}
                            className="p-2 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {user.active && (
                            <button
                              onClick={() => handleDeactivate(user)}
                              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== CREATE USER MODAL ===== */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Create New User">
          <div className="space-y-4">
            <FormField label="Username" error={formErrors.username}>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.username ? 'border-red-400' : 'border-gray-200'}`}
              />
            </FormField>
            <FormField label="Email" error={formErrors.email}>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-400' : 'border-gray-200'}`}
              />
            </FormField>
            <FormField label="Password" error={formErrors.password}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className={`w-full px-4 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-400' : 'border-gray-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="Role">
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EDITOR">Editor</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </FormField>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </Modal>
      )}

      {/* ===== EDIT USER MODAL ===== */}
      {showEditModal && selectedUser && (
        <Modal onClose={() => setShowEditModal(false)} title={`Edit User: ${selectedUser.username}`}>
          <div className="space-y-4">
            <FormField label="Email">
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
            <FormField label="Role">
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EDITOR">Editor</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </FormField>
            <FormField label="Status">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </FormField>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* ===== RESET PASSWORD MODAL ===== */}
      {showResetModal && selectedUser && (
        <Modal onClose={() => setShowResetModal(false)} title={`Reset Password: ${selectedUser.username}`}>
          <FormField label="New Password">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleResetPassword} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">
              Reset Password
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ===== Reusable Components ===== */

const Modal = ({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <p className="text-sm text-gray-500 font-medium">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${color.split(' ')[1]}`}>{value}</p>
  </div>
);

