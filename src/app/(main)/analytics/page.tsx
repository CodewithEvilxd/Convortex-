"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";

interface AnalyticsData {
  totalFiles: number;
  totalSize: number;
  conversionsCount: number;
  storageUsed: number;
  fileTypeDistribution: Record<string, number>;
  conversionTrends: Array<{ date: string; count: number }>;
  storageTrends: Array<{ date: string; size: number }>;
  popularFormats: Array<{ format: string; count: number; percentage: number }>;
  processingTimes: Array<{ operation: string; avgTime: number; count: number }>;
  userActivity: Array<{ action: string; count: number; lastActivity: string }>;
}

interface TimeRange {
  label: string;
  value: '7d' | '30d' | '90d' | '1y';
  days: number;
}

const Analytics: React.FC = () => {
  const { files } = useFileContext();
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>({
    label: 'Last 30 Days',
    value: '30d',
    days: 30
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const timeRanges: TimeRange[] = [
    { label: 'Last 7 Days', value: '7d', days: 7 },
    { label: 'Last 30 Days', value: '30d', days: 30 },
    { label: 'Last 90 Days', value: '90d', days: 90 },
    { label: 'Last Year', value: '1y', days: 365 }
  ];

  // Calculate analytics data
  const calculateAnalytics = useMemo(() => {
    if (!files.length) return null;

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (timeRange.days * 24 * 60 * 60 * 1000));

    const filteredFiles = files.filter(file =>
      new Date(file.dateAdded) >= cutoffDate
    );

    // File type distribution
    const fileTypeDistribution: Record<string, number> = {};
    filteredFiles.forEach(file => {
      const type = file.type.split('/')[0];
      fileTypeDistribution[type] = (fileTypeDistribution[type] || 0) + 1;
    });

    // Conversion trends (simulated)
    const conversionTrends = [];
    for (let i = timeRange.days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const count = Math.floor(Math.random() * 10) + 1; // Simulated data
      conversionTrends.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Storage trends
    const storageTrends = [];
    let cumulativeSize = 0;
    for (let i = timeRange.days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      cumulativeSize += Math.floor(Math.random() * 1000000); // Simulated growth
      storageTrends.push({
        date: date.toISOString().split('T')[0],
        size: cumulativeSize
      });
    }

    // Popular formats
    const formatCount: Record<string, number> = {};
    filteredFiles.forEach(file => {
      const format = file.type.split('/')[1] || 'unknown';
      formatCount[format] = (formatCount[format] || 0) + 1;
    });

    const popularFormats = Object.entries(formatCount)
      .map(([format, count]) => ({
        format: format.toUpperCase(),
        count,
        percentage: Math.round((count / filteredFiles.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Processing times (simulated)
    const processingTimes = [
      { operation: 'Image Conversion', avgTime: 2.3, count: 45 },
      { operation: 'PDF Compression', avgTime: 1.8, count: 32 },
      { operation: 'Text Extraction', avgTime: 0.9, count: 28 },
      { operation: 'File Upload', avgTime: 3.1, count: 67 },
      { operation: 'Batch Processing', avgTime: 5.2, count: 15 }
    ];

    // User activity (simulated)
    const userActivity = [
      { action: 'File Upload', count: 67, lastActivity: '2 hours ago' },
      { action: 'File Conversion', count: 45, lastActivity: '4 hours ago' },
      { action: 'File Download', count: 23, lastActivity: '1 day ago' },
      { action: 'File Deletion', count: 8, lastActivity: '3 days ago' },
      { action: 'Settings Change', count: 3, lastActivity: '1 week ago' }
    ];

    const analytics: AnalyticsData = {
      totalFiles: filteredFiles.length,
      totalSize: filteredFiles.reduce((sum, file) => sum + file.size, 0),
      conversionsCount: filteredFiles.filter(f => f.processed).length,
      storageUsed: filteredFiles.reduce((sum, file) => sum + file.size, 0),
      fileTypeDistribution,
      conversionTrends,
      storageTrends,
      popularFormats,
      processingTimes,
      userActivity
    };

    return analytics;
  }, [files, timeRange]);

  useEffect(() => {
    setAnalyticsData(calculateAnalytics);
  }, [calculateAnalytics]);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Please sign in to view analytics
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to access your file analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-slate-400">
          📊 Advanced Analytics
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-500">
          Comprehensive insights into your file usage and performance
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {timeRanges.map(range => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              timeRange.value === range.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalFiles}</p>
            </div>
            <div className="text-3xl">📁</div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            +12% from last period
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatBytes(analyticsData.storageUsed)}</p>
            </div>
            <div className="text-3xl">💾</div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            +8% from last period
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversions</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.conversionsCount}</p>
            </div>
            <div className="text-3xl">🔄</div>
          </div>
          <div className="mt-2 text-xs text-purple-600">
            +15% from last period
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.processingTimes.reduce((sum, item) => sum + item.avgTime, 0) / analyticsData.processingTimes.length || 0}s
              </p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
          <div className="mt-2 text-xs text-orange-600">
            -5% from last period
          </div>
        </div>
      </div>

      {/* Detailed Analytics Sections */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* File Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 File Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.fileTypeDistribution).map(([type, count]) => {
              const percentage = Math.round((count / analyticsData.totalFiles) * 100);
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      type === 'image' ? 'bg-blue-500' :
                      type === 'application' ? 'bg-green-500' :
                      type === 'text' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="capitalize font-medium">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count} files</span>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Formats */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">🏆 Popular Formats</h3>
          <div className="space-y-3">
            {analyticsData.popularFormats.map((format, index) => (
              <div key={format.format} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{format.format}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{format.count} files</div>
                  <div className="text-sm text-gray-600">{format.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">⚡ Performance Metrics</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsData.processingTimes.map((metric) => (
            <div key={metric.operation} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{metric.avgTime}s</div>
              <div className="text-sm text-gray-600">{metric.operation}</div>
              <div className="text-xs text-gray-500">{metric.count} operations</div>
            </div>
          ))}
        </div>
      </div>

      {/* User Activity Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 User Activity</h3>
        <div className="space-y-4">
          {analyticsData.userActivity.map((activity) => (
            <div key={activity.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.action.includes('Upload') ? 'bg-green-100 text-green-600' :
                  activity.action.includes('Conversion') ? 'bg-blue-100 text-blue-600' :
                  activity.action.includes('Download') ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.action.includes('Upload') ? '⬆️' :
                   activity.action.includes('Download') ? '⬇️' :
                   activity.action.includes('Conversion') ? '🔄' : '⚙️'}
                </div>
                <div>
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-gray-600">{activity.lastActivity}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{activity.count}</div>
                <div className="text-sm text-gray-600">times</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trends Visualization (Simplified) */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 Usage Trends</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Conversion Activity</h4>
            <div className="h-32 flex items-end justify-between gap-1">
              {analyticsData.conversionTrends.slice(-7).map((day) => (
                <div key={day.date} className="flex flex-col items-center">
                  <div
                    className="bg-indigo-500 rounded-t w-6 transition-all duration-300 hover:bg-indigo-600"
                    style={{ height: `${(day.count / 10) * 100}%` }}
                    title={`${day.count} conversions on ${day.date}`}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Storage Growth</h4>
            <div className="h-32 flex items-end justify-between gap-1">
              {analyticsData.storageTrends.slice(-7).map((day) => {
                const maxSize = Math.max(...analyticsData.storageTrends.map(d => d.size));
                const height = maxSize > 0 ? (day.size / maxSize) * 100 : 0;
                return (
                  <div key={day.date} className="flex flex-col items-center">
                    <div
                      className="bg-green-500 rounded-t w-6 transition-all duration-300 hover:bg-green-600"
                      style={{ height: `${height}%` }}
                      title={`${formatBytes(day.size)} on ${day.date}`}
                    ></div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">💡 AI Recommendations</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-green-700 mb-2">🚀 Optimization Opportunities</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Convert {Math.round(analyticsData.popularFormats[0]?.count * 0.3) || 0} images to WebP for better performance</li>
              <li>• {analyticsData.storageUsed > 10000000 ? 'Consider' : 'No need for'} storage cleanup</li>
              <li>• Enable batch processing for {analyticsData.conversionsCount} conversion operations</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">📊 Usage Insights</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Most active day: {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)]}</li>
              <li>• Peak usage time: {['9-11 AM', '2-4 PM', '6-8 PM'][Math.floor(Math.random() * 3)]}</li>
              <li>• Average session: {Math.floor(Math.random() * 20) + 10} minutes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">📈</div>
          <h4 className="font-semibold mb-2">Usage Trends</h4>
          <p className="text-sm text-gray-600">Track file usage patterns</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">⚡</div>
          <h4 className="font-semibold mb-2">Performance</h4>
          <p className="text-sm text-gray-600">Monitor processing speeds</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">💾</div>
          <h4 className="font-semibold mb-2">Storage Analytics</h4>
          <p className="text-sm text-gray-600">Understand storage usage</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🤖</div>
          <h4 className="font-semibold mb-2">AI Insights</h4>
          <p className="text-sm text-gray-600">Smart recommendations</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;