// Storage Service - Works with or without Firebase Storage
// Falls back to localStorage/IndexedDB for free tier without storage bucket

import { storage, isFirebaseConfigured } from '@/config/firebase';

// Check if Firebase Storage is available (not just Firebase)
export const isStorageConfigured = (): boolean => {
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  return !!(isFirebaseConfigured() && storage && storageBucket && storageBucket.length > 5);
};

// Storage paths
const PATHS = {
  VEHICLE_IMAGES: 'vehicles/images',
  VEHICLE_DOCUMENTS: 'vehicles/documents',
  USER_AVATARS: 'users/avatars',
  REPORTS: 'reports',
  UPLOADS: 'uploads',
} as const;

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface FileMetadata {
  name: string;
  fullPath: string;
  size: number;
  contentType: string;
  timeCreated: string;
  updated: string;
  downloadURL: string;
}

// ============== LOCAL STORAGE FALLBACK (for free tier) ==============

const DB_NAME = 'FleetGuardianFiles';
const DB_STORE = 'files';

// Initialize IndexedDB for larger files
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'path' });
      }
    };
  });
}

// Save file to IndexedDB
async function saveToIndexedDB(path: string, data: string, metadata: Partial<FileMetadata>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_STORE], 'readwrite');
    const store = transaction.objectStore(DB_STORE);
    const request = store.put({ path, data, metadata, timestamp: Date.now() });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Delete file from IndexedDB
async function deleteFromIndexedDB(path: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DB_STORE], 'readwrite');
    const store = transaction.objectStore(DB_STORE);
    const request = store.delete(path);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ============== FIREBASE STORAGE FUNCTIONS ==============

let firebaseStorageModule: typeof import('firebase/storage') | null = null;

async function getFirebaseStorage() {
  if (!isStorageConfigured()) return null;
  if (!firebaseStorageModule) {
    firebaseStorageModule = await import('firebase/storage');
  }
  return firebaseStorageModule;
}

// ============== UNIFIED UPLOAD FUNCTIONS ==============

