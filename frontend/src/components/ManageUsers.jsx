import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Loader, Check, X, Edit2, Filter } from 'lucide-react';
import {
  getAllUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  updateUser,
} from '../services/userService';
import Toast from './Toast';
import EditUserModal from './EditUserModal';
import ConfirmDialog from './ConfirmDialog';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & UI States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State for Create
  const [createForm, setCreateForm] = useState({
    email: '', firstName: '', lastName: '', phoneNumber: '', password: '', role: 'USER', isActive: true
  });

  const ROLES = ['USER', 'ADMIN', 'STAFF', 'TECHNICIAN'];

  // Load Data
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (error) {
      showToast('Failed to load users', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'ACTIVE' ? user.isActive : !user.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Handlers
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      await createUser(createForm);
      showToast('User created successfully');
      setShowCreateModal(false);
      setCreateForm({ email: '', firstName: '', lastName: '', phoneNumber: '', password: '', role: 'USER', isActive: true });
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      setIsProcessing(true);
      await updateUser(editingUser.id, formData);
      showToast('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('Role updated');
    } catch (error) {
      showToast('Failed to update role', 'error');
      console.error(error);
    }
  };

  const confirmToggleStatus = async () => {
    if (!confirmAction) return;
    try {
      setIsProcessing(true);
      await updateUserStatus(confirmAction.user.id, !confirmAction.user.isActive);
      setUsers(prev => prev.map(u => u.id === confirmAction.user.id ? { ...u, isActive: !confirmAction.user.isActive } : u));
      showToast(`User ${confirmAction.user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      showToast('Failed to change status', 'error');
      console.error(error);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
          <p className="text-slate-500 text-sm">View and manage system users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Loader className="animate-spin mx-auto mb-2" size={24} />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{user.fullName}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-slate-100 text-slate-700 border-none rounded text-xs font-semibold px-2 py-1 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirmAction({ type: 'status', user })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {user.isActive ? <Check size={12} /> : <X size={12} />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                  <input required type="text" value={createForm.firstName} onChange={e => setCreateForm({...createForm, firstName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                  <input required type="text" value={createForm.lastName} onChange={e => setCreateForm({...createForm, lastName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                <input required type="tel" value={createForm.phoneNumber} onChange={e => setCreateForm({...createForm, phoneNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <input required type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role *</label>
                <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isProcessing} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center">
                  {isProcessing ? <Loader className="animate-spin" size={16} /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSubmit}
          isLoading={isProcessing}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.user?.isActive ? "Deactivate User" : "Activate User"}
        message={`Are you sure you want to ${confirmAction?.user?.isActive ? 'deactivate' : 'activate'} ${confirmAction?.user?.fullName}?`}
        onConfirm={confirmToggleStatus}
        onCancel={() => setConfirmAction(null)}
        isLoading={isProcessing}
        isDangerous={confirmAction?.user?.isActive}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

