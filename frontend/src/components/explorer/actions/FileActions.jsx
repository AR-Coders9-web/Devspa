export async function copyFilePath(file) {
  const path = file?.path || "";
  if (!path) return false;

  try {
    await navigator.clipboard.writeText(path);
    return true;
  } catch {
    return false;
  }
}

export function renameFile(file, onRename) {
  onRename?.(file);
}

export function deleteFile(file, onDelete) {
  onDelete?.(file);
}
