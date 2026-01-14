
const DB_NAME = 'FocusClassVideoDB';
const STORE_NAME = 'videos';
const META_STORE = 'metadata';
const VERSION = 3; // Incremented version for new schema fields

export interface VideoMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  approved?: boolean; // New field
}

export const videoStore = {
  openDB: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  saveVideo: async (file: File): Promise<string> => {
    const db = await videoStore.openDB();
    const id = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const metadata: VideoMetadata = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: new Date(),
      approved: false // Default to unapproved
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, META_STORE], 'readwrite');
      
      // Save Blob
      const videoStore = transaction.objectStore(STORE_NAME);
      videoStore.put(file, id);

      // Save Metadata
      const metaStore = transaction.objectStore(META_STORE);
      metaStore.put(metadata);
      
      transaction.oncomplete = () => resolve(id);
      transaction.onerror = () => reject(transaction.error);
    });
  },

  getVideo: async (id: string): Promise<Blob | null> => {
    try {
      const db = await videoStore.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result as Blob);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error accessing video store:", error);
      return null;
    }
  },

  getAllMetadata: async (): Promise<VideoMetadata[]> => {
    try {
      const db = await videoStore.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(META_STORE, 'readonly');
        const store = transaction.objectStore(META_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const results = request.result as VideoMetadata[];
          // Sort by newest first
          resolve(results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // If store doesn't exist yet, return empty
      return []; 
    }
  },

  approveVideo: async (id: string): Promise<void> => {
    const db = await videoStore.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(META_STORE, 'readwrite');
      const store = transaction.objectStore(META_STORE);
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result as VideoMetadata;
        if (data) {
          data.approved = true;
          store.put(data);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  deleteVideo: async (id: string): Promise<void> => {
    const db = await videoStore.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, META_STORE], 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.objectStore(META_STORE).delete(id);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};
