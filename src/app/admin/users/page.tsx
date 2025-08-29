'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { AdminService, AdminUser } from '@/services/adminService';
import { formatDate, formatCredits } from '@/lib/utils';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getUsers({
        limit: 50,
        search: searchQuery || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: 'award_credits' | 'deduct_credits' | 'ban_user' | 'unban_user'
  ) => {
    try {
      setActionLoading(userId);

      let result;
      switch (action) {
        case 'award_credits':
          const creditsToAward = prompt('How many credits to award?');
          if (!creditsToAward || isNaN(Number(creditsToAward))) return;
          const awardReason = prompt('Reason for awarding credits (optional):');
          result = await AdminService.awardCredits(userId, Number(creditsToAward), awardReason || undefined);
          break;

        case 'deduct_credits':
          const creditsToDeduct = prompt('How many credits to deduct?');
          if (!creditsToDeduct || isNaN(Number(creditsToDeduct))) return;
          const deductReason = prompt('Reason for deducting credits (optional):');
          result = await AdminService.deductCredits(userId, Number(creditsToDeduct), deductReason || undefined);
          break;

        case 'ban_user':
          const banReason = prompt('Reason for banning user:');
          if (!banReason) return;
          result = await AdminService.banUser(userId, banReason);
          break;

        case 'unban_user':
          result = await AdminService.unbanUser(userId);
          break;
      }

      if (result?.success) {
        alert(result.message);
        await fetchUsers(); // Refresh the list
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to ${action.replace('_', ' ')}: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openUserModal = async (user: AdminUser) => {
    try {
      const details = await AdminService.getUserDetails(user.id);
      setSelectedUser({ ...user, ...details } as AdminUser & Record<string, unknown>);
      setShowUserModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      alert('Failed to load user details');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="User Management">
      {/* Search */}
      <div className="mb-6">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {user.displayName || 'Anonymous'}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatCredits(user.credits)} credits
                        </span>
                        <span className="text-sm text-gray-500">
                          Joined {formatDate(user.createdAt)}
                        </span>
                        {user.banned && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => openUserModal(user)}
                      variant="secondary"
                      className="text-sm"
                    >
                      View Details
                    </Button>
                    
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUserAction(user.id, e.target.value as 'award_credits' | 'deduct_credits' | 'ban_user' | 'unban_user');
                            e.target.value = '';
                          }
                        }}
                        disabled={actionLoading === user.id}
                        className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="">Actions</option>
                        <option value="award_credits">Award Credits</option>
                        <option value="deduct_credits">Deduct Credits</option>
                        {user.banned ? (
                          <option value="unban_user">Unban User</option>
                        ) : (
                          <option value="ban_user">Ban User</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Credits</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCredits(selectedUser.credits)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Joined</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                {selectedUser.banned && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900">User is Banned</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Reason: {(selectedUser as AdminUser & { banReason?: string }).banReason || 'No reason provided'}
                    </p>
                    <p className="text-sm text-red-700">
                      Banned on: {formatDate((selectedUser as AdminUser & { bannedAt?: string }).bannedAt)}
                    </p>
                  </div>
                )}

                {/* Stats */}
                {(selectedUser as AdminUser & { stats?: { totalVideos: number; totalSpent: number } }).stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Videos Created</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {(selectedUser as AdminUser & { stats: { totalVideos: number } }).stats.totalVideos}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">Total Spent</h4>
                      <p className="text-2xl font-bold text-green-600">
                        ${((selectedUser as AdminUser & { stats: { totalSpent: number } }).stats.totalSpent / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}