// Upload vehicle image (works with or without Firebase Storage)
export async function uploadVehicleImage(
  vehicleId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${PATHS.VEHICLE_IMAGES}/${vehicleId}/${fileName}`;
  
  // Try Firebase Storage first
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const storageRef = fbStorage.ref(storage, filePath);
        
        if (onProgress) {
          return uploadWithProgress(fbStorage, storageRef, file, onProgress);
        }
        
        await fbStorage.uploadBytes(storageRef, file);
        return await fbStorage.getDownloadURL(storageRef);
      }
    } catch (error) {
      console.warn('Firebase Storage failed, falling back to local storage:', error);
    }
  }
  
  // Fallback to IndexedDB (local storage)
  console.log('Using local storage for image (no Firebase Storage bucket)');
  const base64 = await fileToBase64(file);
  await saveToIndexedDB(filePath, base64, {
    name: fileName,
    fullPath: filePath,
    size: file.size,
    contentType: file.type,
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
  });
  
  onProgress?.({
    progress: 100,
    bytesTransferred: file.size,
    totalBytes: file.size,
    state: 'success'
  });
  
  // Return the base64 data URL directly
  return base64;
}

// Upload vehicle document
export async function uploadVehicleDocument(
  vehicleId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${PATHS.VEHICLE_DOCUMENTS}/${vehicleId}/${fileName}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const storageRef = fbStorage.ref(storage, filePath);
        
        if (onProgress) {
          return uploadWithProgress(fbStorage, storageRef, file, onProgress);
        }
        
        await fbStorage.uploadBytes(storageRef, file);
        return await fbStorage.getDownloadURL(storageRef);
      }
    } catch (error) {
      console.warn('Firebase Storage failed, falling back to local storage:', error);
    }
  }
  
  // Fallback to IndexedDB
  const base64 = await fileToBase64(file);
  await saveToIndexedDB(filePath, base64, {
    name: fileName,
    fullPath: filePath,
    size: file.size,
    contentType: file.type,
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
  });
  
  onProgress?.({
    progress: 100,
    bytesTransferred: file.size,
    totalBytes: file.size,
    state: 'success'
  });
  
  return base64;
}

// Upload user avatar
export async function uploadUserAvatar(
  userId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const extension = file.name.split('.').pop();
  const fileName = `avatar.${extension}`;
  const filePath = `${PATHS.USER_AVATARS}/${userId}/${fileName}`;
  
  // Delete existing avatar first
  try {
    await deleteUserAvatar(userId);
  } catch (e) {
    // Ignore if no existing avatar
  }
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const storageRef = fbStorage.ref(storage, filePath);
        
        if (onProgress) {
          return uploadWithProgress(fbStorage, storageRef, file, onProgress);
        }
        
        await fbStorage.uploadBytes(storageRef, file);
        return await fbStorage.getDownloadURL(storageRef);
      }
    } catch (error) {
      console.warn('Firebase Storage failed, falling back to local storage:', error);
    }
  }
  
  // Fallback to IndexedDB
  const base64 = await fileToBase64(file);
  await saveToIndexedDB(filePath, base64, {
    name: fileName,
    fullPath: filePath,
    size: file.size,
    contentType: file.type,
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
  });
  
  onProgress?.({
    progress: 100,
    bytesTransferred: file.size,
    totalBytes: file.size,
    state: 'success'
  });
  
  return base64;
}

// Upload data file (CSV, JSON)
export async function uploadDataFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${PATHS.UPLOADS}/${fileName}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const storageRef = fbStorage.ref(storage, filePath);
        
        if (onProgress) {
          return uploadWithProgress(fbStorage, storageRef, file, onProgress);
        }
        
        await fbStorage.uploadBytes(storageRef, file);
        return await fbStorage.getDownloadURL(storageRef);
      }
    } catch (error) {
      console.warn('Firebase Storage failed, falling back to local storage:', error);
    }
  }
  
  // Fallback to IndexedDB
  const base64 = await fileToBase64(file);
  await saveToIndexedDB(filePath, base64, {
    name: fileName,
    fullPath: filePath,
    size: file.size,
    contentType: file.type,
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
  });
  
  onProgress?.({
    progress: 100,
    bytesTransferred: file.size,
    totalBytes: file.size,
    state: 'success'
  });
  
  return base64;
}

// Helper: Upload with progress tracking
async function uploadWithProgress(
  fbStorage: typeof import('firebase/storage'),
  storageRef: ReturnType<typeof import('firebase/storage').ref>,
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadTask = fbStorage.uploadBytesResumable(storageRef, file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          state: snapshot.state as UploadProgress['state'],
        });
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await fbStorage.getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

// ============== DELETE FUNCTIONS ==============

export async function deleteVehicleImage(vehicleId: string, fileName: string): Promise<void> {
  const filePath = `${PATHS.VEHICLE_IMAGES}/${vehicleId}/${fileName}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const fileRef = fbStorage.ref(storage, filePath);
        await fbStorage.deleteObject(fileRef);
        return;
      }
    } catch (error) {
      console.warn('Firebase delete failed, trying local:', error);
    }
  }
  
  await deleteFromIndexedDB(filePath);
}

export async function deleteVehicleDocument(vehicleId: string, fileName: string): Promise<void> {
  const filePath = `${PATHS.VEHICLE_DOCUMENTS}/${vehicleId}/${fileName}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const fileRef = fbStorage.ref(storage, filePath);
        await fbStorage.deleteObject(fileRef);
        return;
      }
    } catch (error) {
      console.warn('Firebase delete failed, trying local:', error);
    }
  }
  
  await deleteFromIndexedDB(filePath);
}

export async function deleteUserAvatar(userId: string): Promise<void> {
  const avatarPath = `${PATHS.USER_AVATARS}/${userId}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const avatarRef = fbStorage.ref(storage, avatarPath);
        const list = await fbStorage.listAll(avatarRef);
        await Promise.all(list.items.map(item => fbStorage.deleteObject(item)));
        return;
      }
    } catch (error) {
      console.warn('Firebase delete failed, trying local:', error);
    }
  }
  
  // For local, we just delete the known avatar path
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  for (const ext of extensions) {
    try {
      await deleteFromIndexedDB(`${avatarPath}/avatar.${ext}`);
    } catch (e) {
      // Ignore
    }
  }
}

