"use client";

import React, { useState } from "react";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";
import { FileObject } from "@/utils/authUtils";
import { useRouter } from "next/navigation";

const AdvancedTools: React.FC = () => {
  const { files, updateFile } = useFileContext();
  const { currentUser } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FileObject[]>([]);
  const [toolType, setToolType] = useState<'compare' | 'bulk-compress' | 'format-detect' | 'export'>('compare');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  // File comparison functionality
  const handleFileComparison = () => {
    if (selectedFiles.length !== 2) {
      alert("Please select exactly 2 files to compare");
      return;
    }

    const [file1, file2] = selectedFiles;
    const comparison = {
      nameMatch: file1.name === file2.name,
      sizeMatch: file1.size === file2.size,
      typeMatch: file1.type === file2.type,
      sizeDifference: Math.abs(file1.size - file2.size),
      dateDifference: Math.abs(new Date(file1.dateAdded).getTime() - new Date(file2.dateAdded).getTime())
    };

    alert(`File Comparison Results:
Name Match: ${comparison.nameMatch ? 'Yes' : 'No'}
Size Match: ${comparison.sizeMatch ? 'Yes' : 'No'}
Type Match: ${comparison.typeMatch ? 'Yes' : 'No'}
Size Difference: ${(comparison.sizeDifference / 1024).toFixed(2)} KB
Date Difference: ${Math.round(comparison.dateDifference / (1000 * 60 * 60 * 24))} days`);
  };

  // Bulk compression
  const handleBulkCompression = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files to compress");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type.startsWith('image/')) {
        // Compress image
        const compressedBase64 = await compressImage(file.base64, 0.7);
        const newSize = getBase64FileSize(compressedBase64);

        updateFile(file.id, {
          base64: compressedBase64,
          size: newSize,
          processed: true,
          dateProcessed: new Date().toISOString(),
        });
      }
      setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }

    setIsProcessing(false);
    alert(`Successfully compressed ${selectedFiles.length} files!`);
  };

  // Format detection
  const detectFileFormat = (file: FileObject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    return {
      extension,
      mimeType,
      detectedFormat: getFormatFromMime(mimeType),
      confidence: extension && mimeType.includes(extension) ? 'High' : 'Medium'
    };
  };

  const getFormatFromMime = (mimeType: string) => {
    const formatMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'application/pdf': 'PDF',
      'text/plain': 'Plain Text',
      'application/msword': 'Microsoft Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (DOCX)'
    };
    return formatMap[mimeType] || 'Unknown';
  };

  // Export functionality
  const handleExport = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files to export");
      return;
    }

    // Create a simple ZIP-like export (in real app, use jszip)
    const exportData = {
      files: selectedFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        data: f.base64
      })),
      exportedAt: new Date().toISOString(),
      totalFiles: selectedFiles.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`Exported ${selectedFiles.length} files as JSON archive!`);
  };

  // Helper functions
  const compressImage = async (base64Data: string, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.src = base64Data;
    });
  };

  const getBase64FileSize = (base64Data: string): number => {
    return Math.round((base64Data.length * 3) / 4);
  };

  const handleFileSelection = (file: FileObject, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, file]);
    } else {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Please sign in to access advanced tools
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to use advanced file processing features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-slate-400">
          Advanced Tools
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-500">
          Powerful file processing and analysis tools
        </p>
      </div>

      {/* Tool Selection */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {[
          { id: 'compare', label: 'File Comparison', icon: '⚖️' },
          { id: 'bulk-compress', label: 'Bulk Compression', icon: '🗜️' },
          { id: 'format-detect', label: 'Format Detection', icon: '🔍' },
          { id: 'export', label: 'Export Tools', icon: '📦' }
        ].map(tool => (
          <button
            key={tool.id}
            onClick={() => setToolType(tool.id as 'compare' | 'bulk-compress' | 'format-detect' | 'export')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              toolType === tool.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* File Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Select Files ({selectedFiles.length} selected)
          </h3>

          {files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No files available</p>
              <button
                onClick={() => router.push("/upload")}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Upload Files
              </button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center p-3 rounded-md border transition-colors ${
                    selectedFiles.some(f => f.id === file.id)
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.some(f => f.id === file.id)}
                    onChange={(e) => handleFileSelection(file, e.target.checked)}
                    className="mr-3 w-4 h-4 text-indigo-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB • {file.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tool Interface */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            {toolType === 'compare' && 'File Comparison'}
            {toolType === 'bulk-compress' && 'Bulk Compression'}
            {toolType === 'format-detect' && 'Format Detection'}
            {toolType === 'export' && 'Export Tools'}
          </h3>

          {toolType === 'compare' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Compare two files to see differences in size, type, and metadata.
              </p>
              <button
                onClick={handleFileComparison}
                disabled={selectedFiles.length !== 2 || isProcessing}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
              >
                Compare Selected Files
              </button>
            </div>
          )}

          {toolType === 'bulk-compress' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Compress multiple image files to reduce file size.
              </p>
              {isProcessing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              <button
                onClick={handleBulkCompression}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Compressing...' : 'Compress Files'}
              </button>
            </div>
          )}

          {toolType === 'format-detect' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Analyze file formats and detect potential mismatches.
              </p>
              <div className="space-y-2">
                {selectedFiles.map(file => {
                  const detection = detectFileFormat(file);
                  return (
                    <div key={file.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        Extension: {detection.extension} | MIME: {detection.mimeType}
                      </p>
                      <p className="text-sm text-gray-600">
                        Detected: {detection.detectedFormat} | Confidence: {detection.confidence}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {toolType === 'export' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Export selected files as a downloadable archive.
              </p>
              <button
                onClick={handleExport}
                disabled={selectedFiles.length === 0}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
              >
                Export {selectedFiles.length} Files
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">⚖️</div>
          <h4 className="font-semibold mb-2">File Comparison</h4>
          <p className="text-sm text-gray-600">Compare files side by side</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🗜️</div>
          <h4 className="font-semibold mb-2">Bulk Compression</h4>
          <p className="text-sm text-gray-600">Compress multiple files at once</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">🔍</div>
          <h4 className="font-semibold mb-2">Format Detection</h4>
          <p className="text-sm text-gray-600">Analyze file formats automatically</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">📦</div>
          <h4 className="font-semibold mb-2">Export Tools</h4>
          <p className="text-sm text-gray-600">Download files as archives</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTools;