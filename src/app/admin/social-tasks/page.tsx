'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCredits } from '@/lib/utils';
import { CREDITS } from '@/lib/constants';

interface SocialTask {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  platform: string;
  postUrl?: string;
  hashtags: string[];
  status: 'pending' | 'approved' | 'rejected';
  creditsAwarded: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export default function AdminSocialTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SocialTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    fetchTasks();
  }, [isAdmin, filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/social-tasks?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskReview = async (
    taskId: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ) => {
    try {
      setProcessingTaskId(taskId);
      
      const response = await fetch(`/api/admin/social-tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes,
          creditsAwarded: action === 'approve' ? CREDITS.SOCIAL_SHARE : 0,
        }),
      });

      if (response.ok) {
        // Refresh tasks
        await fetchTasks();
      } else {
        const error = await response.json();
        alert(`Failed to ${action} task: ${error.message}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} task:`, error);
      alert(`Failed to ${action} task. Please try again.`);
    } finally {
      setProcessingTaskId(null);
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'instagram_share':
        return 'Instagram Share';
      case 'tiktok_share':
        return 'TikTok Share';
      case 'twitter_share':
        return 'Twitter Share';
      case 'facebook_share':
        return 'Facebook Share';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
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
    <AdminLayout title="Social Media Tasks">
      <div className="mb-6">
        <p className="text-gray-600">
          Review and approve user-generated content tasks for credit rewards
        </p>
      </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'pending', label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
                { key: 'approved', label: 'Approved', count: tasks.filter(t => t.status === 'approved').length },
                { key: 'rejected', label: 'Rejected', count: tasks.filter(t => t.status === 'rejected').length },
                { key: 'all', label: 'All', count: tasks.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No tasks found for the selected filter.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li key={task.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {getTaskTypeLabel(task.type)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            User: {task.userEmail} • Platform: {task.platform}
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted: {formatDate(task.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={getStatusBadge(task.status)}>
                            {task.status}
                          </span>
                          {task.creditsAwarded > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                              +{formatCredits(task.creditsAwarded)} credits
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Task Details */}
                      <div className="mt-4 space-y-2">
                        {task.postUrl && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Post URL:</span>
                            <a
                              href={task.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-sm text-pink-600 hover:underline"
                            >
                              {task.postUrl}
                            </a>
                          </div>
                        )}
                        
                        {task.hashtags.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Hashtags:</span>
                            <span className="ml-2 text-sm text-gray-600">
                              {task.hashtags.join(', ')}
                            </span>
                          </div>
                        )}

                        {task.reviewNotes && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Review Notes:</span>
                            <p className="ml-2 text-sm text-gray-600">{task.reviewNotes}</p>
                          </div>
                        )}

                        {task.reviewedBy && task.reviewedAt && (
                          <div>
                            <span className="text-sm text-gray-500">
                              Reviewed by {task.reviewedBy} on {formatDate(task.reviewedAt)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {task.status === 'pending' && (
                        <div className="mt-4 flex space-x-3">
                          <Button
                            onClick={() => handleTaskReview(task.id, 'approve')}
                            disabled={processingTaskId === task.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingTaskId === task.id ? 'Processing...' : `Approve (+${formatCredits(CREDITS.SOCIAL_SHARE)} credits)`}
                          </Button>
                          <Button
                            onClick={() => {
                              const notes = prompt('Rejection reason (optional):');
                              handleTaskReview(task.id, 'reject', notes || undefined);
                            }}
                            disabled={processingTaskId === task.id}
                            variant="secondary"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
    </AdminLayout>
  );
}