// Delete all files for a vehicle
export async function deleteVehicleFiles(vehicleId: string): Promise<void> {
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        // Delete images
        const imagesRef = fbStorage.ref(storage, `${PATHS.VEHICLE_IMAGES}/${vehicleId}`);
        const imagesList = await fbStorage.listAll(imagesRef);
        await Promise.all(imagesList.items.map(item => fbStorage.deleteObject(item)));
        
        // Delete documents
        const docsRef = fbStorage.ref(storage, `${PATHS.VEHICLE_DOCUMENTS}/${vehicleId}`);
        const docsList = await fbStorage.listAll(docsRef);
        await Promise.all(docsList.items.map(item => fbStorage.deleteObject(item)));
        return;
      }
    } catch (error) {
      console.warn('Firebase delete failed:', error);
    }
  }
  
  // For local storage, we can't easily list all files, so we skip
  console.log('Local storage cleanup for vehicle files not implemented');
}

// ============== METADATA FUNCTIONS ==============

export async function getVehicleImages(vehicleId: string): Promise<FileMetadata[]> {
  const folderPath = `${PATHS.VEHICLE_IMAGES}/${vehicleId}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const folderRef = fbStorage.ref(storage, folderPath);
        const list = await fbStorage.listAll(folderRef);
        
        const files = await Promise.all(
          list.items.map(async (item) => {
            const metadata = await fbStorage.getMetadata(item);
            const downloadURL = await fbStorage.getDownloadURL(item);
            return {
              name: metadata.name,
              fullPath: metadata.fullPath,
              size: metadata.size,
              contentType: metadata.contentType || 'application/octet-stream',
              timeCreated: metadata.timeCreated,
              updated: metadata.updated,
              downloadURL,
            };
          })
        );
        
        return files;
      }
    } catch (error) {
      console.warn('Firebase getVehicleImages failed:', error);
    }
  }
  
  // For local storage, return empty (or implement IndexedDB listing)
  return [];
}

export async function getVehicleDocuments(vehicleId: string): Promise<FileMetadata[]> {
  const folderPath = `${PATHS.VEHICLE_DOCUMENTS}/${vehicleId}`;
  
  if (isStorageConfigured() && storage) {
    try {
      const fbStorage = await getFirebaseStorage();
      if (fbStorage) {
        const folderRef = fbStorage.ref(storage, folderPath);
        const list = await fbStorage.listAll(folderRef);
        
        const files = await Promise.all(
          list.items.map(async (item) => {
            const metadata = await fbStorage.getMetadata(item);
            const downloadURL = await fbStorage.getDownloadURL(item);
            return {
              name: metadata.name,
              fullPath: metadata.fullPath,
              size: metadata.size,
              contentType: metadata.contentType || 'application/octet-stream',
              timeCreated: metadata.timeCreated,
              updated: metadata.updated,
              downloadURL,
            };
          })
        );
        
        return files;
      }
    } catch (error) {
      console.warn('Firebase getVehicleDocuments failed:', error);
    }
  }
  
  return [];
}

// ============== UTILITY FUNCTIONS ==============

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(fileName: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(fileName));
}

export function isDocumentFile(fileName: string): boolean {
  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'json'];
  return docExtensions.includes(getFileExtension(fileName));
}

// Get storage mode for debugging
export function getStorageMode(): 'firebase' | 'local' {
  return isStorageConfigured() ? 'firebase' : 'local';
}

console.log(`📦 Storage mode: ${getStorageMode().toUpperCase()} ${isStorageConfigured() ? '(Firebase Storage)' : '(IndexedDB - no storage bucket)'}`);
