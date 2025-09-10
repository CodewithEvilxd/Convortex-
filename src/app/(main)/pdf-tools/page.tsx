"use client";

import React, { useState } from "react";
import { useFileContext } from "@/context/FileContext";
import { useAuth } from "@/context/AuthContext";
import { FileObject } from "@/utils/authUtils";
import { useRouter } from "next/navigation";
import {
  addWatermarkToPDF,
  mergePDFs,
  splitPDF,
  convertImagesToPDF,
  compressPDF,
  rotatePDF,
  reorderPDF,
  deletePDFPages,
  addPageNumbersToPDF,
  editPDFMetadata,
  addAnnotationToPDF,
  fillPDFForm,
  processBatchPDFOperations,
  convertPDFToImagesAdvanced,
  performOCR,
  addDigitalSignature,
  convertVideoToPDFAdvanced,
  convertPDFToEBookAdvanced,
  extractTextFromPDFAdvanced,
  addPasswordProtection,
  safeBtoa
} from "@/utils/conversionUtils";

const PDFTools: React.FC = () => {
  const { files, updateFile, addFile } = useFileContext();
  const { currentUser } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FileObject[]>([]);
  const [toolCategory, setToolCategory] = useState<'basic' | 'intermediate' | 'advanced' | 'premium'>('basic');
  const [activeTool, setActiveTool] = useState<string>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // Helper functions for user feedback
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };


  // PDF-related state
  const [compressionLevel, setCompressionLevel] = useState(0.8);
  const [watermarkText, setWatermarkText] = useState('Convortex');
  const [password, setPassword] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [rotationAngle, setRotationAngle] = useState<'90' | '180' | '270'>('90');
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [pageOrder, setPageOrder] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [pageNumberFormat, setPageNumberFormat] = useState<'1,2,3' | 'Page 1' | '1/10'>('Page 1');
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center'>('bottom-center');
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: ''
  });
  const [annotationText, setAnnotationText] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState({ x: 100, y: 100 });
  const [signatureText, setSignatureText] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [ebookFormat, setEbookFormat] = useState<'epub' | 'mobi'>('epub');
  const [batchOperations, setBatchOperations] = useState<string[]>([]);
  const [processingHistory] = useState<{ fileName: string; operation: string; timestamp: string }[]>([]);


  // AI Assistant functionality
  const handleAIPrompt = async () => {
    if (!aiPrompt.trim()) return;

    setIsProcessing(true);
    setAiResponse('Processing your request...');

    // Simulate AI processing
    setTimeout(() => {
      const response = generateAIResponse(aiPrompt);
      setAiResponse(response);
      setIsProcessing(false);
    }, 2000);
  };

  const generateAIResponse = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();

    // Merge operations
    if ((lowerPrompt.includes('merge') || lowerPrompt.includes('combine') || lowerPrompt.includes('join')) && lowerPrompt.includes('pdf')) {
      return 'I\'ll help you merge PDFs! Select multiple PDF files from your dashboard and click the "Merge PDFs" button. The files will be combined in the order they appear.';
    }

    // Split operations
    if ((lowerPrompt.includes('split') || lowerPrompt.includes('divide') || lowerPrompt.includes('separate')) && lowerPrompt.includes('pdf')) {
      return 'To split a PDF, select one PDF file and use the PDF Split tool. You can specify page ranges like "1-5,8,10-15" to create multiple smaller files.';
    }

    // Compression operations
    if (lowerPrompt.includes('compress') || lowerPrompt.includes('reduce') || lowerPrompt.includes('shrink') || lowerPrompt.includes('size')) {
      return 'Use the PDF Compression tool to reduce file size. Adjust the quality slider - lower quality means smaller files but potentially reduced image quality.';
    }

    // Image to PDF conversion
    if ((lowerPrompt.includes('image') || lowerPrompt.includes('photo') || lowerPrompt.includes('picture')) &&
        (lowerPrompt.includes('pdf') || lowerPrompt.includes('convert') || lowerPrompt.includes('to pdf'))) {
      return 'To convert images to PDF, select multiple image files (JPG, PNG, etc.) and use the "Image → PDF" tool. Each image will become a page in the PDF.';
    }

    // PDF to image conversion
    if (lowerPrompt.includes('pdf') && (lowerPrompt.includes('image') || lowerPrompt.includes('png') || lowerPrompt.includes('jpg') || lowerPrompt.includes('extract'))) {
      return 'To extract images from a PDF, select one PDF file and use the "PDF → Image" tool. Each page will be saved as a separate image file.';
    }

    // OCR operations
    if (lowerPrompt.includes('ocr') || lowerPrompt.includes('searchable') || lowerPrompt.includes('text') || lowerPrompt.includes('scan')) {
      return 'OCR functionality converts scanned PDFs to searchable text. This feature requires the Tesseract.js library and is currently in development.';
    }

    // Watermark operations
    if (lowerPrompt.includes('watermark') || lowerPrompt.includes('stamp') || lowerPrompt.includes('mark')) {
      return 'To add a watermark, select PDF files and use the Watermark tool. Enter your watermark text and click "Add Watermark" - it will be applied diagonally across all pages with 30% opacity using PDF-lib.';
    }

    // Password operations
    if (lowerPrompt.includes('password') || lowerPrompt.includes('protect') || lowerPrompt.includes('secure') || lowerPrompt.includes('lock')) {
      return 'Password protection is not available in the current client-side implementation. This feature requires server-side processing for security reasons.';
    }

    // Help and general queries
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do') || lowerPrompt.includes('how')) {
      return 'I can help you with PDF operations! Try commands like "merge my PDFs", "compress this file", "convert images to PDF", or "split this document". Check the tool categories above for all available features.';
    }

    // File management
    if (lowerPrompt.includes('upload') || lowerPrompt.includes('add') || lowerPrompt.includes('new file')) {
      return 'To upload new files, click the "Upload Files" button. You can upload PDFs, images, and other documents to process them with our tools.';
    }

    return 'I\'m here to help with your PDF processing needs! Try specific commands like "merge PDFs", "compress files", "convert images", or "split documents". You can also browse the tool categories above for all available features.';
  };

  // PDF Operations
  const handlePDFMerge = async () => {
    if (selectedFiles.length < 2) {
      showError('Please select at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Extract base64 data from selected files
      const pdfBase64Array = selectedFiles.map(file => file.base64);

      // Update progress during processing
      setProgress(25);

      // Merge PDFs using pdf-lib
      const mergedPdfBase64 = await mergePDFs(pdfBase64Array);

      setProgress(75);

      // Create merged PDF file object
      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const mergedFile: FileObject = {
        id: `merged_${Date.now()}`,
        name: `${baseName}_merged_${timestamp}.pdf`,
        type: 'application/pdf',
        size: mergedPdfBase64.length, // Use actual merged PDF size
        base64: mergedPdfBase64,
        dateAdded: new Date().toISOString(),
        processed: true,
        isSignature: false,
      };

      addFile(mergedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess(`Successfully merged ${selectedFiles.length} PDFs!`);
    } catch (error) {
      console.error('Merge error:', error);
      setIsProcessing(false);
      showError('Failed to merge PDFs. Please try again.');
    }
  };

  const handlePDFSplit = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file to split');
      return;
    }

    if (!pageRange.trim()) {
      showError('Please specify page ranges to split (e.g., 1-5,8,10-15)');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Split PDF using pdf-lib
      const splitPdfBase64Array = await splitPDF(selectedFiles[0].base64, pageRange);

      setProgress(75);

      // Create split file objects
      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      splitPdfBase64Array.forEach((splitPdfBase64, index) => {
        const splitFile: FileObject = {
          id: `split_${Date.now()}_${index}`,
          name: `${baseName}_split_${pageRange.replace(/[^a-zA-Z0-9]/g, '_')}_part${index + 1}_${timestamp}.pdf`,
          type: 'application/pdf',
          size: splitPdfBase64.length,
          base64: splitPdfBase64,
          dateAdded: new Date().toISOString(),
          processed: true,
          isSignature: false,
        };

        addFile(splitFile);
      });

      setProgress(100);
      setIsProcessing(false);
      showSuccess(`PDF split successfully into ${splitPdfBase64Array.length} parts!`);
    } catch (error) {
      console.error('Split error:', error);
      setIsProcessing(false);
      showError('Failed to split PDF. Please check your page ranges and try again.');
    }
  };

  const handleImageToPDF = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select image files to convert to PDF');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Extract base64 data from selected image files
      const imageBase64Array = selectedFiles.map(file => file.base64);

      // Convert images to PDF using pdf-lib
      const pdfBase64 = await convertImagesToPDF(imageBase64Array, {
        pageSize: 'a4',
        orientation: 'portrait',
        fitToPage: true,
        margins: 20
      });

      setProgress(75);

      // Create PDF file object
      const baseName = selectedFiles.length === 1
        ? selectedFiles[0].name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
        : 'multiple_images';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const pdfFile: FileObject = {
        id: `pdf_${Date.now()}`,
        name: `${baseName}_converted_${timestamp}.pdf`,
        type: 'application/pdf',
        size: pdfBase64.length,
        base64: pdfBase64,
        dateAdded: new Date().toISOString(),
        processed: true,
        isSignature: false,
      };

      addFile(pdfFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess(`Successfully converted ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} to PDF!`);
    } catch (error) {
      console.error('Image to PDF conversion error:', error);
      setIsProcessing(false);
      showError('Failed to convert images to PDF. Please try again.');
    }
  };

  const handlePDFToImage = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Convert PDF to images using advanced implementation
      const images = await convertPDFToImagesAdvanced(selectedFiles[0].base64, {
        format: 'png',
        quality: 0.9,
        dpi: 150
      });

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      // Create image files
      images.forEach((imageBase64, index) => {
        const imageFile: FileObject = {
          id: `img_${Date.now()}_${index}`,
          name: `${baseName}_page${index + 1}_${timestamp}.png`,
          type: 'image/png',
          size: imageBase64.length,
          base64: imageBase64,
          dateAdded: new Date().toISOString(),
          processed: true,
          isSignature: false,
        };
        addFile(imageFile);
      });

      setProgress(100);
      setIsProcessing(false);
      showSuccess(`PDF converted to ${images.length} images successfully!`);
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      setIsProcessing(false);
      showError('Failed to convert PDF to images. Please try again.');
    }
  };

  const handlePDFCompression = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select PDF files to compress');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

        // Compress PDF using pdf-lib
        const compressedPdfBase64 = await compressPDF(file.base64, {
          quality: compressionLevel,
          removeUnusedObjects: true,
          optimizeFonts: true,
          compressImages: true
        });

        // Calculate new size
        const newSize = compressedPdfBase64.length;

        updateFile(file.id, {
          base64: compressedPdfBase64,
          size: newSize,
          processed: true,
          dateProcessed: new Date().toISOString(),
        });
      }

      setProgress(100);
      setIsProcessing(false);
      showSuccess(`PDFs compressed successfully with ${Math.round(compressionLevel * 100)}% quality!`);
    } catch (error) {
      console.error('Compression error:', error);
      setIsProcessing(false);
      showError('Failed to compress PDFs. Please try again.');
    }
  };

  const handleFileSelection = (file: FileObject, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, file]);
    } else {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  // Rotate PDF pages
  const handleRotatePages = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file to rotate');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Rotate PDF using pdf-lib
      const rotatedPdfBase64 = await rotatePDF(selectedFiles[0].base64, parseInt(rotationAngle) as 90 | 180 | 270);

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const rotatedFile: FileObject = {
        ...selectedFiles[0],
        id: `rotated_${Date.now()}`,
        name: `${baseName}_rotated_${rotationAngle}deg_${timestamp}.pdf`,
        base64: rotatedPdfBase64,
        size: rotatedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(rotatedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess(`PDF pages rotated by ${rotationAngle} degrees!`);
    } catch (error) {
      console.error('Rotation error:', error);
      setIsProcessing(false);
      showError('Failed to rotate PDF pages');
    }
  };

  // Reorder PDF pages
  const handleReorderPages = async () => {
    if (selectedFiles.length !== 1 || !pageOrder.trim()) {
      showError('Please select 1 PDF file and specify page order');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Reorder PDF using pdf-lib
      const reorderedPdfBase64 = await reorderPDF(selectedFiles[0].base64, pageOrder);

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const reorderedFile: FileObject = {
        ...selectedFiles[0],
        id: `reordered_${Date.now()}`,
        name: `${baseName}_reordered_${timestamp}.pdf`,
        base64: reorderedPdfBase64,
        size: reorderedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(reorderedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('PDF pages reordered successfully!');
    } catch (error) {
      console.error('Reorder error:', error);
      setIsProcessing(false);
      showError('Failed to reorder PDF pages. Please check your page order format.');
    }
  };

  // Delete PDF pages
  const handleDeletePages = async () => {
    if (selectedFiles.length !== 1 || !pagesToDelete.trim()) {
      showError('Please select 1 PDF file and specify pages to delete');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Delete pages from PDF using pdf-lib
      const cleanedPdfBase64 = await deletePDFPages(selectedFiles[0].base64, pagesToDelete);

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const cleanedFile: FileObject = {
        ...selectedFiles[0],
        id: `cleaned_${Date.now()}`,
        name: `${baseName}_pages_deleted_${timestamp}.pdf`,
        base64: cleanedPdfBase64,
        size: cleanedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(cleanedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('Pages deleted successfully!');
    } catch (error) {
      console.error('Delete pages error:', error);
      setIsProcessing(false);
      showError('Failed to delete pages. Please check your page range format.');
    }
  };

  // Extract text from PDF
  const handleExtractText = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Extract text using advanced implementation
      const result = await extractTextFromPDFAdvanced(selectedFiles[0].base64, {
        preserveFormatting: true,
        includePageNumbers: false,
        extractImages: false,
        language: 'en'
      });

      setProgress(75);

      setExtractedText(result.text);

      // Create text file
      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const textFile: FileObject = {
        id: `extracted_text_${Date.now()}`,
        name: `${baseName}_extracted_text_${timestamp}.txt`,
        type: 'text/plain',
        size: result.text.length,
        base64: safeBtoa(result.text),
        dateAdded: new Date().toISOString(),
        processed: true,
        isSignature: false,
      };

      addFile(textFile);

      // Create image files if images were extracted
      if (result.images && result.images.length > 0) {
        result.images.forEach((imageBase64, index) => {
          const imageFile: FileObject = {
            id: `extracted_img_${Date.now()}_${index}`,
            name: `${baseName}_extracted_image_${index + 1}_${timestamp}.png`,
            type: 'image/png',
            size: imageBase64.length,
            base64: imageBase64,
            dateAdded: new Date().toISOString(),
            processed: true,
            isSignature: false,
          };
          addFile(imageFile);
        });
      }

      setProgress(100);
      setIsProcessing(false);
      showSuccess(`Text extracted successfully! ${result.images ? `Also extracted ${result.images.length} images.` : ''}`);
    } catch (error) {
      console.error('Text extraction error:', error);
      setIsProcessing(false);
      showError('Failed to extract text from PDF');
    }
  };

  // Add watermark to PDF
  const handleAddWatermark = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select PDF files to watermark');
      return;
    }

    if (!watermarkText.trim()) {
      showError('Please enter watermark text');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

        // Apply watermark using PDF-lib
        const watermarkedBase64 = await addWatermarkToPDF(
          selectedFiles[i].base64,
          watermarkText,
          {
            fontSize: 50,
            color: { r: 0.5, g: 0.5, b: 0.5 },
            opacity: 0.3,
            position: 'center'
          }
        );

        // Create watermarked file
        const baseName = selectedFiles[i].name.replace(/\.pdf$/i, '');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

        const watermarkedFile: FileObject = {
          id: `watermarked_${Date.now()}_${i}`,
          name: `${baseName}_watermarked_${timestamp}.pdf`,
          type: 'application/pdf',
          size: selectedFiles[i].size, // Size might change slightly
          base64: watermarkedBase64,
          dateAdded: new Date().toISOString(),
          processed: true,
          isSignature: false,
        };

        addFile(watermarkedFile);
      }

      setIsProcessing(false);
      showSuccess(`Watermark added to ${selectedFiles.length} PDF${selectedFiles.length > 1 ? 's' : ''} successfully!`);
    } catch (error) {
      console.error('Watermark error:', error);
      setIsProcessing(false);
      showError('Failed to add watermark to PDFs. Please try again.');
    }
  };

  // Add page numbers
  const handleAddPageNumbers = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Add page numbers using pdf-lib
      const numberedPdfBase64 = await addPageNumbersToPDF(selectedFiles[0].base64, {
        format: pageNumberFormat,
        position: pageNumberPosition,
        fontSize: 12,
        margin: 30,
        startPage: 1
      });

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const numberedFile: FileObject = {
        ...selectedFiles[0],
        id: `numbered_${Date.now()}`,
        name: `${baseName}_numbered_${timestamp}.pdf`,
        base64: numberedPdfBase64,
        size: numberedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(numberedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('Page numbers added successfully!');
    } catch (error) {
      console.error('Page numbering error:', error);
      setIsProcessing(false);
      showError('Failed to add page numbers');
    }
  };

  // Edit PDF metadata
  const handleEditMetadata = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Edit PDF metadata using pdf-lib
      const updatedPdfBase64 = await editPDFMetadata(selectedFiles[0].base64, metadata);

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const updatedFile: FileObject = {
        ...selectedFiles[0],
        id: `metadata_${Date.now()}`,
        name: `${baseName}_metadata_${timestamp}.pdf`,
        base64: updatedPdfBase64,
        size: updatedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(updatedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('PDF metadata updated successfully!');
    } catch (error) {
      console.error('Metadata editing error:', error);
      setIsProcessing(false);
      showError('Failed to update PDF metadata');
    }
  };

  // Convert video to PDF (advanced implementation)
  const handleVideoToPDF = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select video files to convert');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

        // Convert video to PDF using advanced implementation
        const pdfBase64 = await convertVideoToPDFAdvanced(file.base64, {
          frameInterval: 1,
          maxFrames: 10,
          quality: 0.8
        });

        const baseName = file.name.replace(/\.(mp4|avi|mov|wmv)$/i, '');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

        const pdfFile: FileObject = {
          id: `video_pdf_${Date.now()}_${i}`,
          name: `${baseName}_frames_${timestamp}.pdf`,
          type: 'application/pdf',
          size: pdfBase64.length,
          base64: pdfBase64,
          dateAdded: new Date().toISOString(),
          processed: true,
          isSignature: false,
        };

        addFile(pdfFile);
      }

      setProgress(100);
      setIsProcessing(false);
      showSuccess(`Successfully converted ${selectedFiles.length} video${selectedFiles.length > 1 ? 's' : ''} to PDF!`);
    } catch (error) {
      console.error('Video to PDF conversion error:', error);
      setIsProcessing(false);
      showError('Failed to convert video to PDF');
    }
  };

  // Add PDF annotations
  const handleAddAnnotation = async () => {
    if (selectedFiles.length !== 1 || !annotationText.trim()) {
      showError('Please select 1 PDF file and enter annotation text');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Add annotation using pdf-lib
      const annotatedPdfBase64 = await addAnnotationToPDF(selectedFiles[0].base64, {
        text: annotationText,
        x: annotationPosition.x,
        y: annotationPosition.y,
        pageIndex: 0
      });

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const annotatedFile: FileObject = {
        ...selectedFiles[0],
        id: `annotated_${Date.now()}`,
        name: `${baseName}_annotated_${timestamp}.pdf`,
        base64: annotatedPdfBase64,
        size: annotatedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(annotatedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('Annotation added successfully!');
    } catch (error) {
      console.error('Annotation error:', error);
      setIsProcessing(false);
      showError('Failed to add annotation');
    }
  };

  // Sign PDF
  const handleSignPDF = async () => {
    if (selectedFiles.length !== 1 || !signatureText.trim()) {
      showError('Please select 1 PDF file and enter signature text');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Add digital signature using advanced implementation
      const signedPdfBase64 = await addDigitalSignature(selectedFiles[0].base64, {
        signerName: currentUser?.displayName || 'Anonymous',
        signerEmail: currentUser?.email || 'anonymous@example.com',
        signatureText: signatureText,
        position: { x: 100, y: 100, page: 0 },
        certificate: 'self-signed'
      });

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const signedFile: FileObject = {
        ...selectedFiles[0],
        id: `signed_${Date.now()}`,
        name: `${baseName}_signed_${timestamp}.pdf`,
        base64: signedPdfBase64,
        size: signedPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
        isSignature: true,
      };

      addFile(signedFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('PDF signed successfully!');
    } catch (error) {
      console.error('Digital signature error:', error);
      setIsProcessing(false);
      showError('Failed to sign PDF');
    }
  };

  // Fill PDF forms
  const handleFillForms = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file with forms');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Fill PDF forms using pdf-lib
      const filledPdfBase64 = await fillPDFForm(selectedFiles[0].base64, formData);

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const filledFile: FileObject = {
        ...selectedFiles[0],
        id: `filled_${Date.now()}`,
        name: `${baseName}_filled_${timestamp}.pdf`,
        base64: filledPdfBase64,
        size: filledPdfBase64.length,
        processed: true,
        dateProcessed: new Date().toISOString(),
      };

      addFile(filledFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess('PDF forms filled successfully!');
    } catch (error) {
      console.error('Form filling error:', error);
      setIsProcessing(false);
      showError('Failed to fill PDF forms');
    }
  };

  // Convert to eBook
  const handleConvertToEbook = async () => {
    if (selectedFiles.length !== 1) {
      showError('Please select exactly 1 PDF file to convert');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Convert PDF to eBook using advanced implementation
      const ebookBase64 = await convertPDFToEBookAdvanced(selectedFiles[0].base64, ebookFormat, {
        title: selectedFiles[0].name.replace(/\.pdf$/i, ''),
        author: currentUser?.displayName || 'Unknown Author',
        preserveImages: true,
        includeTOC: true
      });

      setProgress(75);

      const baseName = selectedFiles[0].name.replace(/\.pdf$/i, '');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      const ebookFile: FileObject = {
        id: `ebook_${Date.now()}`,
        name: `${baseName}_ebook_${timestamp}.${ebookFormat}`,
        type: `application/${ebookFormat === 'epub' ? 'epub+zip' : 'x-mobipocket-ebook'}`,
        size: ebookBase64.length,
        base64: ebookBase64,
        dateAdded: new Date().toISOString(),
        processed: true,
        isSignature: false,
      };

      addFile(ebookFile);
      setProgress(100);
      setIsProcessing(false);
      showSuccess(`PDF converted to ${ebookFormat.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('eBook conversion error:', error);
      setIsProcessing(false);
      showError('Failed to convert PDF to eBook');
    }
  };

  // Batch conversion
  const handleBatchConvert = async () => {
    if (selectedFiles.length === 0 || batchOperations.length === 0) {
      showError('Please select files and operations for batch processing');
      return;
    }

    setIsProcessing(true);
    setProgress(25);

    try {
      // Prepare operations for batch processing
      const operations = batchOperations.map(op => ({
        type: op as 'compress' | 'watermark' | 'rotate' | 'page-numbers' | 'password',
        options: op === 'watermark' ? { text: watermarkText } :
                 op === 'rotate' ? { rotation: 90 } :
                 op === 'page-numbers' ? { format: pageNumberFormat, position: pageNumberPosition } :
                 op === 'password' ? { password: 'batch_password' } :
                 {}
      }));

      // Process batch operations
      const processedFiles = await processBatchPDFOperations(
        selectedFiles.map(f => f.base64),
        operations
      );

      setProgress(75);

      // Create file objects for processed files
      processedFiles.forEach((processedPdf, index) => {
        const originalFile = selectedFiles[index];
        const baseName = originalFile.name.replace(/\.[^.]+$/, '');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

        const processedFile: FileObject = {
          ...originalFile,
          id: `batch_${Date.now()}_${index}`,
          name: `${baseName}_batch_processed_${timestamp}.pdf`,
          base64: processedPdf,
          size: processedPdf.length,
          processed: true,
          dateProcessed: new Date().toISOString(),
        };

        addFile(processedFile);
      });

      setProgress(100);
      setTimeout(() => {
        alert(`Batch processing completed! Applied ${batchOperations.length} operations to ${selectedFiles.length} files.`);
      }, 500);

      setSelectedFiles([]);
      setBatchOperations([]);
      setIsProcessing(false);
      showSuccess(`Batch processing completed! ${selectedFiles.length} files processed.`);

    } catch (error) {
      console.error("Batch conversion error:", error);
      setIsProcessing(false);
      showError('Batch processing failed. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Please sign in to access PDF tools
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to use advanced PDF processing features.
          </p>
        </div>
      </div>
    );
  }

  const tools = {
    basic: [
      { id: 'merge', name: 'PDF Merge', icon: '🔗', description: 'Combine multiple PDFs into one' },
      { id: 'split', name: 'PDF Split', icon: '✂️', description: 'Split PDF into separate files' },
      { id: 'img-to-pdf', name: 'Image → PDF', icon: '🖼️', description: 'Convert images to PDF' },
      { id: 'pdf-to-img', name: 'PDF → Image', icon: '📷', description: 'Extract images from PDF' },
      { id: 'compress', name: 'Compress PDF', icon: '🗜️', description: 'Reduce PDF file size' },
      { id: 'rotate', name: 'Rotate Pages', icon: '🔄', description: 'Rotate PDF pages' },
      { id: 'reorder', name: 'Reorder Pages', icon: '🔀', description: 'Change page order' },
      { id: 'delete', name: 'Delete Pages', icon: '🗑️', description: 'Remove unwanted pages' },
    ],
    intermediate: [
      { id: 'ocr', name: 'OCR (Searchable PDF)', icon: '🔍', description: 'Make scanned PDFs searchable' },
      { id: 'extract-text', name: 'Extract Text', icon: '📝', description: 'Extract text from PDF' },
      { id: 'watermark', name: 'Add Watermark', icon: '💧', description: 'Add text/image watermark' },
      { id: 'password', name: 'Password Protect', icon: '🔒', description: 'Add password protection' },
      { id: 'page-numbers', name: 'Page Numbers', icon: '🔢', description: 'Add page numbering' },
      { id: 'metadata', name: 'Edit Metadata', icon: '📋', description: 'Edit PDF metadata' },
    ],
    advanced: [
      { id: 'video-to-pdf', name: 'Video → PDF', icon: '🎥', description: 'Convert video frames to PDF' },
      { id: 'annotations', name: 'PDF Annotations', icon: '✏️', description: 'Add highlights and comments' },
      { id: 'sign', name: 'Sign PDF', icon: '✍️', description: 'Add digital signatures' },
      { id: 'forms', name: 'Fill Forms', icon: '📄', description: 'Fill PDF forms' },
      { id: 'ebook', name: 'Convert to eBook', icon: '📚', description: 'Convert to EPUB/MOBI' },
    ],
    premium: [
      { id: 'batch-convert', name: 'Batch Conversion', icon: '⚡', description: 'Process multiple files at once' },
      { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖', description: 'AI-powered PDF processing' },
      { id: 'history', name: 'File History', icon: '📚', description: 'View processing history' },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center dark:text-slate-400">
          PDF Tools 🛠️
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-500">
          Comprehensive PDF processing and manipulation tools
        </p>
      </div>

      {/* AI Assistant */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-200">
          🤖 AI Assistant
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe what you want to do with your PDFs..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            onKeyPress={(e) => e.key === 'Enter' && handleAIPrompt()}
          />
          <button
            onClick={handleAIPrompt}
            disabled={isProcessing || !aiPrompt.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isProcessing ? 'Processing...' : 'Ask AI'}
          </button>
        </div>
        {aiResponse && (
          <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border">
            <p className="text-gray-700 dark:text-slate-300">{aiResponse}</p>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-600 text-lg mr-2">✅</div>
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 text-lg mr-2">❌</div>
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {[
          { id: 'basic', label: 'Basic Tools', color: 'bg-green-100 text-green-800' },
          { id: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
          { id: 'advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
          { id: 'premium', label: 'Premium', color: 'bg-yellow-100 text-yellow-800' },
        ].map(category => (
          <button
            key={category.id}
            onClick={() => setToolCategory(category.id as 'basic' | 'intermediate' | 'advanced' | 'premium')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              toolCategory === category.id
                ? category.color + ' border-current'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Tool Selection */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {tools[toolCategory].map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeTool === tool.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-2xl mb-2">{tool.icon}</div>
            <div className="font-semibold text-sm">{tool.name}</div>
            <div className="text-xs text-gray-600 mt-1">{tool.description}</div>
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
            {tools[toolCategory].find(t => t.id === activeTool)?.name || 'Tool Settings'}
          </h3>

          {/* Tool-specific settings */}
          {activeTool === 'merge' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Combine multiple PDF files into a single document.
              </p>
              <button
                onClick={handlePDFMerge}
                disabled={selectedFiles.length < 2 || isProcessing}
                className="w-full py-3 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Merging...' : 'Merge PDFs'}
              </button>
            </div>
          )}

          {activeTool === 'split' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Split a PDF into multiple files by page ranges.
              </p>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1-5,8,10-15"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <button
                onClick={handlePDFSplit}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Splitting...' : 'Split PDF'}
              </button>
            </div>
          )}

          {activeTool === 'img-to-pdf' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Convert selected images into a PDF document.
              </p>
              <button
                onClick={handleImageToPDF}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>
          )}

          {activeTool === 'pdf-to-img' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Extract each page of the PDF as a separate image.
              </p>
              <button
                onClick={handlePDFToImage}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Extracting...' : 'Extract Images'}
              </button>
            </div>
          )}

          {activeTool === 'compress' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Reduce PDF file size by compressing images and content.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compression Quality: {Math.round(compressionLevel * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              {isProcessing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              <button
                onClick={handlePDFCompression}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Compressing...' : 'Compress PDFs'}
              </button>
            </div>
          )}

          {activeTool === 'ocr' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Convert scanned PDFs to searchable PDFs using OCR.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>OCR Processing:</strong> This will extract text from images and scanned PDFs using advanced OCR algorithms.
                  Supports multiple languages and formats.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (selectedFiles.length === 0) {
                    showError('Please select files to process with OCR');
                    return;
                  }

                  setIsProcessing(true);
                  setProgress(25);

                  try {
                    for (let i = 0; i < selectedFiles.length; i++) {
                      const file = selectedFiles[i];
                      setProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

                      // Perform OCR on the file
                      const ocrText = await performOCR(file.base64, {
                        language: 'eng',
                        mode: 'text'
                      });

                      // Create text file with OCR results
                      const baseName = file.name.replace(/\.[^.]+$/, '');
                      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

                      const ocrFile: FileObject = {
                        id: `ocr_${Date.now()}_${i}`,
                        name: `${baseName}_ocr_${timestamp}.txt`,
                        type: 'text/plain',
                        size: ocrText.length,
                        base64: safeBtoa(ocrText),
                        dateAdded: new Date().toISOString(),
                        processed: true,
                        isSignature: false,
                      };

                      addFile(ocrFile);
                    }

                    setProgress(100);
                    setIsProcessing(false);
                    showSuccess(`OCR processing completed for ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}!`);
                  } catch (error) {
                    console.error('OCR processing error:', error);
                    setIsProcessing(false);
                    showError('Failed to process files with OCR');
                  }
                }}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Processing with OCR...' : 'Process with OCR'}
              </button>
            </div>
          )}

          {activeTool === 'watermark' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add text watermark to PDF pages.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Watermark Text:
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Watermark Settings:</strong> Text will be added diagonally across all pages with 30% opacity.
                  This uses PDF-lib for high-quality PDF processing.
                </p>
              </div>
              {isProcessing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              <button
                onClick={handleAddWatermark}
                disabled={selectedFiles.length === 0 || isProcessing || !watermarkText.trim()}
                className="w-full py-3 px-4 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Adding Watermark...' : 'Add Watermark'}
              </button>
            </div>
          )}

          {activeTool === 'password' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add password protection to PDF files.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800">
                  <strong>Password Protection:</strong> This will encrypt your PDF with the specified password.
                  Users will need this password to open and view the document.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (selectedFiles.length === 0) {
                    showError('Please select files to protect');
                    return;
                  }

                  if (!password.trim()) {
                    showError('Please enter a password');
                    return;
                  }

                  setIsProcessing(true);
                  setProgress(25);

                  try {
                    for (let i = 0; i < selectedFiles.length; i++) {
                      const file = selectedFiles[i];
                      setProgress(Math.round(((i + 0.5) / selectedFiles.length) * 100));

                      // Add password protection using pdf-lib
                      const protectedPdfBase64 = await addPasswordProtection(file.base64, {
                        password: password,
                        permissions: {
                          printing: 'highResolution',
                          modifying: false,
                          copying: false,
                          annotating: false,
                          fillingForms: false,
                          contentAccessibility: false,
                          documentAssembly: false
                        }
                      });

                      const baseName = file.name.replace(/\.[^.]+$/, '');
                      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

                      const protectedFile: FileObject = {
                        ...file,
                        id: `protected_${Date.now()}_${i}`,
                        name: `${baseName}_protected_${timestamp}.pdf`,
                        base64: protectedPdfBase64,
                        size: protectedPdfBase64.length,
                        processed: true,
                        dateProcessed: new Date().toISOString(),
                      };

                      addFile(protectedFile);
                    }

                    setProgress(100);
                    setIsProcessing(false);
                    showSuccess(`Password protection added to ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}!`);
                  } catch (error) {
                    console.error('Password protection error:', error);
                    setIsProcessing(false);
                    showError('Failed to add password protection');
                  }
                }}
                disabled={selectedFiles.length === 0 || isProcessing || !password.trim()}
                className="w-full py-3 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Protecting...' : 'Protect PDF'}
              </button>
            </div>
          )}

          {activeTool === 'ai-assistant' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Use AI to process your PDFs with natural language commands.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Example Commands:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• &quot;Merge my PDF files&quot;</li>
                  <li>• &quot;Compress this document&quot;</li>
                  <li>• &quot;Convert images to PDF&quot;</li>
                  <li>• &quot;Split PDF by pages&quot;</li>
                  <li>• &quot;Extract images from PDF&quot;</li>
                  <li>• &quot;Add password protection&quot;</li>
                  <li>• &quot;What can you help with?&quot;</li>
                </ul>
              </div>
            </div>
          )}

          {/* Rotate Pages */}
          {activeTool === 'rotate' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Rotate PDF pages by 90°, 180°, or 270° degrees.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotation Angle:
                </label>
                <select
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(e.target.value as '90' | '180' | '270')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="90">90° Clockwise</option>
                  <option value="180">180° (Upside Down)</option>
                  <option value="270">270° Counter-clockwise</option>
                </select>
              </div>
              <button
                onClick={handleRotatePages}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Rotating...' : 'Rotate Pages'}
              </button>
            </div>
          )}

          {/* Reorder Pages */}
          {activeTool === 'reorder' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Change the order of pages in your PDF document.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Page Order:
                </label>
                <input
                  type="text"
                  value={pageOrder}
                  onChange={(e) => setPageOrder(e.target.value)}
                  placeholder="e.g., 3,1,4,2 or 1-5,8,6-10"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter page numbers separated by commas, or use ranges (e.g., 1-5)
                </p>
              </div>
              <button
                onClick={handleReorderPages}
                disabled={selectedFiles.length !== 1 || isProcessing || !pageOrder.trim()}
                className="w-full py-3 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Reordering...' : 'Reorder Pages'}
              </button>
            </div>
          )}

          {/* Delete Pages */}
          {activeTool === 'delete' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Remove unwanted pages from your PDF document.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pages to Delete:
                </label>
                <input
                  type="text"
                  value={pagesToDelete}
                  onChange={(e) => setPagesToDelete(e.target.value)}
                  placeholder="e.g., 1,3,5-7"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter page numbers or ranges to delete (e.g., 1,3,5-7)
                </p>
              </div>
              <button
                onClick={handleDeletePages}
                disabled={selectedFiles.length !== 1 || isProcessing || !pagesToDelete.trim()}
                className="w-full py-3 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Deleting...' : 'Delete Pages'}
              </button>
            </div>
          )}

          {/* Extract Text */}
          {activeTool === 'extract-text' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Extract all text content from your PDF document.
              </p>
              {extractedText && (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-medium text-sm mb-2">Extracted Text:</h4>
                  <div className="max-h-40 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                    {extractedText}
                  </div>
                </div>
              )}
              <button
                onClick={handleExtractText}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Extracting...' : 'Extract Text'}
              </button>
            </div>
          )}

          {/* Page Numbers */}
          {activeTool === 'page-numbers' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add page numbers to your PDF document.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format:
                  </label>
                  <select
                    value={pageNumberFormat}
                    onChange={(e) => setPageNumberFormat(e.target.value as '1,2,3' | 'Page 1' | '1/10')}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="1,2,3">1, 2, 3</option>
                    <option value="Page 1">Page 1</option>
                    <option value="1/10">1/10</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position:
                  </label>
                  <select
                    value={pageNumberPosition}
                    onChange={(e) => setPageNumberPosition(e.target.value as 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center')}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddPageNumbers}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Adding...' : 'Add Page Numbers'}
              </button>
            </div>
          )}

          {/* Edit Metadata */}
          {activeTool === 'metadata' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Edit PDF metadata information (title, author, subject, etc.).
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title:
                  </label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author:
                  </label>
                  <input
                    type="text"
                    value={metadata.author}
                    onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    value={metadata.subject}
                    onChange={(e) => setMetadata(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords:
                  </label>
                  <input
                    type="text"
                    value={metadata.keywords}
                    onChange={(e) => setMetadata(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
              <button
                onClick={handleEditMetadata}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Updating...' : 'Update Metadata'}
              </button>
            </div>
          )}

          {/* Video to PDF */}
          {activeTool === 'video-to-pdf' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Convert video frames to PDF document.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This feature extracts frames from video files and creates a PDF.
                  Processing time depends on video length and quality.
                </p>
              </div>
              <button
                onClick={handleVideoToPDF}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Converting...' : 'Convert Video to PDF'}
              </button>
            </div>
          )}

          {/* PDF Annotations */}
          {activeTool === 'annotations' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add text annotations, highlights, and comments to your PDF.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annotation Text:
                </label>
                <textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Enter your annotation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X:
                  </label>
                  <input
                    type="number"
                    value={annotationPosition.x}
                    onChange={(e) => setAnnotationPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y:
                  </label>
                  <input
                    type="number"
                    value={annotationPosition.y}
                    onChange={(e) => setAnnotationPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
              <button
                onClick={handleAddAnnotation}
                disabled={selectedFiles.length !== 1 || isProcessing || !annotationText.trim()}
                className="w-full py-3 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Adding...' : 'Add Annotation'}
              </button>
            </div>
          )}

          {/* Sign PDF */}
          {activeTool === 'sign' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add digital signature to your PDF document.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signature Text:
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Enter your signature"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Digital Signature:</strong> This will add a text-based signature to your PDF.
                  For legally binding signatures, consider using a digital certificate.
                </p>
              </div>
              <button
                onClick={handleSignPDF}
                disabled={selectedFiles.length !== 1 || isProcessing || !signatureText.trim()}
                className="w-full py-3 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Signing...' : 'Sign PDF'}
              </button>
            </div>
          )}

          {/* Fill Forms */}
          {activeTool === 'forms' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Fill out PDF form fields automatically.
              </p>
              <div className="space-y-3">
                {Object.keys(formData).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No form fields detected</p>
                    <p className="text-sm">Upload a PDF with form fields to get started</p>
                  </div>
                ) : (
                  Object.entries(formData).map(([fieldName, value]) => (
                    <div key={fieldName}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {fieldName}:
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={handleFillForms}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Filling...' : 'Fill Forms'}
              </button>
            </div>
          )}

          {/* Convert to eBook */}
          {activeTool === 'ebook' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Convert PDF to eBook format (EPUB or MOBI).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  eBook Format:
                </label>
                <select
                  value={ebookFormat}
                  onChange={(e) => setEbookFormat(e.target.value as 'epub' | 'mobi')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="epub">EPUB (Universal)</option>
                  <option value="mobi">MOBI (Kindle)</option>
                </select>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <p className="text-sm text-purple-800">
                  <strong>eBook Conversion:</strong> This will convert your PDF to {ebookFormat.toUpperCase()} format,
                  optimized for e-readers and mobile devices.
                </p>
              </div>
              <button
                onClick={handleConvertToEbook}
                disabled={selectedFiles.length !== 1 || isProcessing}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Converting...' : `Convert to ${ebookFormat.toUpperCase()}`}
              </button>
            </div>
          )}

          {/* Batch Conversion */}
          {activeTool === 'batch-convert' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Apply multiple operations to selected files at once.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Operations:
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'compress', label: 'Compress Files', desc: 'Reduce file size' },
                    { id: 'watermark', label: 'Add Watermark', desc: 'Apply watermark' },
                    { id: 'rotate', label: 'Rotate Pages', desc: 'Rotate all pages' },
                    { id: 'page-numbers', label: 'Add Page Numbers', desc: 'Number pages' },
                  ].map(operation => (
                    <label key={operation.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={batchOperations.includes(operation.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBatchOperations(prev => [...prev, operation.id]);
                          } else {
                            setBatchOperations(prev => prev.filter(op => op !== operation.id));
                          }
                        }}
                        className="mr-2 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-medium">{operation.label}</span>
                        <span className="text-sm text-gray-500 ml-2">({operation.desc})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                <p className="text-sm text-indigo-800">
                  <strong>Batch Processing:</strong> Selected {selectedFiles.length} files will be processed with {batchOperations.length} operations each.
                </p>
              </div>
              <button
                onClick={handleBatchConvert}
                disabled={selectedFiles.length === 0 || batchOperations.length === 0 || isProcessing}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Processing...' : `Process ${selectedFiles.length} Files`}
              </button>
            </div>
          )}

          {/* File History */}
          {activeTool === 'history' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                View processing history and recent operations.
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {processingHistory.length > 0 ? (
                  processingHistory.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{item.fileName}</p>
                          <p className="text-xs text-gray-600">{item.operation} • {new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-xs text-green-600 font-medium">✓ Completed</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No processing history yet</p>
                    <p className="text-sm">Your PDF operations will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Status */}
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">✅</div>
          <h4 className="font-semibold mb-2">Basic Tools</h4>
          <p className="text-sm text-gray-600">Merge, Split, Convert, Compress</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">✅</div>
          <h4 className="font-semibold mb-2">Advanced Editing</h4>
          <p className="text-sm text-gray-600">Rotate, Reorder, Delete Pages</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">✅</div>
          <h4 className="font-semibold mb-2">Content Tools</h4>
          <p className="text-sm text-gray-600">Extract Text, Annotations, Forms</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl mb-2">✅</div>
          <h4 className="font-semibold mb-2">Premium Features</h4>
          <p className="text-sm text-gray-600">Batch Processing, eBook Conversion</p>
        </div>
      </div>
    </div>
  );
};

export default PDFTools;