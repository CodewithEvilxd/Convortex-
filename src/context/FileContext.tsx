"use client";
import React, {
  useContext,
  useEffect,
  useState,
  ReactNode,
  createContext,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserFiles, updateUserFiles, FileObject } from "@/utils/authUtils";

interface FileContextType {
  files: FileObject[];
  addFile: (file: FileObject) => void;
  updateFile: (fileId: string, updates: Partial<FileObject>) => void;
  removeFile: (fileId: string) => void;
  getFile: (fileId: string) => FileObject | undefined;
  clearFiles: () => void;
  //method to handle resized images
  updateResizedImage: (fileId: string, resizedBase64: string) => void;
  selectedFile: FileObject | null;
  setSelectedFile: (file: FileObject | null) => void;
}

//create context
const FileContext = createContext<FileContextType | undefined>(undefined);


interface FileProviderProps {
  children: ReactNode;
}


//custom hooks using file context
export const useFileContext = (): FileContextType => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};

// Provider component
export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileObject[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);

  //load user-depecific files when user change

  useEffect(() => {
    if (currentUser) {
      //files for authenticated user
      const userFiles = getUserFiles(currentUser.uid);
      setFiles(userFiles);
    } else {
      //reset files when logged out
      setFiles([]);
    }
  }, [currentUser]);
  //update storage whenever files chamgees
  useEffect(() => {
    if (currentUser) {
      updateUserFiles(currentUser.uid, files);
    }
  }, [files, currentUser]);

  //operation function for files

  //add a new files
  const addFile = (file: FileObject): void => {
    setFiles(prevFiles => [...prevFiles, file]);
  };
  //update files
  const updateFile = (fileId: string, update: Partial<FileObject>): void => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId ? { ...file, ...update } : file
      )
    );
  };
  //remove files
  const removeFile = (fileId: string): void => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };
  //clear Files
  const clearFiles = (): void => {
    if (window.confirm("Are you sure you want to clear all files")) {
      setFiles([]);
    }
  };
  //get single File by Id
  const getFile = (fileId: string): FileObject | undefined => {
    return files.find(file => file.id === fileId);
  };
  //update resized image
  const updateResizedImage =(fileId: string, resizedBase64: string): void =>{
    setFiles(prevFiles=>
      prevFiles.map(file=>
        file.id === fileId ? {...file, base64: resizedBase64}:file
      )
    );
  };
  const contextValue: FileContextType = {
    files,
    addFile,
    updateFile,
    getFile,
    clearFiles,
    removeFile,
    updateResizedImage,
    selectedFile,
    setSelectedFile,
  };

  return (
    <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
  );
};
