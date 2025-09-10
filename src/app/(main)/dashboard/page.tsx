//dashboard.tsx

"use client";

import React, { JSX, useState, useEffect } from "react";
import {
  PhotoIcon,
  DocumentIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";
import { downloadFile } from "@/utils/fileUtils";
import { FileObject } from "@/utils/authUtils";
import { useRouter } from "next/navigation";


// Helper function to format bytes
const formatBytes = (bytes: number, decimals: number = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

interface Base64ImageProps {
  src: string;
  alt: string;
  className?: string;
}

const Base64Image = ({ src, alt, className }: Base64ImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = document.createElement("img");
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
    };

    // Ensure base64 data is properly formatted
    let imageSrc = src;
    if (src && !src.startsWith('data:')) {
      // If it's raw base64, try to detect the MIME type
      const mimeType = src.includes('data:') ? src.split(';')[0].split(':')[1] : 'image/jpeg';
      imageSrc = `data:${mimeType};base64,${src.split(',')[1] || src}`;
    }

    img.src = imageSrc;
  }, [src]);

  if (isLoading) {
    return (
      <div
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      >
        <PhotoIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <PhotoIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  // Use regular img tag for base64 images to avoid Next.js Image URL validation issues
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }}
    />
  );
};

// Define types for type safety
interface Tab {
  id: string;
  label: string;
  icon?: JSX.Element;
}

type SortBy = "dateAdded" | "name" | "type" | "size";
type SortDirection = "asc" | "desc";
type ActiveTab = "all" | "images" | "documents" | "signatures" | "processed";

// Helper function to get file icons
const getFileIcon = (file: FileObject): JSX.Element => {
  const fileType = file.type.split("/")[0];
  if (file.type.includes("pdf")) {
    return <DocumentIcon className="w-10 h-10 text-red-500" />;
  }
  if (file.type.includes("presentation") || file.type.includes("word")) {
    return <DocumentIcon className="w-10 h-10 text-orange-500" />;
  }

  switch (fileType) {
    case "image":
      return <PhotoIcon className="w-10 h-10 text-blue-500" />;
    case "application":
      return <DocumentIcon className="w-10 h-10 text-gray-500" />;
    default:
      return <DocumentIcon className="w-10 h-10 text-gray-400" />;
  }
};

