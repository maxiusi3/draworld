'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatsCard } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';

interface SystemHealth {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: string;
    ai_api: string;
    storage: string;
  };
  version: string;
  environment: string;
}

interface SystemMetrics {
  timestamp: string;
  users: {
    total: number;
    active_24h: number;
    active_7d: number;
    new_24h: number;
  };
  videos: {
    total: number;
    generated_24h: number;
    generated_7d: number;
    success_rate_24h: number;
  };
  credits: {
    total_earned: number;
    total_spent: number;
    purchased_24h: number;
  };
  system: {
    uptime: number;
    memory_usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    node_version: string;
  };
}

export function MonitoringDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { addToast } = useToast();

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      addToast({
        type: 'error',
        title: 'Failed to fetch system health',
        message: 'Unable to retrieve current system status',
      });
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_METRICS_API_KEY || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchHealthStatus(), fetchMetrics()]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !health && !metrics) {
    return <LoadingState message="Loading monitoring dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">
            Real-time system health and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* System Health Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
                  {health.status.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-1">Overall Status</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.database)}`}>
                  {health.services.database.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-1">Database</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.ai_api)}`}>
                  {health.services.ai_api.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-1">AI API</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.services.storage)}`}>
                  {health.services.storage.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-1">Storage</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Version: {health.version}</span>
                <span>Environment: {health.environment}</span>
                <span>Updated: {new Date(health.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              label="Total Users"
              value={metrics.users.total.toLocaleString()}
              change={{
                value: metrics.users.new_24h,
                type: 'increase',
              }}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
            />
            
            <StatsCard
              label="Videos Generated (24h)"
              value={metrics.videos.generated_24h.toLocaleString()}
              change={{
                value: Math.round(metrics.videos.success_rate_24h),
                type: 'increase',
              }}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
            
            <StatsCard
              label="Credits Purchased (24h)"
              value={metrics.credits.purchased_24h.toLocaleString()}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
            
            <StatsCard
              label="System Uptime"
              value={formatUptime(metrics.system.uptime)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active (24h)</span>
                    <span className="font-medium">{metrics.users.active_24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active (7d)</span>
                    <span className="font-medium">{metrics.users.active_7d.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Signups (24h)</span>
                    <span className="font-medium">{metrics.users.new_24h.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Videos</span>
                    <span className="font-medium">{metrics.videos.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Generated (7d)</span>
                    <span className="font-medium">{metrics.videos.generated_7d.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate (24h)</span>
                    <span className="font-medium">{metrics.videos.success_rate_24h.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credit Economy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earned</span>
                    <span className="font-medium">{metrics.credits.total_earned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Spent</span>
                    <span className="font-medium">{metrics.credits.total_spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Balance</span>
                    <span className="font-medium">
                      {(metrics.credits.total_earned - metrics.credits.total_spent).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory (RSS)</span>
                    <span className="font-medium">{formatBytes(metrics.system.memory_usage.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heap Used</span>
                    <span className="font-medium">{formatBytes(metrics.system.memory_usage.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Node Version</span>
                    <span className="font-medium">{metrics.system.node_version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}