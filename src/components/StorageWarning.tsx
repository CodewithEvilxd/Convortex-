"use client";

import React from 'react';
import { getStorageUsage, getStorageWarning, getStorageWarningLevel, StorageWarningLevel, clearOldFiles, getCurrentUser } from '@/utils/authUtils';

const StorageWarning: React.FC = () => {
  const warning = getStorageWarning();
  const level = getStorageWarningLevel();
  const usage = getStorageUsage();
  const currentUser = getCurrentUser();

  if (!warning || level === StorageWarningLevel.NONE) {
    return null;
  }

  const handleClearOldFiles = () => {
    if (currentUser && window.confirm('This will delete old files to free up space. Continue?')) {
      clearOldFiles(currentUser.uid, 10);
      window.location.reload(); // Refresh to show updated storage
    }
  };

  const getAlertStyles = () => {
    switch (level) {
      case StorageWarningLevel.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      case StorageWarningLevel.WARNING:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`p-4 border rounded-lg mb-4 ${getAlertStyles()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-lg mr-2">
            {level === StorageWarningLevel.CRITICAL ? '🚨' : '⚠️'}
          </div>
          <div>
            <p className="font-medium">{warning}</p>
            <p className="text-sm mt-1">
              Used: {(usage.used / 1024 / 1024).toFixed(2)} MB of {(usage.available / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        {currentUser && (
          <button
            onClick={handleClearOldFiles}
            className="px-3 py-1 text-sm bg-white border border-current rounded hover:bg-gray-50 transition-colors"
          >
            Clear Old Files
          </button>
        )}
      </div>
    </div>
  );
};

export default StorageWarning;