const DashboardContent = (): JSX.Element => {
  const { files, removeFile } = useFileContext();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("dateAdded");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");

  const handleDownload = (file: FileObject): void => {
    try {
      // Extract filename and type from the file object
      const fileName = file.name;
      const fileType = file.type;

      // Use the downloadFile utility from fileUtils
      downloadFile(file.base64, fileName, fileType);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const handleDelete = (fileId: string): void => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      removeFile(fileId);
    }
  };

  const getFilteredFiles = (): FileObject[] => {
    let filtered: FileObject[] = [...files];

    if (activeTab === "images") {
      filtered = filtered.filter((file: FileObject) =>
        file.type.startsWith("image/")
      );
    } else if (activeTab === "documents") {
      filtered = filtered.filter(
        (file: FileObject) =>
          file.type.startsWith("application/") || file.type.startsWith("text/")
      );
    } else if (activeTab === "signatures") {
      filtered = filtered.filter((file: FileObject) => file.isSignature);
    } else if (activeTab === "processed") {
      filtered = filtered.filter((file: FileObject) => file.processed);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((file: FileObject) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a: FileObject, b: FileObject) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "dateAdded":
        default:
          aValue = new Date(a.dateAdded);
          bValue = new Date(b.dateAdded);
          break;
      }

      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      if (bValue > aValue) return sortDirection === "asc" ? -1 : 1;
      return 0;
    });

    return filtered;
  };

  const tabs: Tab[] = [
    {
      id: "all",
      label: "All Files",
      icon: <DocumentArrowUpIcon className="w-5 h-5" />,
    },
    { id: "images", label: "Images", icon: <PhotoIcon className="w-5 h-5" /> },
    {
      id: "documents",
      label: "Documents",
      icon: <DocumentIcon className="w-5 h-5" />,
    },
    {
      id: "signatures",
      label: "Signatures",
      icon: <SparklesIcon className="w-5 h-5" />,
    },
    {
      id: "processed",
      label: "Processed",
      icon: <ArrowPathIcon className="w-5 h-5" />,
    },
  ];

  const router = useRouter();

  const filteredFiles = getFilteredFiles();

  // Show login message if user is not authenticated
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            Please sign in to view your dashboard
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to access your uploaded files and dashboard features.
          </p>
        </div>
      </div>
    );
  }
   
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-white">
          Your Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Welcome back, {currentUser.email}! Manage your uploaded files here.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ">
            <MagnifyingGlassIcon className="h-5 w-5 text-blue-500 dark:text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="block w-full rounded-md border-red-800 pl-10 pr-3 py-2 text-sm placeholder-gray-800 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 dark:text-gray-300">
            Sort by:
          </span>
          <div className="flex items-center space-x-2 ">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="block w-full rounded-md border-gray-900 py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:ring-slate-100 text-black dark:bg-gray-700 dark:text-white"
            >
              <option value="dateAdded">Date</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="size">Size</option>
            </select>
            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle sort direction"
            >
              {sortDirection === "asc" ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`group inline-flex items-center gap-2 py-2 px-3 border-b-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400"
              }`}
            >
              {React.cloneElement(tab.icon as JSX.Element, {
                className: `w-5 h-5 ${
                  activeTab === tab.id
                    ? "text-indigo-500"
                    : "text-gray-400 group-hover:text-gray-500"
                }`,
              })}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* File List */}
      {files.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            No files yet
          </h3>
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">
            Upload files to get started with your dashboard.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/choose2.svg"
            alt="Upload Files"
            width={150}
            height={150}
            className="mx-auto mb-10 mt-10 transition-transform duration-300 group-hover:scale-110"
          />
          <button
            onClick={() => router.push("/upload")}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-slate-500 dark:text-white hover:text-white text-sm font-semibold rounded-md hover:bg-indigo-300 dark:hover:bg-slate-900 dark:bg-slate-700 transition-colors duration-200"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Upload Your First File
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            No files match your search or filter criteria.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or changing the active tab.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-[1.02] transform"
              >
                {/* File Preview */}
                <div className="h-44 bg-muted/40 flex items-center justify-center relative p-4">
                  {file.type.startsWith("image/") ? (
                    <Base64Image
                      src={file.base64}
                      alt={file.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-4xl">{getFileIcon(file)}</div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                    {file.processed && (
                      <div className="bg-green-500/80 text-white text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Processed
                      </div>
                    )}
                    {file.isSignature && (
                      <div className="bg-purple-500/80 text-white text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Signature
                      </div>
                    )}
                    {file.convertedFormat && (
                      <div className="bg-blue-500/80 text-white text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Converted
                      </div>
                    )}
                  </div>
                </div>

                {/* File Info */}
                <div className="p-5 border-t border-border flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-slate-900 dark:text-white truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(file.size)} •{" "}
                        {file.type.split("/")[1]?.toUpperCase() || "UNKNOWN"}
                      </p>
                      {file.convertedFormat && (
                        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                          Converted to: {file.convertedFormat.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 text-gray-400">
                      {getFileIcon(file)}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Added: {new Date(file.dateAdded).toLocaleDateString()}
                  </p>

                  {file.dateProcessed && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Processed:{" "}
                      {new Date(file.dateProcessed).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex gap-2 justify-end">
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-indigo-600 text-white text-sm font-semibold transition-all duration-200 hover:bg-indigo-700 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm font-semibold transition-all duration-200 hover:bg-red-100 hover:shadow-md dark:hover:bg-slate-800 dark:bg-slate-700 dark:text-red-400 dark:border-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-500 text-center dark:text-gray-400">
            Showing {filteredFiles.length} of {files.length} files
          </p>
        </>
      )}
    </div>
  );
};

export default function Dashboard(): JSX.Element {
  return <DashboardContent />;
}
