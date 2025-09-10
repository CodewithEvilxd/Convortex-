import {FormatOption} from '@/app/(main)/convert/page'

/**
 * Storage warning levels
 */
export enum StorageWarningLevel {
  NONE = 'none',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/**
 * Get storage warning level based on usage
 * @returns Storage warning level
 */
export const getStorageWarningLevel = (): StorageWarningLevel => {
  const usage = getStorageUsage();

  if (usage.percentage >= 90) {
    return StorageWarningLevel.CRITICAL;
  } else if (usage.percentage >= 75) {
    return StorageWarningLevel.WARNING;
  }

  return StorageWarningLevel.NONE;
};
export interface User{
  name?:string;
  uid:string;
  email:string;
}
export interface UserFull extends User{
  password:string;
  createdAt: string;
}
export interface UserProfile{
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  filesUploaded: number;
}
export interface UserActivity{
  type: string;
  details: Record<string, unknown>;
  timestamp?: string;
}
export interface FileObject {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  dateAdded: string;
  processed?: boolean;
  isSignature?: boolean;
  convertedFormat?: FormatOption | "";
  dateProcessed?: string;
  path?:string;
  lastModified?:string;
  width?: number;
  height?: number;
  _compressed?: boolean; // Indicates file data is compressed
  _storageLimited?: boolean; // Indicates full data not stored due to quota
}

/* note !!!
1. Simulated authentication functionality using localStorage for demo purposes whereas In a real application, this would use Firebase, Auth0, or another authentication service
*/

/**
 * Create demo account for testing purposes
 */
export const createDemoAccount = async (): Promise<void> => {
  try {
    if (typeof window === 'undefined') return;

    const existingUsers: UserFull[] = JSON.parse(
      localStorage.getItem("convertSignUsers") || "[]"
    );

    // Check if demo account already exists
    const demoExists = existingUsers.some(user => user.email === "demo@convert.com");
    if (demoExists) return;

    // Create demo account
    const demoUser: UserFull = {
      uid: `demo_${Date.now()}`,
      email: "demo@convert.com",
      password: "demo123", // In real app, this would be hashed
      createdAt: new Date().toISOString(),
    };

    existingUsers.push(demoUser);
    localStorage.setItem("convertSignUsers", JSON.stringify(existingUsers));

    // Create demo profile
    const profiles: UserProfile[] = JSON.parse(
      localStorage.getItem("convertSignProfiles") || "[]"
    );

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      displayName: "Demo User",
      email: "demo@convert.com",
      createdAt: new Date().toISOString(),
      filesUploaded: 0,
    };

    profiles.push(demoProfile);
    localStorage.setItem("convertSignProfiles", JSON.stringify(profiles));

    console.log("Demo account created successfully");
  } catch (error) {
    console.error("Error creating demo account:", error);
  }
};

// User authentication utilities

/** 
 * create a new user account
 * @param email - user email
 * @param password - user password
 * @param displayName- optional display name
*/
export const createUser = async (email:string, password:string, displayName?: string):Promise<User> => {
  return new Promise((resolve, reject) => {

    try {
      // Check if email is already in use
      if(typeof window === 'undefined'){
        throw new Error('This Function must be called in abrowser environment')
      }

      const existingUsers:UserFull[] = JSON.parse(
        localStorage.getItem("convertSignUsers") || "[]"
      );
      const emailExists = existingUsers.some(user => user.email === email);

      if (emailExists) {
        throw new Error("Email already in use");
      }

      // Generate a unique user ID
      const uid = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Create new user
      const newUser:UserFull = {
        uid,
        password, // Note: In a real app, never store passwords in plain text
        email,
        createdAt: new Date().toISOString(),
      };

      // Add user to storage
      existingUsers.push(newUser);
      localStorage.setItem("convertSignUsers", JSON.stringify(existingUsers));

      // Create user profile
      const profile:UserProfile = {
        uid,
        displayName: displayName || email.split("@")[0],
        email,
        createdAt: new Date().toISOString(),
        filesUploaded: 0,
      };

      // Store profiles
      const profiles:UserProfile[] = JSON.parse(
        localStorage.getItem("convertSignProfiles") || "[]"
      );
      profiles.push(profile);
      localStorage.setItem("convertSignProfiles", JSON.stringify(profiles));

      // Set current user in session
      const sessionUser: User = { uid, email };
      localStorage.setItem(
        "convertSignCurrentUser",
        JSON.stringify(sessionUser)
      );

      // Simulate network delay
      setTimeout(() => resolve(sessionUser), 500);
    } 
    catch (error) {
      reject(error);
    }
  });
};

