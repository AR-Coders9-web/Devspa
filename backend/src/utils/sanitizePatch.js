const fs = require('fs/promises');
const path = require('path');

const applyTextPatch = async ({ workspacePath, file, oldCode, newCode }) => {
  if (!workspacePath) throw Object.assign(new Error('Workspace path is required.'), { status: 400 });
  if (!file || !oldCode || typeof newCode !== 'string') {
    throw Object.assign(new Error('A file, oldCode and newCode are required.'), { status: 400 });
  }

  const relative = path.normalize(String(file));
  if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) {
    throw Object.assign(new Error('Invalid patch file path.'), { status: 400 });
  }

  const target = path.resolve(workspacePath, relative);
  if (!target.startsWith(`${path.resolve(workspacePath)}${path.sep}`)) {
    throw Object.assign(new Error('Patch path escapes the workspace.'), { status: 400 });
  }

  const source = await fs.readFile(target, 'utf8');
  const occurrences = source.split(oldCode).length - 1;

  if (occurrences !== 1) {
    throw Object.assign(
      new Error(occurrences === 0
        ? 'The proposed oldCode was not found. No changes were made.'
        : 'The proposed oldCode matched multiple locations. No changes were made.'),
      { status: 409 }
    );
  }

  const updated = source.replace(oldCode, newCode);
  await fs.writeFile(target, updated, 'utf8');

  return {
    file: relative.replace(/\\/g, '/'),
    changed: true,
    bytesBefore: Buffer.byteLength(source),
    bytesAfter: Buffer.byteLength(updated),
  };
};

module.exports = { applyTextPatch };
