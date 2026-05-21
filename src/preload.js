const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectZipFile: () => ipcRenderer.invoke('select-zip-file'),
  loadZipFile: (zipPath) => ipcRenderer.invoke('load-zip-file', zipPath),
  saveComment: (data) => ipcRenderer.invoke('save-comment', data),
  saveAttachment: (zipPath, entryPath) => ipcRenderer.invoke('save-attachment', { zipPath, entryPath }),


  // Drive API
  driveListFiles: (folderId) => ipcRenderer.invoke('drive-list-files', folderId),
  driveDownloadFile: (fileId, fileName) => ipcRenderer.invoke('drive-download-file', { fileId, fileName }),
  driveSearchFiles: (folderId, searchQuery) => ipcRenderer.invoke('drive-search-files', { folderId, searchQuery }),
  onDriveDownloadProgress: (callback) => ipcRenderer.on('drive-download-progress', (event, data) => callback(data)),
  getDownloadedExams: () => ipcRenderer.invoke('get-downloaded-exams'),
  showInExplorer: (filePath) => ipcRenderer.invoke('show-in-explorer', filePath),
  deleteExam: (filePath) => ipcRenderer.invoke('delete-exam', filePath),
  openExamFolder: () => ipcRenderer.invoke('open-exam-folder'),
  // App Version
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
