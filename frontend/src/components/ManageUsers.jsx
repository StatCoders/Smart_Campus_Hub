import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Loader, Check, X, Edit2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

const ManageUsers = () => {
  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state - Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    role: 'USER',
    isActive: true,
  });

  // UI state - Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditingLoading, setIsEditingLoading] = useState(false);

  // UI state - Confirm Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // UI state - Inline Updates
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [updatingField, setUpdatingField] = useState(null);

  // UI state - Row Highlighting
  const [highlightedRowId, setHighlightedRowId] = useState(null);

  // UI state - Search and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // UI state - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // UI state - Toast
  const [toast, setToast] = useState(null);

  const ROLES = ['USER', 'ADMIN', 'STAFF', 'TECHNICIAN'];

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever filters or data changes
  useEffect(() => {
    applyFilters();
  }, [allUsers, searchTerm, roleFilter, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setToast({
        message: 'Failed to load users',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = allUsers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        filtered = filtered.filter((user) => user.isActive === true);
      } else if (statusFilter === 'INACTIVE') {
        filtered = filtered.filter((user) => user.isActive === false);
      }
    }

    setFilteredUsers(filtered);
  };

  const getPaginatedUsers = () => {
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return filteredUsers.slice(startIdx, endIdx);
  };

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = getPaginatedUsers();

  // Create user handlers
  const handleCreateInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (
      !createFormData.email ||
      !createFormData.firstName ||
      !createFormData.lastName ||
      !createFormData.phoneNumber ||
      !createFormData.password
    ) {
      setToast({
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    try {
      setIsCreating(true);
      await createUser(createFormData);

      setToast({
        message: 'User created successfully',
        type: 'success',
      });

      setCreateFormData({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        role: 'USER',
        isActive: true,
      });
      setShowCreateModal(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to create user',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Edit user handlers
  const openEditModal = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleEditSubmit = async (formData) => {
    if (!editingUser) return;

    try {
      setIsEditingLoading(true);
      await updateUser(editingUser.id, formData);

      // Update local state
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                firstName: formData.firstName,
                lastName: formData.lastName,
                fullName: `${formData.firstName} ${formData.lastName}`,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                isActive: formData.isActive,
              }
            : user
        )
      );

      // Highlight the updated row
      setHighlightedRowId(editingUser.id);
      setTimeout(() => setHighlightedRowId(null), 2000);

      setToast({
        message: 'User updated successfully',
        type: 'success',
      });

      closeEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to update user',
        type: 'error',
      });
    } finally {
      setIsEditingLoading(false);
    }
  };

  // Role change handler
  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      setUpdatingField('role');

      await updateUserRole(userId, newRole);

      setAllUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );

      setHighlightedRowId(userId);
      setTimeout(() => setHighlightedRowId(null), 2000);

      setToast({
        message: 'User role updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to update user role',
        type: 'error',
      });
    } finally {
      setUpdatingUserId(null);
      setUpdatingField(null);
    }
  };

  // Status change handler
  const handleStatusChange = (userId, currentStatus) => {
    setConfirmAction({
      type: 'toggleStatus',
      userId,
      currentStatus,
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmAction || confirmAction.type !== 'toggleStatus') return;

    const { userId, currentStatus } = confirmAction;
    const newStatus = !currentStatus;

    try {
      setUpdatingUserId(userId);
      setUpdatingField('status');

      await updateUserStatus(userId, newStatus);

      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );

      setHighlightedRowId(userId);
      setTimeout(() => setHighlightedRowId(null), 2000);

      setToast({
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
      });

      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error updating user status:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to update user status',
        type: 'error',
      });
    } finally {
      setUpdatingUserId(null);
      setUpdatingField(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-700',
      TECHNICIAN: 'bg-blue-100 text-blue-700',
      STAFF: 'bg-purple-100 text-purple-700',
      USER: 'bg-green-100 text-green-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Manage Users
          </h2>
          <p className="text-sm text-slate-500">
            View, search, and manage all users in the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Role Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Filter className="h-3 w-3 inline mr-1" />
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Results counter */}
          <div className="flex items-end">
            <span className="text-xs text-slate-600">
              {filteredUsers.length > 0 && (
                <>
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredUsers.length)} of{' '}
                  {filteredUsers.length}
                </>
              )}
              {filteredUsers.length === 0 && 'No users found'}
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex min-h-96 items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading users...</span>
            </div>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center">
            <p className="text-lg font-semibold text-slate-950">No users found</p>
            <p className="text-sm text-slate-500">
              {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Add a new user to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Joined</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-100 transition ${
                    highlightedRowId === user.id
                      ? 'bg-blue-50 animate-pulse'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-6 py-4 text-slate-900">{user.email}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{user.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{user.phoneNumber}</td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    {updatingUserId === user.id && updatingField === 'role' ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-xs text-slate-500">Updating...</span>
                      </div>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer ${getRoleBadgeColor(
                          user.role
                        )} border-slate-300 hover:border-slate-400`}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role} className="text-slate-900 bg-white">
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="px-6 py-4">
                    {updatingUserId === user.id && updatingField === 'status' ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-xs text-slate-500">Updating...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, user.isActive)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${getStatusBadgeColor(
                          user.isActive
                        )} cursor-pointer`}
                      >
                        {user.isActive ? (
                          <>
                            <Check className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-semibold text-slate-950">Add New User</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={createFormData.email}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={createFormData.firstName}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="John"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={createFormData.lastName}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Doe"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={createFormData.phoneNumber}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="1234567890"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={createFormData.password}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={createFormData.role}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={createFormData.isActive}
                    onChange={handleCreateInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={editingUser}
        onClose={closeEditModal}
        onSave={handleEditSubmit}
        isLoading={isEditingLoading}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={
          confirmAction?.type === 'toggleStatus' && !confirmAction?.currentStatus
            ? 'Activate User'
            : 'Disable User'
        }
        message={
          confirmAction?.type === 'toggleStatus' && !confirmAction?.currentStatus
            ? 'Are you sure you want to activate this user account?'
            : 'Are you sure you want to disable this user account? They will not be able to log in.'
        }
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}
        isLoading={updatingUserId !== null && updatingField === 'status'}
        isDangerous={confirmAction?.type === 'toggleStatus' && confirmAction?.currentStatus}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ManageUsers;

