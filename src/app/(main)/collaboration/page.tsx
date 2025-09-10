"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";
import { FileObject } from "@/utils/authUtils";

interface SharedFile {
  id: string;
  fileId: string;
  fileName: string;
  sharedBy: string;
  sharedWith: string[];
  permissions: 'view' | 'edit' | 'comment';
  sharedAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed?: string;
}

interface Comment {
  id: string;
  fileId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
  resolved?: boolean;
}

interface TeamWorkspace {
  id: string;
  name: string;
  description: string;
  members: string[];
  files: string[];
  createdBy: string;
  createdAt: string;
  lastActivity: string;
}

interface CollaborationSession {
  id: string;
  fileId: string;
  participants: string[];
  isActive: boolean;
  startedAt: string;
  lastActivity: string;
  admin: string; // Admin user ID
  permissions: { [userId: string]: 'viewer' | 'editor' | 'admin' };
  inviteLink?: string;
  maxParticipants?: number;
}

interface SessionMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  type: 'message' | 'change' | 'join' | 'leave';
}

const Collaboration: React.FC = () => {
  const { files } = useFileContext();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'shared' | 'workspaces' | 'comments' | 'sessions' | 'emails'>('shared');
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [workspaces, setWorkspaces] = useState<TeamWorkspace[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeSessions, setActiveSessions] = useState<CollaborationSession[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit' | 'comment'>('view');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [newSessionMessage, setNewSessionMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers] = useState<string[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'viewer' | 'editor'>('viewer');
  const [uploadedFile, setUploadedFile] = useState<FileObject | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textAnnotations, setTextAnnotations] = useState<Array<{id: string, text: string, x: number, y: number, user: string, color: string}>>([]);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'text' | 'erase'>('draw');
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);

  // Email sharing states
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailProgress, setEmailProgress] = useState(0);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [emailHistory, setEmailHistory] = useState<Array<{
    id: string;
    recipient: string;
    fileName: string;
    status: 'sent' | 'delivered' | 'failed';
    sentAt: string;
    downloadUrl?: string;
  }>>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{x: number, y: number}>>([]);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  // Initialize with mock data
  useEffect(() => {
    // Mock shared files
    const mockSharedFiles: SharedFile[] = [
      {
        id: 'share_1',
        fileId: files[0]?.id || 'file_1',
        fileName: files[0]?.name || 'document.pdf',
        sharedBy: currentUser?.email || 'user@example.com',
        sharedWith: ['colleague@example.com', 'team@example.com'],
        permissions: 'edit',
        sharedAt: new Date(Date.now() - 86400000).toISOString(),
        accessCount: 5,
        lastAccessed: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setSharedFiles(mockSharedFiles);

    // Mock workspaces
    const mockWorkspaces: TeamWorkspace[] = [
      {
        id: 'workspace_1',
        name: 'Marketing Team',
        description: 'Shared workspace for marketing materials',
        members: ['user1@example.com', 'user2@example.com', currentUser?.email || 'user@example.com'],
        files: files.slice(0, 3).map(f => f.id),
        createdBy: currentUser?.email || 'user@example.com',
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        lastActivity: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setWorkspaces(mockWorkspaces);

    // Mock comments
    const mockComments: Comment[] = [
      {
        id: 'comment_1',
        fileId: files[0]?.id || 'file_1',
        userId: 'user2',
        userName: 'Sarah Johnson',
        content: 'Great work on this document! I think we should add more details to section 3.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        resolved: false
      }
    ];
    setComments(mockComments);

    // Mock active sessions
    const mockSessions: CollaborationSession[] = [
      {
        id: 'session_1',
        fileId: files[0]?.id || 'file_1',
        participants: ['user1@example.com', 'user2@example.com'],
        isActive: true,
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        lastActivity: new Date(Date.now() - 300000).toISOString(),
        admin: currentUser?.uid || 'user1',
        permissions: {
          'user1': 'admin',
          'user2': 'editor',
          [currentUser?.uid || 'user']: 'editor'
        },
        inviteLink: `https://convert-sign.vercel.app/collaboration/join/${Date.now()}`,
        maxParticipants: 10
      }
    ];
    setActiveSessions(mockSessions);
  }, [files, currentUser]);

  // Validate email address
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Generate secure download link
  const generateDownloadLink = (fileId: string): string => {
    const token = btoa(`${fileId}_${Date.now()}_${Math.random()}`);
    return `${window.location.origin}/download/${token}`;
  };

  // Send email with file attachment
  const sendFileByEmail = async () => {
    if (!selectedFile || !shareEmail.trim()) return;

    // Validate email
    if (!validateEmail(shareEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsEmailSending(true);
    setEmailStatus('sending');
    setEmailProgress(0);

    try {
      // Simulate email sending process
      setEmailProgress(25);

      // Generate download link
      const downloadLink = generateDownloadLink(selectedFile.id);
      setEmailProgress(50);

      // Prepare email content
      const emailContent = {
        to: shareEmail,
        subject: emailSubject || `File shared: ${selectedFile.name}`,
        message: emailMessage || `Hi there!\n\nI've shared a file with you: ${selectedFile.name}\n\nYou can download it here: ${downloadLink}\n\nPermissions: ${sharePermission}\n\nBest regards,\n${currentUser?.email}`,
        attachment: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          downloadUrl: downloadLink
        }
      };

      setEmailProgress(75);

      // Simulate API call to email service
      await new Promise(resolve => setTimeout(resolve, 2000));

      setEmailProgress(90);

      // Create share record
      const newShare: SharedFile = {
        id: `share_${Date.now()}`,
        fileId: selectedFile.id,
        fileName: selectedFile.name,
        sharedBy: currentUser?.email || 'user@example.com',
        sharedWith: [shareEmail],
        permissions: sharePermission,
        sharedAt: new Date().toISOString(),
        accessCount: 0
      };

      setSharedFiles(prev => [...prev, newShare]);

      // Add to email history
      const emailRecord = {
        id: `email_${Date.now()}`,
        recipient: shareEmail,
        fileName: selectedFile.name,
        status: 'sent' as const,
        sentAt: new Date().toISOString(),
        downloadUrl: downloadLink
      };

      setEmailHistory(prev => [emailRecord, ...prev]);

      setEmailProgress(100);
      setEmailStatus('sent');

      // Show success message
      setTimeout(() => {
        alert(`✅ Email sent successfully to ${shareEmail}!\n\n📎 File: ${selectedFile.name}\n📧 Subject: ${emailContent.subject}\n🔗 Download link generated`);
        setEmailStatus('idle');
        setIsEmailSending(false);
        setShareEmail('');
        setSelectedFile(null);
        setEmailSubject('');
        setEmailMessage('');
        setShowEmailModal(false);
      }, 500);

    } catch (error) {
      console.error('Email sending error:', error);
      setEmailStatus('failed');
      setIsEmailSending(false);
      alert('❌ Failed to send email. Please try again.');
    }
  };

  // Share file with another user (legacy function)
  const shareFile = () => {
    if (!selectedFile || !shareEmail.trim()) return;

    if (!validateEmail(shareEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setShowEmailModal(true);
  };

  // Create new workspace
  const createWorkspace = () => {
    if (!newWorkspaceName.trim()) return;

    const newWorkspace: TeamWorkspace = {
      id: `workspace_${Date.now()}`,
      name: newWorkspaceName,
      description: newWorkspaceDesc,
      members: [currentUser?.email || 'user@example.com'],
      files: [],
      createdBy: currentUser?.email || 'user@example.com',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    setWorkspaces(prev => [...prev, newWorkspace]);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    alert('Workspace created successfully!');
  };

  // Add comment to file
  const addComment = () => {
    if (!selectedFile || !newComment.trim()) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      fileId: selectedFile.id,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: newComment,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    alert('Comment added successfully!');
  };

  // Join collaboration session
  const joinSession = (sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    setActiveSession(session);
    setShowSessionModal(true);

    // Add join message
    const joinMessage: SessionMessage = {
      id: `join_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: 'joined the session',
      timestamp: new Date().toISOString(),
      type: 'join'
    };

    setSessionMessages([joinMessage]);
  };

  // Leave collaboration session
  const leaveSession = () => {
    if (activeSession) {
      // Add leave message before leaving
      const leaveMessage: SessionMessage = {
        id: `leave_${Date.now()}`,
        userId: currentUser?.uid || 'user',
        userName: currentUser?.email?.split('@')[0] || 'User',
        content: 'left the session',
        timestamp: new Date().toISOString(),
        type: 'leave'
      };

      setSessionMessages(prev => [...prev, leaveMessage]);

      // Close modal after a short delay
      setTimeout(() => {
        setActiveSession(null);
        setShowSessionModal(false);
        setSessionMessages([]);
      }, 1000);
    } else {
      setActiveSession(null);
      setShowSessionModal(false);
      setSessionMessages([]);
    }
  };

  // Send message in session
  const sendSessionMessage = () => {
    if (!newSessionMessage.trim() || !activeSession) return;

    const message = {
      id: `msg_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: newSessionMessage,
      timestamp: new Date().toISOString(),
      type: 'message' as const
    };

    setSessionMessages(prev => [...prev, message]);
    setNewSessionMessage('');
  };


  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Simulate sending typing indicator to other users
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  // Generate invite link
  const generateInviteLink = () => {
    if (!activeSession) return;

    const inviteLink = `${window.location.origin}/collaboration/join/${activeSession.id}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  // Invite user to session
  const inviteUser = () => {
    if (!inviteEmail.trim() || !activeSession) return;

    // Check if user is admin
    if (activeSession.admin !== currentUser?.uid) {
      alert('Only session admins can invite users.');
      return;
    }

    // Add user to session
    const updatedSession = {
      ...activeSession,
      participants: [...activeSession.participants, inviteEmail],
      permissions: {
        ...activeSession.permissions,
        [inviteEmail]: invitePermission
      }
    };

    setActiveSession(updatedSession);

    // Add invite message
    const inviteMessage: SessionMessage = {
      id: `invite_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: `invited ${inviteEmail} to the session with ${invitePermission} permissions`,
      timestamp: new Date().toISOString(),
      type: 'join'
    };

    setSessionMessages(prev => [...prev, inviteMessage]);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  // Change user permissions
  const changeUserPermission = (userId: string, newPermission: 'viewer' | 'editor' | 'admin') => {
    if (!activeSession || activeSession.admin !== currentUser?.uid) {
      alert('Only session admins can change permissions.');
      return;
    }

    const updatedPermissions = {
      ...activeSession.permissions,
      [userId]: newPermission
    };

    setActiveSession({
      ...activeSession,
      permissions: updatedPermissions,
      admin: newPermission === 'admin' ? userId : activeSession.admin
    });

    // Add permission change message
    const permissionMessage: SessionMessage = {
      id: `permission_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: `changed ${userId}'s permission to ${newPermission}`,
      timestamp: new Date().toISOString(),
      type: 'change'
    };

    setSessionMessages(prev => [...prev, permissionMessage]);
  };

  // Remove user from session
  const removeUser = (userId: string) => {
    if (!activeSession || activeSession.admin !== currentUser?.uid) {
      alert('Only session admins can remove users.');
      return;
    }

    const updatedParticipants = activeSession.participants.filter(p => p !== userId);
    const updatedPermissions = { ...activeSession.permissions };
    delete updatedPermissions[userId];

    setActiveSession({
      ...activeSession,
      participants: updatedParticipants,
      permissions: updatedPermissions
    });

    // Add removal message
    const removeMessage: SessionMessage = {
      id: `remove_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: `removed ${userId} from the session`,
      timestamp: new Date().toISOString(),
      type: 'leave'
    };

    setSessionMessages(prev => [...prev, removeMessage]);
  };

  // Handle file upload for collaboration
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSession) return;

    // Check if user has edit permissions
    const userPermission = activeSession.permissions[currentUser?.uid || 'user'];
    if (userPermission === 'viewer') {
      alert('You only have view permissions. Ask the admin to grant edit access.');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const fileObject: FileObject = {
        id: `collab_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64,
        dateAdded: new Date().toISOString(),
        processed: false,
        isSignature: false
      };

      setUploadedFile(fileObject);

      // Add file upload message
      const uploadMessage: SessionMessage = {
        id: `upload_${Date.now()}`,
        userId: currentUser?.uid || 'user',
        userName: currentUser?.email?.split('@')[0] || 'User',
        content: `uploaded file: ${file.name}`,
        timestamp: new Date().toISOString(),
        type: 'change'
      };

      setSessionMessages(prev => [...prev, uploadMessage]);
    };
    reader.readAsDataURL(file);
  };


  // Handle mouse/touch drawing
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool !== 'draw' || !activeSession) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCurrentPath([{ x, y }]);
    setIsDrawingMode(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !currentPath.length) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCurrentPath(prev => [...prev, { x, y }]);

    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (ctx && currentPath.length > 1) {
      const lastPoint = currentPath[currentPath.length - 2];
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingMode || !currentPath.length || !activeSession) return;

    // For now, just clear the current path since we're drawing directly on canvas
    setCurrentPath([]);
    setIsDrawingMode(false);

    // Add drawing message
    const drawMessage: SessionMessage = {
      id: `draw_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: `added drawing annotation`,
      timestamp: new Date().toISOString(),
      type: 'change'
    };

    setSessionMessages(prev => [...prev, drawMessage]);
  };

  // Clear all annotations
  const clearAnnotations = () => {
    if (!activeSession) return;

    const userPermission = activeSession.permissions[currentUser?.uid || 'user'];
    if (userPermission === 'viewer') {
      alert('You only have view permissions. Ask the admin to grant edit access.');
      return;
    }

    setTextAnnotations([]);
    setCurrentPath([]);

    // Clear canvas
    if (canvasRef) {
      const ctx = canvasRef.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      }
    }

    // Add clear message
    const clearMessage: SessionMessage = {
      id: `clear_${Date.now()}`,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.email?.split('@')[0] || 'User',
      content: 'cleared all annotations',
      timestamp: new Date().toISOString(),
      type: 'change'
    };

    setSessionMessages(prev => [...prev, clearMessage]);
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Please sign in to access collaboration features
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to collaborate on files with your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-slate-400">
          👥 Team Collaboration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-500">
          Share files, collaborate in real-time, and work together with your team
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {[
          { id: 'shared', label: 'Shared Files', icon: '📤', count: sharedFiles.length },
          { id: 'emails', label: 'Email History', icon: '📧', count: emailHistory.length },
          { id: 'workspaces', label: 'Workspaces', icon: '🏢', count: workspaces.length },
          { id: 'comments', label: 'Comments', icon: '💬', count: comments.length },
          { id: 'sessions', label: 'Live Sessions', icon: '🔴', count: activeSessions.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 rounded-lg border transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
            }`}
          >
            <div className="text-2xl mb-1">{tab.icon}</div>
            <div className="font-semibold text-sm">{tab.label}</div>
            <div className="text-xs opacity-75">({tab.count})</div>
          </button>
        ))}
      </div>

      {/* Shared Files Tab */}
      {activeTab === 'shared' && (
        <div className="space-y-6">
          {/* Share New File */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📤 Share a File</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File to Share:
                </label>
                <select
                  value={selectedFile?.id || ''}
                  onChange={(e) => {
                    const file = files.find(f => f.id === e.target.value);
                    setSelectedFile(file || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Choose a file...</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address:
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permission Level:
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'view', label: 'View Only', desc: 'Can only view the file' },
                  { value: 'comment', label: 'Can Comment', desc: 'Can view and add comments' },
                  { value: 'edit', label: 'Can Edit', desc: 'Full editing permissions' }
                ].map(perm => (
                  <label key={perm.value} className="flex items-center">
                    <input
                      type="radio"
                      value={perm.value}
                      checked={sharePermission === perm.value}
                      onChange={(e) => setSharePermission(e.target.value as typeof sharePermission)}
                      className="mr-2 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium text-sm">{perm.label}</div>
                      <div className="text-xs text-gray-500">{perm.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={shareFile}
              disabled={!selectedFile || !shareEmail.trim()}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              📧 Send via Email
            </button>
          </div>

          {/* Shared Files List */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Your Shared Files</h3>
            {sharedFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📤</div>
                <p>No files shared yet</p>
                <p className="text-sm">Share files with your team above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedFiles.map(shared => (
                  <div key={shared.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{shared.fileName}</h4>
                        <p className="text-sm text-gray-600">
                          Shared with: {shared.sharedWith.join(', ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shared.permissions} • {shared.accessCount} views •
                          Shared {new Date(shared.sharedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                          Manage Access
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email History Tab */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📧 Email History</h3>

            {emailHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📧</div>
                <p>No emails sent yet</p>
                <p className="text-sm">Share files via email to see your history here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailHistory.map(email => (
                  <div key={email.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{email.fileName}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            email.status === 'sent' ? 'bg-green-100 text-green-800' :
                            email.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {email.status === 'sent' ? '📤 Sent' :
                             email.status === 'delivered' ? '✅ Delivered' :
                             '❌ Failed'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📧 To: {email.recipient}
                        </p>
                        <p className="text-xs text-gray-500">
                          📅 Sent: {new Date(email.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {email.downloadUrl && (
                          <button
                            onClick={() => window.open(email.downloadUrl, '_blank')}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            🔗 Download Link
                          </button>
                        )}
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          📋 Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">📧</div>
              <h4 className="font-semibold mb-2">Total Emails</h4>
              <p className="text-2xl font-bold text-gray-900">{emailHistory.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-semibold mb-2">Delivered</h4>
              <p className="text-2xl font-bold text-green-600">
                {emailHistory.filter(e => e.status === 'delivered').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">📎</div>
              <h4 className="font-semibold mb-2">Files Shared</h4>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(emailHistory.map(e => e.fileName)).size}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workspaces Tab */}
      {activeTab === 'workspaces' && (
        <div className="space-y-6">
          {/* Create Workspace */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🏢 Create New Workspace</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name:
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g., Marketing Team"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description:
                </label>
                <input
                  type="text"
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="Brief description of the workspace"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                />
              </div>
            </div>
            <button
              onClick={createWorkspace}
              disabled={!newWorkspaceName.trim()}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              Create Workspace
            </button>
          </div>

          {/* Workspaces List */}
          <div className="grid md:grid-cols-2 gap-6">
            {workspaces.map(workspace => (
              <div key={workspace.id} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{workspace.name}</h4>
                    <p className="text-sm text-gray-600">{workspace.description}</p>
                  </div>
                  <div className="text-2xl">🏢</div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{workspace.members.length}</span> members
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{workspace.files.length}</span> files
                  </p>
                  <p className="text-xs text-gray-500">
                    Last activity: {new Date(workspace.lastActivity).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                    Open Workspace
                  </button>
                  <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {/* Add Comment */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">💬 Add Comment</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File:
                </label>
                <select
                  value={selectedFile?.id || ''}
                  onChange={(e) => {
                    const file = files.find(f => f.id === e.target.value);
                    setSelectedFile(file || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Choose a file...</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment:
                </label>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                />
              </div>
            </div>
            <button
              onClick={addComment}
              disabled={!selectedFile || !newComment.trim()}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              Add Comment
            </button>
          </div>

          {/* Comments List */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">💬 Recent Comments</h3>
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <p>No comments yet</p>
                <p className="text-sm">Add comments to collaborate on files</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-700">
                              {comment.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{comment.userName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{comment.content}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <button className="text-blue-600 hover:text-blue-800">Reply</button>
                          <button className="text-green-600 hover:text-green-800">Resolve</button>
                          <span className={`px-2 py-1 rounded text-xs ${
                            comment.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {comment.resolved ? 'Resolved' : 'Open'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🔴 Active Collaboration Sessions</h3>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔴</div>
                <p>No active sessions</p>
                <p className="text-sm">Start collaborating on files to see live sessions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map(session => (
                  <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Session on {files.find(f => f.id === session.fileId)?.name || 'Unknown File'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {session.participants.length} participants •
                            Started {new Date(session.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => joinSession(session.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Join Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">👥</div>
              <h4 className="font-semibold mb-2">Total Participants</h4>
              <p className="text-2xl font-bold text-gray-900">
                {activeSessions.reduce((sum, session) => sum + session.participants.length, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <h4 className="font-semibold mb-2">Avg Session Time</h4>
              <p className="text-2xl font-bold text-gray-900">45m</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold mb-2">Files Edited</h4>
              <p className="text-2xl font-bold text-gray-900">
                {activeSessions.length * 3}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">📤</div>
          <h4 className="font-semibold mb-2">File Sharing</h4>
          <p className="text-sm text-gray-600">Share files securely with team members</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">💬</div>
          <h4 className="font-semibold mb-2">Comments</h4>
          <p className="text-sm text-gray-600">Add feedback and collaborate on files</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🏢</div>
          <h4 className="font-semibold mb-2">Workspaces</h4>
          <p className="text-sm text-gray-600">Organize team projects and files</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🔴</div>
          <h4 className="font-semibold mb-2">Live Sessions</h4>
          <p className="text-sm text-gray-600">Real-time collaboration on files</p>
        </div>
      </div>

      {/* Collaboration Session Modal */}
      {showSessionModal && activeSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex h-[90vh]">
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Live Session: {files.find(f => f.id === activeSession.fileId)?.name || 'Unknown File'}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {activeSession.participants.length} participants • Started {new Date(activeSession.startedAt).toLocaleString()}
                      </p>
                      {activeSession.admin === currentUser?.uid && (
                        <p className="text-xs text-blue-600 mt-1">👑 You are the session admin</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={generateInviteLink}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🔗 Invite Link
                      </button>
                      {activeSession.admin === currentUser?.uid && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ➕ Invite User
                        </button>
                      )}
                      <button
                        onClick={leaveSession}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Leave Session
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Preview Area */}
                <div className="flex-1 p-6 bg-gray-50">
                  <div className="bg-white rounded-lg h-full flex flex-col">
                    {/* File Upload Section */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">File Workspace</h3>
                        <div className="flex gap-2">
                          <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
                            📁 Upload File
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              accept="image/*,.pdf,.txt,.doc,.docx"
                            />
                          </label>
                          {uploadedFile && (
                            <button
                              onClick={clearAnnotations}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              🗑️ Clear All
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Drawing Tools */}
                    {uploadedFile && (
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Pen Tools */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTool('draw')}
                              className={`px-3 py-2 rounded ${selectedTool === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                              title="Pen Tool"
                            >
                              ✏️ Pen
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTool('draw');
                                setBrushColor('#ffff00');
                                setBrushSize(15);
                              }}
                              className={`px-3 py-2 rounded ${selectedTool === 'draw' && brushColor === '#ffff00' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                              title="Highlighter"
                            >
                              🖍️ Highlighter
                            </button>
                            <button
                              onClick={() => setSelectedTool('text')}
                              className={`px-3 py-2 rounded ${selectedTool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                              title="Text Tool"
                            >
                              📝 Text
                            </button>
                            <button
                              onClick={() => setSelectedTool('erase')}
                              className={`px-3 py-2 rounded ${selectedTool === 'erase' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                              title="Eraser"
                            >
                              🧽 Erase
                            </button>
                          </div>

                          {/* Color Palette */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Color:</label>
                            <div className="flex gap-1">
                              {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'].map(color => (
                                <button
                                  key={color}
                                  onClick={() => setBrushColor(color)}
                                  className={`w-6 h-6 rounded border-2 ${brushColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                                  style={{ backgroundColor: color }}
                                  title={`Select ${color}`}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={brushColor}
                              onChange={(e) => setBrushColor(e.target.value)}
                              className="w-8 h-8 rounded border border-gray-300"
                              title="Custom Color"
                            />
                          </div>

                          {/* Brush Size */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Size:</label>
                            <input
                              type="range"
                              min="1"
                              max="50"
                              value={brushSize}
                              onChange={(e) => setBrushSize(parseInt(e.target.value))}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-600 min-w-[40px]">{brushSize}px</span>
                          </div>

                          {/* Drawing Mode Toggle */}
                          <button
                            onClick={() => setIsDrawing(!isDrawing)}
                            className={`px-4 py-2 rounded font-medium transition-colors ${
                              isDrawing
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                          >
                            {isDrawing ? '🎨 Drawing Mode ON' : '👁️ View Mode'}
                          </button>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 ml-4 border-l border-gray-300 pl-4">
                            <button
                              onClick={() => {
                                setBrushColor('#000000');
                                setBrushSize(2);
                                setSelectedTool('draw');
                              }}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                              title="Fine Pen"
                            >
                              ✏️ Fine
                            </button>
                            <button
                              onClick={() => {
                                setBrushColor('#000000');
                                setBrushSize(5);
                                setSelectedTool('draw');
                              }}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                              title="Medium Pen"
                            >
                              ✏️ Medium
                            </button>
                            <button
                              onClick={() => {
                                setBrushColor('#000000');
                                setBrushSize(10);
                                setSelectedTool('draw');
                              }}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                              title="Thick Pen"
                            >
                              ✏️ Thick
                            </button>
                          </div>
                        </div>

                        {/* Drawing Instructions */}
                        {isDrawing && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Drawing Mode:</strong> Click and drag to draw on the image. Use different colors and sizes to create annotations like a teacher writing on a PPT!
                          </div>
                        )}
                      </div>
                    )}

                    {/* File Display Area */}
                    <div className="flex-1 p-4 flex items-center justify-center relative">
                      {!uploadedFile ? (
                        <div className="text-center">
                          <div className="text-6xl mb-4">📄</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {files.find(f => f.id === activeSession.fileId)?.name || 'No File Uploaded'}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Upload a file to start collaborative editing
                          </p>
                          <div className="text-sm text-gray-500">
                            Supported formats: Images, PDF, Text files
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {uploadedFile.type.startsWith('image/') ? (
                            <div className="relative">
                              <Image
                                src={uploadedFile.base64}
                                alt={uploadedFile.name}
                                width={800}
                                height={600}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                style={{ maxHeight: '500px' }}
                              />
                              {isDrawing && (
                                <canvas
                                  ref={setCanvasRef}
                                  width={800}
                                  height={600}
                                  onMouseDown={handleMouseDown}
                                  onMouseMove={handleMouseMove}
                                  onMouseUp={handleMouseUp}
                                  onMouseLeave={handleMouseUp}
                                  className="absolute top-0 left-0 cursor-crosshair"
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxWidth: '800px',
                                    backgroundColor: 'transparent'
                                  }}
                                />
                              )}

                              {/* Text Annotations */}
                              {textAnnotations.map((annotation) => (
                                <div
                                  key={annotation.id}
                                  className="absolute text-sm font-medium pointer-events-none"
                                  style={{
                                    left: annotation.x,
                                    top: annotation.y,
                                    color: annotation.color,
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                                  }}
                                >
                                  {annotation.text}
                                  <div className="text-xs opacity-75">
                                    - {annotation.user}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : uploadedFile.type === 'text/plain' ? (
                            <div className="bg-gray-100 p-4 rounded-lg max-w-2xl w-full">
                              <h4 className="font-medium mb-2">{uploadedFile.name}</h4>
                              <pre className="text-sm whitespace-pre-wrap text-gray-800">
                                {atob(uploadedFile.base64.split(',')[1])}
                              </pre>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-4xl mb-4">📄</div>
                              <h4 className="font-medium">{uploadedFile.name}</h4>
                              <p className="text-sm text-gray-600 mt-2">
                                File type: {uploadedFile.type}
                              </p>
                              <p className="text-sm text-gray-600">
                                Size: {(uploadedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-80 border-l border-gray-200 flex flex-col">
                {/* Participants */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">👥 Participants ({activeSession.participants.length})</h3>
                  <div className="space-y-2">
                    {activeSession.participants.map((participant, index) => {
                      const permission = activeSession.permissions[participant] || 'viewer';
                      const isAdmin = activeSession.admin === participant;
                      const isCurrentUser = participant === currentUser?.email;

                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-700">
                              {participant.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {participant} {isCurrentUser && '(You)'}
                              </p>
                              {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">👑 Admin</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-green-600">● Online</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                permission === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                                permission === 'editor' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {permission}
                              </span>
                            </div>
                          </div>
                          {activeSession.admin === currentUser?.uid && !isCurrentUser && (
                            <div className="flex gap-1">
                              <select
                                value={permission}
                                onChange={(e) => changeUserPermission(participant, e.target.value as 'viewer' | 'editor' | 'admin')}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => removeUser(participant)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chat */}
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">💬 Session Chat</h3>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sessionMessages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-gray-700">
                            {message.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{message.userName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className={`text-sm p-2 rounded-lg ${
                            message.type === 'change'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-gray-50 text-gray-800'
                          }`}>
                            {message.type === 'change' && '🔄 '}
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="px-4 py-2 text-xs text-gray-500">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSessionMessage}
                        onChange={(e) => {
                          setNewSessionMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && sendSessionMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                      <button
                        onClick={sendSessionMessage}
                        disabled={!newSessionMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && activeSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite User to Session</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Level
                </label>
                <select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value as 'viewer' | 'editor')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="viewer">Viewer - Can only view the file</option>
                  <option value="editor">Editor - Can edit and modify the file</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={inviteUser}
                  disabled={!inviteEmail.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  Send Invitation
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Sharing Modal */}
      {showEmailModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">📧 Send File via Email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📎 File Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedFile.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <p className="font-medium">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium">{selectedFile.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Permissions:</span>
                    <p className="font-medium capitalize">{sharePermission}</p>
                  </div>
                </div>
              </div>

              {/* Email Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📧 Recipient Email
                  </label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={`File shared: ${selectedFile.name}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💬 Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder={`Hi there!

I've shared a file with you: ${selectedFile.name}

You can download it using the link below.

Best regards,
${currentUser?.email}`}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                </div>
              </div>

              {/* Email Progress */}
              {isEmailSending && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-800">
                      {emailStatus === 'sending' && 'Sending email...'}
                      {emailStatus === 'sent' && '✅ Email sent successfully!'}
                      {emailStatus === 'failed' && '❌ Failed to send email'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${emailProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {emailProgress < 25 && 'Preparing email...'}
                    {emailProgress >= 25 && emailProgress < 50 && 'Generating download link...'}
                    {emailProgress >= 50 && emailProgress < 75 && 'Preparing attachment...'}
                    {emailProgress >= 75 && emailProgress < 90 && 'Sending email...'}
                    {emailProgress >= 90 && 'Finalizing...'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={sendFileByEmail}
                  disabled={isEmailSending || !shareEmail.trim() || !validateEmail(shareEmail)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                >
                  {isEmailSending ? '📤 Sending...' : '📧 Send Email'}
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email History Modal */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowEmailModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg"
        >
          📧 Email History ({emailHistory.length})
        </button>
      </div>
    </div>
  );
};

export default Collaboration;