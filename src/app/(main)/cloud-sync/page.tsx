"use client";

import React, { useState, useEffect } from "react";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";
import { FileObject } from "@/utils/authUtils";
import { cloudSyncManager, CLOUD_SERVICES, SyncResult } from "@/utils/cloudSyncUtils";

interface CloudService {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  lastSync?: string;
  filesCount?: number;
}

interface SyncStatus {
  service: string;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  progress: number;
  message: string;
}

const CloudSync: React.FC = () => {
  const { files, addFile } = useFileContext();
  const { currentUser } = useAuth();
  const [cloudServices, setCloudServices] = useState<CloudService[]>(
    CLOUD_SERVICES.map(service => ({
      ...service,
      connected: false,
      lastSync: undefined,
      filesCount: undefined
    }))
  );

  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [syncMode, setSyncMode] = useState<'upload' | 'download' | 'sync'>('sync');
  const [autoSync, setAutoSync] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  // Check connection status on component mount
  useEffect(() => {
    const checkConnections = () => {
      setCloudServices(prev => prev.map(service => ({
        ...service,
        connected: cloudSyncManager.isConnected(service.id)
      })));
    };

    checkConnections();
  }, []);

  // Real cloud service connection using OAuth
  const connectService = async (serviceId: string) => {
    try {
      setIsConnecting(true);
      setConnectionError("");

      // Initiate OAuth flow
      const authUrl = await cloudSyncManager.initiateOAuth(serviceId);

      // Open OAuth window
      const oauthWindow = window.open(
        authUrl,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!oauthWindow) {
        throw new Error('Failed to open OAuth window. Please allow popups for this site.');
      }

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'oauth_callback') {
          const { code, state } = event.data;

          // Handle the OAuth callback
          cloudSyncManager.handleOAuthCallback(code, state)
            .then(success => {
              if (success) {
                setCloudServices(prev => prev.map(service =>
                  service.id === serviceId
                    ? {
                        ...service,
                        connected: true,
                        lastSync: new Date().toISOString(),
                        filesCount: 0
                      }
                    : service
                ));
                alert(`Successfully connected to ${cloudServices.find(s => s.id === serviceId)?.name}!`);
              } else {
                setConnectionError('Failed to complete authentication');
              }
            })
            .catch(error => {
              console.error('OAuth callback error:', error);
              setConnectionError('Authentication failed');
            })
            .finally(() => {
              setIsConnecting(false);
            });

          window.removeEventListener('message', handleMessage);
          oauthWindow.close();
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback: check connection status after a delay
      setTimeout(() => {
        if (cloudSyncManager.isConnected(serviceId)) {
          setCloudServices(prev => prev.map(service =>
            service.id === serviceId
              ? {
                  ...service,
                  connected: true,
                  lastSync: new Date().toISOString(),
                  filesCount: 0
                }
              : service
          ));
        }
        setIsConnecting(false);
      }, 10000);

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect to service');
      setIsConnecting(false);
    }
  };

  // Real file sync with cloud service
  const syncWithService = async (serviceId: string) => {
    const service = cloudServices.find(s => s.id === serviceId);
    if (!service?.connected) return;

    // Add to sync status
    setSyncStatus(prev => [...prev, {
      service: serviceId,
      status: 'syncing',
      progress: 0,
      message: 'Initializing sync...'
    }]);

    try {
      // Convert local files to File objects for sync
      const localFiles: File[] = files.map(file => {
        // Convert base64 to Blob, then to File
        const byteCharacters = atob(file.base64.split(',')[1] || file.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.type });
        return new File([blob], file.name, { type: file.type });
      });

      // Perform sync based on mode
      let result: SyncResult;

      if (syncMode === 'upload') {
        // Upload only mode
        setSyncStatus(prev => prev.map(status =>
          status.service === serviceId
            ? { ...status, message: 'Uploading files...' }
            : status
        ));

        result = {
          success: true,
          uploaded: localFiles.length,
          downloaded: 0,
          errors: []
        };

        // Upload each file
        for (let i = 0; i < localFiles.length; i++) {
          const file = localFiles[i];
          const progress = Math.round(((i + 1) / localFiles.length) * 100);

          setSyncStatus(prev => prev.map(status =>
            status.service === serviceId
              ? {
                  ...status,
                  progress,
                  message: `Uploading ${file.name}...`
                }
              : status
          ));

          try {
            await cloudSyncManager.uploadFile(serviceId, file, file.name);
          } catch (error) {
            result.errors.push(`Failed to upload ${file.name}: ${error}`);
          }
        }

      } else if (syncMode === 'download') {
        // Download only mode
        setSyncStatus(prev => prev.map(status =>
          status.service === serviceId
            ? { ...status, message: 'Downloading files...' }
            : status
        ));

        const cloudFiles = await cloudSyncManager.listFiles(serviceId);

        result = {
          success: true,
          uploaded: 0,
          downloaded: cloudFiles.length,
          errors: []
        };

        // Download each file
        for (let i = 0; i < cloudFiles.length; i++) {
          const cloudFile = cloudFiles[i];
          const progress = Math.round(((i + 1) / cloudFiles.length) * 100);

          setSyncStatus(prev => prev.map(status =>
            status.service === serviceId
              ? {
                  ...status,
                  progress,
                  message: `Downloading ${cloudFile.name}...`
                }
              : status
          ));

          try {
            const blob = await cloudSyncManager.downloadFile(serviceId, cloudFile.id);

            // Convert blob to base64 and add to local files
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              const localFile: FileObject = {
                id: `cloud_${serviceId}_${cloudFile.id}`,
                name: cloudFile.name,
                type: cloudFile.type,
                size: cloudFile.size,
                base64: base64,
                dateAdded: new Date().toISOString(),
                processed: false,
                isSignature: false,
              };
              addFile(localFile);
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            result.errors.push(`Failed to download ${cloudFile.name}: ${error}`);
          }
        }

      } else {
        // Two-way sync
        setSyncStatus(prev => prev.map(status =>
          status.service === serviceId
            ? { ...status, message: 'Performing two-way sync...' }
            : status
        ));

        result = await cloudSyncManager.syncFiles(serviceId, localFiles, (progress) => {
          setSyncStatus(prev => prev.map(status =>
            status.service === serviceId
              ? { ...status, progress: Math.round(progress) }
              : status
          ));
        });
      }

      // Update sync status
      setSyncStatus(prev => prev.map(status =>
        status.service === serviceId
          ? {
              ...status,
              status: result.success ? 'completed' : 'error',
              message: result.success
                ? `Sync completed! Uploaded: ${result.uploaded}, Downloaded: ${result.downloaded}`
                : `Sync failed: ${result.errors.join(', ')}`
            }
          : status
      ));

      // Update service stats
      if (result.success) {
        setCloudServices(prev => prev.map(service =>
          service.id === serviceId
            ? {
                ...service,
                lastSync: new Date().toISOString(),
                filesCount: (service.filesCount || 0) + result.uploaded
              }
            : service
        ));
      }

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => prev.map(status =>
        status.service === serviceId
          ? {
              ...status,
              status: 'error',
              message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : status
      ));
    }

    // Remove from sync status after completion
    setTimeout(() => {
      setSyncStatus(prev => prev.filter(status => status.service !== serviceId));
    }, 5000);
  };

  // Upload files to cloud service
  const uploadToCloud = async (serviceId: string, filesToUpload: FileObject[]) => {
    const service = cloudServices.find(s => s.id === serviceId);
    if (!service?.connected || filesToUpload.length === 0) return;

    setSyncStatus(prev => [...prev, {
      service: serviceId,
      status: 'syncing',
      progress: 0,
      message: 'Preparing upload...'
    }]);

    let uploadedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileObj = filesToUpload[i];
      const progress = Math.round(((i + 1) / filesToUpload.length) * 100);

      setSyncStatus(prev => prev.map(status =>
        status.service === serviceId
          ? {
              ...status,
              progress,
              message: `Uploading ${fileObj.name}...`
            }
          : status
      ));

      try {
        // Convert FileObject to File
        const byteCharacters = atob(fileObj.base64.split(',')[1] || fileObj.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileObj.type });
        const file = new File([blob], fileObj.name, { type: fileObj.type });

        // Upload to cloud
        await cloudSyncManager.uploadFile(serviceId, file, fileObj.name);
        uploadedCount++;
      } catch (error) {
        console.error(`Failed to upload ${fileObj.name}:`, error);
        errors.push(`Failed to upload ${fileObj.name}`);
      }
    }

    setSyncStatus(prev => prev.map(status =>
      status.service === serviceId
        ? {
            ...status,
            status: errors.length === 0 ? 'completed' : 'error',
            message: errors.length === 0
              ? `Successfully uploaded ${uploadedCount} files!`
              : `Uploaded ${uploadedCount} files with ${errors.length} errors`
          }
        : status
    ));

    // Update service stats
    if (uploadedCount > 0) {
      setCloudServices(prev => prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              filesCount: (service.filesCount || 0) + uploadedCount
            }
          : service
      ));
    }

    setTimeout(() => {
      setSyncStatus(prev => prev.filter(status => status.service !== serviceId));
    }, 5000);
  };

  // Create backup of all files
  const createBackup = async () => {
    const connectedServices = cloudServices.filter(s => s.connected);
    if (connectedServices.length === 0) {
      alert('Please connect at least one cloud service to create a backup.');
      return;
    }

    setSyncStatus(prev => [...prev, {
      service: 'backup',
      status: 'syncing',
      progress: 0,
      message: 'Creating backup...'
    }]);

    let totalUploaded = 0;
    let totalErrors = 0;

    for (let i = 0; i < connectedServices.length; i++) {
      const service = connectedServices[i];
      const progress = Math.round(((i + 1) / connectedServices.length) * 100);

      setSyncStatus(prev => prev.map(status =>
        status.service === 'backup'
          ? {
              ...status,
              progress,
              message: `Backing up to ${service.name}...`
            }
          : status
      ));

      try {
        await uploadToCloud(service.id, files);
        totalUploaded += files.length;
      } catch (error) {
        console.error(`Backup to ${service.name} failed:`, error);
        totalErrors++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSyncStatus(prev => prev.map(status =>
      status.service === 'backup'
        ? {
            ...status,
            status: totalErrors === 0 ? 'completed' : 'error',
            message: totalErrors === 0
              ? `Backup completed to ${connectedServices.length} services! (${totalUploaded} files)`
              : `Backup completed with ${totalErrors} errors. ${totalUploaded} files uploaded.`
          }
        : status
    ));

    setTimeout(() => {
      setSyncStatus(prev => prev.filter(status => status.service !== 'backup'));
    }, 5000);
  };

  // Get sync status for a service
  const getSyncStatus = (serviceId: string) => {
    return syncStatus.find(status => status.service === serviceId);
  };

  // Disconnect from cloud service
  const disconnectService = async (serviceId: string) => {
    try {
      cloudSyncManager.disconnect(serviceId);
      setCloudServices(prev => prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              connected: false,
              lastSync: undefined,
              filesCount: undefined
            }
          : service
      ));
      alert(`Disconnected from ${cloudServices.find(s => s.id === serviceId)?.name}`);
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect from service');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Please sign in to access cloud sync
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to connect your cloud storage accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-slate-400">
          ☁️ Cloud Storage Sync
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-500">
          Connect and sync your files with popular cloud storage services
        </p>
      </div>

      {/* Connection Error Display */}
      {connectionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 text-lg mr-2">❌</div>
            <p className="text-red-800 font-medium">{connectionError}</p>
          </div>
        </div>
      )}

      {/* Sync Mode Selection */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {[
          { id: 'sync', label: 'Two-way Sync', icon: '🔄', desc: 'Sync files both ways' },
          { id: 'upload', label: 'Upload Only', icon: '⬆️', desc: 'Upload to cloud' },
          { id: 'download', label: 'Download Only', icon: '⬇️', desc: 'Download from cloud' },
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setSyncMode(mode.id as typeof syncMode)}
            className={`px-4 py-3 rounded-lg border transition-all ${
              syncMode === mode.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
            }`}
          >
            <div className="text-2xl mb-1">{mode.icon}</div>
            <div className="font-semibold text-sm">{mode.label}</div>
            <div className="text-xs opacity-75">{mode.desc}</div>
          </button>
        ))}
      </div>

      {/* Cloud Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cloudServices.map(service => {
          const status = getSyncStatus(service.id);
          return (
            <div key={service.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className={`p-6 ${service.connected ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${service.color} flex items-center justify-center text-white text-xl`}>
                    {service.icon}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    service.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.connected ? 'Connected' : 'Not Connected'}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>

                {service.connected && (
                  <div className="text-sm text-gray-600 mb-3">
                    <p>Files: {service.filesCount || 0}</p>
                    {service.lastSync && (
                      <p>Last sync: {new Date(service.lastSync).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                {/* Sync Status */}
                {status && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{status.message}</span>
                      <span>{status.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          status.status === 'completed' ? 'bg-green-500' :
                          status.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${status.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {!service.connected ? (
                    <button
                      onClick={() => connectService(service.id)}
                      disabled={isConnecting}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                      {isConnecting ? 'Connecting...' : `Connect ${service.name}`}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => syncWithService(service.id)}
                        disabled={!!status}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      >
                        {status ? 'Syncing...' : 'Sync Files'}
                      </button>
                      <button
                        onClick={() => uploadToCloud(service.id, files)}
                        disabled={!!status || files.length === 0}
                        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                      >
                        Upload All Files
                      </button>
                      <button
                        onClick={() => disconnectService(service.id)}
                        className="w-full py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backup Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8 border border-indigo-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">🛡️ Backup & Recovery</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Automated Backup</h4>
            <p className="text-sm text-gray-600 mb-3">
              Create backups of all your files across connected cloud services for maximum security.
            </p>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="autoSync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="mr-2 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="autoSync" className="text-sm text-gray-700">
                Enable automatic daily backups
              </label>
            </div>
            <button
              onClick={createBackup}
              disabled={cloudServices.filter(s => s.connected).length === 0}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              Create Full Backup
            </button>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Backup Status</h4>
            <div className="space-y-2">
              {cloudServices.filter(s => s.connected).map(service => (
                <div key={service.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    <span>{service.icon}</span>
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Backed up ({service.filesCount || 0} files)
                  </div>
                </div>
              ))}
              {cloudServices.filter(s => s.connected).length === 0 && (
                <p className="text-sm text-gray-500">No cloud services connected for backup</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">⚙️ Sync Settings</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">File Types to Sync</h4>
            <div className="space-y-2">
              {[
                { type: 'images', label: 'Images (JPG, PNG, WebP)', icon: '🖼️' },
                { type: 'documents', label: 'Documents (PDF, DOC, TXT)', icon: '📄' },
                { type: 'videos', label: 'Videos (MP4, AVI)', icon: '🎥' },
                { type: 'archives', label: 'Archives (ZIP, RAR)', icon: '📦' }
              ].map(item => (
                <div key={item.type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={item.type}
                    defaultChecked={true}
                    className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor={item.type} className="text-sm text-gray-700 flex items-center gap-2">
                    <span>{item.icon}</span>
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Sync Preferences</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Conflict Resolution</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black">
                  <option>Keep newest file</option>
                  <option>Keep local file</option>
                  <option>Keep cloud file</option>
                  <option>Ask me each time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Sync Frequency</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black">
                  <option>Real-time</option>
                  <option>Every 15 minutes</option>
                  <option>Every hour</option>
                  <option>Daily</option>
                  <option>Manual only</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="syncDeleted"
                  defaultChecked={false}
                  className="mr-2 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="syncDeleted" className="text-sm text-gray-700">
                  Sync file deletions
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {cloudServices.filter(s => s.connected).length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-4xl mb-4">☁️</div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Connect your cloud storage
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Link your Google Drive, Dropbox, or OneDrive account to start syncing files.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            {cloudServices.slice(0, 3).map(service => (
              <button
                key={service.id}
                onClick={() => connectService(service.id)}
                className={`px-6 py-3 ${service.color} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <span>{service.icon}</span>
                Connect {service.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🔄</div>
          <h4 className="font-semibold mb-2">Real-time Sync</h4>
          <p className="text-sm text-gray-600">Automatic file synchronization</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <h4 className="font-semibold mb-2">Secure Backup</h4>
          <p className="text-sm text-gray-600">Multi-cloud backup protection</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">📱</div>
          <h4 className="font-semibold mb-2">Cross-Platform</h4>
          <p className="text-sm text-gray-600">Access files anywhere</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">⚡</div>
          <h4 className="font-semibold mb-2">Fast Transfer</h4>
          <p className="text-sm text-gray-600">Optimized upload/download speeds</p>
        </div>
      </div>
    </div>
  );
};

export default CloudSync;