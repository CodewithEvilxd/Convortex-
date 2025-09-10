/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
} from "react";
import {
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";
import { FileObject } from "@/utils/authUtils";
import { useRouter } from "next/navigation";

export interface ImageResizerProps {
  file: FileObject;
  onSave: (resizedFile: FileObject) => void;
  onCancel: () => void;
}


// Fix malformed base64 strings
const fixBase64String = (base64: string): string => {
  // Ensure proper base64 format with comma after "base64"
  if (base64.includes("base64") && !base64.includes("base64,")) {
    return base64.replace("base64", "base64,");
  }
  return base64;
};

const ImageResizer: React.FC<ImageResizerProps> = ({
  file,
  onSave,
  onCancel,
}) => {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Use a minimal approach to detect image type from base64 data
  const detectImageType = useCallback((base64: string): string => {
    if (base64.startsWith("data:image/jpeg")) return "image/jpeg";
    if (base64.startsWith("data:image/png")) return "image/png";
    if (base64.startsWith("data:image/gif")) return "image/gif";
    if (base64.startsWith("data:image/webp")) return "image/webp";
    return "image/png";
  }, []);

  // Load the image and set initial dimensions
  useEffect(() => {
    if (!file || !file.base64) {
      setError("No valid image file provided.");
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    const image = new window.Image();
    image.onload = () => {
      try {
        setOriginalWidth(image.width);
        setOriginalHeight(image.height);
        setWidth(image.width);
        setHeight(image.height);
        setAspectRatio(image.width / image.height);
        imageRef.current = image;
        setPreview(image.src);
        setIsLoading(false);
      } catch {
        setError("Failed to process image.");
        setIsLoading(false);
      }
    };
    image.onerror = () => {
      setError("Failed to load image. The image data may be corrupted.");
      setIsLoading(false);
    };

    // Fix the base64 string before setting as src
    const fixedBase64 = fixBase64String(file.base64);
    image.crossOrigin = "anonymous";
    image.src = fixedBase64;
  }, [file]);

  // Update the canvas preview when dimensions change
  const updatePreview = useCallback(() => {
    if (
      isLoading ||
      !canvasRef.current ||
      !imageRef.current ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Canvas context not available");
        return;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Clear canvas with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw resized image
      ctx.drawImage(imageRef.current, 0, 0, width, height);

      // Generate preview with detected image type
      const detectedType = detectImageType(file.base64);
      setPreview(canvas.toDataURL(detectedType, 0.95));
    } catch {
      setError("Failed to generate preview.");
    }
  }, [width, height, isLoading, file.base64, detectImageType]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Handle width change, maintaining aspect ratio if needed
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.max(1, parseInt(e.target.value, 10) || 1);
    setWidth(newWidth);

    if (maintainAspectRatio && aspectRatio > 0) {
      setHeight(Math.max(1, Math.round(newWidth / aspectRatio)));
    }
  };

  // Handle height change, maintaining aspect ratio if needed
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.max(1, parseInt(e.target.value, 10) || 1);
    setHeight(newHeight);

    if (maintainAspectRatio && aspectRatio > 0) {
      setWidth(Math.max(1, Math.round(newHeight * aspectRatio)));
    }
  };

  // Toggle aspect ratio lock
  const toggleAspectRatio = () => {
    setMaintainAspectRatio(prev => !prev);
  };

  // Reset to original dimensions
  const handleReset = () => {
    setWidth(originalWidth);
    setHeight(originalHeight);
  };

  // Save the resized image
  const handleSave = () => {
    if (!canvasRef.current) {
      setError("Canvas not available for save");
      return;
    }

    try {
      const detectedType = detectImageType(file.base64);
      const resizedBase64 = canvasRef.current.toDataURL(detectedType, 0.95);

      if (!resizedBase64 || resizedBase64 === "data:,") {
        setError("Failed to generate valid base64 data.");
        return;
      }

      // Create a new file object with resized dimensions and correct type
      const resizedFile: FileObject = {
        ...file,
        base64: resizedBase64,
        type: detectedType,
        width,
        height,
        size: Math.round((resizedBase64.length * 3) / 4),
      };

      onSave(resizedFile);
    } catch {
      setError("Failed to save resized image.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-md">
      {/* Resizer Controls */}
      <div className="flex-1 md:order-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Resize Image</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-500 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading image...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={width}
                  onChange={handleWidthChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-black"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={height}
                  onChange={handleHeightChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-black"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-2">
                    Maintain Aspect Ratio
                  </span>
                  <button
                    onClick={toggleAspectRatio}
                    className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
                  >
                    {maintainAspectRatio ? (
                      <LockClosedIcon className="w-5 h-5" />
                    ) : (
                      <LockOpenIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-6 rounded-xl border border-gray-300 text-gray-800 font-semibold shadow-sm hover:bg-indigo-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={width <= 0 || height <= 0}
                className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-semibold shadow-md  disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
              >
                Apply Resize
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Section */}
      <div className="flex-1 md:order-1">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner">
          <div className="flex items-center gap-2 mb-2">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              Original: {originalWidth}x{originalHeight}px
            </span>
            <span className="text-sm text-gray-600 font-medium">|</span>
            <span className="text-sm text-gray-600 font-medium">
              New: {width}x{height}px
            </span>
          </div>
          <div className="relative w-full h-auto max-h-[400px] overflow-hidden rounded-lg">
            {preview ? (
              // Use regular img tag for base64 images instead of Next.js Image
              <img
                src={preview}
                alt="Resized preview"
                className="w-full h-auto object-contain"
                style={{ maxHeight: "380px" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full min-h-[200px] bg-gray-100 text-gray-400 text-center p-8">
                Preview not available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// Main App Component integrated with file context
export default function App() {
  const { files, updateFile } = useFileContext();
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const router = useRouter();

  // Filter to get only image files
  const imageFiles = files.filter(file => file.type.startsWith('image/'));

  const handleFileSelect = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleSave = async (resizedFile: FileObject) => {
    if (selectedFile) {
      // Update the file in context with resized data
      updateFile(selectedFile.id, {
        base64: resizedFile.base64,
        size: resizedFile.size,
        width: resizedFile.width,
        height: resizedFile.height,
        processed: true,
        dateProcessed: new Date().toISOString(),
      });
    }
    setSelectedFile(null);

    // Show success message
    alert(`Image resized successfully! Check your dashboard to see the updated image.`);
  };

  const handleCancel = () => {
    setSelectedFile(null);
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Image
            src={"resize.svg"}
            alt="Resize"
            width={150}
            height={150}
            className="mx-auto mb-4 w-auto h-auto max-w-[150px] max-h-[150px]"
          />
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Please sign in to resize images
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to access image resizing features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-slate-400">
          Image Resizer
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-500">
          Resize your uploaded images while maintaining quality
        </p>
      </div>

      <Image
        src={"resize.svg"}
        alt="Resize"
        width={200}
        height={200}
        className="mx-auto mb-6 transition-transform duration-300 group-hover:scale-110 w-auto h-auto max-w-[200px] max-h-[200px]"
      />

      {!selectedFile && (
        <>
          {imageFiles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                No images available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload some images first to resize them.
              </p>
              <button
                onClick={() => router.push("/upload")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-slate-500 dark:text-white hover:text-white text-sm font-semibold rounded-md hover:bg-indigo-300 dark:hover:bg-slate-900 dark:bg-slate-700 transition-colors duration-200"
              >
                Upload Images
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageFiles.map(file => (
                <div
                  key={file.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer"
                  onClick={() => handleFileSelect(file.id)}
                >
                  <div className="h-44 bg-muted/40 flex items-center justify-center relative p-4">
                    <img
                      src={file.base64}
                      alt={file.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-5 border-t border-border">
                    <p className="font-semibold text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB • {file.type.split("/")[1]?.toUpperCase()}
                    </p>
                    <button className="mt-3 w-full py-2 px-3 rounded-md bg-indigo-600 text-white text-sm font-semibold transition-colors duration-200 hover:bg-indigo-700">
                      Resize This Image
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedFile && (
        <div className="w-full max-w-4xl mx-auto">
          <ImageResizer
            file={selectedFile}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      
    </div>
  );
}
