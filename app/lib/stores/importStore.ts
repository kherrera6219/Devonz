import { map } from 'nanostores';

export type ImportStatus = 'idle' | 'scanning' | 'storing' | 'indexing' | 'syncing' | 'complete' | 'error';

export interface ImportState {
  status: ImportStatus;
  progress: number;
  currentFile: string;
  totalFiles: number;
  error?: string;
  folderName?: string;
}

const initialState: ImportState = {
  status: 'idle',
  progress: 0,
  currentFile: '',
  totalFiles: 0,
};

export const importStore = map<ImportState>(initialState);

export const setImportStatus = (status: ImportStatus) => {
  importStore.setKey('status', status);
};

export const setImportProgress = (progress: number) => {
  importStore.setKey('progress', Math.min(100, Math.max(0, progress)));
};

export const setImportFile = (fileName: string, total?: number) => {
  importStore.setKey('currentFile', fileName);

  if (total !== undefined) {
    importStore.setKey('totalFiles', total);
  }
};

export const setImportError = (error: string) => {
  importStore.setKey('status', 'error');
  importStore.setKey('error', error);
};

export const resetImport = () => {
  importStore.set(initialState);
};

export const startImport = (folderName: string, totalFiles: number) => {
  importStore.set({
    status: 'scanning',
    progress: 0,
    currentFile: '',
    totalFiles,
    folderName,
  });
};