/**
 * Sign in existing User
 * @param email-user email
 * @param password- user password 
 * @returns User Object
 */
export const signInUser = async (email:string, password:string): Promise<User> => {
  return new Promise((resolve, reject) => {
    try {
      if(typeof window === 'undefined'){
        throw new Error('This function must be called in a browser')
      }
      const users: UserFull[] = JSON.parse(
        localStorage.getItem("convertSignUsers") || "[]"
      );
      const user = users.find(
        u => u.email === email && u.password === password
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Set current user in session
      const sessionUser:User = { uid: user.uid, email: user.email };
      localStorage.setItem(
        "convertSignCurrentUser",
        JSON.stringify(sessionUser)
      );

      // Simulate network delay
      setTimeout(() => resolve(sessionUser), 500);
    } catch (error) {
      reject(error);
    }
  });
};
/*
* Sign out the current user
*/
export const signOutUser = async (): Promise<void> => {
  return new Promise(resolve => {
    // Remove current user from session
    localStorage.removeItem("convertSignCurrentUser");

    // Simulate network delay
    setTimeout(() => resolve(), 500);
  });
};
/** 
* get the current logged in user
* @returns user object or null 
*/
export const getCurrentUser = ():User | null => {
  try {
    if(typeof window === 'undefined')
      return null;
    
    const userString = localStorage.getItem("convertSignCurrentUser");
    return userString ? JSON.parse(userString) : null;
  } catch {
    return null;
  }
};

// User profile utilities
/**
 * 
 * @param uid 
 * @returns 
 */
export const getUserProfile = (uid: string): UserProfile | null=> {

  try {
    if(typeof window === 'undefined') return null;
    const profiles : UserProfile[] = JSON.parse(
      localStorage.getItem("convertSignProfiles") || "[]"
    );
    return profiles.find(profile => profile.uid === uid) || null;
  } catch {
    return null;
  }
};
/**
 * 
 * @param uid 
 * @param updates 
 * @returns 
 */
export const updateUserProfile =(uid:string, updates: Partial<UserProfile>): UserProfile | null=> {
  try {
    if(typeof window === 'undefined')return null;
    const profiles:UserProfile[] = JSON.parse(
      localStorage.getItem("convertSignProfiles") || "[]"
    );
    const updatedProfiles = profiles.map(profile =>
      profile.uid === uid ? { ...profile, ...updates } : profile
    );
    localStorage.setItem(
      "convertSignProfiles",
      JSON.stringify(updatedProfiles)
    );
    return getUserProfile(uid);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return null;
  }
};

// File storage utilities per user
/**
 *
 * @param uid
 * @returns
 */
export const getUserFiles = (uid:string): FileObject[] => {
  try {
    if(typeof window === 'undefined') return [];
    const userFilesKey = `convertSignFiles_${uid}`;
    const storedData = localStorage.getItem(userFilesKey);

    if (!storedData) return [];

    const files: FileObject[] = JSON.parse(storedData);

    // Check if files are in compressed/minimal format
    const hasCompressedFiles = files.some(file => file._compressed || file._storageLimited);

    if (hasCompressedFiles) {
      console.warn('Some files are stored in compressed format due to storage limitations');
    }

    return files;
  } catch (error) {
    console.error("Error retrieving user files:", error);
    return [];
  }
};
/**
 * Check if localStorage has enough space for the data
 * @param data - The data to check size for
 * @param key - The storage key
 * @returns boolean indicating if storage is available
 */
const checkStorageQuota = (data: string, key: string): boolean => {
  try {
    const testKey = `${key}_test`;
    localStorage.setItem(testKey, data);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Compress file data for storage by removing base64 data for large files
 * @param files - Array of file objects
 * @returns Compressed file data
 */
const compressFileData = (files: FileObject[]): FileObject[] => {
  return files.map(file => {
    // If file is larger than 1MB, store only metadata
    if (file.size > 1024 * 1024) {
      return {
        ...file,
        base64: '', // Remove base64 data to save space
        _compressed: true, // Mark as compressed
      };
    }
    return file;
  });
};

/**
 * Get storage usage information
 * @returns Object with storage usage details
 */
export const getStorageUsage = (): { used: number; available: number; percentage: number } => {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }

    // Estimate available space (rough approximation)
    const available = 5 * 1024 * 1024; // 5MB typical limit
    const percentage = (total / available) * 100;

    return {
      used: total,
      available,
      percentage: Math.min(percentage, 100)
    };
  } catch {
    return { used: 0, available: 0, percentage: 0 };
  }
};

/**
 *
 * @param uid
 * @param files
 */
export const updateUserFiles = (uid:string, files: FileObject[]):void => {
  try {
    const userFilesKey = `convertSignFiles_${uid}`;
    const fileData = JSON.stringify(files);

    // Check if we can store the data
    if (!checkStorageQuota(fileData, userFilesKey)) {
      console.warn('Storage quota exceeded, attempting to compress data...');

      // Try compressing the data
      const compressedFiles = compressFileData(files);
      const compressedData = JSON.stringify(compressedFiles);

      if (!checkStorageQuota(compressedData, userFilesKey)) {
        // If still too large, store only essential metadata
        const minimalFiles = files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          dateAdded: file.dateAdded,
          processed: file.processed,
          _storageLimited: true, // Mark that full data is not stored
        }));

        const minimalData = JSON.stringify(minimalFiles);

        if (checkStorageQuota(minimalData, userFilesKey)) {
          localStorage.setItem(userFilesKey, minimalData);
          console.warn('File data stored in minimal format due to storage limitations');
        } else {
          throw new Error('Unable to store file data - storage quota exceeded');
        }
      } else {
        localStorage.setItem(userFilesKey, compressedData);
        console.warn('File data stored in compressed format');
      }
    } else {
      localStorage.setItem(userFilesKey, fileData);
    }

    // Update user stats (with error handling)
    try {
      const profiles = JSON.parse(
        localStorage.getItem("convertSignProfiles") || "[]"
      );
      const updatedProfiles = profiles.map((profile: { uid: string; }) => {
        if (profile.uid === uid) {
          return { ...profile, filesUploaded: files.length };
        }
        return profile;
      });
      localStorage.setItem(
        "convertSignProfiles",
        JSON.stringify(updatedProfiles)
      );
    } catch (profileError) {
      console.error("Error updating user profile:", profileError);
    }

  } catch (error) {
    console.error("Error updating user files:", error);

    // Show user-friendly error message
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      alert('Storage limit exceeded! Some file data may not be saved. Consider clearing old files or using smaller files.');
    }
  }
};

