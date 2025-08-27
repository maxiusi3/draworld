'use client';

import { useState, useCallback } from 'react';
import { SocialTaskService, CreateSocialTaskRequest, SocialTasksResponse } from '@/services/socialTaskService';
import { SocialTask } from '@/types';

interface UseSocialTasksReturn {
  tasks: SocialTask[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  loadTasks: () => Promise<void>;
  submitTask: (request: CreateSocialTaskRequest) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useSocialTasks(): UseSocialTasksReturn {
  const [tasks, setTasks] = useState<SocialTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SocialTaskService.getUserTasks();
      setTasks(result.tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load social tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const submitTask = useCallback(async (request: CreateSocialTaskRequest) => {
    setSubmitting(true);
    setError(null);

    try {
      await SocialTaskService.submitTask(request);
      // Reload tasks to show the new submission
      await loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to submit social task');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [loadTasks]);

  const refresh = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    submitting,
    loadTasks,
    submitTask,
    refresh,
    clearError,
  };
}