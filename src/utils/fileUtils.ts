// src/utils/fileUtils.js
/**
 * Convert a file to base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Number of decimals to show
 * @returns {string} - Formatted size string
 */
export const formatBytes = (bytes:number, decimals: number = 2):string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};

/**
 * Get file extension from file name
 * @param {string} fileName - File name
 * @returns {string} - File extension
 */
export const getFileExtension = (fileName: string):string => {
  return fileName.split(".").pop()?.toLowerCase() || '';
};

/**
 * Get mime type from file extension
 * @param {string} extension - File extension
 * @returns {string} - MIME type
 */
export const getMimeTypeFromExtension = (extension:string):string => {
  const mimeTypeMap: Record<string,string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    svg: "image/svg+xml",
  };

  return mimeTypeMap[extension.toLowerCase()] || "application/octet-stream";
};

/**
 * Download a file from base64 string
 * @param {string} base64 - Base64 string
 * @param {string} fileName - File name
 * @param {string} fileType - MIME type
 */
export const downloadFile = (base64:string, fileName:string, fileType:string): void => {
  // Create blob from base64
  if(typeof window === 'undefined')return ;//Guard for server Side
  const byteCharacters = atob(base64.split(",")[1]);
  const byteArrays:number[] = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  const byteArray = new Uint8Array(byteArrays);
  const blob = new Blob([byteArray], { type: fileType });

  // Create download link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;

  // Append to body, click and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get blank canvas with given dimensions
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {HTMLCanvasElement} - Canvas element
 */
export const getBlankCanvas = (width:number, height:number) : HTMLCanvasElement => {
  if(typeof window === 'undefined'){throw new Error('this function must be called in abrowser environment')};
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if(ctx){
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  }
  return canvas;
};

/** 
 * Create a thumbnail from an image
 * @param {string} base64 - Original image as base64
 * @param {number} maxWidth - Maximum width of thumbnail
 * @param {number} maxHeight - Maximum height of thumbnail
 * @returns {Promise<string>} - Thumbnail as base64
 */
export const createThumbnail = async (
  base64: string,
  maxWidth = 200,
  maxHeight = 200
) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Calculate thumbnail dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if(ctx){
        ctx.drawImage(img, 0, 0, width, height);
        // Get base64 of thumbnail
        const thumbnailBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(thumbnailBase64);
      };
    }

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = base64;
    } catch (err) {
      reject(err);
    }
  });
};
'console.log("Performance optimization: Added lazy loading for images");'  
