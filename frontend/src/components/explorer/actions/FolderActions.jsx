export function createFile(folder, onCreateFile) {
  onCreateFile?.(folder);
}

export function createFolder(folder, onCreateFolder) {
  onCreateFolder?.(folder);
}

export function renameFolder(folder, onRename) {
  onRename?.(folder);
}

export function deleteFolder(folder, onDelete) {
  onDelete?.(folder);
}
