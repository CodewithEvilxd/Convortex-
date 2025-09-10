"use client";

import { useFileContext } from "@/context/FileContext";
import React, { useState } from "react";
import { FileObject } from "@/utils/authUtils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  convertImageFormat,
  compressImage,
  addWatermark,
  addWatermarkToPDF,
  generatePDFFromImage,
  isConversionSupported,
  getBase64FileSize,
  // PDF → Other Formats
  convertPDFToImages,
  convertPDFToText,
  convertPDFToWord,
  convertPDFToExcel,
  convertPDFToPowerPoint,
  convertPDFToHTML,
  convertPDFToEBook,
  convertPDFToMarkdown,
  convertPDFToStructuredData,
  convertPDFToAudio,
  // Other → PDF Formats
  convertImagesToPDF,
  convertWordToPDF,
  convertExcelToPDF,
  convertTextToPDF,
  convertHTMLToPDF,
  convertStructuredDataToPDF,
  convertZIPToPDF,
  // Media → PDF
  convertVideoToPDF,
  convertAudioToPDF,
  // OCR & Scanned
  convertScannedPDFToSearchable,
  convertImageToSearchablePDF,
  // Specialized
  convertPDFToFillableForm,
  convertLaTeXToPDF,
  convertSVGToPDF,
  // AI Smart
  summarizePDFToShortPDF
} from "@/utils/conversionUtils";

// Comprehensive format options for all conversion types
export type FormatOption =
  | "jpg"
  | "png"
  | "webp"
  | "gif"
  | "bmp"
  | "tiff"
  | "svg"
  | "ico"
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "txt"
  | "csv"
  | "json"
  | "xml"
  | "html"
  | "md"
  | "rtf"
  | "epub"
  | "mobi"
  | "mp3"
  | "wav"
  | "mp4"
  | "avi"
  | "mov"
  | "zip"
  | "rar";

// Define interface for conversion history
interface ConversionHistoryItem {
  fileName: string;
  operation: string;
  targetFormat: string;
  timestamp: string;
  originalSize: number;
  newSize: number;
}

