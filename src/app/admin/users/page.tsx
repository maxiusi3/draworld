'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { AdminService } from '@/services/adminService';
import { AdminUser, UserDetailsStats } from '@/types';
import { formatDate, formatCredits } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Ban, CreditCard, Eye, MoreHorizontal, ShieldCheck, ShieldX } from 'lucide-react';

type Action = 'award' | 'deduct' | 'ban' | 'unban' | 'view';

const AdminUsersPage = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<Partial<AdminUser> & { stats: UserDetailsStats } | null>(null);
  const [actionAmount, setActionAmount] = useState(100);
  const [actionReason, setActionReason] = useState('');

  const { addToast } = useToast();

  const isAdmin = authUser?.role === 'admin';

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { users: fetchedUsers, total } = await AdminService.getUsers({
        page,
        pageSize,
        filter,
        search: searchTerm,
        sortBy,
        sortOrder,
      });
      setUsers(fetchedUsers);
      setTotalUsers(total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addToast({
        title: 'Error',
        message: 'Failed to fetch users.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, pageSize, filter, searchTerm, sortBy, sortOrder, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const openModal = (user: AdminUser, actionType: Action) => {
    setSelectedUser(user);
    setAction(actionType);
    if (actionType === 'view') {
      fetchUserDetails(user.id);
    } else {
      setActionAmount(100);
      setActionReason('');
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setAction(null);
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const details = await AdminService.getUserDetails(userId);
      setUserDetails(details);
      setIsUserDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      addToast({
        title: 'Error',
        message: 'Failed to fetch user details.',
        type: 'error',
      });
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !action) return;

    let result: { success: boolean; message: string } | undefined;
    try {
      switch (action) {
        case 'award':
          result = await AdminService.awardCredits(selectedUser.id, actionAmount, actionReason);
          break;
        case 'deduct':
          result = await AdminService.deductCredits(selectedUser.id, actionAmount, actionReason);
          break;
        case 'ban':
          result = await AdminService.banUser(selectedUser.id, actionReason);
          break;
        case 'unban':
          result = await AdminService.unbanUser(selectedUser.id);
          break;
        default:
          return;
      }
      addToast({
        title: 'Success',
        message: result?.message || 'Action completed successfully.',
        type: 'success',
      });
      closeModal();
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addToast({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="User Management">
      {/* Filters and Search */}
      <div className="mb-6 flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Users</option>
            <option value="banned">Banned Users</option>
            <option value="not_banned">Active Users</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('displayName')}>User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('credits')}>Credits</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>Joined</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.displayName || 'Anonymous'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCredits(user.credits)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt.toDate())}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.banned ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Banned</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <Button onClick={() => openModal(user, 'view')} variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      <Button onClick={() => openModal(user, 'award')} variant="ghost" size="sm"><CreditCard className="h-4 w-4" /></Button>
                      {user.banned ? (
                        <Button onClick={() => openModal(user, 'unban')} variant="ghost" size="sm"><ShieldCheck className="h-4 w-4" /></Button>
                      ) : (
                        <Button onClick={() => openModal(user, 'ban')} variant="ghost" size="sm"><ShieldX className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
        </div>
      )}

      {/* Action Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 capitalize">{action} User</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                You are about to {action} <strong>{selectedUser.displayName || selectedUser.email}</strong>.
              </p>
              {(action === 'award' || action === 'deduct') && (
                <div className="mt-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    value={actionAmount}
                    onChange={(e) => setActionAmount(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                  />
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  id="reason"
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <Button onClick={handleAction} className="w-full">Confirm</Button>
              <Button onClick={closeModal} variant="secondary" className="mt-3 w-full sm:mt-0">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isUserDetailsOpen && userDetails && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
         <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
           <div className="p-6">
             {/* Header */}
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
               <button
                 onClick={() => setIsUserDetailsOpen(false)}
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
                   <p className="mt-1 text-sm text-gray-900">{userDetails.displayName || 'Not set'}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Email</label>
                   <p className="mt-1 text-sm text-gray-900">{userDetails.email}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Credits</label>
                   <p className="mt-1 text-sm text-gray-900">{formatCredits(userDetails.credits || 0)}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Joined</label>
                   <p className="mt-1 text-sm text-gray-900">{userDetails.createdAt ? formatDate(userDetails.createdAt.toDate()) : 'N/A'}</p>
                 </div>
               </div>

               {userDetails.banned && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                   <h4 className="font-medium text-red-900">User is Banned</h4>
                   <p className="text-sm text-red-700 mt-1">
                     Reason: {userDetails.banReason || 'No reason provided'}
                   </p>
                   <p className="text-sm text-red-700">
                     Banned on: {userDetails.bannedAt ? formatDate(userDetails.bannedAt.toDate()) : 'N/A'}
                   </p>
                 </div>
               )}

               {/* Stats */}
               {userDetails.stats && (
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900">Videos Created</h4>
                     <p className="text-2xl font-bold text-purple-600">
                       {userDetails.stats.totalVideos}
                     </p>
                   </div>
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-medium text-gray-900">Total Spent</h4>
                     <p className="text-2xl font-bold text-green-600">
                       ${(userDetails.stats.totalSpent / 100).toFixed(2)}
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
};

export default AdminUsersPage;