// Track file conversions and activities
/**
 * 
 * @param uid 
 * @param activity 
 * @returns 
 */
export const recordUserActivity = (uid:string, activity: UserActivity):void => {
  try {
    if(typeof window === 'undefined')return ;
    const activities = JSON.parse(
      localStorage.getItem(`convertSignActivities_${uid}`) || "[]"
    );
    activities.push({
      ...activity,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(
      `convertSignActivities_${uid}`,
      JSON.stringify(activities)
    );
  } catch (error) {
    console.error("Error recording user activity:", error);
  }
};

/**
 *
 * @param uid
 * @returns
 */
export const getUserActivities = (uid:string): UserActivity[]=> {
  try {
    if(typeof window === 'undefined') return [];
    return JSON.parse(
      localStorage.getItem(`convertSignActivities_${uid}`) || "[]"
    );
  } catch {
    return [];
  }
};

/**
 * Clear old files to free up storage space
 * @param uid - User ID
 * @param keepRecent - Number of recent files to keep (default: 10)
 */
export const clearOldFiles = (uid: string, keepRecent: number = 10): void => {
  try {
    const files = getUserFiles(uid);
    if (files.length <= keepRecent) return;

    // Sort by date added (newest first)
    const sortedFiles = files.sort((a, b) =>
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );

    // Keep only the most recent files
    const filesToKeep = sortedFiles.slice(0, keepRecent);
    updateUserFiles(uid, filesToKeep);

    console.log(`Cleared ${files.length - keepRecent} old files to free up storage`);
  } catch (error) {
    console.error("Error clearing old files:", error);
  }
};

/**
 * Get storage warning message based on usage
 * @returns Warning message or null if no warning needed
 */
export const getStorageWarning = (): string | null => {
  const usage = getStorageUsage();

  if (usage.percentage >= 90) {
    return `Storage is ${usage.percentage.toFixed(1)}% full. Consider clearing old files to prevent data loss.`;
  } else if (usage.percentage >= 75) {
    return `Storage is ${usage.percentage.toFixed(1)}% full. Large files may not be saved properly.`;
  }

  return null;
};