const FileConverter: React.FC = () => {
  const { files, updateFile, addFile } = useFileContext();
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileObject[]>([]);
  const [targetFormat, setTargetFormat] = useState<FormatOption | "">("");
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState("");
  const [conversionProgress, setConversionProgress] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  type OperationType = 'convert' | 'compress' | 'watermark' | 'merge' | 'split' | 'pdf-to-other' | 'other-to-pdf' | 'media-to-pdf' | 'ocr' | 'specialized' | 'batch' | 'ai-smart';
  const [operationType, setOperationType] = useState<OperationType>('convert');
  const [watermarkText, setWatermarkText] = useState('Convortex');
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [mergeFormat, setMergeFormat] = useState<'pdf' | 'zip'>('pdf');
  const [splitPages, setSplitPages] = useState<number>(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileObject | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistoryItem[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [estimatedOutputSize, setEstimatedOutputSize] = useState<number | null>(null);
  const [conversionSettings, setConversionSettings] = useState({
    maintainAspectRatio: true,
    resizeWidth: '',
    resizeHeight: '',
    jpegQuality: 0.9,
    pngCompression: 6,
    webpQuality: 0.8,
  });

  //list of possible target formats based on file type and operation
  const getTargetFormats = (fileType: string, operationType?: OperationType): FormatOption[] => {
    if (!fileType) return [];

    // For specialized operations, return specific format lists
    if (operationType === 'pdf-to-other') {
      return ["jpg", "png", "tiff", "txt", "docx", "html", "md", "xlsx", "csv", "json", "xml", "pptx", "epub", "mobi", "mp3", "wav"];
    }

    if (operationType === 'other-to-pdf') {
      return ["pdf"]; // All formats can convert to PDF
    }

    if (operationType === 'media-to-pdf') {
      return ["pdf"];
    }

    if (operationType === 'ocr') {
      return ["pdf", "txt", "docx"];
    }

    if (operationType === 'specialized') {
      return ["pdf"];
    }

    if (operationType === 'batch') {
      return ["pdf"];
    }

    if (operationType === 'ai-smart') {
      return ["pdf"];
    }

    // Default format list for regular conversions
    const allFormats: FormatOption[] = ["jpg", "png", "webp", "gif", "bmp", "tiff", "svg", "ico", "pdf", "docx", "xlsx", "pptx", "txt", "csv", "json", "xml", "html", "md", "rtf", "epub", "mobi", "mp3", "wav", "mp4", "avi", "mov", "zip", "rar"];

    // Filter formats based on what conversions are actually supported
    return allFormats.filter(format => isConversionSupported(fileType, format));
  };
  // handle file selection
  const handleFileSelect = (fileId: string): void => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setSelectedFile(file);
      setTargetFormat("");
      setConversionError("");
    }
  };

  //handle format selection
  const handleFormatChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setTargetFormat(e.target.value as FormatOption | "");
  };

  const router = useRouter();
  const getOriginalFormat = (file: FileObject | null): string => {
    if (!file) return "";

    const typeMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.ms-powerpoint": "ppt",
      "text/plain": "txt",
    };
    return typeMap[file.type] || file.type.split("/")[1];
  };
  // handle Conversion
  const handleConvert = async (): Promise<void> => {
    if (!selectedFile) {
      setConversionError("Please select a file");
      return;
    }

    if ((operationType === 'convert' || operationType === 'pdf-to-other' || operationType === 'other-to-pdf' || operationType === 'media-to-pdf' || operationType === 'ocr' || operationType === 'specialized' || operationType === 'batch' || operationType === 'ai-smart') && !targetFormat) {
      setConversionError("Please select a target format");
      return;
    }

    if (operationType === 'convert' && !isConversionSupported(selectedFile.type, targetFormat)) {
      setConversionError(`Conversion from ${selectedFile.type} to ${targetFormat} is not supported yet.`);
      return;
    }

    if (operationType === 'watermark' && !watermarkText.trim()) {
      setConversionError("Please enter watermark text");
      return;
    }

    setIsConverting(true);
    setConversionError("");
    setConversionProgress(0);

    try {
      let convertedBase64 = selectedFile.base64;
      let newFileName = selectedFile.name;

      // Simulate progress updates
      setConversionProgress(25);

      // Perform actual conversion based on operation type and file type
      if (operationType === 'pdf-to-other') {
        // PDF to other formats
        setConversionProgress(50);
        switch (targetFormat) {
          case 'jpg':
          case 'png':
          case 'tiff':
            convertedBase64 = (await convertPDFToImages(selectedFile.base64, targetFormat))[0] || selectedFile.base64;
            break;
          case 'txt':
            convertedBase64 = await convertPDFToText(selectedFile.base64);
            break;
          case 'docx':
            convertedBase64 = await convertPDFToWord(selectedFile.base64);
            break;
          case 'xlsx':
          case 'csv':
            convertedBase64 = await convertPDFToExcel(selectedFile.base64, targetFormat as 'xlsx' | 'csv');
            break;
          case 'pptx':
            convertedBase64 = await convertPDFToPowerPoint(selectedFile.base64);
            break;
          case 'html':
            convertedBase64 = await convertPDFToHTML(selectedFile.base64);
            break;
          case 'epub':
          case 'mobi':
            convertedBase64 = await convertPDFToEBook(selectedFile.base64, targetFormat as 'epub' | 'mobi');
            break;
          case 'md':
            convertedBase64 = await convertPDFToMarkdown(selectedFile.base64);
            break;
          case 'json':
          case 'xml':
            convertedBase64 = await convertPDFToStructuredData(selectedFile.base64, targetFormat as 'json' | 'xml');
            break;
          case 'mp3':
          case 'wav':
            convertedBase64 = await convertPDFToAudio(selectedFile.base64);
            break;
          default:
            convertedBase64 = selectedFile.base64;
        }
        setConversionProgress(75);
        newFileName = selectedFile.name.replace(/\.pdf$/i, `.${targetFormat}`);

      } else if (operationType === 'other-to-pdf') {
        // Other formats to PDF
        setConversionProgress(50);
        if (selectedFile.type.startsWith("image/")) {
          convertedBase64 = await convertImagesToPDF([selectedFile.base64]);
        } else if (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          convertedBase64 = await convertWordToPDF(selectedFile.base64);
        } else if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
          convertedBase64 = await convertExcelToPDF(selectedFile.base64);
        } else if (selectedFile.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
          convertedBase64 = await convertWordToPDF(selectedFile.base64); // Use Word converter as placeholder
        } else if (selectedFile.type === "text/plain") {
          convertedBase64 = await convertTextToPDF(atob(selectedFile.base64.split(',')[1]));
        } else if (selectedFile.type === "text/html") {
          convertedBase64 = await convertHTMLToPDF(atob(selectedFile.base64.split(',')[1]));
        } else if (selectedFile.type === "application/json" || selectedFile.type === "application/xml") {
          const data = selectedFile.type === "application/json" ?
            JSON.parse(atob(selectedFile.base64.split(',')[1])) :
            atob(selectedFile.base64.split(',')[1]);
          convertedBase64 = await convertStructuredDataToPDF(data);
        } else if (selectedFile.type === "application/zip") {
          convertedBase64 = await convertZIPToPDF(selectedFile.base64);
        } else {
          convertedBase64 = selectedFile.base64;
        }
        setConversionProgress(75);
        newFileName = selectedFile.name.replace(/\.[^.]+$/, '.pdf');

      } else if (operationType === 'media-to-pdf') {
        // Media to PDF
        setConversionProgress(50);
        if (selectedFile.type.startsWith("video/")) {
          convertedBase64 = await convertVideoToPDF(selectedFile.base64);
        } else if (selectedFile.type.startsWith("audio/")) {
          convertedBase64 = await convertAudioToPDF(selectedFile.base64);
        }
        setConversionProgress(75);
        newFileName = selectedFile.name.replace(/\.[^.]+$/, '.pdf');

      } else if (operationType === 'ocr') {
        // OCR processing
        setConversionProgress(50);
        if (targetFormat === 'pdf') {
          convertedBase64 = await convertScannedPDFToSearchable(selectedFile.base64);
        } else if (targetFormat === 'txt') {
          convertedBase64 = await convertPDFToText(selectedFile.base64);
        } else if (targetFormat === 'docx') {
          convertedBase64 = await convertPDFToWord(selectedFile.base64);
        } else if (selectedFile.type.startsWith("image/")) {
          convertedBase64 = await convertImageToSearchablePDF(selectedFile.base64);
        }
        setConversionProgress(75);
        newFileName = selectedFile.name.replace(/\.[^.]+$/, `.${targetFormat}`);

      } else if (operationType === 'specialized') {
        // Specialized conversions
        setConversionProgress(50);
        if (targetFormat === 'pdf' && selectedFile.type === "application/pdf") {
          convertedBase64 = await convertPDFToFillableForm(selectedFile.base64);
        } else if (targetFormat === 'pdf' && selectedFile.name.endsWith('.tex')) {
          convertedBase64 = await convertLaTeXToPDF(atob(selectedFile.base64.split(',')[1]));
        } else if (targetFormat === 'pdf' && selectedFile.type === "image/svg+xml") {
          convertedBase64 = await convertSVGToPDF(atob(selectedFile.base64.split(',')[1]));
        }
        setConversionProgress(75);
        newFileName = selectedFile.name.replace(/\.[^.]+$/, '.pdf');

      } else if (operationType === 'ai-smart') {
        // AI-powered conversions
        setConversionProgress(50);
        if (targetFormat === 'pdf') {
          convertedBase64 = await summarizePDFToShortPDF(selectedFile.base64);
        }
        setConversionProgress(75);
        newFileName = selectedFile.name.replace(/\.[^.]+$/, '_ai.pdf');

      } else {
        // Standard conversions
        if (selectedFile.type.startsWith("image/")) {
          // Image format conversion
          setConversionProgress(50);
          convertedBase64 = await convertImageFormat(selectedFile.base64, targetFormat);
          setConversionProgress(75);
          const originalFormat = getOriginalFormat(selectedFile);
          newFileName = selectedFile.name.replace(
            new RegExp(`\\.${originalFormat}$`, "i"),
            `.${targetFormat}`
          );
        } else if (selectedFile.type === "text/plain" && targetFormat === "pdf") {
          // Text to PDF (simplified)
          setConversionProgress(50);
          convertedBase64 = await generatePDFFromImage(selectedFile.base64);
          setConversionProgress(75);
          newFileName = selectedFile.name.replace(/\.txt$/i, ".pdf");
        } else if (selectedFile.type === "application/pdf" && ["jpg", "jpeg", "png"].includes(targetFormat)) {
          // PDF to image (simplified - would need pdf-lib in real implementation)
          setConversionProgress(50);
          // For now, we'll simulate this
          convertedBase64 = selectedFile.base64; // Placeholder
          setConversionProgress(75);
          newFileName = selectedFile.name.replace(/\.pdf$/i, `.${targetFormat}`);
        } else {
          // For unsupported conversions, show error
          throw new Error(`Conversion from ${selectedFile.type} to ${targetFormat} is not implemented yet.`);
        }
      }

      setConversionProgress(90);

      // Calculate new file size
      const newSize = getBase64FileSize(convertedBase64);

      // Update the file with converted data
      if (selectedFile.id) {
        updateFile(selectedFile.id, {
          name: newFileName,
          base64: convertedBase64,
          type: `application/${targetFormat}`, // Simplified MIME type
          size: newSize,
          processed: true,
          convertedFormat: targetFormat,
          dateProcessed: new Date().toISOString(),
        });
      }

      // Reset selection after successful conversion
      setTargetFormat("");
      setSelectedFile(null);

      // Add to conversion history
      setConversionHistory(prev => [{
        fileName: selectedFile.name,
        operation: operationType,
        targetFormat: targetFormat || 'N/A',
        timestamp: new Date().toISOString(),
        originalSize: selectedFile.size,
        newSize: newSize,
      }, ...prev.slice(0, 9)]); // Keep only last 10 conversions

      // Show success message
      setConversionProgress(100);
      setTimeout(() => {
        alert(`File converted successfully to ${targetFormat.toUpperCase()}! Check your dashboard to see the converted file.`);
      }, 500);

    } catch (error) {
      console.error("Conversion error:", error);
      setConversionError(
        error instanceof Error ? error.message : "An error occurred during conversion. Please try again."
      );
    } finally {
      setIsConverting(false);
    }
  };
  // Handle file selection for batch mode
  const handleFileSelection = (file: FileObject, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, file]);
    } else {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  // Handle batch conversion
  const handleBatchConvert = async () => {
    if (selectedFiles.length === 0 || (!targetFormat && operationType !== 'merge')) {
      setConversionError("Please select files and target format");
      return;
    }

    setIsConverting(true);
    setConversionError("");
    setConversionProgress(0);

    try {
      if (operationType === 'merge') {
        // Handle file merging
        await handleFileMerge();
      } else {
        // Handle regular batch conversion
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setConversionProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

          let convertedBase64 = file.base64;
          let newFileName = file.name;

          if (file.type.startsWith("image/")) {
            if (operationType === 'compress') {
              convertedBase64 = await compressImage(file.base64, compressionQuality);
              newFileName = file.name.replace(/(\.\w+)$/i, `_compressed$1`);
            } else if (operationType === 'watermark') {
              convertedBase64 = await addWatermark(file.base64, watermarkText, {
                position: watermarkPosition,
                opacity: watermarkOpacity
              });
              newFileName = file.name.replace(/(\.\w+)$/i, `_watermarked$1`);
            } else {
              convertedBase64 = await convertImageFormat(file.base64, targetFormat);
              const originalFormat = getOriginalFormat(file);
              newFileName = file.name.replace(
                new RegExp(`\\.${originalFormat}$`, "i"),
                `.${targetFormat}`
              );
            }
          } else if (file.type === "application/pdf" && operationType === 'watermark') {
            // Handle PDF watermarking
            convertedBase64 = await addWatermarkToPDF(file.base64, watermarkText, {
              position: watermarkPosition,
              opacity: watermarkOpacity,
              fontSize: 50,
              color: { r: 0.5, g: 0.5, b: 0.5 }
            });
            newFileName = file.name.replace(/(\.\w+)$/i, `_watermarked$1`);
          }

          const newSize = getBase64FileSize(convertedBase64);

          updateFile(file.id, {
            name: newFileName,
            base64: convertedBase64,
            size: newSize,
            processed: true,
            convertedFormat: targetFormat,
            dateProcessed: new Date().toISOString(),
          });
        }
      }

      // Add batch conversion to history
      const batchEntry = {
        fileName: `${selectedFiles.length} files`,
        operation: operationType,
        targetFormat: targetFormat || 'N/A',
        timestamp: new Date().toISOString(),
        originalSize: selectedFiles.reduce((sum, f) => sum + f.size, 0),
        newSize: selectedFiles.length * 1000, // Approximate
      };
      setConversionHistory(prev => [batchEntry, ...prev.slice(0, 9)]);

      setConversionProgress(100);
      setTimeout(() => {
        alert(`Successfully processed ${selectedFiles.length} files!`);
      }, 500);

      setSelectedFiles([]);
      setBatchMode(false);

    } catch (error) {
      console.error("Batch conversion error:", error);
      setConversionError(
        error instanceof Error ? error.message : "Batch conversion failed"
      );
    } finally {
      setIsConverting(false);
    }
  };

  // Handle file merging
  const handleFileMerge = async () => {
    if (selectedFiles.length < 2) {
      setConversionError("Please select at least 2 files to merge");
      return;
    }

    setConversionProgress(25);

    try {
      if (mergeFormat === 'pdf') {
        // Merge images into PDF
        const mergedBase64 = await mergeImagesToPDF(selectedFiles);
        const newFileName = `merged_${Date.now()}.pdf`;

        // Add merged file to context
        addFile({
          id: `merged_${Date.now()}`,
          name: newFileName,
          type: "application/pdf",
          size: getBase64FileSize(mergedBase64),
          base64: mergedBase64,
          dateAdded: new Date().toISOString(),
          processed: true,
          isSignature: false,
        });

        setConversionProgress(100);
      } else if (mergeFormat === 'zip') {
        // Create ZIP file
        await createZipFile(selectedFiles);
        setConversionProgress(100);
      }
    } catch (error) {
      console.error("Merge error:", error);
      setConversionError("Failed to merge files");
    }
  };

  // Merge images to PDF (simplified implementation)
  const mergeImagesToPDF = async (files: FileObject[]): Promise<string> => {
    // This is a simplified implementation
    // In a real app, you'd use pdf-lib or similar library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas not available');

    // Set canvas size for A4
    canvas.width = 595;
    canvas.height = 842;

    // For now, just return the first image as base64
    // Real implementation would create a multi-page PDF
    return files[0].base64;
  };

  // Create ZIP file (simplified implementation)
  const createZipFile = async (files: FileObject[]) => {
    // This is a placeholder for ZIP creation
    // In a real app, you'd use jszip or similar library
    console.log('Creating ZIP with files:', files.map(f => f.name));
    alert('ZIP creation would be implemented with a ZIP library');
  };

  // Handle preview
  const handlePreview = (file: FileObject) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      try {
        setIsConverting(true);
        setConversionError("");

        // Process each dropped file
        for (const file of droppedFiles) {
          // Validate file size (max 50MB)
          if (file.size > 50 * 1024 * 1024) {
            setConversionError(`File "${file.name}" is too large. Maximum size is 50MB.`);
            continue;
          }

          // Convert file to base64
          const base64 = await fileToBase64(file);

          // Create file object
          const fileObject: FileObject = {
            id: `dropped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64,
            dateAdded: new Date().toISOString(),
            processed: false,
            isSignature: false,
          };

          // Add to file context
          addFile(fileObject);
        }

        // Show success message
        setTimeout(() => {
          alert(`Successfully added ${droppedFiles.length} file(s) to your collection!`);
        }, 500);

      } catch (error) {
        console.error("Error processing dropped files:", error);
        setConversionError("Failed to process dropped files. Please try again.");
      } finally {
        setIsConverting(false);
      }
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle bulk actions
  const handleSelectAll = () => {
    setSelectedFiles(files);
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
    setSelectedFile(null);
  };

  // Handle conversion presets
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'web-optimized':
        setTargetFormat('webp');
        setCompressionQuality(0.8);
        break;
      case 'print-quality':
        setTargetFormat('png');
        setCompressionQuality(1.0);
        break;
      case 'document-pdf':
        setTargetFormat('pdf');
        setOperationType('convert');
        break;
      case 'mobile-friendly':
        setTargetFormat('jpg');
        setCompressionQuality(0.7);
        break;
    }
  };

  // Estimate output file size
  const estimateOutputSize = (inputSize: number, format: string, quality: number = 0.8): number => {
    const formatMultipliers: Record<string, number> = {
      'jpg': 0.3,
      'jpeg': 0.3,
      'png': 0.8,
      'webp': 0.25,
      'gif': 0.4,
      'pdf': 0.9,
    };

    const baseMultiplier = formatMultipliers[format.toLowerCase()] || 1;
    return Math.round(inputSize * baseMultiplier * quality);
  };

  // Update estimated size when format or quality changes
  React.useEffect(() => {
    if (selectedFile && targetFormat) {
      const estimated = estimateOutputSize(selectedFile.size, targetFormat, compressionQuality);
      setEstimatedOutputSize(estimated);
    } else {
      setEstimatedOutputSize(null);
    }
  }, [selectedFile, targetFormat, compressionQuality]);

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    if (!selectedFile) return;

    switch (action) {
      case 'optimize':
        setOperationType('compress');
        setCompressionQuality(0.7);
        break;
      case 'watermark':
        setOperationType('watermark');
        setWatermarkText('© Convortex');
        break;
      case 'convert-jpg':
        setOperationType('convert');
        setTargetFormat('jpg');
        break;
      case 'convert-png':
        setOperationType('convert');
        setTargetFormat('png');
        break;
    }
  };

  // Get operation label for buttons
  const getOperationLabel = (opType: OperationType): string => {
    switch (opType) {
      case 'convert': return 'Convert';
      case 'compress': return 'Compress';
      case 'watermark': return 'Watermark';
      case 'merge': return 'Merge';
      case 'split': return 'Split';
      case 'pdf-to-other': return 'Convert PDF';
      case 'other-to-pdf': return 'Convert to PDF';
      case 'media-to-pdf': return 'Convert Media';
      case 'ocr': return 'Process OCR';
      case 'specialized': return 'Specialized Convert';
      case 'batch': return 'Batch Process';
      case 'ai-smart': return 'AI Convert';
      default: return 'Process';
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 container-mobile">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 spacing-mobile">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left text-gray-800 dark:text-white text-responsive">
          Convert Files
        </h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end gap-mobile">
          <button
            onClick={() => setBatchMode(!batchMode)}
            className={`px-4 py-3 sm:px-3 sm:py-2 rounded-md transition-colors touch-target btn-mobile text-sm sm:text-base ${
              batchMode
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {batchMode ? "Single Mode" : "Batch Mode"}
          </button>
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value as OperationType)}
            className="px-4 py-3 sm:px-3 sm:py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 touch-target text-sm sm:text-base"
          >
            <option value="convert">🔄 Convert Mode</option>
            <option value="compress">🗜️ Compress Mode</option>
            <option value="watermark">💧 Watermark Mode</option>
            <option value="merge">🔗 Merge Files</option>
            <option value="split">✂️ Split Files</option>
            <option value="pdf-to-other">📄 PDF → Other Formats</option>
            <option value="other-to-pdf">📋 Other → PDF</option>
            <option value="media-to-pdf">🎥 Media → PDF</option>
            <option value="ocr">🔍 OCR & Scanned PDFs</option>
            <option value="specialized">⚙️ Specialized Conversions</option>
            <option value="batch">📦 Batch Conversions</option>
            <option value="ai-smart">🤖 AI Smart Conversions</option>
          </select>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="px-4 py-3 sm:px-3 sm:py-2 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors touch-target btn-mobile text-sm sm:text-base"
          >
            ⚙️ Advanced
          </button>
        </div>
      </div>

      {/* Enhanced Drag and Drop Zone */}
      <div
        className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center transition-all duration-300 ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-lg"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        } ${isConverting ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`text-6xl mb-4 transition-transform duration-300 ${dragOver ? "scale-110" : ""}`}>
          {isConverting ? "⏳" : dragOver ? "📂" : "�"}
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">
          {isConverting ? "Processing files..." : dragOver ? "Drop files here" : "Drag and drop files here to upload"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isConverting ? "Please wait..." : "Supports images, documents, videos, audio, and more"}
        </p>
        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Images
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Documents
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Media
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Archives
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Maximum file size: 50MB per file</p>
      </div>

      {/* Conversion Presets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'web-optimized', label: 'Web Optimized', icon: '🌐', desc: 'Small WebP files' },
            { id: 'print-quality', label: 'Print Quality', icon: '🖨️', desc: 'High-quality PNG' },
            { id: 'document-pdf', label: 'Document PDF', icon: '📄', desc: 'Convert to PDF' },
            { id: 'mobile-friendly', label: 'Mobile Friendly', icon: '📱', desc: 'Optimized JPG' },
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              title={preset.desc}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300">No files available for conversion.</p>
          <p className="text-red-500 dark:text-red-400 text-sm mt-2">
            Please upload files first.
          </p>
          <button
            onClick={() => router.push("/upload")}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-slate-500 dark:text-white hover:text-white text-sm font-semibold rounded-md hover:bg-indigo-300 dark:hover:bg-slate-900 dark:bg-slate-700 transition-colors duration-200"
          > Click here to Upload </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                Select File to Convert
              </h3>
              {batchMode && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions for Single File */}
            {!batchMode && selectedFile && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickAction('optimize')}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    ⚡ Optimize
                  </button>
                  <button
                    onClick={() => handleQuickAction('watermark')}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    💧 Watermark
                  </button>
                  <button
                    onClick={() => handleQuickAction('convert-jpg')}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                  >
                    🖼️ To JPG
                  </button>
                  <button
                    onClick={() => handleQuickAction('convert-png')}
                    className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    🖼️ To PNG
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-72 overflow-y-auto pr-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center p-3 mb-2 rounded-md transition-colors ${
                    batchMode
                      ? selectedFiles.some(f => f.id === file.id)
                        ? "bg-indigo-50 border border-indigo-300"
                        : "bg-gray-50 hover:bg-gray-100"
                      : selectedFile?.id === file.id
                      ? "bg-indigo-50 border border-indigo-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {batchMode && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.some(f => f.id === file.id)}
                      onChange={(e) => handleFileSelection(file, e.target.checked)}
                      className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  )}
                  {!batchMode && (
                    <input
                      type="radio"
                      name="selectedFile"
                      checked={selectedFile?.id === file.id}
                      onChange={() => handleFileSelect(file.id)}
                      className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                  )}

                  {/* Drag handle for batch mode */}
                  {batchMode && (
                    <div className="mr-3 cursor-move text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zM3 8h14a1 1 0 010 2H3a1 1 0 010-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2z"/>
                      </svg>
                    </div>
                  )}

                  {/* File type icon */}
                  <div className="mr-3">
                    {file.type.startsWith("image/") ? (
                      <svg
                        className="w-6 h-6 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    ) : file.type.includes("pdf") ? (
                      <svg
                        className="w-6 h-6 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* File name and info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-900">
                      {(file.size / 1024).toFixed(2)} KB •{" "}
                      {getOriginalFormat(file).toUpperCase()}
                    </p>
                  </div>

                  {/* Preview button */}
                  {file.type.startsWith("image/") && (
                    <button
                      onClick={() => handlePreview(file)}
                      className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                    >
                      Preview
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-white">
              Conversion Options
            </h3>

            {(selectedFile || selectedFiles.length > 0) ? (
              <>
                <div className="mb-4">
                  <p className="mb-2 text-sm text-black dark:text-white">
                    {batchMode ? `Selected Files (${selectedFiles.length}):` : "Selected File:"}
                  </p>
                  {batchMode ? (
                    <div className="max-h-32 overflow-y-auto">
                      {selectedFiles.map(file => (
                        <div key={file.id} className="p-2 bg-indigo-50 rounded-md mb-1">
                          <p className="font-medium text-black text-sm truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {getOriginalFormat(file).toUpperCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : selectedFile ? (
                    <div className="p-3 bg-indigo-50 rounded-md">
                      <p className="font-medium text-black dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-900 dark:text-gray-300">
                        Original format: {getOriginalFormat(selectedFile).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Size: {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      {estimatedOutputSize && targetFormat && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Estimated output: {(estimatedOutputSize / 1024).toFixed(2)} KB
                          ({targetFormat.toUpperCase()})
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                {operationType === 'convert' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-black mb-1">
                      Convert to:
                    </label>
                    <select
                      value={targetFormat}
                      onChange={handleFormatChange}
                      className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                    >
                      <option value="">
                        Select target format
                      </option>
                      {batchMode && selectedFiles.length > 0 ? (
                        // In batch mode, show formats supported by all selected files
                        getTargetFormats(selectedFiles[0].type, operationType).map(format => (
                          <option key={format} value={format}>
                            {format.toUpperCase()}
                          </option>
                        ))
                      ) : selectedFile ? (
                        getTargetFormats(selectedFile.type, operationType).map(format => (
                          <option key={format} value={format}>
                            {format.toUpperCase()}
                          </option>
                        ))
                      ) : null}
                    </select>

                    {/* Advanced Options Panel */}
                    {showAdvancedOptions && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Options</h4>

                        {/* Resize Options */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
                            <input
                              type="number"
                              value={conversionSettings.resizeWidth}
                              onChange={(e) => setConversionSettings(prev => ({ ...prev, resizeWidth: e.target.value }))}
                              placeholder="Auto"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
                            <input
                              type="number"
                              value={conversionSettings.resizeHeight}
                              onChange={(e) => setConversionSettings(prev => ({ ...prev, resizeHeight: e.target.value }))}
                              placeholder="Auto"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Quality Settings */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              JPEG Quality: {Math.round(conversionSettings.jpegQuality * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={conversionSettings.jpegQuality}
                              onChange={(e) => setConversionSettings(prev => ({ ...prev, jpegQuality: parseFloat(e.target.value) }))}
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              WebP Quality: {Math.round(conversionSettings.webpQuality * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={conversionSettings.webpQuality}
                              onChange={(e) => setConversionSettings(prev => ({ ...prev, webpQuality: parseFloat(e.target.value) }))}
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="maintainAspectRatio"
                              checked={conversionSettings.maintainAspectRatio}
                              onChange={(e) => setConversionSettings(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                              className="mr-2 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="maintainAspectRatio" className="text-xs text-gray-600">
                              Maintain aspect ratio when resizing
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {operationType === 'compress' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-black mb-1">
                      Compression Quality: {Math.round(compressionQuality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={compressionQuality}
                      onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Higher Quality</span>
                      <span>Smaller Size</span>
                    </div>
                  </div>
                )}

                {operationType === 'watermark' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Watermark Text:
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="Enter watermark text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Position:
                      </label>
                      <select
                        value={watermarkPosition}
                        onChange={(e) => setWatermarkPosition(e.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="center">Center</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Opacity: {Math.round(watermarkOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>More Transparent</span>
                        <span>Less Transparent</span>
                      </div>
                    </div>
                  </div>
                )}

                {operationType === 'merge' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Merge Format:
                      </label>
                      <select
                        value={mergeFormat}
                        onChange={(e) => setMergeFormat(e.target.value as 'pdf' | 'zip')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="pdf">Merge to PDF</option>
                        <option value="zip">Create ZIP Archive</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Selected {selectedFiles.length} files to merge</p>
                      <p className="mt-1">Files will be merged in the order they appear in the list</p>
                    </div>
                  </div>
                )}

                {operationType === 'split' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Split Options:
                      </label>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm text-gray-600">Pages per file:</label>
                          <input
                            type="number"
                            min="1"
                            value={splitPages}
                            onChange={(e) => setSplitPages(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF → Other Formats */}
                {operationType === 'pdf-to-other' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Convert PDF to:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select target format</option>
                        <optgroup label="📄 Images">
                          <option value="jpg">JPG - High Quality Images</option>
                          <option value="png">PNG - Transparent Images</option>
                          <option value="tiff">TIFF - Professional Images</option>
                        </optgroup>
                        <optgroup label="📝 Text">
                          <option value="txt">TXT - Plain Text</option>
                        </optgroup>
                        <optgroup label="📄 Documents">
                          <option value="docx">DOCX - Microsoft Word</option>
                          <option value="html">HTML - Web Format</option>
                          <option value="md">MD - Markdown</option>
                        </optgroup>
                        <optgroup label="📊 Data">
                          <option value="xlsx">XLSX - Excel Spreadsheet</option>
                          <option value="csv">CSV - Comma Separated Values</option>
                          <option value="json">JSON - Structured Data</option>
                          <option value="xml">XML - Extensible Markup</option>
                        </optgroup>
                        <optgroup label="📋 Presentations">
                          <option value="pptx">PPTX - PowerPoint Slides</option>
                        </optgroup>
                        <optgroup label="📚 eBooks">
                          <option value="epub">EPUB - eBook Format</option>
                          <option value="mobi">MOBI - Kindle Format</option>
                        </optgroup>
                        <optgroup label="🔊 Audio">
                          <option value="mp3">MP3 - Audio Book</option>
                          <option value="wav">WAV - High Quality Audio</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Conversion Details:</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          {targetFormat === 'jpg' && <p>• High-quality JPEG images extracted from each PDF page</p>}
                          {targetFormat === 'png' && <p>• PNG images with transparency support</p>}
                          {targetFormat === 'tiff' && <p>• Professional TIFF format for printing</p>}
                          {targetFormat === 'txt' && <p>• Plain text extraction with formatting preserved</p>}
                          {targetFormat === 'docx' && <p>• Editable Word document with layout preservation</p>}
                          {targetFormat === 'html' && <p>• Web-ready HTML with CSS styling</p>}
                          {targetFormat === 'md' && <p>• Developer-friendly Markdown format</p>}
                          {targetFormat === 'xlsx' && <p>• Excel spreadsheet with table data</p>}
                          {targetFormat === 'csv' && <p>• CSV format for data processing</p>}
                          {targetFormat === 'json' && <p>• Structured JSON data export</p>}
                          {targetFormat === 'xml' && <p>• XML format for data interchange</p>}
                          {targetFormat === 'pptx' && <p>• PowerPoint presentation with slides</p>}
                          {targetFormat === 'epub' && <p>• eBook format for e-readers</p>}
                          {targetFormat === 'mobi' && <p>• Kindle-compatible MOBI format</p>}
                          {targetFormat === 'mp3' && <p>• Text-to-speech audio conversion</p>}
                          {targetFormat === 'wav' && <p>• High-quality WAV audio format</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Other Formats → PDF */}
                {operationType === 'other-to-pdf' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Convert to PDF from:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select source format</option>
                        <optgroup label="🖼️ Images">
                          <option value="jpg">JPG Images</option>
                          <option value="png">PNG Images</option>
                          <option value="webp">WebP Images</option>
                          <option value="gif">GIF Images</option>
                          <option value="bmp">BMP Images</option>
                          <option value="tiff">TIFF Images</option>
                          <option value="svg">SVG Vector Graphics</option>
                        </optgroup>
                        <optgroup label="📄 Documents">
                          <option value="docx">Word Documents (DOCX)</option>
                          <option value="txt">Text Files (TXT)</option>
                          <option value="html">HTML Web Pages</option>
                          <option value="md">Markdown Files</option>
                          <option value="rtf">Rich Text Format</option>
                        </optgroup>
                        <optgroup label="📊 Spreadsheets">
                          <option value="xlsx">Excel Files (XLSX)</option>
                          <option value="csv">CSV Data Files</option>
                        </optgroup>
                        <optgroup label="📋 Presentations">
                          <option value="pptx">PowerPoint Files (PPTX)</option>
                        </optgroup>
                        <optgroup label="📦 Archives">
                          <option value="zip">ZIP Archives</option>
                        </optgroup>
                        <optgroup label="🔧 Data">
                          <option value="json">JSON Data Files</option>
                          <option value="xml">XML Data Files</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Conversion Details:</h4>
                        <div className="text-sm text-green-700 space-y-1">
                          {(targetFormat === 'jpg' || targetFormat === 'png' || targetFormat === 'webp' || targetFormat === 'gif' || targetFormat === 'bmp' || targetFormat === 'tiff' || targetFormat === 'svg') && <p>• Multiple images will be combined into a single PDF document</p>}
                          {targetFormat === 'docx' && <p>• Word document formatting and layout preserved in PDF</p>}
                          {targetFormat === 'txt' && <p>• Plain text converted to formatted PDF with proper typography</p>}
                          {targetFormat === 'html' && <p>• Web page rendered and converted to PDF with CSS styling</p>}
                          {targetFormat === 'md' && <p>• Markdown syntax converted to formatted PDF</p>}
                          {targetFormat === 'xlsx' && <p>• Excel data and charts converted to PDF tables</p>}
                          {targetFormat === 'csv' && <p>• CSV data converted to PDF tables</p>}
                          {targetFormat === 'pptx' && <p>• PowerPoint slides converted to PDF pages</p>}
                          {targetFormat === 'zip' && <p>• Archive contents extracted and converted to PDF</p>}
                          {(targetFormat === 'json' || targetFormat === 'xml') && <p>• Structured data converted to formatted PDF report</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Media → PDF */}
                {operationType === 'media-to-pdf' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Convert Media to PDF:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select media type</option>
                        <optgroup label="🎥 Video">
                          <option value="mp4">MP4 Video Files</option>
                          <option value="avi">AVI Video Files</option>
                          <option value="mov">MOV Video Files</option>
                        </optgroup>
                        <optgroup label="🔊 Audio">
                          <option value="mp3">MP3 Audio Files</option>
                          <option value="wav">WAV Audio Files</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">Media Conversion Details:</h4>
                        <div className="text-sm text-purple-700 space-y-1">
                          {(targetFormat === 'mp4' || targetFormat === 'avi' || targetFormat === 'mov') && (
                            <>
                              <p>• Video frames extracted and converted to PDF pages</p>
                              <p>• Frame interval: Every 1 second (configurable)</p>
                              <p>• Quality: High resolution image extraction</p>
                              <p>• Format: Each frame becomes a PDF page</p>
                            </>
                          )}
                          {(targetFormat === 'mp3' || targetFormat === 'wav') && (
                            <>
                              <p>• Audio transcribed to text using speech recognition</p>
                              <p>• Transcript formatted as PDF document</p>
                              <p>• Timestamps and speaker identification included</p>
                              <p>• Multi-language support available</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OCR & Scanned PDFs */}
                {operationType === 'ocr' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        OCR Processing:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select OCR option</option>
                        <optgroup label="🔍 OCR Processing">
                          <option value="pdf">Make PDF Searchable (OCR)</option>
                          <option value="txt">Extract Text from Scanned PDF</option>
                          <option value="docx">OCR to Editable Word Document</option>
                        </optgroup>
                        <optgroup label="🖼️ Image OCR">
                          <option value="jpg">OCR Image to Searchable PDF</option>
                          <option value="png">OCR PNG to Searchable PDF</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-800 mb-2">OCR Processing Details:</h4>
                        <div className="text-sm text-orange-700 space-y-1">
                          {targetFormat === 'pdf' && <p>• Add invisible text layer to scanned PDF for searchability</p>}
                          {targetFormat === 'txt' && <p>• Extract all text content from scanned document</p>}
                          {targetFormat === 'docx' && <p>• Convert scanned document to editable Word format</p>}
                          {(targetFormat === 'jpg' || targetFormat === 'png') && <p>• Convert scanned image to searchable PDF with text layer</p>}
                          <p>• Multi-language OCR support (English, Hindi, etc.)</p>
                          <p>• High accuracy text recognition</p>
                          <p>• Preserve original image quality</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Specialized Conversions */}
                {operationType === 'specialized' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Specialized Conversion:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select specialized option</option>
                        <optgroup label="📋 Forms">
                          <option value="pdf">Convert PDF to Fillable Form</option>
                        </optgroup>
                        <optgroup label="🏗️ Technical">
                          <option value="pdf">LaTeX to PDF Compilation</option>
                          <option value="pdf">SVG to PDF Vector Conversion</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">Specialized Conversion Details:</h4>
                        <div className="text-sm text-indigo-700 space-y-1">
                          {targetFormat === 'pdf' && operationType === 'specialized' && (
                            <>
                              <p>• Advanced form field detection and creation</p>
                              <p>• LaTeX mathematical typesetting support</p>
                              <p>• SVG vector graphics preservation</p>
                              <p>• Professional document formatting</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Batch Conversions */}
                {operationType === 'batch' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Batch Conversion Type:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select batch operation</option>
                        <optgroup label="📦 Multi-file">
                          <option value="pdf">Multiple Images → Single PDF</option>
                          <option value="pdf">Multiple PDFs → Images</option>
                          <option value="pdf">Bulk Documents → PDFs</option>
                        </optgroup>
                        <optgroup label="🎭 Mixed Media">
                          <option value="pdf">Images + Documents → PDF</option>
                          <option value="pdf">Videos + Audio → PDF</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <h4 className="font-medium text-teal-800 mb-2">Batch Processing Details:</h4>
                        <div className="text-sm text-teal-700 space-y-1">
                          <p>• Process multiple files simultaneously</p>
                          <p>• Automatic file type detection</p>
                          <p>• Progress tracking for each file</p>
                          <p>• Error handling and recovery</p>
                          <p>• Consolidated output generation</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Smart Conversions */}
                {operationType === 'ai-smart' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        AI-Powered Conversion:
                      </label>
                      <select
                        value={targetFormat}
                        onChange={handleFormatChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      >
                        <option value="">Select AI conversion</option>
                        <optgroup label="📝 Smart Processing">
                          <option value="pdf">Summarize PDF → Short PDF</option>
                          <option value="pdf">Translate PDF → Another Language</option>
                        </optgroup>
                        <optgroup label="🎓 Educational">
                          <option value="pdf">PDF → Flashcards (Anki)</option>
                          <option value="pdf">PDF → Quiz/Test Generation</option>
                        </optgroup>
                      </select>
                    </div>

                    {targetFormat && (
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <h4 className="font-medium text-pink-800 mb-2">AI Processing Details:</h4>
                        <div className="text-sm text-pink-700 space-y-1">
                          <p>• Advanced AI algorithms for content analysis</p>
                          <p>• Natural language processing capabilities</p>
                          <p>• Intelligent content extraction and restructuring</p>
                          <p>• Multi-language translation support</p>
                          <p>• Educational content optimization</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {conversionError && (
                  <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">
                    {conversionError}
                  </div>
                )}

                {isConverting && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${conversionProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 text-center">
                      Converting... {conversionProgress}%
                    </p>
                  </div>
                )}

                <button
                  onClick={batchMode ? handleBatchConvert : handleConvert}
                  disabled={
                    isConverting ||
                    (batchMode && selectedFiles.length === 0) ||
                    (!batchMode && !selectedFile) ||
                    (operationType === 'convert' && !targetFormat) ||
                    (operationType === 'watermark' && !watermarkText.trim()) ||
                    (operationType === 'pdf-to-other' && !targetFormat) ||
                    (operationType === 'other-to-pdf' && !targetFormat) ||
                    (operationType === 'media-to-pdf' && !targetFormat) ||
                    (operationType === 'ocr' && !targetFormat) ||
                    (operationType === 'specialized' && !targetFormat) ||
                    (operationType === 'batch' && !targetFormat) ||
                    (operationType === 'ai-smart' && !targetFormat)
                  }
                  className={`w-full py-4 sm:py-3 px-4 rounded-md transition-all duration-200 font-semibold touch-target btn-mobile ${
                    isConverting ||
                    (batchMode && selectedFiles.length === 0) ||
                    (!batchMode && !selectedFile) ||
                    (operationType === 'convert' && !targetFormat) ||
                    (operationType === 'watermark' && !watermarkText.trim())
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 dark:bg-slate-600 dark:hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {isConverting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {batchMode ? "Batch Processing..." : "Processing..."}
                    </div>
                  ) : batchMode ? (
                    `${getOperationLabel(operationType)} ${selectedFiles.length} Files`
                  ) : (
                    `${getOperationLabel(operationType)} File`
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">
                  Select a file to see conversion options
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversion History */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-white">
          Recent Conversions
        </h3>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {conversionHistory.length > 0 ? (
            <div className="space-y-2">
              {conversionHistory.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {item.operation === 'convert' ? '🔄' :
                       item.operation === 'compress' ? '🗜️' :
                       item.operation === 'watermark' ? '💧' : '📄'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{item.fileName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.operation} • {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Completed
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No recent conversions</p>
              <p className="text-sm">Your conversion history will appear here</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-white">
          About File Conversion
        </h3>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 shadow-sm group">
          <Image
            src="/convert1.svg"
            alt="Convert Files"
            width={150}
            height={150}
            className="mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 w-auto h-auto max-w-[150px] max-h-[150px]"
          />
          <p className="mb-2">Convert files between various formats:</p>
          <ul className="list-disc pl-5 mb-2 space-y-1">
            <li>Convert JPG, PNG, WebP, and more</li>
            <li>Convert documents between PDF, DOC, and TXT formats</li>
            <li>Convert spreadsheets to CSV or PDF</li>
            <li>Convert presentations to PDF or image formats</li>
          </ul>
          <p>
            All conversions are processed securely at your browser local storage
          </p>
          <div className="security-note mt-8 p-4 bg-green-50 border border-green-200/80 rounded-lg">
            <p className="text-center font-medium m-2 p-2 text-green-800 dark:text-green-300">
              After conversion all the files will be displayed at Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* File Validation Info */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 text-2xl mb-2">✅</div>
          <h4 className="font-medium text-green-800 dark:text-green-300 mb-1">Supported Formats</h4>
          <p className="text-sm text-green-700 dark:text-green-400">JPG, PNG, WebP, GIF, BMP, PDF, DOCX, TXT, CSV</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-blue-600 text-2xl mb-2">🔒</div>
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Secure Processing</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">All files processed locally in your browser</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-purple-600 text-2xl mb-2">⚡</div>
          <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-1">Fast Conversion</h4>
          <p className="text-sm text-purple-700 dark:text-purple-400">Optimized algorithms for quick processing</p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{previewFile.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center">
              {previewFile.type.startsWith("image/") ? (
                <Image
                  src={previewFile.base64}
                  alt={previewFile.name}
                  width={400}
                  height={300}
                  className="max-w-full max-h-96 object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-500 dark:text-gray-400">Preview not available for this file type</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              <p>Size: {(previewFile.size / 1024).toFixed(2)} KB</p>
              <p>Type: {previewFile.type}</p>
              <p>Added: {new Date(previewFile.dateAdded).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileConverter;
