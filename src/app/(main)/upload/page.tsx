"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useFileContext } from "@/context/FileContext";
import { fileToBase64 } from "@/utils/fileUtils";
import { ArrowUpTrayIcon } from "@heroicons/react/16/solid";
import Image from "next/image";

const FileUploader: React.FC = () => {
  const { addFile } = useFileContext();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Accepted file types
  const acceptedFileTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if file type is accepted
      if (!acceptedFileTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported!`);
        continue;
      }

      try {
        // Convert file to base64 for preview and manipulation
        const base64 = await fileToBase64(file);

        // Simulate upload progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        // Add file to context
        addFile({
          id: `${Date.now()}-${i}`,
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64,
          dateAdded: new Date().toISOString(),
          processed: false,
          isSignature: false,
        });
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }, 500);
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  interface Step {
    title: string;
    description: string;
  }

  const steps: Step[] = [
    {
      title: "Upload Files",
      description:
        "Click the upload button or drag and drop your files onto the page",
    },
    {
      title: "Select Format",
      description:
        "Choose your desired output format from the available options",
    },
    {
      title: "Convert Files",
      description: "Click convert and wait for processing to complete",
    },
    {
      title: "Download Results",
      description:
        "Download your converted files individually or as a ZIP archive",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200 dark:bg-gray-800">
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 text-center mb-8 dark:text-white">
        Upload Your Files
      </h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 ${
          dragActive
            ? "border-slate-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-300 bg-gray-50 dark:bg-gray-700"
        } transition-all duration-200 flex flex-col items-center justify-center`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center  ">
          <ArrowUpTrayIcon
            className={`w-16 h-16 mb-4 transition-colors duration-200  ${
              dragActive ? "text-indigo-400" : "text-gray-400 dark:text-slate-900"
            }`}
          />
          <p className="mb-2 text-black dark:text-white text-center">
            <span className="font-semibold text-indigo-400 dark:text-indigo-300">drag and drop</span>{" "}
          </p>
          <p className="text-xs max-w-sm text-black dark:text-gray-300 mb-4 text-center p-2">
            PNG, JPG, PDF, DOCX, and more. All files are processed securely.
          </p>
        </div>
        <button
          onClick={handleButtonClick}
          className="px-4 py-2 bg-slate-900 text-white rounded-md dark:hover:bg-white hover:text-slate-900 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors "
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Click to upload "}
        </button>

        <input
          ref={inputRef}
          onChange={handleChange}
          type="file"
          multiple
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="indigo-800 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            > <p className="mt-2 text-sm text-center text-gray-900 dark:text-white">
            Uploading... {uploadProgress}%
                  </p> </div>
          </div>
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Supported File Types
        </h3>
        <Image
          src={"support.svg"}
          alt="Upload Files"
          width={150}
          height={150}
          className="mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 "
          />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm ">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-2 text-center text-black dark:text-white shadow-black shadow-2xs cursor-default">
            Images (JPG, PNG, GIF)
          </div>
          <div className="bg-pink-100 dark:bg-pink-900/30 rounded p-2 text-center text-black dark:text-white shadow-black shadow-2xs cursor-default">
            Documents (PDF, DOC)
          </div>
          <div className="bg-blue-200 dark:bg-blue-800/30 rounded p-2 text-center text-black dark:text-white shadow-black shadow-2xs cursor-default">
            Spreadsheets (XLS, XLSX)
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/30 rounded p-2 text-center text-black dark:text-white shadow-black shadow-2xs cursor-default">
            Presentations (PPT, PPTX)
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded p-2 text-center text-black dark:text-white shadow-black shadow-2xs cursor-default">
            Text files (TXT)
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-bold m-2 p-2 ">
          <div className={`how-to-use bg-indigo-100 dark:bg-gray-800 rounded-lg p-6 shadow-sm`}>
            <h2 className="section-title text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
              Steps to Use
            </h2>

            <ol className="numbered-steps space-y-6 max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className="step-item flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-[#1a1b60] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="step-title text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="step-description text-gray-400 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="security-note mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200/80 dark:border-green-700/50 rounded-lg">
              <p className="text-green-800/80 dark:text-green-300 text-center font-medium">
                All files are temporarily stored in your dashboard .
              </p>
            </div>
          </div>
        </h3>
      </div>
    </div>
  );
};
export default FileUploader;
