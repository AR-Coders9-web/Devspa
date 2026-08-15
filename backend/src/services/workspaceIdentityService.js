const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const getSessionPrincipal = (req) => {
  if (!req || !req.session) {
    throw new Error('Session is required for workspace operations.');
  }

  if (!req.session.devspaPrincipalId) {
    req.session.devspaPrincipalId = crypto.randomUUID();
  }

  return {
    id: String(req.session.devspaPrincipalId),
    githubInstallationId: req.session.githubInstallationId
      ? String(req.session.githubInstallationId)
      : null,
    githubLogin: req.session.user?.login || null,
  };
};

const createWorkspaceId = (principalId, repositoryId) => {
  const value = `${String(principalId)}:${String(repositoryId)}`;
  const digest = crypto.createHash('sha256').update(value).digest('hex');
  return `ws_${digest.slice(0, 40)}`;
};

const getMetadataPath = (workspaceRoot) =>
  path.join(workspaceRoot, '.devspa.json');

const readWorkspaceMetadata = async (workspaceRoot) => {
  try {
    return JSON.parse(
      await fs.readFile(getMetadataPath(workspaceRoot), 'utf8')
    );
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

const assertWorkspaceAccess = async ({
  workspaceRoot,
  principalId,
  allowLegacy = true,
}) => {
  const metadata = await readWorkspaceMetadata(workspaceRoot);

  if (!metadata) {
    const error = new Error('Workspace metadata was not found.');
    error.status = 404;
    throw error;
  }

  const ownerId = metadata.ownerPrincipalId
    ? String(metadata.ownerPrincipalId)
    : null;

  if (!ownerId) {
    if (allowLegacy) {
      return { metadata, legacy: true };
    }

    const error = new Error(
      'This legacy workspace must be re-imported before it can be used.'
    );
    error.status = 409;
    throw error;
  }

  if (ownerId !== String(principalId)) {
    const error = new Error('You do not have access to this workspace.');
    error.status = 403;
    throw error;
  }

  return { metadata, legacy: false };
};

module.exports = {
  getSessionPrincipal,
  createWorkspaceId,
  readWorkspaceMetadata,
  assertWorkspaceAccess,
};
